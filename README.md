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

> Status: in active development. Screens are built feature by feature from the Readwell designs
> (Kavin Design System, 75 Android screens).

## Tech stack

- **Expo SDK 58** · React Native 0.88 (New Architecture) · TypeScript · Expo Router
- **Expo development build** (`expo-dev-client`) — not Expo Go
- **Supabase** — auth (email + password), Postgres with Row Level Security, private Storage for book files
- **expo-sqlite** — local source of truth with a sync queue (offline first)
- **react-native-webview** readers: epub.js (EPUB), pdf.js (PDF), custom renderer (TXT)
- **expo-notifications** — local scheduled reminders
- Nunito font, Lucide icons, design tokens in `src/theme`

## Project structure

```
src/app/            Expo Router screens
src/theme/          design tokens: colors, typography, spacing, effects
src/components/ds/  Kavin Design System components (Button, IconButton, GlassCard, Icon…)
src/components/kit/ Readwell screen kit (Screen, Tile, Chip, typography, layout…)
plugins/            local Expo config plugins
```

## Running it

Requirements: Node.js, Android Studio (SDK + JDK), an Android phone with USB debugging on.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon (publishable) key.
   Never put a service-role key or personal access token in `.env`.
3. Build and install the development build on a USB-connected phone, then keep Metro running:
   ```bash
   npx expo run:android --device
   ```
   If the phone can't reach Metro: `adb reverse tcp:8081 tcp:8081`.
4. Later, start just the dev server (no native rebuild needed unless native dependencies change):
   ```bash
   npx expo start --dev-client
   ```

### Windows notes

React Native's C++ build creates file paths longer than 260 characters. You need:

- Windows long paths enabled (admin PowerShell):
  `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force`
- CMake 3.31.6 from the Android SDK (`sdkmanager "cmake;3.31.6"`). The `plugins/withCmakeVersion.js`
  config plugin makes every native module use it.
- A project path without spaces.
