import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendSubscriptionNotification } from '@/services/notifications';

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Session not paid' }, { status: 400 });
    }

    const organizationId = session.metadata?.organizationId || session.metadata?.companyId;
    const appId = session.metadata?.appId || 'xentra_people';
    const plan = session.metadata?.plan || 'starter';

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organization metadata' }, { status: 400 });
    }

    // Retrieve subscription from Stripe to get current_period_end
    if (!session.subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as any;

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Try V5 sync
    try {
      if (session.customer) {
        await supabaseAdmin.from('billing_customers').upsert({
          organization_id: organizationId,
          stripe_customer_id: session.customer as string
        }, { onConflict: 'organization_id' });
      }

      await supabaseAdmin.from('subscriptions').upsert({
        organization_id: organizationId,
        app_id: appId,
        stripe_subscription_id: session.subscription as string,
        status: subscription.status,
        current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
      }, { onConflict: 'stripe_subscription_id' });
    } catch {
      // Fallback for legacy database schema
      await supabaseAdmin.from('subscriptions').upsert({
        company_id: organizationId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan: plan,
        status: subscription.status,
        current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
      });
    }

    // Send Realtime Notification
    await sendSubscriptionNotification({
      companyId: organizationId,
      appName: appId || 'Workspace App',
      status: subscription.status || 'active',
      plan: plan,
    }).catch((e) => console.error('[Sync-Session] Notification error:', e));

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('Error syncing session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
