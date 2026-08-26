import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getDeviceIdentity, parseUserAgent } from "@/lib/security/device";
import { getGeoLocation } from "@/lib/security/geo";
import { sendSecurityAlertNotification } from "@/services/notifications";

export interface SecurityEventOptions {
  authMethod?: string;
  user?: any;
  userId?: string;
  session?: any;
  accessToken?: string;
}

export async function processLoginSecurityEvent(options?: SecurityEventOptions) {
  console.log("[SECURITY_DIAG] processLoginSecurityEvent started");
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const isAdminInitialized = Boolean(supabaseUrl && serviceRoleKey);
  console.log("[SECURITY_DIAG] Service-role admin client initialized:", isAdminInitialized);

  const supabaseAdmin = createSupabaseClient(
    supabaseUrl!,
    serviceRoleKey!
  );

  // 1. Get authenticated user and session
  let user = options?.user;
  let userId = options?.userId || user?.id;
  let authSessionId = options?.accessToken || options?.session?.access_token;

  if (!userId) {
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userError && userData?.user) {
      user = userData.user;
      userId = user.id;
    }
  }

  if (!userId) {
    console.error("[SECURITY_DIAG] No active user found during security event processing.");
    return null;
  }

  console.log("[SECURITY_DIAG] Authenticated user ID:", userId);

  // Get account_id using admin client
  const { data: account, error: accountError } = await supabaseAdmin
    .schema("identity")
    .from("accounts")
    .select("id")
    .eq("auth_user_id", userId)
    .single();

  console.log(
    "[SECURITY_DIAG] identity.accounts SELECT result:",
    account ? `Found account ID: ${account.id}` : "NOT FOUND",
    accountError ? `Error: ${accountError.code} - ${accountError.message}` : "No error"
  );

  if (!account) {
    console.error("[SECURITY_DIAG] Aborting: No identity.account found for user", userId);
    return null;
  }

  const accountId = account.id;

  // 2. Gather context
  const deviceId = await getDeviceIdentity();
  const parsedUa = await parseUserAgent();
  const geo = await getGeoLocation();

  // 3. Evaluate Security Rules (Check past successful logins)
  const { data: pastLogins, error: pastLoginsError } = await supabaseAdmin
    .schema("identity")
    .from("login_events")
    .select("device_id, country_code")
    .eq("account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (pastLoginsError) {
    console.warn("[SECURITY_DIAG] Past logins query notice:", pastLoginsError.code, pastLoginsError.message);
  }

  const isFirstEverLogin = !pastLogins || pastLogins.length === 0;
  
  let isNewDevice = false;
  let isNewLocation = false;

  if (!isFirstEverLogin) {
    const knownDevices = new Set(pastLogins.map(l => l.device_id));
    const knownCountries = new Set(pastLogins.map(l => l.country_code).filter(Boolean));

    isNewDevice = !knownDevices.has(deviceId);
    isNewLocation = !!geo.countryCode && !knownCountries.has(geo.countryCode);
  }

  let eventType: "login" | "new_device" | "new_location" | "new_device_and_location" = "login";
  if (isNewDevice && isNewLocation) eventType = "new_device_and_location";
  else if (isNewDevice) eventType = "new_device";
  else if (isNewLocation) eventType = "new_location";

  // 4. Update or Create Account Session
  // Find if this device already has an active session record
  const { data: existingSession, error: existingError } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .select("id")
    .eq("account_id", accountId)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") {
    console.warn("[SECURITY_DIAG] existingSession lookup notice:", existingError.code, existingError.message);
  }

  let supabaseSessionId: string | null = null;
  if (authSessionId && authSessionId.includes('.')) {
    try {
      const payloadBase64 = authSessionId.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      supabaseSessionId = payload.session_id || null;
    } catch {
      // Ignore
    }
  }

  let internalSessionId;

  if (existingSession) {
    // Update existing session with admin client
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .schema("identity")
      .from("account_sessions")
      .update({
        is_active: true,
        ...(supabaseSessionId ? { supabase_session_id: supabaseSessionId } : {}),
        ip_address: geo.ipAddress,
        user_agent: parsedUa.rawString,
        device_name: parsedUa.deviceName,
        device_type: parsedUa.deviceType,
        browser: parsedUa.browser,
        os: parsedUa.os,
        country_code: geo.countryCode,
        country_name: geo.countryName,
        city: geo.city,
        region: geo.region,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existingSession.id)
      .select("id")
      .single();

    console.log(
      "[SECURITY_DIAG] account_sessions UPDATE result:",
      updatedSession ? `Updated session ID: ${updatedSession.id}` : "FAILED",
      updateError ? `Error: ${updateError.code} - ${updateError.message}` : "No error"
    );

    if (updateError) {
      return { success: false, error: "Failed to process security event (session update)" };
    }
    internalSessionId = updatedSession?.id;
  } else {
    // Insert new session with admin client
    const { data: newSession, error: insertError } = await supabaseAdmin
      .schema("identity")
      .from("account_sessions")
      .insert({
        account_id: accountId,
        user_id: userId,
        device_id: deviceId,
        is_active: true,
        supabase_session_id: supabaseSessionId,
        ip_address: geo.ipAddress,
        user_agent: parsedUa.rawString,
        device_name: parsedUa.deviceName,
        device_type: parsedUa.deviceType,
        browser: parsedUa.browser,
        os: parsedUa.os,
        country_code: geo.countryCode,
        country_name: geo.countryName,
        city: geo.city,
        region: geo.region,
      })
      .select("id")
      .single();

    console.log(
      "[SECURITY_DIAG] account_sessions INSERT result:",
      newSession ? `Inserted session ID: ${newSession.id}` : "FAILED",
      insertError ? `Error: ${insertError.code} - ${insertError.message}` : "No error"
    );

    if (insertError) {
      return { success: false, error: "Failed to process security event (session insert)" };
    }
    internalSessionId = newSession?.id;
  }

  // Securely determine the authentication method from the user / session token
  let finalAuthMethod = options?.authMethod || "email_password";
  const amr = (user as any)?.amr;
  
  if (amr && Array.isArray(amr)) {
    const methods = amr.map((m: any) => m.method);
    if (methods.includes('webauthn') || methods.includes('passkey')) {
      finalAuthMethod = 'passkey';
    } else if (methods.includes('totp') || methods.includes('mfa')) {
      finalAuthMethod = 'mfa_totp';
    } else if (methods.includes('otp') || methods.includes('magiclink')) {
      finalAuthMethod = 'otp';
    } else if (methods.includes('sso')) {
      finalAuthMethod = 'sso';
    } else if (methods.includes('oauth')) {
      finalAuthMethod = 'google_oauth';
    }
  } else if (user?.app_metadata?.provider === 'google') {
    finalAuthMethod = 'google_oauth';
  } else if (user?.app_metadata?.provider === 'sso') {
    finalAuthMethod = 'sso';
  }

  // Insert Login Event (Successful Login) with admin client
  const { data: insertedEvent, error: eventError } = await supabaseAdmin
    .schema("identity")
    .from("login_events")
    .insert({
      account_id: accountId,
      user_id: userId,
      session_id: internalSessionId,
      auth_method: finalAuthMethod,
      device_id: deviceId,
      device_name: parsedUa.deviceName,
      device_type: parsedUa.deviceType,
      browser: parsedUa.browser,
      os: parsedUa.os,
      ip_address: geo.ipAddress,
      country_code: geo.countryCode,
      country_name: geo.countryName,
      city: geo.city,
      region: geo.region,
      event_type: eventType,
      is_new_device: isNewDevice,
      is_new_location: isNewLocation,
    })
    .select("id")
    .single();

  console.log(
    "[SECURITY_DIAG] login_events INSERT result:",
    insertedEvent ? `Inserted event ID: ${insertedEvent.id}` : "FAILED",
    eventError ? `Error: ${eventError.code} - ${eventError.message}` : "No error"
  );

  if (eventError) {
    return { success: false, error: "Failed to process security event (event insert)" };
  }

  // 6. Fire Notifications (Only for new devices or locations)
  if (isNewDevice || isNewLocation) {
    await sendSecurityAlertNotification({
      userId,
      accountId,
      eventType: eventType as "new_device" | "new_location" | "new_device_and_location",
      browser: parsedUa.browser,
      os: parsedUa.os,
      city: geo.city,
      country: geo.countryCode || geo.countryName,
    });
  }

  console.log("[SECURITY_DIAG] processLoginSecurityEvent finished successfully. Event type:", eventType);
  return { success: true, eventType };
}
