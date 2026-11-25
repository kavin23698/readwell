// Kit Toast: dark pill with icon, message and optional action (screens 33, 39, 50, 74).
import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, font, shadow } from '@/theme';

export function Toast({ children, icon = 'check', action, style }: { children: ReactNode; icon?: IconName; action?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="box-none" style={[{ position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 9 }, style]}>
      <View
        accessibilityRole="alert"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: action ? 6 : 11,
          paddingLeft: action ? 16 : 18,
          paddingRight: action ? 6 : 18,
          borderRadius: 99,
          backgroundColor: 'rgba(28,46,67,0.94)',
          boxShadow: shadow.pill,
        }}>
        <Icon name={icon} size={17} color={colors.textOnDark} />
        <Text style={[font(700, 13, 1.25), { color: colors.textOnDark, flexShrink: 1 }]}>{children}</Text>
        {action}
      </View>
    </View>
  );
}
