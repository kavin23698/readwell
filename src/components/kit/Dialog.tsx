// Kit Dialog: confirm dialog over a scrim (screens 32, 52, 60, 66, 71).
import { Modal, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ds/Button';
import type { IconName } from '@/components/ds/Icon';
import { colors, font, gradients, linear, shadow } from '@/theme';
import { Tile } from './Tile';

export function Dialog({
  visible,
  icon,
  title,
  body,
  cancel = 'Cancel',
  ok,
  danger,
  busy,
  onCancel,
  onOk,
}: {
  visible: boolean;
  icon?: IconName;
  title: string;
  body: string;
  cancel?: string;
  ok: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onOk: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent navigationBarTranslucent>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
        <Pressable accessibilityLabel={cancel} onPress={onCancel} style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }} />
        <View
          accessibilityRole="alert"
          style={{
            width: '100%',
            borderRadius: 28,
            padding: 24,
            backgroundImage: linear(gradients.dialog),
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.85)',
            boxShadow: shadow.dialog,
          }}>
          {icon ? (
            <View style={{ marginBottom: 16 }}>
              <Tile icon={icon} size={52} danger={danger} />
            </View>
          ) : null}
          <Text style={[font(800, 19, 1.3), { color: colors.rwInk }]}>{title}</Text>
          <Text style={[font(500, 14, 1.5), { color: colors.rwBody, marginTop: 8 }]}>{body}</Text>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
            <Button variant="secondary" onPress={onCancel} disabled={busy}>
              {cancel}
            </Button>
            <Button variant={danger ? 'danger' : 'primary'} onPress={onOk} disabled={busy}>
              {ok}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
