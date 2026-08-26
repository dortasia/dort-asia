const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  console.log("Checking if identity.account_sessions exists...");
  const { data, error } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Error querying account_sessions:", error);
  } else {
    console.log("Success! Data:", data);
  }

  console.log("Checking if identity.login_events exists...");
  const { data: data2, error: error2 } = await supabaseAdmin
    .schema("identity")
    .from("login_events")
    .select("id")
    .limit(1);

  if (error2) {
    console.error("Error querying login_events:", error2);
  } else {
    console.log("Success! Data:", data2);
  }
}

testQuery();
