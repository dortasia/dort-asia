/**
 * Centralised environment variable validator.
 *
 * All NEXT_PUBLIC_* vars are baked in at build time.
 * SUPABASE_SERVICE_ROLE_KEY is server-only — never exposed to the browser.
 *
 * Call `validateEnv()` once at server startup (e.g. in next.config.ts or a
 * server layout) to fail fast with a clear message instead of a silent runtime
 * error.
 */

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_LANDING_URL",
  "NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL",
] as const;

const REQUIRED_SERVER = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

type PublicKey = (typeof REQUIRED_PUBLIC)[number];
type ServerKey = (typeof REQUIRED_SERVER)[number];

/** Typed, validated access to public env vars. */
export const ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  LANDING_URL: process.env.NEXT_PUBLIC_LANDING_URL!,
  HRMS_URL: process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL!,
  PAYROLL_URL: process.env.NEXT_PUBLIC_PAYROLL_URL ?? "",
  PROJECT_URL: process.env.NEXT_PUBLIC_PROJECT_MANAGEMENT_URL ?? "",
  XENTRA_URL: process.env.NEXT_PUBLIC_XENTRA_URL ?? "",
  GMAPS_KEY: process.env.NEXT_PUBLIC_GMAPS_KEY ?? "",
} as const;

/**
 * Run once at build/boot time. Throws if any required variable is missing.
 * Server-only variables are only checked in a Node.js (non-browser) context.
 */
export function validateEnv() {
  const missing: string[] = [];

  for (const key of REQUIRED_PUBLIC) {
    if (!process.env[key]) missing.push(key);
  }

  // Only check server-side vars in a Node context
  if (typeof window === "undefined") {
    for (const key of REQUIRED_SERVER) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\n\n❌ Missing required environment variables:\n` +
        missing.map((k) => `   • ${k}`).join("\n") +
        `\n\nSet them in .env.local (dev), .env.beta, or .env.production,` +
        ` and ensure they are passed as --build-arg to Docker.\n`
    );
  }
}
