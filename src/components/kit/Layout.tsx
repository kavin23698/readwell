// Kit layout helpers: Body (scrollable content column) and Actions (bottom button stack).
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

export function Body({
  children,
  gap = 14,
  pad = 20,
  scroll = true,
  style,
}: {
  children?: ReactNode;
  gap?: number;
  pad?: number;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (!scroll) {
    return <View style={[{ flex: 1, minHeight: 0, paddingHorizontal: pad, gap }, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      contentContainerStyle={[{ flexGrow: 1, paddingHorizontal: pad, gap, paddingBottom: 8 }, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Actions({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, gap: 10 }, style]}>{children}</View>;
}
