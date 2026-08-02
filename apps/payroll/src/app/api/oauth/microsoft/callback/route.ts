import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Microsoft OneDrive OAuth Callback ────────────────────────────
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const redirectBase = `${process.env.NEXT_PUBLIC_HRMS_URL}/storage`;

  if (error || !code || !userId) {
    return NextResponse.redirect(`${redirectBase}?drive_error=${error || "no_code"}`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_HRMS_URL}/api/oauth/microsoft/callback`,
          grant_type: "authorization_code",
          scope: "Files.Read offline_access User.Read",
        }),
      }
    );

    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Fetch OneDrive storage quota
    const driveRes = await fetch("https://graph.microsoft.com/v1.0/me/drive", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const driveData = await driveRes.json();
    const quota = driveData.quota || {};
    const usedGB = parseFloat(((quota.used || 0) / 1e9).toFixed(2));
    const totalGB = parseFloat(((quota.total || 5_000_000_000) / 1e9).toFixed(2));

    const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const meData = await meRes.json();
    const account = meData.userPrincipalName || meData.mail || "";

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: comp } = await supabase
      .from("company_settings")
      .select("connected_drives")
      .eq("company_id", userId)
      .maybeSingle();

    const existing: any[] = Array.isArray(comp?.connected_drives) ? comp.connected_drives : [];
    const updated = [
      ...existing.filter((d: any) => d.key !== "onedrive"),
      {
        key: "onedrive",
        connected: true,
        used: usedGB,
        total: totalGB,
        account,
        access_token,
        refresh_token: refresh_token || null,
        expires_at: Date.now() + (expires_in || 3600) * 1000,
      },
    ];

    await supabase
      .from("company_settings")
      .update({ connected_drives: updated } as any)
      .eq("company_id", userId);

    return NextResponse.redirect(`${redirectBase}?drive_connected=onedrive`);
  } catch (err: any) {
    console.error("OneDrive OAuth error:", err);
    return NextResponse.redirect(`${redirectBase}?drive_error=server_error`);
  }
}
