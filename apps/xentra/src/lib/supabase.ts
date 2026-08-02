import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/config/env'

export const supabase = createBrowserClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
)
