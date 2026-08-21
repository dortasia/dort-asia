import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@supabase/supabase-js';
import { recalculateEntitlements } from '@/services/entitlements';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
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

  const now = new Date().toISOString();
  const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();

  // 1. Insert Event (Idempotent: ignore if already exists)
  await supabase.from('stripe_webhook_events').upsert({
    stripe_event_id: event.id,
    type: event.type,
    status: 'received',
    payload: event,
  }, { onConflict: 'stripe_event_id', ignoreDuplicates: true });

  // 2. Atomic Lease Claim
  // We only claim if it's 'received', OR stuck in 'processing' for > 5m, OR 'failed' and ready to retry
  const { data: claimData, error: claimError } = await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'processing',
      claimed_at: now
    })
    .eq('stripe_event_id', event.id)
    .or(`status.eq.received,and(status.eq.processing,claimed_at.lt.${fiveMinsAgo}),and(status.eq.failed,next_retry_at.lte.${now})`)
    .select('attempts')
    .maybeSingle();

  if (claimError) {
    console.error('Error claiming event:', claimError);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  if (!claimData) {
    console.log(`Event ${event.id} is already processed, processing, or waiting for retry. Skipping.`);
    return NextResponse.json({ received: true, skipped: true });
  }

  const attempts = (claimData.attempts || 0) + 1;

  // Increment attempts
  await supabase.from('stripe_webhook_events').update({ attempts }).eq('stripe_event_id', event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const organizationId = session.metadata.organizationId;
        const appId = session.metadata.appId;
        
        const subscription = await stripe.subscriptions.retrieve(session.subscription) as any;

        // Upsert Billing Customer
        await supabase.from('billing_customers').upsert({
           organization_id: organizationId,
           stripe_customer_id: session.customer as string
        }, { onConflict: 'organization_id' });

        // Upsert Subscription
        const { data: sub, error: subError } = await supabase.from('subscriptions').upsert({
          organization_id: organizationId,
          app_id: appId,
          stripe_subscription_id: session.subscription as string,
          status: subscription.status,
          current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' }).select().single();

        if (subError) throw subError;

        // Update Checkout Session Status
        await supabase.from('checkout_sessions')
          .update({ status: 'complete' })
          .eq('stripe_session_id', session.id);

        // Process Subscription Items
        await processSubscriptionItems(supabase, sub.id, subscription.items.data);

        // Recalculate Entitlements
        await recalculateEntitlements(supabase, organizationId, appId);
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id, organization_id, app_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (existingSub) {
          await supabase
            .from('subscriptions')
            .update({
               status: subscription.status,
               current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
               cancel_at_period_end: subscription.cancel_at_period_end || false
            })
            .eq('id', existingSub.id);

          await processSubscriptionItems(supabase, existingSub.id, subscription.items.data);
          await recalculateEntitlements(supabase, existingSub.organization_id, existingSub.app_id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const stripeCustomerId = invoice.customer;
        const stripeSubscriptionId = invoice.subscription;

        const { data: customer } = await supabase.from('billing_customers').select('organization_id').eq('stripe_customer_id', stripeCustomerId).maybeSingle();
        const { data: sub } = await supabase.from('subscriptions').select('id').eq('stripe_subscription_id', stripeSubscriptionId).maybeSingle();

        if (customer) {
            const { data: inv } = await supabase.from('invoices').upsert({
                organization_id: customer.organization_id,
                subscription_id: sub?.id || null,
                stripe_invoice_id: invoice.id,
                status: invoice.status,
                currency: invoice.currency,
                amount_due: invoice.amount_due,
                amount_paid: invoice.amount_paid,
                payload: invoice
            }, { onConflict: 'stripe_invoice_id' }).select().single();

            if (inv && invoice.lines?.data) {
                for (const line of invoice.lines.data) {
                    await supabase.from('invoice_items').upsert({
                        invoice_id: inv.id,
                        stripe_line_item_id: line.id,
                        description: line.description,
                        quantity: line.quantity || 1,
                        unit_amount: line.price?.unit_amount || 0,
                        currency: line.currency,
                        tax_snapshot: line.tax_amounts,
                        discount_snapshot: line.discount_amounts
                    }, { onConflict: 'stripe_line_item_id' });
                }
            }

            if (inv && invoice.payment_intent) {
                await supabase.from('payments').upsert({
                    invoice_id: inv.id,
                    stripe_payment_intent_id: invoice.payment_intent as string,
                    stripe_charge_id: invoice.charge as string,
                    amount: invoice.amount_paid,
                    currency: invoice.currency,
                    status: 'succeeded',
                    payload: invoice
                }, { onConflict: 'stripe_payment_intent_id' });
            }
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // 4. Mark event as processed
    await supabase.from('stripe_webhook_events').update({
       status: 'processed',
       error_text: null
    }).eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler failed:', error);
    
    // 5. Retry Scheduling
    const nextRetryAt = new Date(Date.now() + Math.pow(2, attempts) * 60000).toISOString(); // Exponential backoff in minutes
    
    // Mark event as failed
    await supabase.from('stripe_webhook_events').update({
       status: 'failed',
       error_text: error.message || 'Unknown error',
       next_retry_at: nextRetryAt
    }).eq('stripe_event_id', event.id);

    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Helper to map Stripe line items to database subscription items
async function processSubscriptionItems(supabase: any, subscriptionId: string, stripeItems: any[]) {
    const validItemIds = stripeItems.map(item => item.id);
    
    // Soft deletion is handled by RESTRICT in standard logic, but here we physically remove the item 
    // since it's an association table. Historical tracking is handled by invoices and subscription_changes.
    if (validItemIds.length > 0) {
      await supabase.from('subscription_items')
        .delete()
        .eq('subscription_id', subscriptionId)
        .not('stripe_subscription_item_id', 'in', `(${validItemIds.join(',')})`);
    } else {
      await supabase.from('subscription_items')
        .delete()
        .eq('subscription_id', subscriptionId);
    }

    for (const item of stripeItems) {
        const stripePriceId = item.price.id;
        
        let planId = null;
        let planPriceId = null;
        let addonId = null;
        let addonPriceId = null;

        const { data: planPrice } = await supabase.from('plan_prices').select('id, plan_id').eq('stripe_price_id', stripePriceId).eq('active', true).maybeSingle();
        if (planPrice) {
            planId = planPrice.plan_id;
            planPriceId = planPrice.id;
        } else {
            const { data: addonPrice } = await supabase.from('addon_prices').select('id, add_on_id').eq('stripe_price_id', stripePriceId).eq('active', true).maybeSingle();
            if (addonPrice) {
                addonId = addonPrice.add_on_id;
                addonPriceId = addonPrice.id;
            }
        }

        await supabase.from('subscription_items').upsert({
            subscription_id: subscriptionId,
            plan_id: planId,
            plan_price_id: planPriceId,
            add_on_id: addonId,
            addon_price_id: addonPriceId,
            stripe_subscription_item_id: item.id,
            quantity: item.quantity
        }, { onConflict: 'stripe_subscription_item_id' });
    }
}
