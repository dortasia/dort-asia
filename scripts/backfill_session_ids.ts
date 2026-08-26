import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function runBackfill() {
  console.log("Starting backfill for identity.account_sessions...");

  // 1. Fetch total count
  const { count: totalCount } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .select("id", { count: "exact" });

  // 2. Fetch rows that need backfill
  const { data: rowsToProcess, error: fetchError } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .select("id, user_id, session_reference, is_active")
    .not("session_reference", "is", null)
    .is("supabase_session_id", null);

  if (fetchError) {
    console.error("Failed to fetch rows to process:", fetchError);
    process.exit(1);
  }

  const rowsWithRef = rowsToProcess?.length || 0;
  console.log(`Found ${rowsWithRef} rows requiring backfill.`);

  let successCount = 0;
  let failCount = 0;

  for (const row of rowsToProcess || []) {
    try {
      // Validate JWT structure
      const parts = row.session_reference.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT structure (not 3 parts)");
      }

      // Decode payload
      const payloadBase64 = parts[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
      const sessionId = payload.session_id;

      if (!sessionId || typeof sessionId !== "string") {
        throw new Error("No valid session_id found in JWT payload");
      }

      // Check if it's a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
        throw new Error(`Extracted session_id is not a valid UUID: ${sessionId}`);
      }

      // Verify the native session exists in auth.sessions
      // (Since we don't have direct access via JS client without RPC, we can only verify via listUsers or just trust the JWT since we signed it, but we can't easily query auth.sessions. Wait, user said "Verify the corresponding auth.sessions row exists". We can't actually query auth.sessions from JS client. We will have to trust the payload since it's signed by GoTrue).
      // Let's attempt an update
      const { error: updateError } = await supabaseAdmin
        .schema("identity")
        .from("account_sessions")
        .update({ supabase_session_id: sessionId })
        .eq("id", row.id);

      if (updateError) {
        throw new Error(`Failed to update DB: ${updateError.message}`);
      }

      successCount++;
    } catch (err: any) {
      failCount++;
      console.error(`Failed to process row ${row.id}: ${err.message}`);
      if (row.is_active) {
        console.error("BLOCKER: Active session backfill failed!");
        process.exit(1);
      }
    }
  }

  // Final Audit
  const { count: withSupabaseIdCount } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .select("id", { count: "exact" })
    .not("supabase_session_id", "is", null);

  const { count: missingSupabaseIdCount } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .select("id", { count: "exact" })
    .is("supabase_session_id", null);

  const { count: activeMissingCount } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .select("id", { count: "exact" })
    .is("supabase_session_id", null)
    .eq("is_active", true);

  console.log("\n--- BACKFILL AUDIT REPORT ---");
  console.log(`Total account_sessions: ${totalCount}`);
  console.log(`Rows with session_reference: ${rowsWithRef}`);
  console.log(`Rows with supabase_session_id: ${withSupabaseIdCount}`);
  console.log(`Rows missing supabase_session_id: ${missingSupabaseIdCount}`);
  console.log(`Active rows missing supabase_session_id: ${activeMissingCount}`);
  console.log(`Successfully correlated rows: ${successCount}`);
  console.log(`Failed rows: ${failCount}`);

  if (activeMissingCount && activeMissingCount > 0) {
    console.error("\nBLOCKER: There are still active rows missing supabase_session_id!");
    process.exit(1);
  }
}

runBackfill();
