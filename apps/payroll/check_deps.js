const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"(.*)\"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"(.*)\"/)[1];
const supabase = createClient(url, key);

async function run() {
  const { data: dData } = await supabase.from('departments').select('*').limit(1);
  const out1 = 'Departments: ' + (dData && dData[0] ? Object.keys(dData[0]).join(', ') : 'No data');

  const { data: eData } = await supabase.from('employees').select('*').limit(1);
  const out2 = 'Employees: ' + (eData && eData[0] ? Object.keys(eData[0]).join(', ') : 'No data');
  
  fs.writeFileSync('schema_out.txt', out1 + '\n' + out2);
}
run();
