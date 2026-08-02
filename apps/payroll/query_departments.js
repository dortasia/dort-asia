const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"(.*)\"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"(.*)\"/)[1];
const supabase = createClient(url, key);

async function run() {
  const { data: depts, error: err } = await supabase.from('departments').select('*');
  if (err) {
    console.error('Error fetching departments:', err);
    return;
  }
  console.log('--- DEPARTMENTS ---');
  depts.forEach(d => {
    console.log(`ID: ${d.id} | Name: "${d.name}" | Company ID: ${d.company_id}`);
  });
  console.log('Total:', depts.length);
}

run();
