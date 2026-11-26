# Readwell

Readwell helps people build a lasting daily reading habit. You import your own book files (EPUB, PDF, TXT)
from your phone, read them in a comfortable reader with highlights, notes, translation and word meanings,
and track your progress with a daily goal, streaks, and weekly or monthly challenges. Your library,
reading position, highlights, notes and stats are saved to your account and sync across devices, and the
app works offline after the first sign-in.

The onboarding frames the habit as a journey of up to 254 days, based on Lally et al. (2009, University
College London): people took 18–254 days for a new daily behaviour to become automatic, 66 days on
average. 254 days is the longest anyone in that study took — the upper end of what was observed, not a
requirement.

Built from the Readwell designs (Kavin Design System, 75 Android screens).

## Features

- **Onboarding** — habit science, daily goal (minutes or pages), reading mode, translation language,
  reminder time, notification permission; shown once per account
- **Accounts** — email + password sign-up, log in, password reset (Supabase Auth)
- **Library** — import EPUB / PDF / TXT (up to 50 MB) from the Android file picker; title, author and
  cover from the file; background upload to private cloud storage; download on first open on a new
  device; grid / list, search, filters; delete everywhere
- **Reader** — EPUB, PDF and TXT in Slide (page swipe) or Scroll mode; font size, light / sepia / dark
  theme, line spacing; continue where you left off on any device
- **Highlights & notes** — any colour (presets, recent, custom picker), notes on highlights or selections,
  Notes tab with search and filters; tap to jump to the passage
- **Meaning & translate** — Free Dictionary API definitions; on-device Google ML Kit translation that
  works offline after the first download; text-to-speech for pronunciation and Listen
- **Daily performance** — reading timer (pauses after 2 minutes idle or in the background), today's
  ratio, streaks, habit counter (“Day N of 254”), 7-day chart, session summary
- **Challenges** — weekly / monthly targets for books, pages, minutes or goal days; automatic progress,
  completion celebration, history
- **Profile & stats** — lifetime and weekly / monthly stats, Want to read list
- **Settings & notifications** — local reminders (daily, streak at risk, challenge ending soon)
- **Offline first** — SQLite on the device with a sync queue to Supabase (last write wins, soft deletes)

## Tech stack

- **Expo SDK 58** · React Native 0.88 (New Architecture) · TypeScript · Expo Router
- **Expo development build** (`expo-dev-client`) — not Expo Go
- **Supabase** — auth, Postgres with Row Level Security, private Storage for book files
  (schema in `supabase/migrations/`)
- **expo-sqlite** — local source of truth; sync engine in `src/sync/`
- **react-native-webview** readers built from `reader-web/`: epub.js (EPUB), pdf.js with text layer (PDF),
  custom renderer (TXT) — bundled offline into `assets/reader/*.html`
- **@react-native-ml-kit/translate-text** + **identify-languages** — on-device translation
- **expo-notifications** (local only), **expo-speech**, **expo-document-picker**, **expo-file-system**
- Nunito font, Lucide icons, design tokens in `src/theme`

## Project structure

```
src/app/              Expo Router screens
src/theme/            design tokens: colors, typography, spacing, effects
src/components/ds/    Kavin Design System components
src/components/kit/   Readwell screen kit (Screen, Sheet, Dialog, Field, Ring, Cover…)
src/features/         auth, onboarding, library, reader, notes, challenges, stats, notifications…
src/db/, src/sync/    local SQLite database and Supabase sync engine
reader-web/           reader page sources (npm run build:reader → assets/reader/)
supabase/migrations/  database schema, RLS policies, storage bucket
plugins/              local Expo config plugins
```

## Running it

Requirements: Node.js, Android Studio (SDK + JDK), an Android phone with USB debugging on.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon (publishable) key.
   Never put a service-role key or personal access token in `.env`.
3. Apply `supabase/migrations/*.sql` to your Supabase project (SQL editor or `supabase db push`).
4. Build and install the development build on a USB-connected phone, then keep Metro running:
   ```bash
   npx expo run:android --device
   ```
   If the phone can't reach Metro: `adb reverse tcp:8081 tcp:8081`.
5. Later, start just the dev server (no native rebuild needed unless native dependencies change):
   ```bash
   npx expo start --dev-client
   ```
6. After editing anything in `reader-web/`, rebuild the reader pages: `npm run build:reader`.

### Notes

- Email confirmation is currently **off** in Supabase (the built-in email sender only reaches the
  project team, 2 emails/hour). Turn it back on once a custom SMTP provider is configured.
- Scheduled reminders use Android's inexact alarms, so they can arrive up to about an hour late.

### Windows notes

React Native's C++ build creates file paths longer than 260 characters. You need:

- Windows long paths enabled (admin PowerShell):
  `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`
- CMake 3.31.6 from the Android SDK (`sdkmanager "cmake;3.31.6"`). The `plugins/withCmakeVersion.js`
  config plugin makes every native module use it.
- A project path without spaces.
