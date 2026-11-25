import { useProfile } from '@/features/profile/ProfileProvider';
import { useAuth } from './AuthProvider';

/** Who may see which screens. */
export function useAccess() {
  const { session, ready, recovering } = useAuth();
  const { profile, loaded } = useProfile();
  const signedIn = !!session;
  const needsOnboarding = signedIn && !!profile && !profile.onboarding_completed;
  return { ready: ready && (!signedIn || loaded), signedIn, recovering, needsOnboarding };
}
