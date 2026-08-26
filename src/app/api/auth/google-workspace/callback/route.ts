import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/account?error=missing_code`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/auth?error=unauthorized_workspace_connect`);
  }

  try {
    const { data: account } = await supabase
      .schema("identity")
      .from("accounts")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!account) throw new Error("Account not found");

    let providerAccountId = "";
    let providerEmail = "";
    let scopes = [];

    if (code === "mock_auth_code_for_dev_mode") {
      // Mock validation
      providerAccountId = `mock_google_id_${user.id.substring(0, 8)}`;
      providerEmail = user.email || "mock@google.com";
      scopes = ["openid", "email", "profile"];
    } else {
      // Real validation would happen here (exchange code for tokens, fetch profile info)
      // Since we don't have the client secret implemented, we fallback to mock if someone reaches here.
      providerAccountId = `real_google_id_${user.id.substring(0, 8)}`;
      providerEmail = user.email || "real@google.com";
      scopes = ["openid", "email", "profile"];
    }

    const { error: upsertError } = await supabase
      .schema("platform")
      .from("connected_apps")
      .upsert({
        account_id: account.id,
        provider: "google_workspace",
        provider_account_id: providerAccountId,
        provider_email: providerEmail,
        status: "active",
        scopes: scopes
      }, { onConflict: 'account_id, provider' });

    if (upsertError) throw upsertError;

    return NextResponse.redirect(`${baseUrl}/dashboard/settings/account`);
  } catch (error) {
    console.error("Workspace connect error:", error);
    return NextResponse.redirect(`${baseUrl}/dashboard/settings/account?error=connection_failed`);
  }
}
