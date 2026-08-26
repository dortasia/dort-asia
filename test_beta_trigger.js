const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  console.log("Checking auth.users count...");
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error("Error fetching auth users:", authError);
  } else {
    console.log(`Found ${authUsers.users.length} auth users`);
    authUsers.users.forEach(u => console.log(` - ${u.id} (${u.email})`));
  }

  console.log("\nChecking identity.accounts count...");
  const { data: identityAccounts, error: idError } = await supabaseAdmin
    .schema("identity")
    .from("accounts")
    .select("id, email, auth_user_id");
  if (idError) {
    console.error("Error fetching identity accounts:", idError);
  } else {
    console.log(`Found ${identityAccounts.length} identity accounts`);
    identityAccounts.forEach(a => console.log(` - auth_id: ${a.auth_user_id} (${a.email})`));
  }
}

testQuery();
