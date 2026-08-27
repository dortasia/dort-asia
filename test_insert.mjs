import { createClient } from '@supabase/supabase-js';

const url = "https://zirmlijktxaboztjojed.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm1saWprdHhhYm96dGpvamVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcxMzMxOSwiZXhwIjoyMTAyMjg5MzE5fQ.3MPdaraFDP2dsvGQZhSXiY5Ym4HJSDs_-TGLAsBlxlc";
const supabaseAdmin = createClient(url, key);

async function run() {
  // 1. Get a real user
  const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError || !users.users.length) {
    console.error("Failed to fetch users");
    return;
  }
  
  const user = users.users[0]; // grab first user
  
  // 2. Get their account
  const { data: account, error: accountError } = await supabaseAdmin
    .schema('identity')
    .from('accounts')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
    
  if (accountError || !account) {
    console.error("Failed to find account for user");
    return;
  }
  
  // 3. Try to insert
  const hashedCodes = [
    { account_id: account.id, code_hash: 'testhash1' }
  ];
  
  const { error: insertError } = await supabaseAdmin
    .schema('identity')
    .from('mfa_recovery_codes')
    .insert(hashedCodes);
    
  if (insertError) {
    console.error('[RECOVERY_DIAG] recovery code INSERT failed', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
  } else {
    console.log("INSERT SUCCESS");
  }
}

run();
