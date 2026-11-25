// Turns Supabase auth errors into the plain-language messages shown in the designs.
import NetInfo from '@react-native-community/netinfo';
import type { AuthError } from '@supabase/supabase-js';

export const OFFLINE_MESSAGE = "You're offline. Connect to sign in.";

export async function isOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === false || state.isInternetReachable === false;
}

export function friendlyAuthError(error: AuthError | Error): string {
  const status = 'status' in error ? (error as AuthError).status : undefined;
  const code = 'code' in error ? (error as AuthError).code : undefined;
  const msg = error.message ?? '';

  if (code === 'email_address_not_authorized' || /not authorized/i.test(msg)) {
    return "We couldn't send an email to this address right now. Please try a different email, or try again later.";
  }
  if (status === 429 || code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || /rate limit/i.test(msg)) {
    if (code === 'over_email_send_rate_limit' || /email/i.test(msg)) {
      return "We've sent too many emails in a short time. Wait up to an hour, then try again.";
    }
    return 'Too many attempts. Wait a minute, then try again.';
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(msg)) {
    return "That password isn't right. Try again or reset it.";
  }
  if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) {
    return 'Confirm your email first — tap the link we sent you.';
  }
  if (code === 'weak_password' || /password/i.test(msg) && /weak|short|least/i.test(msg)) {
    return 'Too weak — use at least 8 characters, including a number.';
  }
  if (code === 'email_address_invalid' || /invalid.*email|email.*invalid/i.test(msg)) {
    return 'Enter a valid email, like name@example.com';
  }
  if (code === 'same_password') return 'Choose a password different from your current one.';
  if (code === 'otp_expired' || /expired/i.test(msg)) return 'This link has expired. Request a new one.';
  if (/network|fetch/i.test(msg)) return OFFLINE_MESSAGE;
  return msg || 'Something went wrong. Please try again.';
}

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export function passwordProblem(pw: string): string | null {
  if (pw.length < 8 || !/\d/.test(pw)) return 'Too weak — use at least 8 characters, including a number.';
  return null;
}

/** 0–3 strength for the meter under the password field. */
export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/\d/.test(pw) && /[a-zA-Z]/.test(pw)) s++;
  if (pw.length >= 12 || /[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(3, Math.max(1, s)) as 1 | 2 | 3;
}
