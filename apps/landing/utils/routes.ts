/**
 * Centralised cross-app routing.
 *
 * All URLs are derived from ENV — never hardcoded.
 * Use these helpers everywhere instead of building URLs inline.
 */

import { ENV } from "./env";
import { Session } from "@supabase/supabase-js";

/** Return the HRMS callback URL (with session tokens) or the base HRMS URL if
 *  no session is provided. */
export function hrmsUrl(session?: Session | null): string {
  const base = ENV.HRMS_URL.replace(/\/$/, "");
  if (session) {
    return (
      `${base}/api/auth/callback` +
      `?access_token=${encodeURIComponent(session.access_token)}` +
      `&refresh_token=${encodeURIComponent(session.refresh_token)}`
    );
  }
  return base;
}

/** Return the Xentra (or other micro-frontend) URL. */
export function xentraUrl(): string {
  return ENV.XENTRA_URL || "/apps";
}

/**
 * Validate that an external `?redirect=` query param is from a trusted origin.
 *
 * Accepted patterns:
 *  - Exact NEXT_PUBLIC_* origins from ENV
 *  - localhost (dev only)
 *  - *.vercel.app (beta)
 *  - *.dortasia.com (production)
 */
const TRUSTED_ORIGINS = [
  ENV.LANDING_URL,
  ENV.HRMS_URL,
  ENV.PAYROLL_URL,
  ENV.PROJECT_URL,
].filter(Boolean);

export function isTrustedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    // Allow localhost for dev
    if (host === "localhost" || host === "127.0.0.1") return true;

    // Allow *.vercel.app for beta
    if (host.endsWith(".vercel.app")) return true;

    // Allow *.dortasia.com for production
    if (host === "dortasia.com" || host.endsWith(".dortasia.com")) return true;

    // Allow any explicitly configured ENV origin
    for (const origin of TRUSTED_ORIGINS) {
      try {
        if (new URL(origin).hostname === host) return true;
      } catch {
        // ignore malformed ENV values
      }
    }

    return false;
  } catch {
    return false; // not a valid URL
  }
}
