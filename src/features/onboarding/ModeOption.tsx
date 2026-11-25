// Radio card for the reading mode (screen 7 "Opt").
import { Pressable, Text, View } from 'react-native';
import type { IconName } from '@/components/ds/Icon';
import { Tile } from '@/components/kit/Tile';
import { Meta } from '@/components/kit/Typography';
import { colors, font, shadow } from '@/theme';

export function ModeOption({ icon, title, body, on, onPress }: { icon: IconName; title: string; body: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: on ? colors.teal600 : 'rgba(255,255,255,0.3)',
        backgroundImage: on
          ? 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.36))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.26), rgba(255,255,255,0.12))',
        boxShadow: shadow.card,
      }}>
      <Tile icon={icon} size={48} />
      <View style={{ flex: 1 }}>
        <Text style={[font(800, 16, 1.2), { color: colors.rwInk }]}>{title}</Text>
        <Meta style={{ marginTop: 3 }}>{body}</Meta>
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: on ? 7 : 2,
          borderColor: on ? colors.teal600 : colors.slate600,
          backgroundColor: '#fff',
        }}
      />
    </Pressable>
  );
}
