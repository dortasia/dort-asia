import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getURL } from '@/lib/utils';
import { stripe } from '@/utils/stripe/config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Fallback Stripe catalog mapping in case database tables have not yet been seeded
const STRIPE_PRODUCT_MAP: Record<string, string> = {
  starter: 'prod_V4WzbO8JBnGO1f',
  business: 'prod_V4Wz8JcJcSqjE6',
};

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Server misconfiguration: Missing Supabase URL or Admin Key');
      return NextResponse.json({ error: 'Server misconfiguration: Missing Supabase credentials.' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Normalize parameters
    const appId = body.appId || 'xentra_people';
    const planId = (body.planId || body.plan || '').toLowerCase();
    const rawInterval = (body.interval || 'month').toLowerCase();
    const interval = (rawInterval === 'annual' || rawInterval === 'year') ? 'year' : 'month';
    const organizationName = (body.organizationName || body.companyName || '').trim();
    const addons = body.addons || [];
    const couponId = body.couponId;
    const checkoutIdempotencyKey = body.idempotencyKey || crypto.randomUUID();

    if (!planId) {
      return NextResponse.json({ error: 'Missing required field: planId' }, { status: 400 });
    }

    // 1. Resolve Stripe Price ID
    let stripePriceId: string | null = null;
    let unitAmount: number = 0;
    let currency: string = 'sgd';
    let internalPriceId: string | null = null;

    // 1a. Try resolving from V5 `plan_prices` table in Supabase
    try {
      const { data: planPrice } = await supabaseAdmin
        .from('plan_prices')
        .select('id, stripe_price_id, unit_amount, currency')
        .eq('plan_id', planId)
        .eq('interval', interval)
        .eq('active', true)
        .maybeSingle();

      if (planPrice?.stripe_price_id) {
        stripePriceId = planPrice.stripe_price_id;
        unitAmount = planPrice.unit_amount;
        currency = planPrice.currency;
        internalPriceId = planPrice.id;
      }
    } catch {
      // Table may not exist yet if migrations are pending
    }

    // 1b. Fallback: Lookup Price directly from Stripe
    if (!stripePriceId) {
      const stripeProductId = STRIPE_PRODUCT_MAP[planId];
      if (stripeProductId) {
        try {
          const prices = await stripe.prices.list({ product: stripeProductId, active: true });
          const matchingPrice = prices.data.find(p => p.recurring?.interval === interval);
          if (matchingPrice) {
            stripePriceId = matchingPrice.id;
            unitAmount = matchingPrice.unit_amount || 0;
            currency = matchingPrice.currency;
          }
        } catch (err: any) {
          console.error('Error fetching prices from Stripe:', err.message);
        }
      }
    }

    if (!stripePriceId) {
      return NextResponse.json({ error: `Price not found for plan: ${planId} (${interval})` }, { status: 404 });
    }

    // 2. Build Line Items and Snapshot
    const lineItems: any[] = [{
      price: stripePriceId,
      quantity: 1,
    }];

    const snapshotItems: any[] = [{
      type: 'plan',
      internal_id: planId,
      price_id: internalPriceId || stripePriceId,
      stripe_price_id: stripePriceId,
      quantity: 1,
      unit_amount: unitAmount,
      currency: currency
    }];

    // Process add-ons if any
    for (const addon of addons) {
      try {
        const { data: addonPrice } = await supabaseAdmin
          .from('addon_prices')
          .select('id, stripe_price_id, unit_amount, currency')
          .eq('add_on_id', addon.id)
          .eq('interval', interval)
          .eq('active', true)
          .maybeSingle();

        if (addonPrice?.stripe_price_id) {
          const qty = addon.quantity || 1;
          lineItems.push({
            price: addonPrice.stripe_price_id,
            quantity: qty
          });

          snapshotItems.push({
            type: 'addon',
            internal_id: addon.id,
            price_id: addonPrice.id,
            stripe_price_id: addonPrice.stripe_price_id,
            quantity: qty,
            unit_amount: addonPrice.unit_amount,
            currency: addonPrice.currency
          });
        }
      } catch {
        // Ignore addon lookup errors
      }
    }

    // 3. Organization / Company Verification
    let organizationId: string | null = null;

    // 3a. Check V5 `organization_memberships`
    try {
      const { data: memberships } = await supabaseAdmin
        .from('organization_memberships')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (memberships && memberships.length > 0) {
        organizationId = memberships[0].organization_id;
      }
    } catch {
      // Table may not exist yet
    }

    // 3b. Check Legacy `company_users`
    if (!organizationId) {
      try {
        const { data: companyUsers } = await supabaseAdmin
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .limit(1);

        if (companyUsers && companyUsers.length > 0) {
          organizationId = companyUsers[0].company_id;
        }
      } catch {
        // Table may not exist
      }
    }

    // 3c. If no organization exists, prompt or create
    if (!organizationId) {
      if (!organizationName) {
        return NextResponse.json(
          { error: 'COMPANY_REQUIRED', message: 'Company name is required.' },
          { status: 400 }
        );
      }

      // Create in V5 `organizations` if available
      try {
        const { data: newOrg } = await supabaseAdmin
          .from('organizations')
          .insert({ name: organizationName })
          .select()
          .single();

        if (newOrg) {
          organizationId = newOrg.id;
          const { data: ownerRole } = await supabaseAdmin
            .from('organization_roles')
            .select('id')
            .eq('name', 'owner')
            .eq('is_system', true)
            .maybeSingle();

          if (ownerRole) {
            await supabaseAdmin.from('organization_memberships').insert({
              organization_id: organizationId,
              user_id: user.id,
              role_id: ownerRole.id,
            });
          }
        }
      } catch {
        // If V5 tables don't exist, create in legacy `companies`
      }

      // Create in legacy `companies` if not created yet
      if (!organizationId) {
        try {
          const { data: newCompany } = await supabaseAdmin
            .from('companies')
            .insert({ name: organizationName })
            .select()
            .single();

          if (newCompany) {
            organizationId = newCompany.id;
            await supabaseAdmin.from('company_users').insert({
              company_id: organizationId,
              user_id: user.id,
              role: 'owner',
            });
          }
        } catch (err: any) {
          console.error('Failed to create company/organization:', err.message);
          throw new Error('Failed to create organization record');
        }
      }
    }

    const origin = getURL(req).replace(/\/$/, '');

    // 4. Create Stripe Checkout Session
    const sessionParams: any = {
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      customer_email: user.email,
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${origin}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        userId: user.id,
        organizationId: organizationId,
        companyId: organizationId,
        appId: appId,
        plan: planId,
        planId: planId,
        interval: interval,
        checkoutIdempotencyKey: checkoutIdempotencyKey,
      },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams, {
      idempotencyKey: checkoutIdempotencyKey,
    });

    // 5. Track in `checkout_sessions` if table exists
    try {
      await supabaseAdmin.from('checkout_sessions').insert({
        organization_id: organizationId,
        user_id: user.id,
        stripe_session_id: session.id,
        app_id: appId,
        status: 'open',
        idempotency_key: checkoutIdempotencyKey,
        snapshot: snapshotItems,
        metadata: sessionParams.metadata,
      });
    } catch {
      // Gracefully continue if checkout_sessions table is not yet created
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
