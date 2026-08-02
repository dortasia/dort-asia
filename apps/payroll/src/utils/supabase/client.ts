import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Reuse the same client instance to avoid lock conflicts with Turbopack HMR
  if (client) return client

  // Do not set auth.storageKey here: createServerClient in middleware uses the
  // default Supabase cookie key (sb-<project-ref>-auth-token). A custom key
  // makes the browser read/write different cookies than the server, causing
  // AuthSessionMissingError on the client while middleware still sees the session.
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bwakqpptkwpcvgerayus.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWtxcHB0a3dwY3ZnZXJheXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODIyODIsImV4cCI6MjA5NDI1ODI4Mn0.WUz2ieMcP5BBFuDPotz5wfg1wUV03kBx4Tez-1ooTUc"
  )

  return client
}
