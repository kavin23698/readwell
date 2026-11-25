// Supabase client. Only the public project URL and publishable (anon) key live in the app —
// Row Level Security protects every table and the books bucket.
import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — copy .env.example to .env.');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: localStorage, // persisted in SQLite, survives app restarts
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce', // email links come back as readwell://auth/...?code=…
  },
});

// Refresh tokens only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

/** Deep links the auth emails redirect back to. */
export const authRedirects = {
  confirm: 'readwell://auth/callback',
  reset: 'readwell://auth/reset',
};
