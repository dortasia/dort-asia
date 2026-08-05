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
export function getAvatarColor(name: string): AvatarColor {
  const first = (name || "A").trim()[0].toUpperCase();
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
export function getInitials(name: string): string {
  return (name || "?")
    .trim()
    .split(" ")
    .map(p => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export const DEPARTMENT_COLORS = [
  { bg: "#FDE9E7", color: "#D94841" },
  { bg: "#FFF3E4", color: "#E67E22" },
  { bg: "#FFF8DB", color: "#B8860B" },
  { bg: "#F6F8D7", color: "#7A8F00" },
  { bg: "#EAF8E5", color: "#2E8B57" },
  { bg: "#DFF7EC", color: "#1F8A70" },
  { bg: "#E3FAF3", color: "#00897B" },
  { bg: "#E4FBFA", color: "#00838F" },
  { bg: "#E6F8FF", color: "#0288D1" },
  { bg: "#EAF2FF", color: "#3B82F6" },
  { bg: "#EEF3FF", color: "#4F46E5" },
  { bg: "#F3F0FF", color: "#6D5BD0" },
  { bg: "#F8EEFF", color: "#8E44AD" },
  { bg: "#FDEEFF", color: "#C0399F" },
  { bg: "#FFEAF4", color: "#D63384" },
  { bg: "#FFF0F5", color: "#C2185B" },
  { bg: "#F7F7F8", color: "#4B5563" },
  { bg: "#ECEFF1", color: "#546E7A" },
  { bg: "#F4F1EC", color: "#8D6E63" },
  { bg: "#EEF5E8", color: "#4CAF50" },
  { bg: "#E7F8F2", color: "#00A676" },
  { bg: "#E7F7FF", color: "#0077CC" },
  { bg: "#EEF2FD", color: "#5B6CFF" },
  { bg: "#F4EDFF", color: "#7B61FF" },
  { bg: "#FCEEFF", color: "#B04CE1" },
  { bg: "#FFF1E8", color: "#F97316" },
  { bg: "#FFF8F1", color: "#C77D00" },
  { bg: "#EDF8E6", color: "#3F8F3F" },
  { bg: "#EAFDF8", color: "#0F9D8A" },
  { bg: "#EEF7FB", color: "#2B7A9A" }
];

/**
 * Returns a consistent department color based on the department name.
 * We hash the department name to deterministically select from 30 accent colors.
 */
export function getDepartmentColor(name: string): { bg: string; color: string } {
  if (!name || typeof name !== 'string') return DEPARTMENT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEPARTMENT_COLORS.length;
  return DEPARTMENT_COLORS[index];
}
/**
 * Instagram style default profile picture asset path
 */
export const INSTAGRAM_DEFAULT_AVATAR = "/default-profile.svg";

/**
 * Returns the profile picture URL for a user/employee.
 * If user uploaded a profile pic, show it; otherwise show Instagram-style default avatar.
 */
export function getUserAvatarUrl(avatarUrl?: string | null): string {
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== "" && avatarUrl !== ".." && !avatarUrl.includes('dicebear') && !avatarUrl.includes('unsplash')) {
    return avatarUrl;
  }
  return INSTAGRAM_DEFAULT_AVATAR;
}

/**
 * Returns the company profile logo URL.
 * If company uploaded a logo, show it; otherwise show Dicebear (glass) avatar based on company name.
 */
export function getCompanyLogoUrl(logoUrl?: string | null, companyName?: string | null): string {
  if (logoUrl && typeof logoUrl === 'string' && logoUrl.trim() !== "" && logoUrl !== "..") {
    return logoUrl;
  }
  return "/default-profile.svg";
}

