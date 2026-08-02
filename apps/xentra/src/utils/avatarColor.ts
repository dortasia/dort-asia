/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Dort Asia – Universal Avatar Color System
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Rule: The FIRST LETTER of the name determines the color.
 * Same name = same color everywhere across every app, pixel-perfect.
 *
 *  A–D  →  Orange  (#FF9500)
 *  E–H  →  Blue    (#007AFF)
 *  I–L  →  Green   (#34C759)
 *  M–P  →  Purple  (#AF52DE)
 *  Q–T  →  Red     (#FF2D55)
 *  U–Z  →  Teal    (#00C7BE)
 *
 * Usage:
 *   const { bg, color, solid, tint } = getAvatarColor(name)
 *
 *   bg    → solid vivid color  → use as avatar background
 *   color → always "#ffffff"   → use as avatar text/icon color
 *   solid → same as bg        → alias for explicit use
 *   tint  → 15% opacity hex   → use for light chip backgrounds
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface AvatarColor {
  /** Solid vivid background for the avatar circle */
  bg: string;
  /** Always white — text/icon on top of the avatar */
  color: string;
  /** Alias of bg — for places that explicitly destructure `solid` */
  solid: string;
  /** Light 15%-opacity tint for chips / badges */
  tint: string;
}

const MAP: AvatarColor[] = [
  // A–D  Orange
  { bg: "#FF9500", color: "#ffffff", solid: "#FF9500", tint: "#FF950026" },
  // E–H  Blue
  { bg: "#007AFF", color: "#ffffff", solid: "#007AFF", tint: "#007AFF26" },
  // I–L  Green
  { bg: "#34C759", color: "#ffffff", solid: "#34C759", tint: "#34C75926" },
  // M–P  Purple
  { bg: "#AF52DE", color: "#ffffff", solid: "#AF52DE", tint: "#AF52DE26" },
  // Q–T  Red
  { bg: "#FF2D55", color: "#ffffff", solid: "#FF2D55", tint: "#FF2D5526" },
  // U–Z  Teal
  { bg: "#00C7BE", color: "#ffffff", solid: "#00C7BE", tint: "#00C7BE26" },
];

/**
 * Returns the canonical avatar color for a given name.
 * Determined purely by first letter — same name = same color everywhere.
 */
export function getAvatarColor(name?: string | null): AvatarColor {
  const trimmed = (name || "").trim();
  const first = (trimmed.length > 0 ? trimmed[0] : "A").toUpperCase();
  const code = first.charCodeAt(0);

  if (code >= 65 && code <= 68) return MAP[0]; // A–D  Orange
  if (code >= 69 && code <= 72) return MAP[1]; // E–H  Blue
  if (code >= 73 && code <= 76) return MAP[2]; // I–L  Green
  if (code >= 77 && code <= 80) return MAP[3]; // M–P  Purple
  if (code >= 81 && code <= 84) return MAP[4]; // Q–T  Red
  if (code >= 85 && code <= 90) return MAP[5]; // U–Z  Teal

  return MAP[1]; // fallback → Blue
}

/**
 * Returns up to 2 uppercase initials from a full name.
 */
export function getInitials(name?: string | null): string {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  return trimmed
    .split(" ")
    .filter(Boolean)
    .map(p => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
