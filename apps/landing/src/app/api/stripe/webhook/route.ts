import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Initialize inside handler so env vars are available at runtime, not build time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not set.');
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const companyId = session.metadata.companyId;
        const plan = session.metadata.plan;
        
        // Retrieve the subscription to get the period end date
        const subscription = await stripe.subscriptions.retrieve(session.subscription) as any;

        // Upsert subscription into Supabase
        const { error } = await supabase.from('subscriptions').upsert({
          company_id: companyId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: plan,
          status: subscription.status,
          current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
        });

        if (error) {
          console.error('Error inserting subscription:', error);
          throw error;
        }
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        // Find the record by stripe_subscription_id and update status
        const { error } = await supabase
          .from('subscriptions')
          .update({
             status: subscription.status,
             current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (error) {
          console.error('Error updating subscription:', error);
          throw error;
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler failed:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
