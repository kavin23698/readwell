// Kit Tile: glass square/round tile holding an icon or an illustration.
import { Image, type ImageSource } from 'expo-image';
import { View } from 'react-native';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, gradients, linear, shadow } from '@/theme';

export type TileProps = {
  icon?: IconName;
  img?: ImageSource;
  size?: number;
  round?: boolean;
  danger?: boolean;
  dark?: boolean;
};

export function Tile({ icon, img, size = 88, round, danger, dark }: TileProps) {
  const fg = danger ? colors.danger : dark ? colors.teal100 : colors.slate800;
  return (
    <View
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: round ? size / 2 : size * 0.3,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: linear(dark ? gradients.tileDark : gradients.tile),
        borderWidth: size > 70 ? 2 : 1,
        borderColor: `rgba(255,255,255,${dark ? 0.25 : 0.65})`,
        boxShadow: shadow.raised,
      }}>
      {img ? (
        <Image source={img} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : icon ? (
        <Icon name={icon} size={Math.round(size * 0.44)} strokeWidth={2} color={fg} />
      ) : null}
    </View>
  );
}
