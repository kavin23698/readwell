// Screen 73 · No internet banner — shown at the top of main screens while offline.
import { Text, View } from 'react-native';
import { Icon } from '@/components/ds/Icon';
import { useSync } from '@/sync/SyncProvider';
import { colors, font, gradients, linear, shadow } from '@/theme';

export function OfflineBanner() {
  const { online } = useSync();
  if (online) return null;
  return (
    <View
      accessibilityRole="alert"
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundImage: linear(gradients.tabBar),
        boxShadow: shadow.raised,
      }}>
      <Icon name="wifi-off" size={18} color={colors.textOnDark} />
      <Text style={[font(600, 13, 1.35), { flex: 1, color: colors.textOnDark }]}>
        You&apos;re offline. Reading still works — we&apos;ll sync when you&apos;re back.
      </Text>
    </View>
  );
}
