import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ plan: null });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get user's company
    const { data: userCompanies } = await supabaseAdmin
      .from('company_users')
      .select('company_id')
      .eq('user_id', user.id)
      .limit(1);

    if (!userCompanies || userCompanies.length === 0) {
      return NextResponse.json({ plan: null });
    }

    const companyId = userCompanies[0].company_id;

    // 2. Get active subscription for company
    const { data: subscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status')
      .eq('company_id', companyId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ plan: null });
    }

    return NextResponse.json({ plan: subscriptions[0].plan });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ plan: null });
  }
}
