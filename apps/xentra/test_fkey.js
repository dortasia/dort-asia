require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // Using ANON key, but let's see if we can do RPC or just examine error messages

async function test() {
  const res = await supabase.rpc('get_foreign_keys');
  console.log(res);
}
test();
