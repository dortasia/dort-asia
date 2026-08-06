import { createClient as createSSRClient } from "@/utils/supabase/client";
import { createClient as createServerSupabase } from "@supabase/supabase-js";

/**
 * Global authenticated Supabase client proxy that delegates to createBrowserClient,
 * ensuring all database requests across the app automatically include current session cookies.
 *
 * On the server side, falls back to a standard @supabase/supabase-js client using
 * environment variables — hardcoded credentials are never allowed.
 */
export const supabase = new Proxy({} as ReturnType<typeof createSSRClient>, {
  get(_target, prop) {
    if (typeof window === 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          '[supabase] Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
        );
      }

      const instance = createServerSupabase(supabaseUrl, supabaseAnonKey);
      const val = instance[prop as keyof typeof instance];
      return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(instance) : val;
    }

    const client = createSSRClient();
    const value = (client as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  }
});
