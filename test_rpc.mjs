import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
  console.log("Testing subscriptions.get_company_subscriptions()...");
  const { data, error } = await supabase
    .schema('subscriptions')
    .rpc('get_company_subscriptions');

  if (error) {
    console.error("RPC Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("RPC Success:", JSON.stringify(data, null, 2));
  }
}

testRpc();
