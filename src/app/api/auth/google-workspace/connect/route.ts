import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
  
  if (!process.env.GOOGLE_WORKSPACE_CLIENT_ID) {
    // Development/mock mode
    return NextResponse.redirect(`${baseUrl}/api/auth/google-workspace/callback?code=mock_auth_code_for_dev_mode`);
  }

  // Real mode
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/google-workspace/callback`);
  const clientId = process.env.GOOGLE_WORKSPACE_CLIENT_ID;
  const scopes = encodeURIComponent("openid email profile");
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;
  
  return NextResponse.redirect(authUrl);
}
