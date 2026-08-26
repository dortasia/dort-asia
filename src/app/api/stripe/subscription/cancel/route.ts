import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/utils/stripe/config';

export async function POST(req: Request) {
  try {
    const { appId } = await req.json();

    if (!appId) {
      return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Resolve user's company_id securely server-side
    let companyId: string | null = null;
    try {
      const { data: companyData } = await supabaseAdmin.rpc('get_company_profile', {
        user_uuid: user.id
      });
      if (companyData && (companyData.id || companyData.company_id)) {
        companyId = companyData.id || companyData.company_id;
      }
    } catch (e) {
      // Ignore
    }

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

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 403 });
    }

    // 2. Resolve app UUID from platform.apps if appId is a slug
    let resolvedAppId = appId;
    if (appId && !appId.includes('-') || (appId.includes('-') && appId.length < 30)) {
      const { data: appData } = await supabaseAdmin
        .schema('platform')
        .from('apps')
        .select('id')
        .eq('slug', appId)
        .maybeSingle();
      
      if (appData?.id) {
        resolvedAppId = appData.id;
      }
    }

    // 3. Retrieve subscription belonging to this company and app
    const { data: subscription, error: subError } = await supabaseAdmin
      .schema('subscriptions')
      .from('subscriptions')
      .select('id, stripe_subscription_id, status, cancel_at_period_end')
      .eq('company_id', companyId)
      .eq('app_id', resolvedAppId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Active subscription not found for this company and app' }, { status: 404 });
    }

    if (!subscription.stripe_subscription_id) {
       return NextResponse.json({ error: 'Subscription missing Stripe reference' }, { status: 400 });
    }

    // 3. Call Stripe to schedule cancellation
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    ) as any;

    // Note: The webhook will handle updating the local subscription table when it receives
    // customer.subscription.updated from Stripe. We do NOT update the DB directly here
    // to ensure Stripe remains the sole source of truth.

    const currentPeriodEnd =
      typeof updatedStripeSubscription.current_period_end === "number" &&
      Number.isFinite(updatedStripeSubscription.current_period_end)
        ? new Date(updatedStripeSubscription.current_period_end * 1000).toISOString()
        : null;

    return NextResponse.json({ 
      success: true, 
      cancelAtPeriodEnd: updatedStripeSubscription.cancel_at_period_end,
      currentPeriodEnd: currentPeriodEnd
    });

  } catch (error: any) {
    console.error('Cancel subscription API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
