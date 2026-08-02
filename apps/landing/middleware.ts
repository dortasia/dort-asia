import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://pjeedikqcmznpwopfucs.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZWVkaWtxY216bnB3b3BmdWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzI5MzIsImV4cCI6MjA5ODc0ODkzMn0.f5fFHF_JQa76d-EU43z_nuJMiBeH5vYlNfZmrqZPNKM',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          const isLocalhost = request.nextUrl.hostname === 'localhost';
          
          // Write cookies onto the request for downstream server components
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response with updated request cookies
          supabaseResponse = NextResponse.next({ request });
          // Also forward cookies to the browser via response headers
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: isLocalhost ? undefined : '.dortasia.com',
            })
          );
        },
      },
    }
  );

  // IMPORTANT: Do not remove this call.
  // It refreshes expired session tokens and writes updated cookies.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/apps')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (images, svgs, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
