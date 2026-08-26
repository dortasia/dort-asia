import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: subs, error: subErr } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (subErr) {
      return NextResponse.json({ error: subErr });
    }

    let report = { 
      recent_subscriptions: subs, 
      diagnostics: {} as any
    };

    if (subs && subs.length > 0) {
      const activeSub = subs.find(s => s.status === 'active') || subs[0];
      
      const { data: cUsers } = await supabase.from('company_users').select('*').eq('company_id', activeSub.company_id);
      
      const { data: comp } = await supabase.schema('company').from('companies').select('*').eq('id', activeSub.company_id).single();
      let account = null;
      if (comp) {
         const { data: acc } = await supabase.schema('identity').from('accounts').select('*').eq('id', comp.account_id).single();
         account = acc;
      }

      const { data: cust } = await supabase.from('billing_customers').select('*').eq('organization_id', activeSub.company_id).single();

      report.diagnostics = {
        target_sub: activeSub,
        company_users: cUsers,
        company: comp,
        account: account,
        billing_customer: cust
      };
    }

    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
