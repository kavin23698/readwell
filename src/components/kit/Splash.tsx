// Screen 1 · Splash — shown while the session and profile load.
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Icon } from '@/components/ds/Icon';
import { illustrations } from '@/illustrations';
import { colors, font, gradients, linear } from '@/theme';
import { Screen } from './Screen';
import { Tile } from './Tile';

export function Splash() {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
  }, [spin]);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  return (
    <Screen bg={linear(gradients.dark)} dark>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Tile img={illustrations.plant} icon="sprout" size={128} round dark />
        <Text style={[font(800, 40, 1.1), { color: colors.textOnDark, letterSpacing: -0.5 }]}>Readwell</Text>
        <Text style={[font(600, 15, 1.4), { color: colors.textOnDarkMuted }]}>Read a little. Every day.</Text>
      </View>
      <View style={{ alignItems: 'center', paddingBottom: 44 }} accessibilityLabel="Loading">
        <Animated.View style={spinStyle}>
          <Icon name="loader-circle" size={28} color={colors.teal200} />
        </Animated.View>
      </View>
    </Screen>
  );
}
