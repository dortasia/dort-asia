import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Google Drive OAuth Initiation ─────────────────────────────────
// Step 1: Redirect user to Google's OAuth consent screen
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get the logged-in user's session via cookie
  const { createServerClient } = await import("@supabase/ssr");
  // We embed state = user's company_id (their auth.uid) so we can link the token back later
  // For simplicity we pass it as a state param — in production use PKCE or signed JWT
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "";

  const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_HRMS_URL}/api/oauth/google/callback`,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: userId, // pass userId so callback can link token
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
