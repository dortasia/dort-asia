import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const isLocalhost = request.nextUrl.hostname === 'localhost'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: isLocalhost ? undefined : '.dortasia.com',
            })
          )
        },
      },
    }
  )

  // This will refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all dashboard routes — authentication is handled by the Dort Asia landing page
  const isApiRoute = request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/_next')

  if (!user && !isApiRoute) {
    // Prevent infinite loops: only override if LANDING_URL points exactly at this HRMS host
    let baseUrl = process.env.NEXT_PUBLIC_LANDING_URL || 'https://dortasia.vercel.app'
    try {
      const landingHostname = new URL(baseUrl).hostname
      if (landingHostname === request.nextUrl.hostname) {
        baseUrl = 'https://dortasia.com'
      }
    } catch {
      baseUrl = 'https://dortasia.com'
    }
    
    // Redirect unauthenticated users to the external Dort Asia login page
    const landingLoginUrl = new URL('/login', baseUrl)
    return NextResponse.redirect(landingLoginUrl)
  }

  return supabaseResponse
}
