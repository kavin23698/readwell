// DS PromoCard (components/surfaces/PromoCard.jsx), row layout: round image, title, body, action.
import type { ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Tile } from '@/components/kit/Tile';
import { colors, font, gradients, linear, radius, shadow } from '@/theme';
import type { IconName } from './Icon';

export function PromoCard({ image, icon = 'sparkles', title, body, action }: { image?: ImageSource; icon?: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <View
      style={{
        borderRadius: radius.lg,
        backgroundImage: linear(gradients.glassCard),
        borderWidth: 1,
        borderColor: colors.borderGlassSoft,
        boxShadow: shadow.card,
        paddingVertical: 12,
        paddingLeft: 16,
        paddingRight: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18,
      }}>
      <Tile img={image} icon={icon} size={64} round />
      <View style={{ flex: 1 }}>
        <Text style={[font(700, 16, 1.3), { color: colors.textStrong }]}>{title}</Text>
        {body ? <Text style={[font(500, 13, 1.4), { color: colors.textBody, marginTop: 4 }]}>{body}</Text> : null}
      </View>
      {action}
    </View>
  );
}
