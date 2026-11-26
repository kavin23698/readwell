import Storage from 'expo-sqlite/kv-store';
import { highlightColors } from '@/theme';

export const presetOrder = ['sun', 'mint', 'sky', 'lilac', 'rose', 'peach'] as const;
export const presets = presetOrder.map((k) => ({ key: k, color: highlightColors[k] }));

const KEY = 'reader:recentColors';

/** Recently used custom colours (newest first, max 4). */
export async function recentColors(): Promise<string[]> {
  const raw = await Storage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export async function rememberColor(hex: string) {
  const c = hex.toLowerCase();
  if (presets.some((p) => p.color.toLowerCase() === c)) return;
  const list = (await recentColors()).filter((x) => x !== c);
  list.unshift(c);
  await Storage.setItem(KEY, JSON.stringify(list.slice(0, 4)));
}
