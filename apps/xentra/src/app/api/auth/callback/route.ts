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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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
  let baseUrl = (process.env.NEXT_PUBLIC_LANDING_URL || 'https://dortasia.vercel.app').replace(/\/$/, '')
  
  // Prevent redirecting to itself if misconfigured on Vercel (exact hostname match only)
  try {
    const landingHostname = new URL(baseUrl).hostname
    if (landingHostname === request.nextUrl.hostname) {
      baseUrl = 'https://dortasia.com'
    }
  } catch {
    baseUrl = 'https://dortasia.com'
  }
  
  return NextResponse.redirect(`${baseUrl}/login`)
}
