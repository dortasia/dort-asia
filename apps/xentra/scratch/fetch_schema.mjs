import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  'https://pjeedikqcmznpwopfucs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZWVkaWtxY216bnB3b3BmdWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3MjkzMiwiZXhwIjoyMDk4NzQ4OTMyfQ._OaoKlAmrXM1taWBXfOWo_V1uQ1DqGpQ-_XMQqJ8AiQ'
);

async function fetchSchema() {
  const output = [];

  // 1. Get all tables in public schema
  const { data: tables, error: tErr } = await supabase.rpc('get_schema_info', {}).catch(() => ({ data: null, error: 'no rpc' }));

  // Fallback: query information_schema via raw query through REST
  // Use pg_policies for RLS info
  const queries = [
    {
      name: 'tables',
      sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    },
    {
      name: 'columns',
      sql: `SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position`
    },
    {
      name: 'rls_policies',
      sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname`
    },
    {
      name: 'foreign_keys',
      sql: `SELECT
              tc.table_name,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name,
              tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
            ORDER BY tc.table_name`
    },
    {
      name: 'indexes',
      sql: `SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname`
    },
    {
      name: 'rls_enabled',
      sql: `SELECT relname AS table_name, relrowsecurity AS rls_enabled, relforcerowsecurity AS rls_forced
            FROM pg_class
            WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND relkind = 'r'
            ORDER BY relname`
    }
  ];

  for (const q of queries) {
    try {
      const res = await fetch('https://pjeedikqcmznpwopfucs.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZWVkaWtxY216bnB3b3BmdWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3MjkzMiwiZXhwIjoyMDk4NzQ4OTMyfQ._OaoKlAmrXM1taWBXfOWo_V1uQ1DqGpQ-_XMQqJ8AiQ',
        }
      });
      output.push({ name: q.name, note: 'REST API does not support raw SQL — use Management API' });
    } catch (e) {
      output.push({ name: q.name, error: e.message });
    }
    break;
  }

  // The correct way: use Supabase Management API
  // GET https://api.supabase.com/v1/projects/{ref}/database/query
  const mgmtToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = 'pjeedikqcmznpwopfucs';
  
  if (!mgmtToken) {
    console.log('No SUPABASE_ACCESS_TOKEN found. Will use direct PostgREST approach.');
    
    // Use Supabase JS client for known tables to get their structure
    const knownTables = ['employees', 'company_settings', 'departments', 'attendance_logs', 'leave_requests'];
    
    for (const tbl of knownTables) {
      const { data, error } = await supabase.from(tbl).select('*').limit(0);
      output.push({ table: tbl, error: error?.message || 'OK (no rows, just structure check)' });
    }
    
    writeFileSync('./scratch/schema_output.json', JSON.stringify(output, null, 2));
    console.log('Output written to scratch/schema_output.json');
    return;
  }

  const schemaQueries = [
    { name: 'columns', sql: `SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position` },
    { name: 'rls_policies', sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname` },
    { name: 'rls_enabled', sql: `SELECT relname AS table_name, relrowsecurity AS rls_enabled FROM pg_class WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND relkind = 'r' ORDER BY relname` },
    { name: 'indexes', sql: `SELECT indexname, tablename, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname` },
  ];

  const result = {};
  for (const q of schemaQueries) {
    const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q.sql })
    });
    result[q.name] = await r.json();
  }

  writeFileSync('./scratch/schema_output.json', JSON.stringify(result, null, 2));
  console.log('Schema written to scratch/schema_output.json');
}

fetchSchema().catch(console.error);
