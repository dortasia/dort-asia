import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/admin-auth';

export async function GET() {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const supabase = getServiceSupabase();

    // 1. Apps statistics
    const { data: apps } = await supabase
      .schema('platform')
      .from('apps')
      .select('id, status');

    const totalApps = apps?.length || 0;
    const publishedApps = apps?.filter(a => a.status === 'active' || a.status === 'PUBLISHED').length || 0;
    const draftApps = apps?.filter(a => a.status === 'draft' || a.status === 'DRAFT').length || 0;

    // 2. Customers / Companies count
    const { count: totalCustomers } = await supabase
      .schema('company')
      .from('companies')
      .select('id', { count: 'exact', head: true });

    // 3. Subscriptions statistics & MRR
    const { data: subscriptions } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select(`
        id,
        status,
        plan_id,
        created_at
      `);

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active' || s.status === 'trialing').length || 0;

    // Calculate MRR from active plans
    const { data: activePlans } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .select('id, price, billing_interval');

    const planPriceMap = new Map<string, number>();
    if (activePlans) {
      for (const p of activePlans) {
        const monthlyEquivalent = p.billing_interval === 'yearly' ? Number(p.price) / 12 : Number(p.price);
        planPriceMap.set(p.id, monthlyEquivalent || 0);
      }
    }

    let mrr = 0;
    if (subscriptions) {
      for (const sub of subscriptions) {
        if (sub.status === 'active' || sub.status === 'trialing') {
          mrr += planPriceMap.get(sub.plan_id) || 0;
        }
      }
    }

    // 4. Failed Payments count
    const { count: failedPaymentsCount } = await supabase
      .schema('billing')
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed');

    // 5. Recent Subscriptions
    const { data: recentSubsData } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select(`
        id,
        status,
        created_at,
        company_id,
        app_id,
        plan_id
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    // Fetch related names for recent subscriptions
    let recentSubscriptions: any[] = [];
    if (recentSubsData && recentSubsData.length > 0) {
      const companyIds = Array.from(new Set(recentSubsData.map(s => s.company_id).filter(Boolean)));
      const appIds = Array.from(new Set(recentSubsData.map(s => s.app_id).filter(Boolean)));
      const planIds = Array.from(new Set(recentSubsData.map(s => s.plan_id).filter(Boolean)));

      const { data: companies } = await supabase
        .schema('company')
        .from('companies')
        .select('id, company_name')
        .in('id', companyIds);

      const { data: appRecords } = await supabase
        .schema('platform')
        .from('apps')
        .select('id, name, slug')
        .in('id', appIds);

      const { data: planRecords } = await supabase
        .schema('marketplace')
        .from('app_plans')
        .select('id, name, price, currency, billing_interval')
        .in('id', planIds);

      const compMap = new Map((companies || []).map(c => [c.id, c.company_name]));
      const appMap = new Map((appRecords || []).map(a => [a.id, a]));
      const planMap = new Map((planRecords || []).map(p => [p.id, p]));

      recentSubscriptions = recentSubsData.map(s => ({
        id: s.id,
        status: s.status,
        createdAt: s.created_at,
        companyName: compMap.get(s.company_id) || 'Individual Organization',
        appName: appMap.get(s.app_id)?.name || 'Platform App',
        appSlug: appMap.get(s.app_id)?.slug || '',
        planName: planMap.get(s.plan_id)?.name || 'Custom Plan',
        price: planMap.get(s.plan_id)?.price || 0,
        currency: planMap.get(s.plan_id)?.currency || 'SGD',
        billingInterval: planMap.get(s.plan_id)?.billing_interval || 'monthly',
      }));
    }

    // 6. Recent Admin Audit Logs
    const { data: recentAuditLogs } = await supabase
      .schema('audit')
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);

    return NextResponse.json({
      metrics: {
        totalApps,
        publishedApps,
        draftApps,
        totalCustomers: totalCustomers || 0,
        activeSubscriptions,
        mrr: Math.round(mrr),
        failedPayments: failedPaymentsCount || 0,
      },
      recentSubscriptions,
      recentAuditLogs: recentAuditLogs || [],
    });
  } catch (error: any) {
    console.error('Error fetching admin overview:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate admin overview statistics', details: error.message },
      { status: 500 }
    );
  }
}
