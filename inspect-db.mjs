import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("=== platform.apps ===");
  const { data: apps, error: appsError } = await supabase.schema('platform').from('apps').select('*');
  if (appsError) console.error("Error fetching apps:", appsError);
  else console.log(JSON.stringify(apps, null, 2));

  console.log("\n=== marketplace.app_plans ===");
  const { data: plans, error: plansError } = await supabase.schema('marketplace').from('app_plans').select('*');
  if (plansError) console.error("Error fetching plans:", plansError);
  else console.log(JSON.stringify(plans, null, 2));
}

inspect();
