import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Splash } from '@/components/kit/Splash';
import { SyncToast } from '@/components/kit/SyncToast';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { useAccess } from '@/features/auth/useAccess';
import { NotificationsManager } from '@/features/notifications/NotificationsManager';
import { ProfileProvider } from '@/features/profile/ProfileProvider';
import { SyncProvider } from '@/sync/SyncProvider';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { ready, signedIn, recovering, needsOnboarding } = useAccess();
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const fontsReady = fontsLoaded || !!fontError;
  const [minSplashDone, setMinSplashDone] = useState(false);

  useEffect(() => {
    if (!fontsReady) return;
    SplashScreen.hideAsync();
    const t = setTimeout(() => setMinSplashDone(true), 900);
    return () => clearTimeout(t);
  }, [fontsReady]);

  if (!fontsReady) return null; // native splash still showing
  if (!ready || !minSplashDone) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.slate400 }, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn || needsOnboarding}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && recovering}>
        <Stack.Screen name="set-password" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !recovering && !needsOnboarding}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="performance" />
        <Stack.Screen name="import" />
        <Stack.Screen name="book/[id]" />
        <Stack.Screen name="reader/[id]" />
        <Stack.Screen name="session-summary" />
        <Stack.Screen name="book-notes/[id]" />
        <Stack.Screen name="note/[id]" />
        <Stack.Screen name="challenge/new" />
        <Stack.Screen name="challenge/[id]" />
        <Stack.Screen name="challenge/created/[id]" />
        <Stack.Screen name="challenge/done/[id]" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="want-to-read" />
        <Stack.Screen name="want-to-read/add" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="settings/profile" />
        <Stack.Screen name="settings/password" />
        <Stack.Screen name="settings/goal" />
        <Stack.Screen name="settings/notifications" />
      </Stack.Protected>
      {/* Email links (readwell://auth/…) are always reachable. */}
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="auth/reset" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SyncProvider>
            <ProfileProvider>
              <RootNavigator />
              <SyncToast />
              <NotificationsManager />
            </ProfileProvider>
          </SyncProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
