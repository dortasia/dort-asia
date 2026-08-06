require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('departments').insert({
    department_name: 'Test Dept',
    company_id: '12345678-1234-1234-1234-123456789012'
  }).select();
  console.log("Insert result:", data, error);
}
test();
