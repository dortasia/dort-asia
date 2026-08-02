import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url({ message: 'Invalid Supabase URL' }),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, { message: 'Supabase Anon Key is required' }),
  VITE_APP_NAME: z.string().default('Xentra HRMS'),
  VITE_APP_VERSION: z.string().default('1.0.0'),
  VITE_LANDING_URL: z.string().url().default('http://localhost:3001'),
})

const rawEnv = {
  VITE_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://bwakqpptkwpcvgerayus.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWtxcHB0a3dwY3ZnZXJheXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODIyODIsImV4cCI6MjA5NDI1ODI4Mn0.WUz2ieMcP5BBFuDPotz5wfg1wUV03kBx4Tez-1ooTUc',
  VITE_APP_NAME: process.env.VITE_APP_NAME || 'Xentra HRMS',
  VITE_APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',
  VITE_LANDING_URL: process.env.NEXT_PUBLIC_LANDING_URL || process.env.VITE_LANDING_URL || 'http://localhost:3001',
}

const parsed = envSchema.safeParse(rawEnv)

if (!parsed.success) {
  console.warn('⚠️ Invalid environment variables:', parsed.error.format())
}

export const env = parsed.success ? parsed.data : rawEnv
