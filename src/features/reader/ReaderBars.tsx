// Screen 35 · Reader controls overlay: top bar (back, title, chapter) and bottom panel (page,
// progress slider, prev/next, Slide/Scroll).
import { useState } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/ds/IconButton';
import { Seg } from '@/components/kit/Seg';
import type { ReadingMode } from '@/features/profile/types';
import { colors, font, gradients, linear, shadow } from '@/theme';

const panel = { backgroundImage: linear(gradients.tabBar), boxShadow: shadow.sidebar } as const;

export function ReaderBars({
  title,
  chapter,
  page,
  total,
  percent,
  mode,
  onBack,
  onMode,
  onPrev,
  onNext,
  onSeek,
  onSettings,
}: {
  title: string;
  chapter: string | null;
  page: number | null;
  total: number | null;
  percent: number;
  mode: ReadingMode;
  onBack: () => void;
  onMode: (m: ReadingMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (percent: number) => void;
  onSettings: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [drag, setDrag] = useState<number | null>(null);
  const [trackW, setTrackW] = useState(1);
  const shown = drag ?? percent;
  const pctFrom = (e: GestureResponderEvent) => Math.max(0, Math.min(100, (e.nativeEvent.locationX / trackW) * 100));

  return (
    <>
      <View
        style={[
          panel,
          { position: 'absolute', left: 10, right: 10, top: insets.top + 6, zIndex: 15, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 22 },
        ]}>
        <IconButton icon="chevron-left" size={40} label="Close book" onPress={onBack} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[font(800, 15, 1.2), { color: colors.textOnDark }]}>
            {title}
          </Text>
          {chapter ? (
            <Text numberOfLines={1} style={[font(600, 12, 1.3), { color: colors.textOnDarkMuted }]}>
              {chapter}
            </Text>
          ) : null}
        </View>
        <IconButton icon="type" size={40} label="Reading settings" onPress={onSettings} />
      </View>

      <View
        style={[
          panel,
          { position: 'absolute', left: 10, right: 10, bottom: insets.bottom + 18, zIndex: 15, padding: 16, borderRadius: 24, gap: 14 },
        ]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={[font(700, 13, 1.1), { color: colors.textOnDark }]}>{page && total ? `Page ${page} of ${total}` : ' '}</Text>
          <Text style={[font(700, 13, 1.1), { color: colors.textOnDarkMuted }]}>{Math.round(shown)}%</Text>
        </View>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={`Reading position ${Math.round(shown)} percent`}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => onSeek(Math.max(0, Math.min(100, percent + (e.nativeEvent.actionName === 'increment' ? 5 : -5))))}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => setDrag(pctFrom(e))}
          onResponderMove={(e) => setDrag(pctFrom(e))}
          onResponderRelease={(e) => {
            const p = pctFrom(e);
            setDrag(null);
            onSeek(p);
          }}
          style={{ height: 22, justifyContent: 'center' }}>
          <View pointerEvents="none" style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <View style={{ width: `${shown}%`, height: '100%', borderRadius: 3, backgroundColor: colors.teal300 }} />
          </View>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: `${shown}%`,
              marginLeft: -11,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundImage: linear(['#ffffff', '#cfdde3']),
              boxShadow: shadow.pill,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <IconButton icon="chevron-left" size={40} label="Previous page" onPress={onPrev} />
          <View style={{ flex: 1 }}>
            <Seg<ReadingMode>
              dark
              sm
              value={mode}
              onChange={onMode}
              options={[
                { value: 'slide', label: 'Slide', icon: 'book-open' },
                { value: 'scroll', label: 'Scroll', icon: 'scroll-text' },
              ]}
            />
          </View>
          <IconButton icon="chevron-right" size={40} label="Next page" onPress={onNext} />
        </View>
      </View>
    </>
  );
}
