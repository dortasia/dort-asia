import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe/config';
import { createClient } from '@supabase/supabase-js';
import { recalculateEntitlements } from '@/services/entitlements';
import { sendSubscriptionNotification, sendPaymentNotification } from '@/services/notifications';

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

  const starterProduct = process.env.STRIPE_PRODUCT_STARTER;
  const businessProduct = process.env.STRIPE_PRODUCT_BUSINESS;

  if (!starterProduct || !businessProduct) {
    console.error('Webhook Error: Stripe Product IDs are missing from environment configuration');
    return NextResponse.json({ error: 'Webhook Error: Missing server configuration' }, { status: 500 });
  }

  const STRIPE_PRODUCT_TO_PLAN_CODE: Record<string, string> = {};
  STRIPE_PRODUCT_TO_PLAN_CODE[starterProduct] = 'starter';
  STRIPE_PRODUCT_TO_PLAN_CODE[businessProduct] = 'business';

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
        let appId = session.metadata.appId;
        
        const subscription = await stripe.subscriptions.retrieve(session.subscription) as any;

        // Ensure appId is a UUID
        const isAppUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId);
        if (!isAppUuid) {
           const { data: appData } = await supabase.schema('platform').from('apps').select('id').eq('slug', appId).maybeSingle();
           if (appData) {
               appId = appData.id;
           } else {
               throw new Error(`Platform app not found for slug: ${appId}`);
           }
        }

        // Use the trusted plan UUID from our checkout session metadata
        let internalPlanId = session.metadata.planId;
        
        if (!internalPlanId) {
          // Fallback for older checkout sessions that only had 'plan' (plan_code)
          const planCode = session.metadata.plan;
          if (!planCode) throw new Error("Missing planId or plan in session metadata");

          const interval = subscription.items?.data?.[0]?.plan?.interval === 'year' ? 'yearly' : 'monthly';
          
          const { data: plansData, error: planErr } = await supabase.rpc('get_marketplace_plans', { p_app_ids: [appId] });
          if (planErr) throw planErr;
          
          const planData = (plansData as any[])?.find(p => p.plan_code === planCode && p.billing_interval === interval);
          if (!planData) throw new Error(`No active marketplace.app_plans found for app ${appId}, plan ${planCode}, interval ${interval}`);
          
          internalPlanId = planData.id;
        }

        // Upsert Billing Customer
        await supabase.from('billing_customers').upsert({
           organization_id: organizationId,
           stripe_customer_id: session.customer as string
        }, { onConflict: 'organization_id' });

        // Upsert Subscription
        const { data: sub, error: subError } = await supabase.schema('subscriptions').from('subscriptions').upsert({
          company_id: organizationId,
          app_id: appId,
          plan_id: internalPlanId,
          stripe_subscription_id: session.subscription as string,
          status: subscription.status,
          current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
        }, { onConflict: 'stripe_subscription_id' }).select().single();

        if (subError) throw subError;

        // Sync Discounts
        if (subscription.discount) {
           const discount = subscription.discount;
           const coupon = discount.coupon;
           await supabase.schema('subscriptions').from('subscription_discounts').upsert({
               subscription_id: sub.id,
               stripe_discount_id: discount.id || coupon.id,
               snapshot_base_price: 0, // Should be looked up from plan, simplified for webhook here
               snapshot_currency: coupon.currency || 'sgd',
               discount_type: coupon.percent_off ? 'percentage' : 'fixed',
               discount_amount: coupon.percent_off || (coupon.amount_off / 100.0),
               starts_at: new Date(discount.start * 1000).toISOString(),
               expires_at: discount.end ? new Date(discount.end * 1000).toISOString() : null,
               is_active: true
           }, { onConflict: 'subscription_id' }); // Assuming unique index on subscription_id where is_active=true
        }

        // Update Checkout Session Status
        await supabase.from('checkout_sessions')
          .update({ status: 'complete' })
          .eq('stripe_session_id', session.id);

        // Process Subscription Items
        await processSubscriptionItems(supabase, sub.id, subscription.items.data);

        // Recalculate Entitlements
        await recalculateEntitlements(supabase, organizationId, appId);

        const purchaseDateObj = new Date(session.created * 1000);
        const purchaseDate = purchaseDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const purchaseTime = purchaseDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const nextBillingObj = new Date((subscription.current_period_end || 0) * 1000);
        const nextBilling = nextBillingObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        const intervalVal = subscription.items?.data?.[0]?.plan?.interval;
        const billingCycle = intervalVal === 'year' ? 'Yearly' : intervalVal === 'month' ? 'Monthly' : 'One-time';

        // Send Realtime Notification
        await sendSubscriptionNotification({
          companyId: organizationId,
          appIdOrSlug: appId,
          status: subscription.status,
          plan: session.metadata?.plan,
          eventId: event.id,
          purchaseDate,
          purchaseTime,
          billingCycle,
          nextBilling,
        }).catch(e => console.error('Notification error:', e));
        break;
      }
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        
        const { data: existingSub } = await supabase.schema('subscriptions')
          .from('subscriptions')
          .select('id, company_id, app_id, plan_id, status')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (existingSub) {
          const updatePayload: any = {
             status: subscription.status,
             current_period_end: new Date((subscription.current_period_end || subscription.items?.data[0]?.current_period_end || 0) * 1000).toISOString(),
             cancel_at_period_end: subscription.cancel_at_period_end || false
          };

          await supabase.schema('subscriptions')
            .from('subscriptions')
            .update(updatePayload)
            .eq('id', existingSub.id);

          // Sync Discounts
          if (subscription.discount) {
             const discount = subscription.discount;
             const coupon = discount.coupon;
             
             // Deactivate old discounts
             await supabase.schema('subscriptions').from('subscription_discounts')
                 .update({ is_active: false })
                 .eq('subscription_id', existingSub.id);
                 
             // Insert new active discount
             await supabase.schema('subscriptions').from('subscription_discounts').insert({
                 subscription_id: existingSub.id,
                 stripe_discount_id: discount.id || coupon.id,
                 snapshot_base_price: 0, // Should be properly looked up
                 snapshot_currency: coupon.currency || 'sgd',
                 discount_type: coupon.percent_off ? 'percentage' : 'fixed',
                 discount_amount: coupon.percent_off || (coupon.amount_off / 100.0),
                 starts_at: new Date(discount.start * 1000).toISOString(),
                 expires_at: discount.end ? new Date(discount.end * 1000).toISOString() : null,
                 is_active: true
             });
          } else {
             // Remove active discounts if no discount present
             await supabase.schema('subscriptions').from('subscription_discounts')
                 .update({ is_active: false })
                 .eq('subscription_id', existingSub.id);
          }

          await processSubscriptionItems(supabase, existingSub.id, subscription.items.data);
          await recalculateEntitlements(supabase, existingSub.company_id, existingSub.app_id);

          // Send Realtime Notification ONLY IF status changed
          if (existingSub.status !== subscription.status) {
            let planCode: string | undefined;
            try {
              const stripeProductId = subscription.items?.data?.[0]?.price?.product;
              if (stripeProductId) {
                planCode = STRIPE_PRODUCT_TO_PLAN_CODE[stripeProductId as string];
              }
            } catch (e) {}

            await sendSubscriptionNotification({
              companyId: existingSub.company_id,
              appIdOrSlug: existingSub.app_id,
              status: subscription.status,
              plan: planCode,
              eventId: event.id,
            }).catch(e => console.error('Notification error:', e));
          }
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

            // Send Realtime Notification
            await sendPaymentNotification({
              companyId: customer.organization_id,
              amount: invoice.amount_paid,
              currency: invoice.currency || 'sgd',
              status: 'succeeded',
              invoiceId: invoice.id,
            }).catch(e => console.error('Notification error:', e));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const stripeCustomerId = invoice.customer;
        const { data: customer } = await supabase.from('billing_customers').select('organization_id').eq('stripe_customer_id', stripeCustomerId).maybeSingle();
        if (customer) {
          await sendPaymentNotification({
            companyId: customer.organization_id,
            amount: invoice.amount_due || 0,
            currency: invoice.currency || 'sgd',
            status: 'failed',
            invoiceId: invoice.id,
          }).catch(e => console.error('Notification error:', e));
        }
        break;
      }
      
      case 'price.created':
      case 'price.updated': {
        const price = event.data.object as any;
        await handlePriceSync(supabase, price);
        break;
      }

      case 'product.created':
      case 'product.updated': {
        const product = event.data.object as any;
        await handleProductSync(supabase, product);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // 4. Mark event as completed
    await supabase.from('stripe_webhook_events').update({
       status: 'completed',
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

// Helper to sync Stripe Price changes to Supabase plan_prices and addon_prices
async function handlePriceSync(supabase: any, price: any) {
  const stripePriceId = price.id;
  const stripeProductId = typeof price.product === 'string' ? price.product : price.product?.id;
  const unitAmount = price.unit_amount ?? 0;
  const currency = (price.currency || 'sgd').toLowerCase();
  const interval = price.recurring?.interval || 'month';
  const isActive = price.active !== false;

  if (!stripeProductId) {
    console.warn(`Price ${stripePriceId} has no associated product id.`);
    return;
  }

  // 1. Check if product matches a plan in public.plans
  const { data: plan } = await supabase
    .from('plans')
    .select('id, name')
    .eq('stripe_product_id', stripeProductId)
    .maybeSingle();

  if (plan) {
    // If the price is active, deactivate/archive any older active price for the same (plan_id, currency, interval)
    if (isActive) {
      await supabase
        .from('plan_prices')
        .update({ active: false, archived_at: new Date().toISOString() })
        .eq('plan_id', plan.id)
        .eq('currency', currency)
        .eq('interval', interval)
        .neq('stripe_price_id', stripePriceId);
    }

    // Check if this exact stripe_price_id already exists in plan_prices
    const { data: existingPrice } = await supabase
      .from('plan_prices')
      .select('id, unit_amount, currency')
      .eq('stripe_price_id', stripePriceId)
      .maybeSingle();

    if (existingPrice) {
      // If active state changed, update active and archived_at (avoiding unit_amount updates due to immutability trigger)
      await supabase
        .from('plan_prices')
        .update({
          active: isActive,
          archived_at: isActive ? null : new Date().toISOString()
        })
        .eq('id', existingPrice.id);
    } else {
      // Insert new price record
      await supabase
        .from('plan_prices')
        .insert({
          plan_id: plan.id,
          stripe_price_id: stripePriceId,
          currency: currency,
          interval: interval,
          unit_amount: unitAmount,
          active: isActive,
          archived_at: isActive ? null : new Date().toISOString()
        });
    }
    return;
  }

  // 2. Check if product matches an add-on in public.add_ons
  const { data: addon } = await supabase
    .from('add_ons')
    .select('id, name')
    .eq('stripe_product_id', stripeProductId)
    .maybeSingle();

  if (addon) {
    if (isActive) {
      await supabase
        .from('addon_prices')
        .update({ active: false, archived_at: new Date().toISOString() })
        .eq('add_on_id', addon.id)
        .eq('currency', currency)
        .eq('interval', interval)
        .neq('stripe_price_id', stripePriceId);
    }

    const { data: existingAddonPrice } = await supabase
      .from('addon_prices')
      .select('id')
      .eq('stripe_price_id', stripePriceId)
      .maybeSingle();

    if (existingAddonPrice) {
      await supabase
        .from('addon_prices')
        .update({
          active: isActive,
          archived_at: isActive ? null : new Date().toISOString()
        })
        .eq('id', existingAddonPrice.id);
    } else {
      await supabase
        .from('addon_prices')
        .insert({
          add_on_id: addon.id,
          stripe_price_id: stripePriceId,
          currency: currency,
          interval: interval,
          unit_amount: unitAmount,
          active: isActive,
          archived_at: isActive ? null : new Date().toISOString()
        });
    }
  }
}

// Helper to sync Stripe Product changes to Supabase plans and add_ons
async function handleProductSync(supabase: any, product: any) {
  const stripeProductId = product.id;
  const productName = product.name;
  const isActive = product.active !== false;

  // Check if it's a plan
  const { data: existingPlan } = await supabase
    .from('plans')
    .select('id')
    .eq('stripe_product_id', stripeProductId)
    .maybeSingle();

  if (existingPlan) {
    await supabase
      .from('plans')
      .update({
        name: productName,
        active: isActive,
        archived_at: isActive ? null : new Date().toISOString()
      })
      .eq('id', existingPlan.id);
  }

  // Check if it's an add-on
  const { data: existingAddon } = await supabase
    .from('add_ons')
    .select('id')
    .eq('stripe_product_id', stripeProductId)
    .maybeSingle();

  if (existingAddon) {
    await supabase
      .from('add_ons')
      .update({
        name: productName,
        active: isActive,
        archived_at: isActive ? null : new Date().toISOString()
      })
      .eq('id', existingAddon.id);
  }
}

