// Kit Sk: shimmering placeholder block (screen 18).
import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function Sk({ w = '100%', h = 14, r = 8 }: { w?: DimensionValue; h?: number; r?: number }) {
  const o = useSharedValue(0.55);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          borderRadius: r,
          backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.52) 50%, rgba(255,255,255,0.22))',
        },
        style,
      ]}
    />
  );
}
