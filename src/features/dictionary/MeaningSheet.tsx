// Screens 41, 43, 44 · Meaning sheet: result, loading skeleton, offline / not found states.
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Sheet } from '@/components/kit/Sheet';
import { Sk } from '@/components/kit/Skeleton';
import { Tile } from '@/components/kit/Tile';
import { Meta, P } from '@/components/kit/Typography';
import { stopSpeaking, toggleSpeak } from '@/lib/speak';
import { colors, font } from '@/theme';
import { lookUp, wordFrom, type MeaningResult } from './dictionary';

export function MeaningSheet({
  visible,
  selection,
  bookTitle,
  onClose,
  onSave,
}: {
  visible: boolean;
  selection: string;
  bookTitle: string;
  onClose: () => void;
  onSave: (word: string, text: string) => Promise<void> | void;
}) {
  const word = wordFrom(selection);
  const [result, setResult] = useState<MeaningResult | null>(null);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!visible) stopSpeaking();
  }, [visible]);

  const run = useCallback(() => {
    setResult(null);
    lookUp(word).then(setResult);
  }, [word]);

  useEffect(() => {
    if (visible) run();
  }, [visible, run]);

  const summary = (r: MeaningResult) =>
    r.kind === 'ok'
      ? [
          `${r.meaning.word}${r.meaning.phonetic ? ` ${r.meaning.phonetic}` : ''}${r.meaning.partOfSpeech ? ` · ${r.meaning.partOfSpeech}` : ''}`,
          ...r.meaning.definitions.map((d, i) => `${i + 1}. ${d}`),
        ].join('\n')
      : '';

  return (
    <Sheet visible={visible} onClose={onClose} title="Meaning">
      {!result ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="loader-circle" size={20} color={colors.teal700} />
            <Text style={[font(700, 14, 1.2), { color: colors.rwInk }]}>Looking up “{word}”…</Text>
          </View>
          <Sk w="55%" h={26} />
          <Sk w="35%" h={12} />
          <Sk h={14} />
          <Sk w="85%" h={14} />
          <Sk h={48} r={14} />
        </>
      ) : result.kind === 'offline' || result.kind === 'error' ? (
        <>
          <View style={{ alignItems: 'center', gap: 12, paddingTop: 10, paddingHorizontal: 10 }}>
            <Tile icon={result.kind === 'offline' ? 'wifi-off' : 'circle-alert'} size={72} />
            <Text style={[font(800, 17, 1.35), { color: colors.rwInk, textAlign: 'center' }]}>
              {result.kind === 'offline' ? 'Meaning needs an internet connection.' : "Couldn't reach the dictionary. Try again in a moment."}
            </Text>
            <Meta style={{ textAlign: 'center' }}>Your book, highlights and notes still work offline.</Meta>
          </View>
          <Button fullWidth size="lg" icon="refresh-cw" onPress={run}>
            Retry
          </Button>
        </>
      ) : result.kind === 'notFound' ? (
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 10 }}>
          <Tile icon="book-a" size={72} />
          <Text style={[font(800, 17, 1.35), { color: colors.rwInk, textAlign: 'center' }]}>No definition found</Text>
          <Meta style={{ textAlign: 'center' }}>{word ? `“${word}” isn't in the English dictionary.` : 'Select a single English word.'}</Meta>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={[font(800, 28, 1.15), { color: colors.rwInk }]}>{result.meaning.word}</Text>
              <Meta style={{ marginTop: 4 }}>{[result.meaning.phonetic, result.meaning.partOfSpeech].filter(Boolean).join(' · ')}</Meta>
            </View>
            <IconButton
              icon={speaking ? 'x' : 'volume-2'}
              variant="accent"
              label={speaking ? 'Stop' : `Pronounce ${result.meaning.word}`}
              onPress={() => toggleSpeak(result.meaning.word, 'en', setSpeaking)}
            />
          </View>
          {result.meaning.definitions.map((d, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={[font(800, 14, 1.5), { color: colors.teal700 }]}>{i + 1}.</Text>
              <P s={15} c={colors.rwInk} style={{ flex: 1 }}>
                {d}
              </P>
            </View>
          ))}
          {result.meaning.example ? (
            <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.55)' }}>
              <Text style={[font(500, 14, 1.5), { fontStyle: 'italic', color: colors.rwBody }]}>“{result.meaning.example}”</Text>
            </View>
          ) : (
            <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.55)' }}>
              <Text numberOfLines={3} style={[font(500, 14, 1.5), { fontStyle: 'italic', color: colors.rwBody }]}>
                “…{selection.trim()}…” — {bookTitle}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="secondary" icon="copy" style={{ flex: 1 }} onPress={() => Clipboard.setStringAsync(summary(result))}>
              Copy
            </Button>
            <Button icon="sticky-note" style={{ flex: 1 }} onPress={() => onSave(result.meaning.word, summary(result))}>
              Save to notes
            </Button>
          </View>
        </>
      )}
    </Sheet>
  );
}
