import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

    const companyId = session.metadata?.companyId;
    const plan = session.metadata?.plan;

    if (!companyId || !plan) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
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

    // Sync into subscriptions table (acting as a manual webhook trigger)
    const { error } = await supabaseAdmin.from('subscriptions').upsert({
      company_id: companyId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan: plan,
      status: subscription.status,
      current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
    });

    if (error) {
      console.error('Error syncing subscription manually:', error);
      return NextResponse.json({ error: 'Failed to sync database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('Error syncing session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
