/**
 * Browser SpeechSynthesis wrapper for Mira's voice. Free, zero-API, no
 * external service. Quality is device-dependent but always available where
 * Web Speech API works (most modern browsers + iOS Safari).
 *
 * Why the indirection: SpeechSynthesis.getVoices() is asynchronous on most
 * platforms — it returns an empty array on first call and populates after
 * the `voiceschanged` event fires. If we don't wait for that, the first
 * speak() falls back to the browser's default (often a system male voice)
 * while subsequent calls correctly pick a female English voice. The cached
 * loadVoices() promise below removes that inconsistency.
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

// ---------- Voice loading + selection ----------

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;

/**
 * Resolve with the full voice list once the browser has populated it.
 * Guarantees we don't pick a fallback voice on first call.
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isVoiceSupported()) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const immediate = synth.getVoices();
    if (immediate.length > 0) {
      resolve(immediate);
      return;
    }
    let settled = false;
    const handler = () => {
      if (settled) return;
      const v = synth.getVoices();
      if (v.length === 0) return;
      settled = true;
      synth.removeEventListener("voiceschanged", handler);
      resolve(v);
    };
    synth.addEventListener("voiceschanged", handler);
    // Safety net: if voiceschanged never fires (some Linux/embedded WebViews),
    // resolve with whatever we have after 1.5s so callers don't hang forever.
    setTimeout(() => {
      if (settled) return;
      settled = true;
      synth.removeEventListener("voiceschanged", handler);
      resolve(synth.getVoices());
    }, 1500);
  });

  return voicesPromise;
}

/**
 * Female-leaning English voice picker. Hints below were collected from
 * Chrome/Edge (Windows), Safari (macOS/iOS), Chrome (Android) — covers the
 * platforms Mira actually runs on. We score each candidate and pick the
 * highest scorer, falling back to the first English voice and then to
 * whatever exists.
 */
function pickBest(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  // Known female voice names, lowercase, across major platforms.
  const femaleNames = new Set([
    // macOS / iOS
    "samantha", "karen", "tessa", "moira", "fiona", "victoria",
    "kate", "veena", "ava", "allison", "susan",
    // Windows (Microsoft)
    "zira", "hazel", "heera", "catherine",
    // Google
    "google uk english female", "google us english female",
  ]);

  function score(v: SpeechSynthesisVoice): number {
    let s = 0;
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();

    // English is required for Mira's lines to sound right.
    if (lang.startsWith("en")) s += 100;

    // Known female voice name → big bump.
    if (femaleNames.has(name)) s += 50;

    // Substring match for "female" in name.
    if (name.includes("female")) s += 30;

    // Penalise known male voices so we don't accidentally pick David/Mark/etc.
    const maleHints = ["david", "mark", "george", "fred", "alex", "daniel", "oliver", "thomas"];
    if (maleHints.some((m) => name.includes(m))) s -= 30;

    // Slight preference for local (offline) voices — lower latency.
    if (v.localService) s += 5;

    // Slight bump for US / UK English varieties (most familiar tones).
    if (lang === "en-us" || lang === "en-gb") s += 3;

    return s;
  }

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const s = score(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best ?? voices[0];
}

/** Pre-load voices in the background so the first speak() is consistent. */
export function preloadVoices(): void {
  if (!isVoiceSupported()) return;
  void loadVoices().then((voices) => {
    cachedVoice = pickBest(voices);
  });
}

interface SpeakOptions {
  rate?: number;   // 0.1..10, default 1.05 (very slightly snappy)
  pitch?: number;  // 0..2, default 1
  volume?: number; // 0..1, default 1
}

/**
 * Speak `text` with Mira's chosen voice. Async because on first call we may
 * have to wait for the browser to populate the voice list. Subsequent calls
 * use the cached voice and start near-instantly.
 */
export async function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  if (!isVoiceSupported() || !text) return;

  // Cancel anything in flight so Mira's lines don't pile up.
  window.speechSynthesis.cancel();

  if (!cachedVoice) {
    const voices = await loadVoices();
    cachedVoice = pickBest(voices);
  }

  const utter = new window.SpeechSynthesisUtterance(text);
  if (cachedVoice) utter.voice = cachedVoice;
  utter.rate = options.rate ?? 1.05;
  utter.pitch = options.pitch ?? 1.0;
  utter.volume = options.volume ?? 1.0;
  window.speechSynthesis.speak(utter);
}

export function cancelSpeech(): void {
  if (!isVoiceSupported()) return;
  window.speechSynthesis.cancel();
}

// ---------- Debug helpers (handy when reporting voice issues) ----------

/**
 * Returns the voice currently chosen for Mira plus the full list of available
 * voices on this device. Open the browser console and call this:
 *   import("/_next/static/...").mira.debugVoices()
 * — but really, just paste this in the console:
 *   speechSynthesis.getVoices().map(v => `${v.name} (${v.lang})`)
 */
export async function debugVoices(): Promise<{
  chosen: string | null;
  available: string[];
}> {
  const voices = await loadVoices();
  return {
    chosen: cachedVoice ? `${cachedVoice.name} (${cachedVoice.lang})` : null,
    available: voices.map((v) => `${v.name} (${v.lang})${v.localService ? " [local]" : ""}`),
  };
}
