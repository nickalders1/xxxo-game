/**
 * Browser SpeechSynthesis wrapper for Mira's voice. Free, zero-API, no
 * external service. Quality is device-dependent but always available where
 * Web Speech API works (most modern browsers + iOS Safari).
 *
 * Designed so callers can use it unconditionally — every function is a no-op
 * on unsupported runtimes (SSR, ancient browsers).
 */

const VOICE_PREF_KEY = "xxxo-mira-voice-enabled";

export function isVoiceSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

export function getVoiceEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(VOICE_PREF_KEY) === "true";
  } catch {
    return false;
  }
}

export function setVoiceEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOICE_PREF_KEY, enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
  if (!enabled) cancelSpeech();
}

interface SpeakOptions {
  rate?: number;   // 0.1..10, default 1
  pitch?: number;  // 0..2, default 1
  volume?: number; // 0..1, default 1
}

/**
 * Pick the most "Mira-like" voice from those installed. Preference order:
 * - English female voices (most common high-quality ones)
 * - Any English voice
 * - The system default
 */
function pickVoice(): SpeechSynthesisVoice | null {
  if (!isVoiceSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith("en"));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  // Prefer voices with "female" or known female-sounding names.
  const femaleHints = ["female", "samantha", "victoria", "karen", "tessa", "moira", "kate", "google uk english female", "google us english", "zira"];
  const female = pool.find((v) =>
    femaleHints.some((h) => v.name.toLowerCase().includes(h)),
  );
  return female ?? pool[0];
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (!isVoiceSupported() || !text) return;
  // Cancel anything in flight so Mira's lines don't pile up.
  window.speechSynthesis.cancel();
  const utter = new window.SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  utter.rate = options.rate ?? 1.05;
  utter.pitch = options.pitch ?? 1.0;
  utter.volume = options.volume ?? 1.0;
  window.speechSynthesis.speak(utter);
}

export function cancelSpeech(): void {
  if (!isVoiceSupported()) return;
  window.speechSynthesis.cancel();
}
