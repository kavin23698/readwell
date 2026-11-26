// Reader look: font size, theme and line spacing (EPUB and TXT). Stored on this phone.
import Storage from 'expo-sqlite/kv-store';
import { useCallback, useEffect, useState } from 'react';

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderSettings = { fontSize: number; theme: ReaderTheme; lineHeight: number };

export const defaultReaderSettings: ReaderSettings = { fontSize: 16.5, theme: 'light', lineHeight: 1.72 };

/** Page colours per theme — must match reader-web/common.js. */
export const readerThemes: Record<ReaderTheme, { bg: string; fg: string; muted: string; label: string }> = {
  light: { bg: '#eef3f5', fg: '#1a2a38', muted: '#5e707c', label: 'Light' },
  sepia: { bg: '#f4ecd8', fg: '#3b2f22', muted: '#7a6a55', label: 'Sepia' },
  dark: { bg: '#15233a', fg: '#dce6ec', muted: '#a8b8c8', label: 'Dark' },
};

export const lineSpacings = [
  { value: 1.5, label: 'Compact' },
  { value: 1.72, label: 'Normal' },
  { value: 2.0, label: 'Relaxed' },
];

const KEY = 'reader:settings';

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings | null>(null);
  useEffect(() => {
    Storage.getItem(KEY).then((raw) => setSettings(raw ? { ...defaultReaderSettings, ...(JSON.parse(raw) as Partial<ReaderSettings>) } : defaultReaderSettings));
  }, []);
  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...(prev ?? defaultReaderSettings), ...patch };
      Storage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  return { settings, update };
}
