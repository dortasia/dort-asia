import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getDeviceIdentity } from "@/lib/security/device";
import { processLoginSecurityEvent } from "@/services/security";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentDeviceId = await getDeviceIdentity();

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch active sessions from our tracking table with admin client for reliability
    let { data: sessions, error } = await supabaseAdmin
      .schema("identity")
      .from("account_sessions")
      .select("id, device_id, device_name, device_type, browser, os, city, country_name, last_seen_at")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("last_seen_at", { ascending: false })
      .limit(20);

    if (error) {
      // Gracefully handle pre-migration state where schema/table doesn't exist or usage is not granted
      if (['42P01', '42501', 'PGRST205'].includes(error.code)) {
        return NextResponse.json({ sessions: [] }, { status: 200 });
      }
      
      console.error("DEBUG: Error fetching sessions from Supabase:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: "Failed to fetch sessions", details: error }, { status: 500 });
    }

    // Self-healing: if no active session exists or current device is missing, record the current device
    if (!sessions || sessions.length === 0 || !sessions.some(s => s.device_id === currentDeviceId)) {
      try {
        const result = await processLoginSecurityEvent({ user, userId: user.id });
        if (result && !result.success) {
          console.warn("[SESSIONS_API] Self-healing session registration notice:", result.error);
        }
        const { data: refetched } = await supabaseAdmin
          .schema("identity")
          .from("account_sessions")
          .select("id, device_id, device_name, device_type, browser, os, city, country_name, last_seen_at")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("last_seen_at", { ascending: false })
          .limit(20);
        if (refetched) {
          sessions = refetched;
        }
      } catch (err) {
        console.warn("Auto-register current session notice:", err);
      }
    }

    const formattedSessions = (sessions || []).map((s) => ({
      ...s,
      is_current: s.device_id === currentDeviceId,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    // Extract current native Supabase session_id from JWT payload
    const payloadBase64 = session.access_token.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
    const currentSupabaseSessionId = payload.session_id;

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify session ownership and get details for audit logging
    const { data: targetSession, error: fetchError } = await supabaseAdmin
      .schema("identity")
      .from("account_sessions")
      .select("id, account_id, device_id, device_name, device_type, browser, os, ip_address, country_code, country_name, city, region, is_active")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !targetSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // 2. Call the secured RPC to revoke the target session natively
    const { error: revokeError } = await supabaseAdmin
      .schema("identity")
      .rpc("revoke_device_session", {
        p_account_session_id: sessionId,
        p_user_id: user.id,
        p_current_supabase_session_id: currentSupabaseSessionId
      });

    if (revokeError) {
      console.error("[DIAG] Revocation RPC failed:", revokeError.message);
      return NextResponse.json(
        { error: revokeError.message },
        { status: 400 }
      );
    }

    // 3. Record security audit event
    const deviceLabel = `${targetSession.browser || 'Browser'} on ${targetSession.os || 'Device'}`;
    try {
      await supabaseAdmin
        .schema("identity")
        .from("login_events")
        .insert({
          account_id: targetSession.account_id,
          user_id: user.id,
          session_id: targetSession.id,
          auth_method: "session_revocation",
          device_id: targetSession.device_id || "unknown",
          device_name: targetSession.device_name || "Device",
          device_type: targetSession.device_type || "desktop",
          browser: targetSession.browser || "Unknown",
          os: targetSession.os || "Unknown",
          ip_address: targetSession.ip_address || null,
          country_code: targetSession.country_code || null,
          country_name: targetSession.country_name || null,
          city: targetSession.city || null,
          region: targetSession.region || null,
          event_type: "login",
          metadata: {
            action: "session_revoked",
            revoked_session_id: targetSession.id,
            revoked_device: deviceLabel,
            revoked_at: new Date().toISOString(),
          },
        });
    } catch (err) {
      console.warn("[Session Revoke] Security event logging notice:", err);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Signed out of ${deviceLabel}.` 
    });
  } catch (error) {
    console.error("Session revoke error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
