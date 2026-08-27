import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Ensure every request has a persistent device ID before reaching route handlers
  if (!request.cookies.has("dort_device_id")) {
    const newDeviceId = crypto.randomUUID();
    request.cookies.set("dort_device_id", newDeviceId);
    supabaseResponse.cookies.set("dort_device_id", newDeviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect /admin to /dashboard/admin
  if (request.nextUrl.pathname === "/admin" || request.nextUrl.pathname.startsWith("/admin/")) {
    const url = request.nextUrl.clone();
    const rest = request.nextUrl.pathname.replace(/^\/admin/, "");
    url.pathname = "/dashboard/admin" + rest;
    return NextResponse.redirect(url);
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isProtected = request.nextUrl.pathname.startsWith("/dashboard");

  if (!user && isProtected) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    // We can append the requested URL to redirect back after login
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Strictly protect the recovery enrollment route
  if (request.nextUrl.pathname === "/auth/mfa/recover") {
    if (!request.cookies.has("mfa_recovery_token")) {
      const url = request.nextUrl.clone();
      url.pathname = user ? "/dashboard" : "/auth";
      return NextResponse.redirect(url);
    }
  }

  if (user && isProtected) {
    // Enforce MFA if the user has a verified factor but hasn't completed it this session
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!aalError && aal) {
      if (aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/mfa";
        url.searchParams.set("next", request.nextUrl.pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // Optional: If user is logged in and trying to access /auth, redirect to dashboard
  // IMPORTANT: Do not redirect /auth/callback or /auth/mfa because they are needed for authentication flows
  if (user && isAuthRoute && request.nextUrl.pathname !== "/auth/callback" && !request.nextUrl.pathname.startsWith("/auth/mfa")) {
    // Before redirecting to dashboard, check if they need MFA
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/mfa";
      return NextResponse.redirect(url);
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
