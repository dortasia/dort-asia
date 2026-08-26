import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/admin-auth';

// GET /api/admin/subscriptions - List subscriptions with customer & app info
export async function GET(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const appId = url.searchParams.get('app_id');
  const search = url.searchParams.get('search');

  try {
    const supabase = getServiceSupabase();

    let query = supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (appId && appId !== 'all') {
      query = query.eq('app_id', appId);
    }

    const { data: subscriptions, error: subsError } = await query;
    if (subsError) throw subsError;

    // Collect related IDs
    const companyIds = Array.from(new Set((subscriptions || []).map(s => s.company_id).filter(Boolean)));
    const appIds = Array.from(new Set((subscriptions || []).map(s => s.app_id).filter(Boolean)));
    const planIds = Array.from(new Set((subscriptions || []).map(s => s.plan_id).filter(Boolean)));

    const { data: companies } = await supabase
      .schema('company')
      .from('companies')
      .select('id, company_name, account_id')
      .in('id', companyIds);

    const accountIds = Array.from(new Set((companies || []).map(c => c.account_id).filter(Boolean)));
    const { data: accounts } = await supabase
      .schema('identity')
      .from('accounts')
      .select('id, email')
      .in('id', accountIds);

    const { data: apps } = await supabase
      .schema('platform')
      .from('apps')
      .select('id, name, slug, logo_url')
      .in('id', appIds);

    const { data: plans } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .select('id, name, price, currency, billing_interval')
      .in('id', planIds);

    const accMap = new Map((accounts || []).map(a => [a.id, a.email]));
    const compMap = new Map((companies || []).map(c => [c.id, { name: c.company_name, email: accMap.get(c.account_id) || '' }]));
    const appMap = new Map((apps || []).map(a => [a.id, a]));
    const planMap = new Map((plans || []).map(p => [p.id, p]));

    let enriched = (subscriptions || []).map(s => {
      const compInfo = compMap.get(s.company_id);
      const appInfo = appMap.get(s.app_id);
      const planInfo = planMap.get(s.plan_id);

      return {
        id: s.id,
        companyId: s.company_id,
        companyName: compInfo?.name || 'Organization',
        customerEmail: compInfo?.email || 'N/A',
        appId: s.app_id,
        appName: appInfo?.name || 'Platform App',
        appSlug: appInfo?.slug || '',
        appLogo: appInfo?.logo_url || null,
        planId: s.plan_id,
        planName: planInfo?.name || 'Plan',
        price: planInfo?.price || 0,
        currency: planInfo?.currency || 'SGD',
        billingInterval: planInfo?.billing_interval || 'monthly',
        status: s.status,
        stripeSubscriptionId: s.stripe_subscription_id,
        startsAt: s.starts_at,
        currentPeriodStart: s.current_period_start,
        currentPeriodEnd: s.current_period_end,
        cancelAtPeriodEnd: s.cancel_at_period_end,
        cancelledAt: s.cancelled_at,
        createdAt: s.created_at,
      };
    });

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      enriched = enriched.filter(
        s =>
          s.companyName.toLowerCase().includes(q) ||
          s.customerEmail.toLowerCase().includes(q) ||
          s.appName.toLowerCase().includes(q) ||
          s.planName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ subscriptions: enriched });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
