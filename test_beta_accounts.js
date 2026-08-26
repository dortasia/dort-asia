const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  console.log("Checking for identity.accounts rows...");
  const { data, error } = await supabaseAdmin
    .schema("identity")
    .from("accounts")
    .select("id, email, auth_user_id")
    .limit(10);

  if (error) {
    console.error("Error querying accounts:", error);
  } else {
    console.log("Found accounts:", data.length);
  }
}

testQuery();
