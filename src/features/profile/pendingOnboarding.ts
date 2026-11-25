// Onboarding choices made before an account exists, kept on the device until the first sign-in.
import Storage from 'expo-sqlite/kv-store';
import { defaultChoices, type OnboardingChoices } from './types';

const KEY = 'onboarding:pending';

export async function readPendingOnboarding(): Promise<OnboardingChoices | null> {
  const raw = await Storage.getItem(KEY);
  return raw ? { ...defaultChoices, ...(JSON.parse(raw) as Partial<OnboardingChoices>) } : null;
}

export async function savePendingOnboarding(choices: OnboardingChoices) {
  await Storage.setItem(KEY, JSON.stringify(choices));
}

export async function clearPendingOnboarding() {
  await Storage.removeItem(KEY);
}
