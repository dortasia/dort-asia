import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uzylfswzyygcbqaylnyh.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWxmc3d6eXlnY2JxYXlsbnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjQwNDEsImV4cCI6MjA4OTQwMDA0MX0.B_x9iuU-XwNclNCFhiCyqyniwyz-8V81DpYWlZ1r-nw";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWxmc3d6eXlnY2JxYXlsbnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzgyNDA0MSwiZXhwIjoyMDg5NDAwMDQxfQ.wqT5Xi7uZxramlBtnjy6Hvb7LST9gR6oW7UrMLUwL4I";

async function run() {
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: users } = await adminClient.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'dortasiasg@gmail.com');
  
  if (!user) return console.log("User not found");

  // get the exact RLS policies query using service key
  const { data: policies, error: polErr } = await adminClient.rpc('execute_sql', { query: `SELECT * FROM pg_policies WHERE tablename = 'company_settings'` });
  
  // Try using raw REST API query to fetch policies using postgrest directly
  const { data: d2, error: e2 } = await adminClient.from('pg_policies').select('*').eq('tablename', 'company_settings').catch(() => ({}));
  
  console.log("pg_policies direct:", d2, e2?.message);

  // Instead of querying pg_policies, let's just attempt a select on company_settings using a JWT
  // Unfortunately we need the project JWT secret to sign a token for the user, which we don't have.
  // Wait, does the Supabase admin client have user generation capability?
}

run();
