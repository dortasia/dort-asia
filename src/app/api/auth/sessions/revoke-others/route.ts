import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { getDeviceIdentity } from "@/lib/security/device";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Invalidate tokens at the Identity Provider Level natively
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'others' });
    
    if (signOutError) {
      console.error("Error revoking other sessions via Supabase Auth:", signOutError);
      return NextResponse.json({ error: "Failed to revoke tokens natively" }, { status: 500 });
    }

    const currentDeviceId = await getDeviceIdentity();

    // 2. Mark other sessions inactive in our tracking table using service_role
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch other active sessions before updating
    const { data: otherSessions } = await supabaseAdmin
      .schema("identity")
      .from("account_sessions")
      .select("id, account_id, browser, os, device_id")
      .eq("user_id", user.id)
      .neq("device_id", currentDeviceId)
      .eq("is_active", true);

    const revokedCount = otherSessions?.length || 0;

    const { error: dbError } = await supabaseAdmin
      .schema("identity")
      .from("account_sessions")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .neq("device_id", currentDeviceId)
      .eq("is_active", true);

    if (dbError) {
      console.error("Error updating account_sessions:", dbError);
      return NextResponse.json({ error: "Tokens revoked but failed to update local tracking" }, { status: 500 });
    }

    // 3. Record one security audit event for the global sign-out action
    if (otherSessions && otherSessions.length > 0) {
      try {
        await supabaseAdmin
          .schema("identity")
          .from("login_events")
          .insert({
            account_id: otherSessions[0].account_id,
            user_id: user.id,
            auth_method: "session_revocation",
            device_id: currentDeviceId,
            device_name: "Current Device",
            device_type: "desktop",
            browser: "Current Device",
            os: "Current OS",
            event_type: "login",
            metadata: {
              action: "revoke_all_other_sessions",
              revoked_count: revokedCount,
              revoked_devices: otherSessions.map((s) => `${s.browser} on ${s.os}`),
              revoked_at: new Date().toISOString(),
            },
          });
      } catch (err) {
        console.warn("[Revoke Others] Security event logging notice:", err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      revokedCount,
      message: `Signed out of ${revokedCount} other device${revokedCount === 1 ? '' : 's'}.` 
    });
  } catch (error) {
    console.error("Revoke others error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
