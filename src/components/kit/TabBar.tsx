// Kit TabBar: floating navy bar with raised active pill (design TabBar), used by the (tabs) layout.
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ds/Icon';
import { colors, font, gradients, linear, shadow } from '@/theme';

const meta: Record<string, { icon: IconName; label: string }> = {
  home: { icon: 'house', label: 'Home' },
  library: { icon: 'library', label: 'Library' },
  challenges: { icon: 'trophy', label: 'Challenges' },
  notes: { icon: 'notebook-pen', label: 'Notes' },
  profile: { icon: 'user', label: 'Profile' },
};

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingHorizontal: 12, paddingTop: 6, paddingBottom: insets.bottom + 6 }}>
      <View
        accessibilityRole="tablist"
        style={{
          height: 66,
          borderRadius: 24,
          backgroundImage: linear(gradients.tabBar),
          boxShadow: shadow.sidebar,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          gap: 2,
        }}>
        {state.routes.map((route, index) => {
          const m = meta[route.name];
          if (!m) return null;
          const active = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={m.label}
              onPress={() => {
                const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!active && !e.defaultPrevented) navigateToTab(route.key);
              }}
              style={{
                flex: 1,
                height: 54,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                borderWidth: 1,
                borderColor: active ? 'rgba(255,255,255,0.7)' : 'transparent',
                backgroundImage: active ? linear(gradients.tabActive) : undefined,
                boxShadow: active ? shadow.raised : undefined,
              }}>
              <Icon name={m.icon} size={21} strokeWidth={2} color={active ? colors.teal700 : '#c9d5df'} />
              <Text style={[font(700, 10, 1.1), { color: active ? colors.navy800 : '#c9d5df' }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
