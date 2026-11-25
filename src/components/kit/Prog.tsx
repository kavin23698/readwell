// Kit Prog: inset progress track with gradient fill.
import { View } from 'react-native';
import { gradients, linear, shadow } from '@/theme';

export function Prog({ pct, h = 8, color }: { pct: number; h?: number; color?: string }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ height: h, borderRadius: h, backgroundColor: 'rgba(20,36,52,0.14)', boxShadow: shadow.inset, overflow: 'hidden' }}>
      <View
        style={{
          width: `${p}%`,
          height: '100%',
          borderRadius: h,
          backgroundImage: color ?? linear(gradients.progress, 90),
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
        }}
      />
    </View>
  );
}
