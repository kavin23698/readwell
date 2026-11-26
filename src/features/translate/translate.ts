// On-device translation with Google ML Kit. The first use of a language downloads its model
// (needs internet); after that, translation works offline. ML Kit reports no download progress,
// so the UI shows an indeterminate "Downloading … model" state.
import IdentifyLanguages from '@react-native-ml-kit/identify-languages';
import TranslateText from '@react-native-ml-kit/translate-text';
import NetInfo from '@react-native-community/netinfo';
import Storage from 'expo-sqlite/kv-store';

const KEY = 'translate:models';

/** Language pairs whose models are on this phone (we record them after a successful translation). */
async function downloaded(): Promise<string[]> {
  const raw = await Storage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]) : [];
}

async function remember(lang: string) {
  const list = await downloaded();
  if (!list.includes(lang)) await Storage.setItem(KEY, JSON.stringify([...list, lang]));
}

export async function needsDownload(source: string, target: string): Promise<boolean> {
  const list = await downloaded();
  return !(list.includes(source) || source === 'en') || !(list.includes(target) || target === 'en');
}

/** Detects the passage's language; falls back to English. */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const lang = await IdentifyLanguages.identify(text);
    return lang && lang !== 'und' ? lang.split('-')[0] : 'en';
  } catch {
    return 'en';
  }
}

export type TranslateResult = { kind: 'ok'; text: string; source: string } | { kind: 'offline' } | { kind: 'same' } | { kind: 'error'; message: string };

export async function translate(text: string, target: string, onDownloading?: () => void): Promise<TranslateResult> {
  const source = await detectLanguage(text);
  if (source === target) return { kind: 'same' };
  if (await needsDownload(source, target)) {
    const net = await NetInfo.fetch();
    if (net.isConnected === false || net.isInternetReachable === false) return { kind: 'offline' };
    onDownloading?.();
  }
  try {
    const out = await TranslateText.translate({ text, sourceLanguage: source as never, targetLanguage: target as never, downloadModelIfNeeded: true });
    await remember(source);
    await remember(target);
    return { kind: 'ok', text: String(out), source };
  } catch (e) {
    return { kind: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}
