// Screen 18 · Home — loading.
import { View } from 'react-native';
import { GlassCard } from '@/components/ds/GlassCard';
import { Sk } from '@/components/kit/Skeleton';

export function HomeSkeleton() {
  return (
    <View style={{ flex: 1 }} accessibilityLabel="Loading">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 18 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Sk w={120} h={10} />
          <Sk w={210} h={18} />
        </View>
        <Sk w={44} h={44} r={22} />
      </View>
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        <GlassCard padding={14}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Sk w={76} h={114} r={10} />
            <View style={{ flex: 1, gap: 10, paddingTop: 4 }}>
              <Sk w={90} h={10} />
              <Sk w={140} h={18} />
              <Sk w={120} h={10} />
              <View style={{ flex: 1 }} />
              <Sk h={6} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Sk w={140} h={12} />
            <Sk w={110} h={42} r={21} />
          </View>
        </GlassCard>
        <GlassCard padding={14}>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Sk w={96} h={96} r={48} />
            <View style={{ flex: 1, gap: 10 }}>
              <Sk w={130} h={16} />
              <Sk w={100} h={12} />
              <Sk h={6} />
            </View>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}
