// Kit Row: settings/detail row with icon tile, label, subtitle, value and trailing slot.
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, font, linear, shadow } from '@/theme';
import { Meta } from './Typography';

export function Row({
  icon,
  label,
  sub,
  value,
  right,
  danger,
  last,
  onPress,
}: {
  icon?: IconName;
  label: string;
  sub?: string;
  value?: string;
  /** null hides the chevron. */
  right?: ReactNode | null;
  danger?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(255,255,255,0.32)',
      }}>
      {icon ? (
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: linear(['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.25)']),
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.6)',
            boxShadow: shadow.raised,
          }}>
          <Icon name={icon} size={18} color={danger ? colors.danger : colors.slate800} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[font(700, 14, 1.3), { color: danger ? colors.danger : colors.rwInk }]}>{label}</Text>
        {sub ? <Meta style={{ marginTop: 2 }}>{sub}</Meta> : null}
      </View>
      {value ? <Text style={[font(600, 13, 1.3), { color: colors.rwSec }]}>{value}</Text> : null}
      {right === undefined ? <Icon name="chevron-right" size={18} color={colors.slate700} /> : right}
    </Pressable>
  );
}

