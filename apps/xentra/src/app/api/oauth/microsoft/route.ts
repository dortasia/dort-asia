import { NextRequest, NextResponse } from "next/server";

// ── Microsoft OneDrive OAuth Initiation ──────────────────────────
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "";

  const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_HRMS_URL}/api/oauth/microsoft/callback`,
    response_type: "code",
    scope: "Files.Read offline_access User.Read",
    state: userId,
    response_mode: "query",
  });

  return NextResponse.redirect(`${MICROSOFT_AUTH_URL}?${params.toString()}`);
}
