import { DIALOGUES, type MiraCategory } from "./dialogues";
import type { MiraProfile } from "./profile";

/**
 * Pick a line from a category, prefer-not-recent.
 *
 * `recent` is a rolling Set of lines Mira has said recently; we filter them
 * out so she doesn't immediately repeat herself. If the entire pool is in
 * `recent`, we fall back to the full pool (resets the dedupe loop).
 *
 * After picking, the template placeholders ({name}, {games}, ...) are filled
 * in from the profile.
 */
export function pickLine(
  category: MiraCategory,
  profile: MiraProfile,
  recent?: Set<string>,
): string {
  const pool = DIALOGUES[category];
  if (pool.length === 0) return "";

  const available = recent ? pool.filter((l) => !recent.has(l)) : pool;
  const useFromFull = available.length === 0;
  const choices = useFromFull ? pool : available;
  const template = choices[Math.floor(Math.random() * choices.length)];

  // Track that we used this template (caller maintains the Set).
  if (recent && !useFromFull) recent.add(template);

  return fillTemplate(template, profile);
}

function fillTemplate(template: string, profile: MiraProfile): string {
  return template
    .replace(/\{name\}/g, profile.name ?? "you")
    .replace(/\{games\}/g, String(profile.gamesPlayed))
    .replace(/\{wins\}/g, String(profile.wins))
    .replace(/\{losses\}/g, String(profile.losses))
    .replace(/\{best\}/g, timeOfDay());
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
