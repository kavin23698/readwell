// Kit Empty: centred empty state with tile, title, body and actions.
import type { ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { IconName } from '@/components/ds/Icon';
import { colors, font } from '@/theme';
import { Tile } from './Tile';
import { P } from './Typography';

export function Empty({ icon, img, title, body, children }: { icon?: IconName; img?: ImageSource; title: string; body: string; children?: ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 12 }}>
      <Tile icon={icon} img={img} size={104} />
      <Text style={[font(800, 21, 1.25), { color: colors.rwInk, marginTop: 8, textAlign: 'center' }]}>{title}</Text>
      <P style={{ textAlign: 'center' }}>{body}</P>
      {children ? <View style={{ marginTop: 10, gap: 10, alignItems: 'center', width: '100%' }}>{children}</View> : null}
    </View>
  );
}
