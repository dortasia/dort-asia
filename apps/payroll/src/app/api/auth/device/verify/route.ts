import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { request_id } = await req.json();

    if (!request_id) {
      return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the request row
    const { data: requestData, error: fetchError } = await supabase
      .from("device_auth_requests")
      .select("status, user_id")
      .eq("id", request_id)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 404 });
    }

    if (requestData.status !== "approved") {
      return NextResponse.json({ error: "Request not approved yet" }, { status: 400 });
    }

    // Lookup the user so we can generate a session
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(requestData.user_id);
    if (userError || !user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a magic link; extract the token from the action_link URL,
    // then immediately exchange it for a real access+refresh token pair.
    // This avoids any browser redirect through supabase.co.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: user.email,
      options: {
        // Point redirect back to our own app's callback handler
        redirectTo: `${supabaseUrl.replace('https://', 'https://')}`,
      },
    });

    if (linkError) throw linkError;

    // The action_link looks like:
    //   https://<project>.supabase.co/auth/v1/verify?token=<hashed_token>&type=magiclink&redirect_to=...
    // Extract the token_hash so we can verify it server-side and return real JWTs.
    const actionLink = linkData.properties.action_link;
    const tokenHash = linkData.properties.hashed_token;

    if (!tokenHash) {
      throw new Error("Could not extract token hash from magic link");
    }

    // Exchange the token for a session (access_token + refresh_token)
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (sessionError || !sessionData?.session) {
      // Fallback: return the action_link for the client to navigate to
      console.warn("verifyOtp failed, falling back to action_link:", sessionError?.message);
      // Delete the device auth request to prevent replay
      await supabase.from("device_auth_requests").delete().eq("id", request_id);
      return NextResponse.json({ success: true, action_link: actionLink });
    }

    const { access_token, refresh_token } = sessionData.session;

    // Clean up the device auth request (prevent replay attacks)
    await supabase.from("device_auth_requests").delete().eq("id", request_id);

    // Return tokens directly — the client sets the session without any redirect
    return NextResponse.json({
      success: true,
      access_token,
      refresh_token,
    });

  } catch (error: any) {
    console.error("Device Auth Verify Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify device auth" },
      { status: 500 }
    );
  }
}
