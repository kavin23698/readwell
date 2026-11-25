// Kit Sheet: bottom sheet over a scrim (modal). Tap the scrim or the back button to close.
import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton } from '@/components/ds/IconButton';
import { colors, font, gradients, linear, shadow } from '@/theme';

export function Sheet({
  visible,
  onClose,
  title,
  right,
  children,
  light = true,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  right?: ReactNode;
  children?: ReactNode;
  light?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Close"
          onPress={onClose}
          style={{ position: 'absolute', inset: 0, backgroundColor: light ? colors.scrimLight : colors.scrim }}
        />
        <View
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: 24 + insets.bottom,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.85)',
            backgroundImage: linear(gradients.sheet),
            boxShadow: shadow.sheet,
            gap: 14,
            maxHeight: '85%',
          }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(20,36,52,0.28)', alignSelf: 'center' }} />
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[font(800, 18, 1.2), { flex: 1, color: colors.rwInk }]}>{title}</Text>
              {right ?? <IconButton icon="x" size={40} label="Close" onPress={onClose} />}
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}
