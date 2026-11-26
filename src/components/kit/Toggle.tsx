// Kit Toggle: inset track with a sliding knob.
import { Pressable, View } from 'react-native';
import { gradients, linear, shadow } from '@/theme';

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      hitSlop={8}
      onPress={() => onChange(!on)}
      style={{
        width: 50,
        height: 30,
        borderRadius: 99,
        padding: 3,
        justifyContent: 'center',
        alignItems: on ? 'flex-end' : 'flex-start',
        backgroundImage: on ? linear(gradients.primary) : undefined,
        backgroundColor: on ? undefined : 'rgba(20,36,52,0.2)',
        boxShadow: shadow.inset,
      }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundImage: linear(['#ffffff', '#dfe8ec']), boxShadow: '0 2px 4px rgba(20,36,52,0.35)' }} />
    </Pressable>
  );
}
