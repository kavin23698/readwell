// Holds the choices made across the onboarding screens and saves them at the end.
import { router } from 'expo-router';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { savePendingOnboarding } from '@/features/profile/pendingOnboarding';
import { useProfile } from '@/features/profile/ProfileProvider';
import { defaultChoices, type OnboardingChoices } from '@/features/profile/types';

type Ctx = {
  choices: OnboardingChoices;
  set: (patch: Partial<OnboardingChoices>) => void;
  finish: () => Promise<void>;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { profile, update } = useProfile();
  const [choices, setChoices] = useState<OnboardingChoices>(() =>
    profile
      ? {
          goal_type: profile.goal_type,
          daily_goal: profile.daily_goal,
          reminder_time: profile.reminder_time,
          reading_mode: profile.reading_mode,
          translation_language: profile.translation_language,
        }
      : defaultChoices,
  );

  const set = useCallback((patch: Partial<OnboardingChoices>) => setChoices((c) => ({ ...c, ...patch })), []);

  const finish = useCallback(async () => {
    if (session) {
      // Signed in already (e.g. logged into an account that never finished onboarding).
      await update({ ...choices, onboarding_completed: true });
      router.replace('/home');
    } else {
      // Saved on the phone; applied to the profile right after sign-up.
      await savePendingOnboarding(choices);
      router.replace('/sign-up');
    }
  }, [session, choices, update]);

  return <OnboardingContext.Provider value={{ choices, set, finish }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside the onboarding screens');
  return ctx;
}
