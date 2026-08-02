import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables are missing. " +
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      domain: isLocalhost ? undefined : '.dortasia.com',
    }
  });
}
