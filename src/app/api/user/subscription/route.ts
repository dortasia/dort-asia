import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ plan: null, hasSubscription: false });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get company from RPC
    let companyId: string | null = null;
    try {
      const { data: companyData } = await supabaseAdmin.rpc('get_company_profile', {
        user_uuid: user.id
      });
      if (companyData && (companyData.id || companyData.company_id)) {
        companyId = companyData.id || companyData.company_id;
      }
    } catch (e) {
      // Fallback
    }

    // 1b. Fallback: query organization_memberships / company_users
    if (!companyId) {
      try {
        const { data: memberships } = await supabaseAdmin
          .from('organization_memberships')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (memberships && memberships.length > 0) {
          companyId = memberships[0].organization_id;
        }
      } catch {}
    }

    if (!companyId) {
      try {
        const { data: userCompanies } = await supabaseAdmin
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .limit(1);

        if (userCompanies && userCompanies.length > 0) {
          companyId = userCompanies[0].company_id;
        }
      } catch {}
    }

    // 2. Fetch subscriptions from subscriptions schema
    let activePlan: string | null = null;
    let activeCount = 0;

    // Try get_company_subscriptions RPC first
    try {
      const { data: rpcSubs, error: rpcErr } = await supabase
        .schema('subscriptions')
        .rpc('get_company_subscriptions');

      if (!rpcErr && rpcSubs && rpcSubs.length > 0) {
        const active = rpcSubs.filter((s: any) => s.status === 'active' || s.status === 'trialing');
        if (active.length > 0) {
          activePlan = active[0].plan_name || 'Starter';
          activeCount = active.length;
          return NextResponse.json({
            hasSubscription: true,
            plan: activePlan,
            activeCount
          });
        }
      }
    } catch {}

    // Fallback: Query subscriptions table directly with admin client
    if (companyId) {
      try {
        const { data: subs, error: subsErr } = await supabaseAdmin
          .schema('subscriptions')
          .from('subscriptions')
          .select(`
            id,
            status,
            plan_id
          `)
          .eq('company_id', companyId)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false });

        if (!subsErr && subs && subs.length > 0) {
          activeCount = subs.length;
          
          // Resolve plan name if possible
          const planId = subs[0].plan_id;
          if (planId) {
            try {
              const { data: planData } = await supabaseAdmin
                .from('plans')
                .select('name')
                .eq('id', planId)
                .maybeSingle();

              if (planData && planData.name) {
                activePlan = planData.name;
              }
            } catch {}

            if (!activePlan) {
              try {
                const { data: mpPlan } = await supabaseAdmin
                  .from('app_plans')
                  .select('name')
                  .eq('id', planId)
                  .maybeSingle();

                if (mpPlan && mpPlan.name) {
                  activePlan = mpPlan.name;
                }
              } catch {}
            }
          }

          activePlan = activePlan || 'Starter';

          return NextResponse.json({
            hasSubscription: true,
            plan: activePlan,
            activeCount
          });
        }
      } catch {}
    }

    return NextResponse.json({ plan: null, hasSubscription: false, activeCount: 0 });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ plan: null, hasSubscription: false, activeCount: 0 });
  }
}
