import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // If the user arrives at the root with an authorization_id (because of Supabase Site URL redirect)
  // forward them to the consent page.
  const url = request.nextUrl.clone();
  if (url.pathname === '/' && (url.searchParams.has('authorization_id') || url.searchParams.has('consent_id'))) {
    url.pathname = '/oauth/consent';
    return Response.redirect(url);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
