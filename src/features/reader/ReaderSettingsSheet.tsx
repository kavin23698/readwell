// Reader settings (from the controls overlay "Aa"): font size, theme, line spacing, mode.
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ds/Icon';
import { IconButton } from '@/components/ds/IconButton';
import { Seg } from '@/components/kit/Seg';
import { Sheet } from '@/components/kit/Sheet';
import { Meta, Micro } from '@/components/kit/Typography';
import type { ReadingMode } from '@/features/profile/types';
import { colors, font, shadow } from '@/theme';
import { lineSpacings, readerThemes, type ReaderSettings, type ReaderTheme } from './readerSettings';

export function ReaderSettingsSheet({
  visible,
  onClose,
  settings,
  onChange,
  mode,
  onMode,
  isPdf,
}: {
  visible: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onChange: (patch: Partial<ReaderSettings>) => void;
  mode: ReadingMode;
  onMode: (m: ReadingMode) => void;
  isPdf: boolean;
}) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Reading settings" noScrim>
      <Micro>Reading mode</Micro>
      <Seg<ReadingMode>
        value={mode}
        onChange={onMode}
        options={[
          { value: 'slide', label: 'Slide', icon: 'book-open' },
          { value: 'scroll', label: 'Scroll', icon: 'scroll-text' },
        ]}
      />
      {isPdf ? (
        <Meta>PDF pages keep their original layout, so font, theme and spacing don&apos;t apply.</Meta>
      ) : (
        <>
          <Micro>Font size</Micro>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <IconButton icon="minus" label="Smaller text" onPress={() => onChange({ fontSize: Math.max(13, Math.round((settings.fontSize - 1) * 2) / 2) })} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={[font(800, 22, 1.2), { color: colors.rwInk }]}>{settings.fontSize}</Text>
              <Meta>px</Meta>
            </View>
            <IconButton icon="plus" variant="accent" label="Larger text" onPress={() => onChange({ fontSize: Math.min(28, Math.round((settings.fontSize + 1) * 2) / 2) })} />
          </View>
          <Micro>Theme</Micro>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(Object.keys(readerThemes) as ReaderTheme[]).map((t) => {
              const th = readerThemes[t];
              const on = settings.theme === t;
              return (
                <Pressable
                  key={t}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${th.label} theme`}
                  onPress={() => onChange({ theme: t })}
                  style={{
                    flex: 1,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: th.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: 6,
                    borderWidth: 2,
                    borderColor: on ? colors.teal600 : 'rgba(20,36,52,0.12)',
                    boxShadow: shadow.raised,
                  }}>
                  {on ? <Icon name="check" size={16} color={th.fg} strokeWidth={3} /> : null}
                  <Text style={[font(800, 14, 1.2), { color: th.fg }]}>{th.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Micro>Line spacing</Micro>
          <Seg<string>
            sm
            value={String(settings.lineHeight)}
            onChange={(v) => onChange({ lineHeight: Number(v) })}
            options={lineSpacings.map((l) => ({ value: String(l.value), label: l.label }))}
          />
        </>
      )}
    </Sheet>
  );
}
