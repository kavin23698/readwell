// Port of the kit's <Phone>: page gradient + frost texture, safe areas, status bar colour.
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, linear, textureFrost } from '@/theme';

export type ScreenProps = {
  children?: ReactNode;
  /** CSS background override (e.g. the dark navy gradient used by Splash / summaries). */
  bg?: string;
  dark?: boolean;
  paper?: boolean;
  /** Rendered above everything (dialogs, sheets, toasts). */
  overlay?: ReactNode;
  /** Skip the bottom inset (when a tab bar handles it). */
  noBottomInset?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, bg, dark, paper, overlay, noBottomInset, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const background: ViewStyle = paper
    ? { backgroundColor: colors.paper }
    : { backgroundImage: bg ?? linear(gradients.page) };
  return (
    <View style={[styles.root, background]}>
      {!bg && !paper ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundImage: textureFrost }]} /> : null}
      <StatusBar style={dark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior="padding"
        style={[styles.content, { paddingTop: insets.top + 4, paddingBottom: noBottomInset ? 0 : insets.bottom + 6 }, style]}>
        {children}
      </KeyboardAvoidingView>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, minHeight: 0 },
});
