import { Tabs } from 'expo-router';
import { TabBar } from '@/components/kit/TabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' }, animation: 'shift' }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="challenges" />
      <Tabs.Screen name="notes" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

// Screen 75 · any crash below this layout shows the designed recovery screen.
export { ErrorScreen as ErrorBoundary } from '@/components/kit/ErrorScreen';
