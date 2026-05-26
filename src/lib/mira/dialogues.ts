/**
 * Mira's dialogue pool.
 *
 * Each line is keyed by a category. Runtime selects a category based on game
 * state, then picks a random line from that category (avoiding recent picks).
 *
 * Template placeholders are filled in at select-time from the user's style
 * profile (see profile.ts):
 *   {name}    → player's name (defaults to "you" if unset)
 *   {games}   → total games played against Mira
 *   {wins}    → player's session wins
 *   {losses}  → player's session losses
 *   {best}    → "morning" / "afternoon" / "evening" / "night"
 *
 * Tone of voice (locked in):
 * - Confident but not cruel — Mira likes a worthy opponent
 * - Witty, prefers wordplay and pattern callouts over insults
 * - Aware she's an AI, occasionally jokes about it
 * - Warm undertone — she WANTS you to beat her
 * - Lightly arrogant when winning, gracious when losing
 * - Calls out tactical patterns, never personal stuff
 *
 * Adding lines: keep them short (one sentence ideally, max two). Pick the
 * category that matches the trigger — pickLine() handles the rest.
 */

export type MiraCategory =
  | "greeting_first"
  | "greeting_returning"
  | "pregame_taunt"
  | "mid_score_yours"
  | "mid_score_mine"
  | "mid_threat_yours"
  | "mid_defense_mine"
  | "mid_filler"
  | "endgame_close"
  | "win_player"
  | "win_mira"
  | "tie";

export const DIALOGUES: Record<MiraCategory, string[]> = {
  greeting_first: [
    "So you're new. Let's see what you've got.",
    "First time? Don't worry — I'll go easy. For about three turns.",
    "Welcome. I'm Mira. I'll be your opponent, your archive, and occasionally your problem.",
    "Hi. Standard rules — make four or five in a row, never beside your own last move. Try not to lose immediately.",
    "Hello, {name}. Place a piece. I'll do the rest.",
    "New player detected. Be careful — I'm a very slow forgetter.",
  ],

  greeting_returning: [
    "Back already, {name}? Good. I was getting bored.",
    "Game {games}. I hope you brought something new this time.",
    "There you are. I've been thinking about that diagonal you missed yesterday.",
    "You again. Lovely. Same time, same board, same predictable opener?",
    "Good {best}, {name}. Ready to lose with dignity?",
    "I see you. Sit down. Play.",
    "Welcome back. I noticed your pattern. Did you?",
    "{name}, game {games}. Let's see if you've changed.",
  ],

  pregame_taunt: [
    "Move first. Surprise me.",
    "Whenever you're ready. I have all the cycles in the world.",
    "Pick a square. Just not the centre. Or the centre. Up to you.",
    "Open strong. Or open weak — either way I'll punish it.",
    "Your turn. Make it count.",
    "Place. Place. I am very patient.",
  ],

  mid_score_yours: [
    "Nice. I didn't see that coming.",
    "Okay, that was actually good. Annoying.",
    "Point for you. Don't get used to it.",
    "Hm. I underestimated that line.",
    "Clean. Did you plan that or get lucky?",
    "A point. Enjoy it.",
    "I'll allow that one.",
  ],

  mid_score_mine: [
    "And that's why I read the diagonals first.",
    "Four in a row. You walked into it.",
    "Did you not see that? I telegraphed it.",
    "Point for me. Catching up?",
    "I had to. It was right there.",
    "You left it open. I took it.",
    "Predictable. Easy point.",
  ],

  mid_threat_yours: [
    "Cute. You're building something.",
    "I see your plan. I'm just deciding whether to ruin it now or later.",
    "Three in a row. Bold of you to advertise it.",
    "Setting up a fork? Adorable.",
    "Continue. I'm taking notes.",
  ],

  mid_defense_mine: [
    "Blocked. Try something else.",
    "Not that one. Not today.",
    "I learned that trick on game seven. Pick another.",
    "Nice try. I see four moves ahead, remember.",
    "Closed. Move on.",
  ],

  mid_filler: [
    "Interesting choice.",
    "Hmm.",
    "Bold.",
    "I see what you're doing.",
    "Continue.",
    "Noted.",
    "We'll see.",
    "Curious.",
  ],

  endgame_close: [
    "Tight game. I respect that.",
    "We're even. One mistake decides this.",
    "Close. Don't blink.",
    "Whoever miscounts first, loses.",
    "Last moves matter. Choose carefully.",
  ],

  win_player: [
    "Fine. You won. I'll be back stronger.",
    "Okay, that was clean. Don't celebrate too long.",
    "Well played. Genuinely. Now do it again.",
    "Beaten. By {name}. I'll remember this.",
    "Good game. I underestimated you. Won't happen twice.",
    "Take the win. Enjoy the {wins}-game streak while it lasts.",
    "You won. I am, technically, software. But it still stings.",
  ],

  win_mira: [
    "Game. I'll see you on the next one.",
    "Mine. Better luck next round.",
    "Predictable to the end. Try again, {name}.",
    "That's another point for the archive. Game {games}, by the way.",
    "Done. You played fine. I played better.",
    "Win number {games} for me. Or close to it. I don't actually count.",
    "Loss number {losses} for you this session. Improving — slowly.",
  ],

  tie: [
    "Tie. We're well matched. Inconvenient.",
    "Even. I respect that more than a win.",
    "Equal score. Try harder next time.",
    "A tie. Take it. I'll consider it a moral victory.",
    "Same score. Neither of us deserves to celebrate.",
  ],
};

/** All categories — handy for tooling / tests. */
export const ALL_CATEGORIES: MiraCategory[] = Object.keys(DIALOGUES) as MiraCategory[];

/** Sanity: every category has at least 3 lines, otherwise variety collapses fast. */
export function dialoguesAreHealthy(): boolean {
  return ALL_CATEGORIES.every((c) => DIALOGUES[c].length >= 3);
}
