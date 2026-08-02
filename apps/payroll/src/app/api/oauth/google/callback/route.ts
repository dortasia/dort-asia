import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const redirectBase = `${process.env.NEXT_PUBLIC_HRMS_URL}/storage`;

  if (error || !code || !userId) {
    console.error("[Google OAuth] Missing params:", { error, code: !!code, userId });
    return NextResponse.redirect(`${redirectBase}?drive_error=${error || "no_code"}`);
  }

  try {
    // 1. Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_HRMS_URL}/api/oauth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[Google OAuth] Token exchange failed:", errBody);
      return NextResponse.redirect(`${redirectBase}?drive_error=token_exchange_failed`);
    }

    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token) {
      console.error("[Google OAuth] No access_token in response:", tokens);
      return NextResponse.redirect(`${redirectBase}?drive_error=no_access_token`);
    }

    // 2. Fetch storage quota from Google Drive API
    const quotaRes = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=storageQuota,user",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!quotaRes.ok) {
      console.error("[Google OAuth] Quota fetch failed:", quotaRes.status);
      return NextResponse.redirect(`${redirectBase}?drive_error=quota_fetch_failed`);
    }

    const quotaData = await quotaRes.json();
    console.log("[Google OAuth] Quota data:", JSON.stringify(quotaData.storageQuota));

    const quota = quotaData.storageQuota || {};
    // usage = total across Drive, Gmail, Photos
    // usageInDrive = Drive files only
    const usedBytes  = parseInt(quota.usage || quota.usageInDrive || "0", 10);
    const totalBytes = parseInt(quota.limit || "16106127360", 10); // 15 GiB default
    // Google uses binary GiB (1024^3) in their UI, not decimal GB (1e9)
    const GiB = 1073741824; // 1024^3
    const usedGB  = parseFloat((usedBytes  / GiB).toFixed(2));
    const totalGB = parseFloat((totalBytes / GiB).toFixed(2));
    const driveUser = quotaData.user?.emailAddress || "";

    console.log(`[Google OAuth] user=${driveUser} used=${usedGB}GB total=${totalGB}GB`);

    // 3. Save to Supabase using service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current connected_drives
    const { data: comp, error: fetchErr } = await supabase
      .from("company_settings")
      .select("connected_drives")
      .eq("company_id", userId)
      .maybeSingle();

    if (fetchErr) {
      console.error("[Google OAuth] Supabase fetch error:", fetchErr);
    }

    const existing: any[] = Array.isArray(comp?.connected_drives) ? comp.connected_drives : [];
    const withoutGoogle = existing.filter((d: any) => d.key !== "google_drive");
    const updated = [
      ...withoutGoogle,
      {
        key: "google_drive",
        connected: true,
        used: usedGB,
        total: totalGB,
        account: driveUser,
        access_token,
        refresh_token: refresh_token || null,
        expires_at: Date.now() + (expires_in || 3600) * 1000,
      },
    ];

    const { error: updateErr } = await supabase
      .from("company_settings")
      .update({ connected_drives: updated })
      .eq("company_id", userId);

    if (updateErr) {
      console.error("[Google OAuth] Supabase update error:", updateErr);
      return NextResponse.redirect(`${redirectBase}?drive_error=db_save_failed`);
    }

    console.log("[Google OAuth] Successfully saved drive connection for userId:", userId);
    return NextResponse.redirect(`${redirectBase}?drive_connected=google_drive`);

  } catch (err: any) {
    console.error("[Google OAuth] Unexpected error:", err?.message);
    return NextResponse.redirect(`${redirectBase}?drive_error=server_error`);
  }
}
