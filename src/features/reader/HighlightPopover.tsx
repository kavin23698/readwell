// Screen 40 · Edit existing highlight: recolour, add note, copy, remove.
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { font, gradients, linear, shadow } from '@/theme';
import { presets } from './colors';
import type { Rect } from './SelectionMenu';
import { Swatch } from './Swatch';

const H = 124;

export function HighlightPopover({
  rect,
  color,
  topInset,
  onColor,
  onCustom,
  onAction,
  onClose,
}: {
  rect: Rect;
  color: string;
  topInset: number;
  onColor: (hex: string) => void;
  onCustom: () => void;
  onAction: (a: 'note' | 'copy' | 'remove') => void;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const above = rect.y - H - 12;
  const top = above > topInset + 8 ? above : Math.min(rect.y + rect.h + 12, height - H - 40);
  const isPreset = presets.some((p) => p.color.toLowerCase() === color.toLowerCase());
  const actions: { key: 'note' | 'copy' | 'remove'; icon: IconName; label: string }[] = [
    { key: 'note', icon: 'sticky-note', label: 'Add note' },
    { key: 'copy', icon: 'copy', label: 'Copy' },
    { key: 'remove', icon: 'trash-2', label: 'Remove' },
  ];
  return (
    <>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ position: 'absolute', inset: 0, zIndex: 19 }} />
      <View
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          top,
          zIndex: 20,
          padding: 14,
          gap: 12,
          borderRadius: 22,
          backgroundImage: linear(gradients.tabBar),
          boxShadow: shadow.sidebar,
        }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {presets.map((p) => (
            <Swatch key={p.key} color={p.color} size={30} on={p.color.toLowerCase() === color.toLowerCase()} label={`${p.key} highlight`} onPress={() => onColor(p.color)} />
          ))}
          <Swatch rainbow size={30} on={!isPreset} label="Custom colour" onPress={onCustom} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {actions.map((a) => (
            <Pressable
              key={a.key}
              accessibilityRole="button"
              onPress={() => onAction(a.key)}
              style={({ pressed }) => ({
                flex: 1,
                height: 40,
                borderRadius: 14,
                backgroundColor: pressed ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              })}>
              <Icon name={a.icon} size={16} color={a.key === 'remove' ? '#f0b8c4' : '#e2ebf1'} />
              <Text style={[font(700, 13, 1.1), { color: a.key === 'remove' ? '#f0b8c4' : '#e2ebf1' }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}
