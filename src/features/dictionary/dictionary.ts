// Word meanings from the Free Dictionary API (https://api.dictionaryapi.dev), English only.
import NetInfo from '@react-native-community/netinfo';

export type Meaning = {
  word: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  definitions: string[];
  example: string | null;
};

export type MeaningResult = { kind: 'ok'; meaning: Meaning } | { kind: 'notFound' } | { kind: 'offline' } | { kind: 'error' };

/** First word of the selection, without punctuation ("congenial," → "congenial"). */
export function wordFrom(text: string): string {
  const m = text.trim().match(/[A-Za-z][A-Za-z'’-]*/);
  return m ? m[0].replace(/[’']s$/i, '').toLowerCase() : '';
}

type ApiEntry = {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string }[];
  meanings?: { partOfSpeech?: string; definitions?: { definition: string; example?: string }[] }[];
};

export async function lookUp(word: string): Promise<MeaningResult> {
  if (!word) return { kind: 'notFound' };
  const net = await NetInfo.fetch();
  if (net.isConnected === false || net.isInternetReachable === false) return { kind: 'offline' };
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: controller.signal });
    clearTimeout(t);
    if (res.status === 404) return { kind: 'notFound' };
    if (!res.ok) return { kind: 'error' };
    const entries = (await res.json()) as ApiEntry[];
    const e = entries[0];
    const m = e?.meanings?.find((x) => x.definitions?.length);
    if (!e || !m) return { kind: 'notFound' };
    const defs = m.definitions ?? [];
    return {
      kind: 'ok',
      meaning: {
        word: e.word,
        phonetic: e.phonetic ?? e.phonetics?.find((p) => p.text)?.text ?? null,
        partOfSpeech: m.partOfSpeech ?? null,
        definitions: defs.slice(0, 3).map((d) => d.definition),
        example: defs.find((d) => d.example)?.example ?? null,
      },
    };
  } catch {
    const again = await NetInfo.fetch();
    return again.isConnected === false ? { kind: 'offline' } : { kind: 'error' };
  }
}
