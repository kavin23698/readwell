// Entry route: sends people to the right place for their sign-in and onboarding state.
import { Redirect } from 'expo-router';
import { useAccess } from '@/features/auth/useAccess';

export default function Index() {
  const { signedIn, recovering, needsOnboarding } = useAccess();
  if (!signedIn) return <Redirect href="/welcome" />;
  if (recovering) return <Redirect href="/set-password" />;
  if (needsOnboarding) return <Redirect href="/habits-1" />;
  return <Redirect href="/home" />;
}
