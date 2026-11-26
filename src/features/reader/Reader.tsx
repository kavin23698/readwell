// The reader: an offline WebView page per format (assets/reader/*.html) plus native overlays —
// selection menu (36), highlight colours (37/38), edit highlight (40), controls (35), meaning (41,
// 43, 44), add note (45), reading settings, toasts; the reading timer feeds the session summary (46).
import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView as RNWebView, type WebViewMessageEvent, type WebViewProps } from 'react-native-webview';
import { Toast } from '@/components/kit/Toast';
import type { BookFormat, BookRow } from '@/db/schema';
import { MeaningSheet } from '@/features/dictionary/MeaningSheet';
import { AddNoteSheet } from '@/features/notes/AddNoteSheet';
import { addNote, noteForHighlight, updateNote } from '@/features/notes/notesData';
import { useProfile } from '@/features/profile/ProfileProvider';
import type { ReadingMode } from '@/features/profile/types';
import { useDailyStats } from '@/features/stats/stats';
import { TranslateSheet } from '@/features/translate/TranslateSheet';
import { colors, font, highlightColors } from '@/theme';
import { recentColors, rememberColor } from './colors';
import { CustomColorSheet, HighlightColorSheet } from './ColorSheets';
import { HighlightPopover } from './HighlightPopover';
import { addHighlight, deleteHighlight, getProgress, recolorHighlight, saveProgress, useHighlights, type Position } from './readerData';
import { ReaderBars } from './ReaderBars';
import { readerThemes, useReaderSettings } from './readerSettings';
import { ReaderSettingsSheet } from './ReaderSettingsSheet';
import { SelectionMenu, type Rect, type SelectionAction } from './SelectionMenu';
import { useReadingTimer } from './useReadingTimer';

// react-native-webview's typings collapse to never under RN 0.88's types; use its declared props.
type WebViewHandle = { injectJavaScript: (js: string) => void };
const WebView = RNWebView as unknown as React.ComponentType<WebViewProps & { ref?: React.Ref<WebViewHandle> }>;

const pageAssets: Record<BookFormat, number> = {
  epub: require('@/assets/reader/epub.html'),
  pdf: require('@/assets/reader/pdf.html'),
  txt: require('@/assets/reader/txt.html'),
};

/** Sessions shorter than this close straight back instead of showing the summary. */
const SUMMARY_MIN_SECONDS = 60;

type Selection = { text: string; location: string; rect: Rect; page: number | null; chapter: string | null };
type Msg =
  | { type: 'ready' }
  | { type: 'loaded'; total: number }
  | ({ type: 'location' } & Position)
  | ({ type: 'selection' } & Selection)
  | { type: 'selectionCleared' }
  | { type: 'highlightTap'; id: string; rect: Rect }
  | { type: 'toggleBars' }
  | { type: 'activity' }
  | { type: 'noTextLayer' }
  | { type: 'error'; message: string };

type SheetKind = null | 'colors' | 'custom' | 'editCustom' | 'settings' | 'meaning' | 'translate' | 'note';
type NoteTarget = { quote: string | null; color: string | null; location: string | null; highlightId: string | null; noteId: string | null; initial: string; page: number | null; chapter: string | null };

export function Reader({ book, fileUri }: { book: BookRow; fileUri: string }) {
  const insets = useSafeAreaInsets();
  const { profile, update } = useProfile();
  const web = useRef<WebViewHandle>(null);
  const highlights = useHighlights(book.id);
  const { settings, update: updateSettings } = useReaderSettings();
  const stats = useDailyStats();
  const timer = useReadingTimer(book);
  const [pageUri, setPageUri] = useState<string | null>(null);
  const [mode, setMode] = useState<ReadingMode>(profile?.reading_mode ?? 'slide');
  const [pos, setPos] = useState<Position | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [bars, setBars] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [editing, setEditing] = useState<{ id: string; rect: Rect } | null>(null);
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null);
  const [toast, setToast] = useState<{ text: string; icon?: 'check' | 'bookmark' | 'info' | 'copy' } | null>(null);
  const [noText, setNoText] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const closing = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPos = useRef<Position | null>(null);
  const ratioBefore = useRef<number | null>(null);
  // A tap on an EPUB highlight also arrives as a page tap; wait briefly so the highlight wins.
  const barsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPdf = book.format === 'pdf';
  const theme = readerThemes[isPdf ? 'light' : (settings?.theme ?? 'light')];
  const pageBg = isPdf ? '#c9d3d9' : theme.bg;

  useEffect(() => {
    if (stats && ratioBefore.current == null) ratioBefore.current = stats.todayPct;
  }, [stats]);

  // Load the reader page for this format.
  useEffect(() => {
    let alive = true;
    Asset.fromModule(pageAssets[book.format])
      .downloadAsync()
      .then((a) => alive && setPageUri(a.localUri ?? a.uri))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [book.format]);

  const send = useCallback((msg: object) => {
    web.current?.injectJavaScript(`window.rw && window.rw.cmd(${JSON.stringify(msg)}); true;`);
  }, []);

  const hlPayload = useMemo(() => (highlights ?? []).map((h) => ({ id: h.id, color: h.color, location: h.location })), [highlights]);

  useEffect(() => {
    if (loaded) send({ type: 'setHighlights', highlights: hlPayload });
  }, [hlPayload, loaded, send]);

  const pageSettings = useMemo(
    () => ({ ...(settings ?? { theme: 'light', fontSize: 16.5, lineHeight: 1.72 }), padTop: insets.top + 30, padBottom: insets.bottom + 34 }),
    [settings, insets.top, insets.bottom],
  );

  // Settings changes after the book is open.
  const firstSettings = useRef(true);
  useEffect(() => {
    if (!loaded || !settings) return;
    if (firstSettings.current) {
      firstSettings.current = false;
      return;
    }
    send({ type: 'settings', settings: pageSettings });
  }, [pageSettings, loaded, settings, send]);

  const showToast = useCallback((text: string, icon?: 'check' | 'bookmark' | 'info' | 'copy') => {
    setToast({ text, icon });
    setTimeout(() => setToast(null), 2200);
  }, []);

  const flushSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = null;
    if (lastPos.current) saveProgress(book, lastPos.current);
  }, [book]);

  /** Close the book: save position + session, then show the summary for real reading sessions. */
  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    flushSave();
    const totals = await timer.finish();
    if (totals.seconds >= SUMMARY_MIN_SECONDS) {
      router.replace({
        pathname: '/session-summary',
        params: { bookId: book.id, title: book.title, seconds: String(totals.seconds), pages: String(totals.pages), before: String(ratioBefore.current ?? 0) },
      });
    } else {
      router.back();
    }
  }, [flushSave, timer, book.id, book.title]);

  // Android back button closes the book the same way.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet || selection || editing) {
        setSheet(null);
        setEditing(null);
        if (selection) {
          setSelection(null);
          send({ type: 'clearSelection' });
        }
        return true;
      }
      close();
      return true;
    });
    return () => sub.remove();
  }, [close, sheet, selection, editing, send]);

  // Leaving by any other route still saves.
  useEffect(
    () => () => {
      if (!closing.current) {
        flushSave();
        timer.finish();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  async function onMessage(e: WebViewMessageEvent) {
    let msg: Msg;
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    switch (msg.type) {
      case 'ready': {
        if (started.current || !settings) return;
        started.current = true;
        const progress = await getProgress(book.id);
        send({ type: 'init', fileUrl: fileUri, format: book.format, mode, location: progress?.location ?? null, highlights: hlPayload, settings: pageSettings });
        if (progress?.page) showToast(`Resumed at page ${progress.page}`, 'bookmark');
        return;
      }
      case 'loaded':
        setLoaded(true);
        return;
      case 'location': {
        const p: Position = { location: msg.location, percent: msg.percent, page: msg.page, total: msg.total, chapter: msg.chapter };
        setPos((prev) => ({ ...p, percent: p.percent ?? prev?.percent ?? null, total: p.total ?? prev?.total ?? null, page: p.page ?? prev?.page ?? null }));
        lastPos.current = p;
        timer.onPage(p.page);
        setLoaded(true);
        if (!saveTimer.current) saveTimer.current = setTimeout(flushSave, 3000);
        return;
      }
      case 'selection':
        setEditing(null);
        timer.onActivity();
        if (isPdf && noText) return;
        setSelection(msg);
        return;
      case 'selectionCleared':
        if (!sheet) setSelection(null);
        return;
      case 'highlightTap':
        if (barsTimer.current) clearTimeout(barsTimer.current);
        barsTimer.current = null;
        setSelection(null);
        setEditing({ id: msg.id, rect: msg.rect });
        return;
      case 'toggleBars':
        if (barsTimer.current) clearTimeout(barsTimer.current);
        barsTimer.current = setTimeout(() => {
          barsTimer.current = null;
          setEditing(null);
          setBars((b) => !b);
        }, 250);
        return;
      case 'activity':
        timer.onActivity();
        return;
      case 'noTextLayer':
        setNoText(true);
        return;
      case 'error':
        console.warn('[reader]', msg.message);
        if (!loaded) setError(msg.message);
        return;
    }
  }

  // Wait for settings before rendering the page so the first paint uses them.
  const ready = !!pageUri && !!settings;

  function clearSelection() {
    setSelection(null);
    send({ type: 'clearSelection' });
  }

  async function onSelectionAction(a: SelectionAction) {
    if (!selection) return;
    if (a === 'copy') {
      await Clipboard.setStringAsync(selection.text);
      clearSelection();
      showToast('Copied', 'copy');
    } else if (a === 'highlight') {
      setSheet('colors');
    } else if (a === 'note') {
      // A note on a selection also highlights it (last colour used, else sun), so it's findable.
      const recent = await recentColors();
      setNoteTarget({
        quote: selection.text,
        color: recent[0] ?? highlightColors.sun,
        location: selection.location,
        highlightId: null,
        noteId: null,
        initial: '',
        page: selection.page ?? pos?.page ?? null,
        chapter: selection.chapter ?? pos?.chapter ?? null,
      });
      setSheet('note');
    } else if (a === 'meaning') {
      setSheet('meaning');
    } else {
      setSheet('translate');
    }
  }

  async function applyColor(hex: string) {
    const sel = selection;
    setSheet(null);
    if (!sel) return;
    await rememberColor(hex);
    await addHighlight(book, { color: hex, location: sel.location, text: sel.text, chapter: sel.chapter ?? pos?.chapter ?? null, page: sel.page ?? pos?.page ?? null });
    clearSelection();
    showToast('Highlight saved');
  }

  async function onEditAction(a: 'note' | 'copy' | 'remove') {
    const h = highlights?.find((x) => x.id === editing?.id);
    setEditing(null);
    if (!h) return;
    if (a === 'copy') {
      await Clipboard.setStringAsync(h.text);
      showToast('Copied', 'copy');
    } else if (a === 'remove') {
      await deleteHighlight(h.id);
      showToast('Highlight removed', 'check');
    } else {
      const existing = await noteForHighlight(h.id);
      setNoteTarget({ quote: h.text, color: h.color, location: h.location, highlightId: h.id, noteId: existing?.id ?? null, initial: existing?.body ?? '', page: h.page, chapter: h.chapter });
      setSheet('note');
    }
  }

  async function saveNote(body: string) {
    const t = noteTarget;
    if (!t) return;
    if (t.noteId) {
      await updateNote(t.noteId, body);
    } else {
      let highlightId = t.highlightId;
      if (!highlightId && t.location && t.quote) {
        highlightId = await addHighlight(book, { color: t.color ?? highlightColors.sun, location: t.location, text: t.quote, chapter: t.chapter, page: t.page });
      }
      await addNote(book, { body, highlight_id: highlightId, location: t.location, quote: t.quote, chapter: t.chapter, page: t.page });
    }
    setSheet(null);
    setNoteTarget(null);
    clearSelection();
    showToast('Note saved');
  }

  function changeMode(m: ReadingMode) {
    if (m === mode) return;
    setMode(m);
    send({ type: 'setMode', mode: m });
    update({ reading_mode: m }); // remembered per user
  }

  const editingHl = highlights?.find((x) => x.id === editing?.id);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <Text style={[font(800, 18, 1.3), { color: colors.rwInk, textAlign: 'center' }]}>This book couldn&apos;t be opened</Text>
        <Text style={[font(500, 14, 1.5), { color: colors.rwBody, textAlign: 'center', marginTop: 8 }]}>{error}</Text>
      </View>
    );
  }

  const fadeTop = `linear-gradient(180deg, ${theme.bg} 70%, ${theme.bg}00)`;
  const fadeBottom = `linear-gradient(180deg, ${theme.bg}00, ${theme.bg} 55%)`;

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      {ready ? (
        <WebView
          ref={web}
          source={{ uri: pageUri }}
          originWhitelist={['*']}
          onMessage={onMessage}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          menuItems={[]}
          setSupportMultipleWindows={false}
          overScrollMode="never"
          textZoom={100}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          onError={(e) => setError(e.nativeEvent.description)}
        />
      ) : null}

      {/* Running header / footer (design 33): chapter on top, page and % at the bottom. */}
      {!bars && loaded && !isPdf ? (
        <>
          {mode === 'scroll' ? (
            <>
              {/* Scroll mode (design 34): text fades out under the header and footer. */}
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 34, backgroundImage: fadeTop }} />
              <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom + 60, backgroundImage: fadeBottom }} />
            </>
          ) : null}
          <Text
            numberOfLines={1}
            pointerEvents="none"
            style={[font(700, 12, 1.2), { position: 'absolute', top: insets.top + 8, left: 40, right: 40, textAlign: 'center', color: theme.muted }]}>
            {pos?.chapter ?? book.title}
          </Text>
          <View pointerEvents="none" style={{ position: 'absolute', bottom: insets.bottom + 8, left: 26, right: 26, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[font(700, 12, 1.2), { color: theme.muted }]}>{pos?.page && pos.total ? `${pos.page} of ${pos.total}` : ''}</Text>
            <Text style={[font(700, 12, 1.2), { color: theme.muted }]}>{pos?.percent != null ? `${Math.round(pos.percent)}%` : ''}</Text>
          </View>
        </>
      ) : null}
      {!bars && loaded && isPdf && pos?.page ? (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: insets.bottom + 8, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(28,46,67,0.7)' }}>
          <Text style={[font(700, 12, 1.2), { color: colors.textOnDark }]}>
            {pos.page} of {pos.total}
          </Text>
        </View>
      ) : null}

      {!loaded ? (
        <View pointerEvents="none" style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.teal700} />
        </View>
      ) : null}

      {selection && !sheet ? <SelectionMenu rect={selection.rect} topInset={insets.top} onAction={onSelectionAction} /> : null}

      {editing && editingHl ? (
        <HighlightPopover
          rect={editing.rect}
          color={editingHl.color}
          topInset={insets.top}
          onClose={() => setEditing(null)}
          onColor={async (hex) => {
            await recolorHighlight(editingHl.id, hex);
            setEditing(null);
          }}
          onCustom={() => setSheet('editCustom')}
          onAction={onEditAction}
        />
      ) : null}

      {bars ? (
        <ReaderBars
          title={book.title}
          chapter={pos?.chapter ?? null}
          page={pos?.page ?? null}
          total={pos?.total ?? null}
          percent={pos?.percent ?? 0}
          mode={mode}
          onBack={close}
          onMode={changeMode}
          onPrev={() => send({ type: 'prev' })}
          onNext={() => send({ type: 'next' })}
          onSeek={(p) => send({ type: 'goToPercent', percent: p })}
          onSettings={() => setSheet('settings')}
        />
      ) : null}

      {noText && isPdf && bars ? (
        <Toast icon="info" style={{ top: insets.top + 80 }}>
          Highlighting isn&apos;t available for this PDF (no selectable text)
        </Toast>
      ) : null}
      {toast ? (
        <Toast icon={toast.icon ?? 'check'} style={{ bottom: insets.bottom + 52 }}>
          {toast.text}
        </Toast>
      ) : null}

      <HighlightColorSheet
        visible={sheet === 'colors'}
        onClose={() => {
          setSheet(null);
          clearSelection();
        }}
        onPick={applyColor}
        onCustom={() => setSheet('custom')}
      />
      <CustomColorSheet
        visible={sheet === 'custom' || sheet === 'editCustom'}
        initial={sheet === 'editCustom' && editingHl ? editingHl.color : '#8ccfd9'}
        onClose={() => setSheet(sheet === 'custom' ? 'colors' : null)}
        onApply={async (hex) => {
          if (sheet === 'editCustom' && editingHl) {
            await rememberColor(hex);
            await recolorHighlight(editingHl.id, hex);
            setSheet(null);
            setEditing(null);
          } else {
            await applyColor(hex);
          }
        }}
      />
      {settings ? (
        <ReaderSettingsSheet
          visible={sheet === 'settings'}
          onClose={() => setSheet(null)}
          settings={settings}
          onChange={updateSettings}
          mode={mode}
          onMode={changeMode}
          isPdf={isPdf}
        />
      ) : null}
      <MeaningSheet
        visible={sheet === 'meaning'}
        selection={selection?.text ?? ''}
        bookTitle={book.title}
        onClose={() => {
          setSheet(null);
          clearSelection();
        }}
        onSave={async (word, text) => {
          await addNote(book, {
            kind: 'meaning',
            body: text,
            quote: word,
            location: selection?.location ?? null,
            page: selection?.page ?? pos?.page ?? null,
            chapter: selection?.chapter ?? pos?.chapter ?? null,
          });
          setSheet(null);
          clearSelection();
          showToast('Saved to notes');
        }}
      />
      <TranslateSheet
        visible={sheet === 'translate'}
        text={selection?.text ?? ''}
        target={profile?.translation_language ?? 'hi'}
        onChangeTarget={(code) => update({ translation_language: code })}
        onClose={() => {
          setSheet(null);
          clearSelection();
        }}
        onSave={async (translation) => {
          await addNote(book, {
            kind: 'translation',
            body: translation,
            quote: selection?.text ?? null,
            location: selection?.location ?? null,
            page: selection?.page ?? pos?.page ?? null,
            chapter: selection?.chapter ?? pos?.chapter ?? null,
          });
          setSheet(null);
          clearSelection();
          showToast('Saved to notes');
        }}
      />
      <AddNoteSheet
        visible={sheet === 'note'}
        title={noteTarget?.noteId ? 'Edit note' : 'Add note'}
        quote={noteTarget?.quote}
        color={noteTarget?.color}
        initial={noteTarget?.initial ?? ''}
        meta={[book.title, noteTarget?.page ? `p. ${noteTarget.page}` : null].filter(Boolean).join(' · ')}
        onClose={() => {
          setSheet(null);
          setNoteTarget(null);
          clearSelection();
        }}
        onSave={saveNote}
      />
    </View>
  );
}
