// Kit AppBar: back / close button, title + subtitle, right slot.
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { IconButton } from '@/components/ds/IconButton';
import { colors, font } from '@/theme';

export type AppBarProps = {
  title?: string;
  sub?: string;
  back?: boolean;
  close?: boolean;
  right?: ReactNode;
  onBack?: () => void;
};

export function AppBar({ title, sub, back = true, close, right, onBack }: AppBarProps) {
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, paddingHorizontal: 16, paddingBottom: 12 }}>
      {back ? <IconButton icon={close ? 'x' : 'chevron-left'} size={44} label={close ? 'Close' : 'Back'} onPress={goBack} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <Text numberOfLines={1} style={[font(700, 18, 1.2), { color: colors.rwInk }]}>
            {title}
          </Text>
        ) : null}
        {sub ? <Text style={[font(600, 12, 1.3), { color: colors.rwSec, marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}
