import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Token-based auth endpoint for cross-domain session establishment.
 * Landing page redirects here with access_token + refresh_token in the URL
 * after successful login, allowing HRMS to set its own auth cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  const next = searchParams.get('next') || '/'

  if (accessToken && refreshToken) {
    const redirectUrl = new URL(next, request.url)
    const supabaseResponse = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bwakqpptkwpcvgerayus.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWtxcHB0a3dwY3ZnZXJheXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODIyODIsImV4cCI6MjA5NDI1ODI4Mn0.WUz2ieMcP5BBFuDPotz5wfg1wUV03kBx4Tez-1ooTUc",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (!error) {
      return supabaseResponse
    }
  }

  // If no tokens or session failed, redirect to landing login
  let baseUrl = (process.env.NEXT_PUBLIC_LANDING_URL || 'https://dortasia.com').replace(/\/$/, '')
  
  // Failsafe: never redirect to localhost in a production environment
  if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {
    baseUrl = 'https://dortasia.com'
  }
  
  // Prevent redirecting to itself if misconfigured on Vercel
  if (baseUrl.includes(request.nextUrl.hostname) || baseUrl.includes('dortasia-hrms') || baseUrl.includes('localhost:3003')) {
    baseUrl = 'https://dortasia.com'
  }
  
  return NextResponse.redirect(`${baseUrl}/login`)
}
