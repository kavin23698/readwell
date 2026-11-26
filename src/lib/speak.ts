// Text-to-speech with the phone's own voices (works offline when the voice is installed).
import * as Speech from 'expo-speech';

const bcp47: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ur: 'ur-IN',
};

/** True when the phone has a voice for this language. */
export async function hasVoice(lang: string): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    if (!voices.length) return true; // some phones don't list voices but still speak
    return voices.some((v) => v.language.toLowerCase().startsWith(lang.toLowerCase()));
  } catch {
    return true;
  }
}

/** Speaks the text; tapping again while speaking stops it. Calls onState(true/false). */
export async function toggleSpeak(text: string, lang: string, onState?: (speaking: boolean) => void) {
  if (await Speech.isSpeakingAsync()) {
    await Speech.stop();
    onState?.(false);
    return;
  }
  onState?.(true);
  Speech.speak(text, {
    language: bcp47[lang] ?? lang,
    rate: 0.95,
    onDone: () => onState?.(false),
    onStopped: () => onState?.(false),
    onError: () => onState?.(false),
  });
}

export const stopSpeaking = () => Speech.stop();
