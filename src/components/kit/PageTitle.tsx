// Kit PageTitle: big embossed tab title with a right slot.
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { colors, embossText, type } from '@/theme';

export function PageTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Text accessibilityRole="header" style={[type.pageTitle, { flex: 1, fontSize: 30, lineHeight: 34, color: colors.textTitleEmboss }, embossText]}>
        {title}
      </Text>
      {right}
    </View>
  );
}
