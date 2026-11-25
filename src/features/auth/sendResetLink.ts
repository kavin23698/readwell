import { authRedirects, supabase } from '@/lib/supabase';
import { friendlyAuthError, isOffline, OFFLINE_MESSAGE } from './errors';

/** Sends the password-reset email. Returns a user-facing error message, or null on success. */
export async function sendResetLink(email: string): Promise<string | null> {
  if (await isOffline()) return OFFLINE_MESSAGE;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authRedirects.reset });
  return error ? friendlyAuthError(error) : null;
}
