// Screens 31 + 32 · Book detail and Delete book — confirm.
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { GlassCard } from '@/components/ds/GlassCard';
import { AppBar } from '@/components/kit/AppBar';
import { Cover } from '@/components/kit/Cover';
import { Dialog } from '@/components/kit/Dialog';
import { Body } from '@/components/kit/Layout';
import { Prog } from '@/components/kit/Prog';
import { Row } from '@/components/kit/Row';
import { Screen } from '@/components/kit/Screen';
import { Seg } from '@/components/kit/Seg';
import { H, Meta } from '@/components/kit/Typography';
import { formatDayMonth, relativeTime } from '@/lib/dates';
import { deleteBook, setFinished } from '@/features/library/bookActions';
import { formatBytes } from '@/features/library/files';
import { SyncBadge } from '@/features/library/SyncBadge';
import { readingTime, useBook, useBookStats } from '@/features/library/useLibrary';
import { colors, font } from '@/theme';

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const book = useBook(id);
  const stats = useBookStats(id);
  const [tab, setTab] = useState<'overview' | 'notes'>('overview');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (book === undefined) return <Screen />;
  if (book === null || book.deleted_at) {
    return (
      <Screen>
        <AppBar />
        <Body style={{ justifyContent: 'center' }}>
          <Meta style={{ textAlign: 'center' }}>This book is no longer in your Library.</Meta>
        </Body>
      </Screen>
    );
  }

  const pct = Math.round(book.finished_at ? 100 : (book.percent ?? 0));
  const pagesLeft = book.total_pages && book.page ? Math.max(0, book.total_pages - book.page) : null;
  const started = !!book.last_opened_at;
  const items = stats?.items ?? 0;

  const open = () => router.push({ pathname: '/reader/[id]', params: { id: book.id } });

  async function doDelete() {
    if (!book) return;
    setBusy(true);
    await deleteBook(book);
    setBusy(false);
    setConfirm(false);
    router.back();
  }

  return (
    <Screen>
      <AppBar />
      <Body gap={12}>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Cover book={book} w={104} />
          <View style={{ flex: 1, gap: 4, paddingTop: 4 }}>
            <H s={22} numberOfLines={3}>
              {book.title}
            </H>
            {book.author ? <Meta>{book.author}</Meta> : null}
            <View style={{ flex: 1 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Meta c={colors.rwInk}>{book.finished_at ? 'Finished' : `${pct}% read`}</Meta>
              {pagesLeft != null && !book.finished_at ? <Meta>{pagesLeft} pages left</Meta> : null}
            </View>
            <Prog pct={pct} h={6} />
          </View>
        </View>

        <GlassCard padding={12}>
          <View style={{ flexDirection: 'row' }}>
            {[
              [book.page ? (book.total_pages ? `${book.page}/${book.total_pages}` : String(book.page)) : '–', 'Page'],
              [book.last_opened_at ? relativeTime(book.last_opened_at).replace(' ago', '') : '–', 'Last read'],
              [stats ? readingTime(stats.seconds) : '–', 'Reading time'],
            ].map(([v, l]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[font(800, 16, 1.2), { color: colors.rwInk }]}>{v}</Text>
                <Meta>{l}</Meta>
              </View>
            ))}
          </View>
        </GlassCard>

        <Button fullWidth size="lg" icon="book-open" onPress={open}>
          {started ? (book.page ? `Continue · page ${book.page}` : 'Continue reading') : 'Start reading'}
        </Button>

        <Seg
          sm
          value={tab}
          onChange={(t) => (t === 'notes' ? router.push({ pathname: '/book-notes/[id]', params: { id: book.id } }) : setTab(t))}
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'notes', label: `Notes & highlights (${items})` },
          ]}
        />

        {tab === 'overview' ? (
          <GlassCard padding={{ vertical: 2, horizontal: 6 }} gap={0}>
            <Row
              icon="bookmark"
              label="Last position"
              sub={started ? [book.chapter, book.page ? `page ${book.page}` : `${pct}%`].filter(Boolean).join(', ') : 'Not opened yet'}
              right={null}
            />
            <Row
              icon="file-text"
              label={`${book.format.toUpperCase()} · ${formatBytes(book.file_size)}`}
              sub={`Added ${formatDayMonth(new Date(book.created_at))} ${new Date(book.created_at).getFullYear()}${book.source_name ? ` · ${book.source_name}` : ''}`}
              right={<SyncBadge book={book} />}
            />
            <Row
              icon={book.finished_at ? 'book-open' : 'circle-check'}
              label={book.finished_at ? 'Mark as not finished' : 'Mark as finished'}
              onPress={() => setFinished(book, !book.finished_at)}
              right={null}
            />
            <Row icon="trash-2" label="Delete book" danger last right={null} onPress={() => setConfirm(true)} />
          </GlassCard>
        ) : (
          <GlassCard padding={16}>
            <Meta>
              {items ? 'Your notes and highlights for this book appear here in the Notes feature.' : 'Long-press any passage while reading to highlight it or add a note.'}
            </Meta>
          </GlassCard>
        )}
      </Body>

      <Dialog
        visible={confirm}
        danger
        icon="trash-2"
        title={`Delete ${book.title.length > 40 ? book.title.slice(0, 39) + '…' : book.title}?`}
        body={`This removes the book${items ? `, your position and ${items} highlights and notes` : ' and your position'} from Readwell on all your devices. The original file${book.source_name ? ` (${book.source_name})` : ''} stays on your phone.`}
        ok="Delete"
        busy={busy}
        onCancel={() => setConfirm(false)}
        onOk={doDelete}
      />
    </Screen>
  );
}
