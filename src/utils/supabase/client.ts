import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const finalUrl = (url && url !== '[SENSITIVE]') ? url : 'https://dummy.supabase.co';
  const finalKey = (key && key !== '[SENSITIVE]') ? key : 'dummy_anon_key';

  return createBrowserClient(finalUrl, finalKey, {
    auth: {
      experimental: {
        passkey: true
      }
    }
  })
}
