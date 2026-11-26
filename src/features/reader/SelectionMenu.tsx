// Screen 36 · Text selection menu: navy pill above (or below) the selection.
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { font, gradients, linear, shadow } from '@/theme';

export type SelectionAction = 'highlight' | 'note' | 'meaning' | 'translate' | 'copy';
export type Rect = { x: number; y: number; w: number; h: number };

const items: { key: SelectionAction; icon: IconName; label: string }[] = [
  { key: 'highlight', icon: 'highlighter', label: 'Highlight' },
  { key: 'note', icon: 'sticky-note', label: 'Add note' },
  { key: 'meaning', icon: 'book-a', label: 'Meaning' },
  { key: 'translate', icon: 'languages', label: 'Translate' },
  { key: 'copy', icon: 'copy', label: 'Copy' },
];

const MENU_H = 64;

export function SelectionMenu({ rect, onAction, topInset }: { rect: Rect; onAction: (a: SelectionAction) => void; topInset: number }) {
  const { height } = useWindowDimensions();
  const above = rect.y - MENU_H - 14;
  const top = above > topInset + 8 ? above : Math.min(rect.y + rect.h + 14, height - MENU_H - 40);
  return (
    <View
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        top,
        zIndex: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 20,
        backgroundImage: linear(gradients.tabBar),
        boxShadow: shadow.sidebar,
      }}>
      {items.map((it) => (
        <Pressable
          key={it.key}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          onPress={() => onAction(it.key)}
          style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 5, paddingVertical: 4, opacity: pressed ? 0.6 : 1 })}>
          <Icon name={it.icon} size={20} color="#e2ebf1" />
          <Text style={[font(700, 11, 1.1), { color: '#e2ebf1' }]}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
