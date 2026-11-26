// Screen 42 (+43/44) · Translate sheet: source → target chip (changeable), original and translation,
// Copy and Save to notes. First use of a language shows the model download.
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import { Icon } from '@/components/ds/Icon';
import { Chip } from '@/components/kit/Chip';
import { Sheet } from '@/components/kit/Sheet';
import { Sk } from '@/components/kit/Skeleton';
import { Tile } from '@/components/kit/Tile';
import { Meta, Micro, P } from '@/components/kit/Typography';
import { languages } from '@/features/onboarding/languages';
import { hasVoice, stopSpeaking, toggleSpeak } from '@/lib/speak';
import { colors, font, shadow } from '@/theme';
import { translate, type TranslateResult } from './translate';

const nameOf = (code: string) => languages.find((l) => l.code === code)?.name ?? (code === 'en' ? 'English' : code.toUpperCase());

export function TranslateSheet({
  visible,
  text,
  target,
  onChangeTarget,
  onClose,
  onSave,
}: {
  visible: boolean;
  text: string;
  target: string;
  onChangeTarget: (code: string) => void;
  onClose: () => void;
  onSave: (translation: string, source: string) => Promise<void> | void;
}) {
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceMissing, setVoiceMissing] = useState(false);
  useEffect(() => {
    if (!visible) stopSpeaking();
  }, [visible]);

  const run = useCallback(() => {
    setResult(null);
    setDownloading(false);
    translate(text, target, () => setDownloading(true)).then((r) => {
      setDownloading(false);
      setResult(r);
    });
  }, [text, target]);

  useEffect(() => {
    if (visible) run();
  }, [visible, run]);

  const source = result?.kind === 'ok' ? result.source : 'en';

  return (
    <Sheet visible={visible} onClose={onClose} title="Translate">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Chip>{nameOf(source)}</Chip>
        <Icon name="arrow-right" size={18} color={colors.slate800} />
        <Pressable accessibilityRole="button" accessibilityLabel={`Translate into ${nameOf(target)}. Change language`} onPress={() => setPicking((p) => !p)}>
          <View pointerEvents="none">
            <Chip on>{`${nameOf(target)} ▾`}</Chip>
          </View>
        </Pressable>
      </View>

      {picking ? (
        <FlatList
          data={languages}
          keyExtractor={(l) => l.code}
          style={{ maxHeight: 260, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.5)' }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: item.code === target }}
              onPress={() => {
                setPicking(false);
                onChangeTarget(item.code);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', minHeight: 46, paddingHorizontal: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.6)' }}>
              <Text style={[font(700, 14, 1.3), { color: colors.rwInk, flex: 1 }]}>
                {item.name} <Text style={{ color: colors.rwSec }}>{item.native}</Text>
              </Text>
              {item.code === target ? <Icon name="check" size={18} color={colors.teal700} strokeWidth={3} /> : null}
            </Pressable>
          )}
        />
      ) : null}

      <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.4)' }}>
        <Micro>{nameOf(source)}</Micro>
        <P s={15} c={colors.rwInk} style={{ marginTop: 4 }} numberOfLines={6}>
          {text.trim()}
        </P>
      </View>

      {!result ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="loader-circle" size={20} color={colors.teal700} />
            <Text style={[font(700, 14, 1.3), { color: colors.rwInk, flex: 1 }]}>
              {downloading ? `Downloading the ${nameOf(target)} language pack — only needed once…` : 'Translating…'}
            </Text>
          </View>
          <Sk h={14} />
          <Sk w="80%" h={14} />
        </View>
      ) : result.kind === 'offline' ? (
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Tile icon="wifi-off" size={64} />
          <Text style={[font(800, 16, 1.35), { color: colors.rwInk, textAlign: 'center' }]}>
            Connect to the internet once to download {nameOf(target)}. After that, translation works offline.
          </Text>
          <Button fullWidth icon="refresh-cw" onPress={run}>
            Retry
          </Button>
        </View>
      ) : result.kind === 'same' ? (
        <Meta>This passage is already in {nameOf(target)}. Pick another language above.</Meta>
      ) : result.kind === 'error' ? (
        <View style={{ gap: 10 }}>
          <Meta c={colors.danger}>Couldn&apos;t translate this passage. {result.message}</Meta>
          <Button fullWidth icon="refresh-cw" onPress={run}>
            Retry
          </Button>
        </View>
      ) : (
        <>
          <View style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.7)', boxShadow: shadow.raised }}>
            <Micro>{nameOf(target)}</Micro>
            <Text selectable style={[font(600, 17, 1.6), { color: colors.rwInk, marginTop: 4 }]}>
              {result.text}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button variant="secondary" icon="copy" style={{ flex: 1 }} onPress={() => Clipboard.setStringAsync(result.text)}>
              Copy
            </Button>
            <Button
              variant="secondary"
              icon={speaking ? 'x' : 'volume-2'}
              style={{ flex: 1 }}
              onPress={async () => {
                if (!speaking && !(await hasVoice(target))) {
                  setVoiceMissing(true);
                  return;
                }
                setVoiceMissing(false);
                toggleSpeak(result.text, target, setSpeaking);
              }}>
              {speaking ? 'Stop' : 'Listen'}
            </Button>
          </View>
          {voiceMissing ? (
            <Meta>
              Your phone has no {nameOf(target)} voice yet. Add one in Android Settings › Text-to-speech output, then try again.
            </Meta>
          ) : null}
          <Button fullWidth icon="sticky-note" onPress={() => onSave(result.text, result.source)}>
            Save to notes
          </Button>
        </>
      )}
    </Sheet>
  );
}
