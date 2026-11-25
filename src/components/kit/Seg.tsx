// Kit Seg: inset segmented control.
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, font, gradients, linear, shadow } from '@/theme';

export type SegOption<T extends string> = { value: T; label: string; icon?: IconName };

export function Seg<T extends string>({
  options,
  value,
  onChange,
  sm,
  dark,
}: {
  options: SegOption<T>[];
  value: T;
  onChange?: (v: T) => void;
  sm?: boolean;
  dark?: boolean;
}) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        padding: 4,
        gap: 4,
        borderRadius: 999,
        backgroundColor: dark ? 'rgba(0,0,0,0.25)' : 'rgba(20,36,52,0.12)',
        boxShadow: shadow.inset,
      }}>
      {options.map((o) => {
        const active = o.value === value;
        const fg = active ? colors.navy800 : dark ? '#c9d5df' : colors.rwBody;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange?.(o.value)}
            style={{
              flex: 1,
              height: sm ? 34 : 42,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: active ? 'rgba(255,255,255,0.7)' : 'transparent',
              backgroundImage: active ? linear(gradients.segActive) : undefined,
              boxShadow: active ? shadow.raised : undefined,
            }}>
            {o.icon ? <Icon name={o.icon} size={16} color={fg} /> : null}
            <Text numberOfLines={1} style={[font(700, sm ? 13 : 14, 1.2), { color: fg }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
