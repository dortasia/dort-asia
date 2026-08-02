import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

/**
 * OAuth callback handler.
 * 
 * After Google/Microsoft redirects back with a ?code=… param,
 * this route exchanges it for a Supabase session and sets the
 * auth cookies on a redirect response.
 *
 * We deliberately use the NextResponse cookie adapter (NOT the
 * next/headers cookies() helper) so that cookies are written on
 * the outgoing redirect response — the pattern recommended by
 * Supabase for Route Handlers.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    // Build the redirect response first so we can attach cookies to it
    const redirectUrl = new URL(next, origin);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }

    console.error('OAuth code exchange failed:', error.message);
  }

  // No code or exchange failed → back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
