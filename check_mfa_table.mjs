import { createClient } from '@supabase/supabase-js';

const url = "https://zirmlijktxaboztjojed.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm1saWprdHhhYm96dGpvamVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcxMzMxOSwiZXhwIjoyMTAyMjg5MzE5fQ.3MPdaraFDP2dsvGQZhSXiY5Ym4HJSDs_-TGLAsBlxlc";

const supabase = createClient(url, key);

async function run() {
  console.log("Testing SELECT against identity.mfa_recovery_codes...");
  const selectRes = await supabase.schema('identity').from('mfa_recovery_codes').select('*').limit(1);
  if (selectRes.error) {
    console.log("SELECT ERROR:", JSON.stringify(selectRes.error, null, 2));
  } else {
    console.log("SELECT SUCCESS. Table exists.");
  }
  
  // Try inserting a dummy row but with a fake account_id to see if it fails due to foreign key or something else.
  // Actually, we can just insert something invalid to see the error.
  console.log("Testing INSERT against identity.mfa_recovery_codes...");
  const insertRes = await supabase.schema('identity').from('mfa_recovery_codes').insert({
    account_id: '00000000-0000-0000-0000-000000000000',
    code_hash: 'testhash'
  });
  
  console.log("INSERT RESULT:", JSON.stringify(insertRes, null, 2));
}

run();
