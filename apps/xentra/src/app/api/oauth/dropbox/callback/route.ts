import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Dropbox OAuth Callback ────────────────────────────────────────
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
    // Exchange code for token
    const tokenRes = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.DROPBOX_CLIENT_ID}:${process.env.DROPBOX_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_HRMS_URL}/api/oauth/dropbox/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) throw new Error("Token exchange failed");
    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in, account_id } = tokens;

    // Fetch space usage
    const spaceRes = await fetch("https://api.dropboxapi.com/2/users/get_space_usage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: "null",
    });
    const spaceData = await spaceRes.json();
    const usedGB = parseFloat(((spaceData.used || 0) / 1e9).toFixed(2));
    const totalGB = parseFloat(
      (((spaceData.allocation?.allocated) || 10_000_000_000) / 1e9).toFixed(2)
    );

    // Fetch account info for email
    const acctRes = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: "null",
    });
    const acctData = await acctRes.json();
    const account = acctData.email || account_id || "";

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
      ...existing.filter((d: any) => d.key !== "dropbox"),
      {
        key: "dropbox",
        connected: true,
        used: usedGB,
        total: totalGB,
        account,
        access_token,
        refresh_token: refresh_token || null,
        expires_at: expires_in ? Date.now() + expires_in * 1000 : null,
      },
    ];

    await supabase
      .from("company_settings")
      .update({ connected_drives: updated } as any)
      .eq("company_id", userId);

    return NextResponse.redirect(`${redirectBase}?drive_connected=dropbox`);
  } catch (err: any) {
    console.error("Dropbox OAuth error:", err);
    return NextResponse.redirect(`${redirectBase}?drive_error=server_error`);
  }
}
