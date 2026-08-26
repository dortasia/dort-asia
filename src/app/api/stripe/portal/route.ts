import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/lib/utils';
import { stripe } from '@/utils/stripe/config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let companyId: string | null = null;

    // 1. Resolve Company ID securely from session hierarchy
    try {
      const { data: account } = await supabaseAdmin
        .schema('identity')
        .from('accounts')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (account) {
        const { data: company } = await supabaseAdmin
          .schema('company')
          .from('companies')
          .select('id')
          .eq('account_id', account.id)
          .maybeSingle();

        if (company) {
          companyId = company.id;
        }
      }
    } catch (e) {
      console.error('Error resolving company hierarchy:', e);
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company profile not found' }, { status: 404 });
    }

    let stripeCustomerId: string | null = null;

    // 2. Resolve Stripe Customer ID from billing_customers
    try {
      const { data: billingCustomer } = await supabaseAdmin
        .from('billing_customers')
        .select('stripe_customer_id')
        .eq('organization_id', companyId)
        .maybeSingle();

      if (billingCustomer?.stripe_customer_id) {
        stripeCustomerId = billingCustomer.stripe_customer_id;
      }
    } catch {
      // Ignore
    }

    // 2b. Fallback: Find from subscriptions schema
    if (!stripeCustomerId) {
      try {
        const { data: subscriptions } = await supabaseAdmin
          .schema('subscriptions')
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('company_id', companyId)
          .not('stripe_customer_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptions && subscriptions.length > 0 && subscriptions[0].stripe_customer_id) {
          stripeCustomerId = subscriptions[0].stripe_customer_id;
        }
      } catch {
        // Ignore
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No active subscription or customer profile found to manage' }, { status: 404 });
    }

    // Use getURL() and remove trailing slash since return_url paths start with /
    const origin = getURL(req).replace(/\/$/, "");

    // 3. Create Stripe Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

