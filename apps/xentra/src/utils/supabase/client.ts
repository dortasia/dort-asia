import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Reuse the same client instance to avoid lock conflicts with Turbopack HMR
  if (client) return client

  // Do not set auth.storageKey here: createServerClient in middleware uses the
  // default Supabase cookie key (sb-<project-ref>-auth-token). A custom key
  // makes the browser read/write different cookies than the server, causing
  // AuthSessionMissingError on the client while middleware still sees the session.
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: isLocalhost ? undefined : '.dortasia.com',
      }
    }
  )

  return client
}
