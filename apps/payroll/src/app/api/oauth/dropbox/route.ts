import { NextRequest, NextResponse } from "next/server";

// ── Dropbox OAuth Initiation ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "";

  const DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
  const params = new URLSearchParams({
    client_id: process.env.DROPBOX_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_HRMS_URL}/api/oauth/dropbox/callback`,
    response_type: "code",
    token_access_type: "offline",
    state: userId,
  });

  return NextResponse.redirect(`${DROPBOX_AUTH_URL}?${params.toString()}`);
}
