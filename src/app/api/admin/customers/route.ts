import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/admin-auth';

// GET /api/admin/customers - List all customer organizations
export async function GET(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get('search');

  try {
    const supabase = getServiceSupabase();

    // 1. Fetch companies
    const { data: companies, error: compError } = await supabase
      .schema('company')
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (compError) throw compError;

    // 2. Fetch associated accounts
    const accountIds = (companies || []).map(c => c.account_id).filter(Boolean);
    const { data: accounts } = await supabase
      .schema('identity')
      .from('accounts')
      .select('id, email, status, created_at')
      .in('id', accountIds);

    const { data: profiles } = await supabase
      .schema('identity')
      .from('account_profiles')
      .select('account_id, first_name, last_name, profile_photo_url')
      .in('account_id', accountIds);

    // 3. Fetch subscriptions per company
    const { data: subscriptions } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select('id, company_id, status, plan_id');

    const accMap = new Map((accounts || []).map(a => [a.id, a]));
    const profMap = new Map((profiles || []).map(p => [p.account_id, p]));

    const subCounts = new Map<string, { total: number; active: number }>();
    for (const s of subscriptions || []) {
      const current = subCounts.get(s.company_id) || { total: 0, active: 0 };
      current.total += 1;
      if (s.status === 'active' || s.status === 'trialing') {
        current.active += 1;
      }
      subCounts.set(s.company_id, current);
    }

    let customers = (companies || []).map(c => {
      const acc = accMap.get(c.account_id);
      const prof = profMap.get(c.account_id);
      const subs = subCounts.get(c.id) || { total: 0, active: 0 };

      const ownerName = prof ? `${prof.first_name} ${prof.last_name}`.trim() : 'Account Owner';

      return {
        id: c.id,
        companyName: c.company_name,
        countryCode: c.country_code,
        timezone: c.timezone,
        status: c.status,
        createdAt: c.created_at,
        ownerEmail: acc?.email || 'N/A',
        ownerName: ownerName || 'N/A',
        ownerPhoto: prof?.profile_photo_url || null,
        accountStatus: acc?.status || 'active',
        totalSubscriptions: subs.total,
        activeSubscriptions: subs.active,
      };
    });

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      customers = customers.filter(
        c =>
          c.companyName.toLowerCase().includes(q) ||
          c.ownerEmail.toLowerCase().includes(q) ||
          c.ownerName.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}
