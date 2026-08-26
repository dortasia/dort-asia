const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testQuery() {
  const accountId = '00000000-0000-0000-0000-000000000000'; // dummy
  const userId = '00000000-0000-0000-0000-000000000000';
  
  const { data, error } = await supabaseAdmin
    .schema("identity")
    .from("account_sessions")
    .insert({
      account_id: accountId,
      user_id: userId,
      device_id: 'test'
    });

  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Success! Data:", data);
  }
}

testQuery();
