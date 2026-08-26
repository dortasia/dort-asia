import { createClient as createAdminClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type NotificationType = 'system' | 'billing' | 'subscription' | 'security' | 'app';

export interface CreateNotificationParams {
  userId?: string;
  companyId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Creates a notification in the database using service_role credentials.
 */
export async function createNotification(params: CreateNotificationParams): Promise<string | null> {
  try {
    const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);

    const { data, error } = await adminClient.rpc('create_notification', {
      p_user_id: params.userId || null,
      p_company_id: params.companyId || null,
      p_title: params.title,
      p_message: params.message,
      p_type: params.type || 'system',
      p_action_url: params.actionUrl || null,
      p_metadata: params.metadata || {},
    });

    if (error) {
      // Fallback direct insert if RPC not yet created
      const { data: fallbackData, error: fallbackError } = await adminClient
        .from('notifications')
        .insert({
          user_id: params.userId || null,
          company_id: params.companyId || null,
          title: params.title,
          message: params.message,
          type: params.type || 'system',
          action_url: params.actionUrl || null,
          metadata: params.metadata || {},
          is_read: false,
          is_dismissed: false,
        })
        .select('id')
        .single();

      if (fallbackError) {
        console.warn('[Notification Service] Insert note:', fallbackError.message);
        return null;
      }
      return fallbackData?.id || null;
    }

    return (data as string) || null;
  } catch (err) {
    console.error('[Notification Service] Unexpected error:', err);
    return null;
  }
}

/**
 * Dispatches a notification for subscription activation/changes.
 */
export async function sendSubscriptionNotification(options: {
  userId?: string;
  companyId?: string;
  appIdOrSlug?: string;
  appName?: string; // Fallback
  status: string;
  plan?: string;
  actionUrl?: string;
  eventId?: string;
  purchaseDate?: string;
  purchaseTime?: string;
  billingCycle?: string;
  nextBilling?: string;
}) {
  const adminClient = createAdminClient(supabaseUrl, supabaseServiceRoleKey);

  if (options.eventId) {
    // Enforce idempotency using the stripeEventId
    const { data: existing } = await adminClient
      .from('notifications')
      .select('id')
      .eq('metadata->>stripeEventId', options.eventId)
      .maybeSingle();
      
    if (existing) {
      console.log(`[Notification Service] Notification for event ${options.eventId} already exists. Skipping.`);
      return null;
    }
  }

  let finalAppName = options.appName || 'Workspace App';
  let appLogo = null;
  let resolvedAppId = null;
  let resolvedAppSlug = null;

  try {
    if (options.appIdOrSlug) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.appIdOrSlug);
      let query = adminClient.schema('platform').from('apps').select('id, slug, name, logo_url');
      if (isUuid) {
        query = query.eq('id', options.appIdOrSlug);
      } else {
        query = query.eq('slug', options.appIdOrSlug);
      }
      
      const { data: appData } = await query.maybeSingle();
      if (appData) {
        finalAppName = appData.name || finalAppName;
        appLogo = appData.logo_url;
        resolvedAppId = appData.id;
        resolvedAppSlug = appData.slug;
      }
    }
    if (!appLogo) {
      if (resolvedAppSlug === 'xentra-paynote' || options.appIdOrSlug === 'xentra-paynote' || finalAppName.toLowerCase().includes('paynote')) {
        appLogo = '/apps-logo/xentra_paynote.svg';
      } else {
        appLogo = '/apps-logo/xentra-bluelogo.svg';
      }
    }
  } catch (err) {
    console.warn('Could not fetch app metadata for notification:', err);
    if (!appLogo) {
      appLogo = '/apps-logo/xentra-bluelogo.svg';
    }
  }

  const isCanceled = options.status === 'canceled' || options.status === 'deleted';
  const title = isCanceled
    ? `Subscription Canceled: ${finalAppName}`
    : `Subscription Active: ${finalAppName}`;

  const message = isCanceled
    ? `Your subscription for ${finalAppName} has ended.`
    : `Your ${options.plan ? `${options.plan} plan for ` : ''}${finalAppName} is now active and ready to use.`;

  return createNotification({
    userId: options.userId,
    companyId: options.companyId,
    title,
    message,
    type: 'subscription',
    actionUrl: options.actionUrl || `/dashboard/subscriptions`,
    metadata: {
      appName: finalAppName,
      appLogo: appLogo,
      appId: resolvedAppId,
      appSlug: resolvedAppSlug,
      status: options.status,
      plan: options.plan,
      stripeEventId: options.eventId,
      purchaseDate: options.purchaseDate,
      purchaseTime: options.purchaseTime,
      billingCycle: options.billingCycle,
      nextBilling: options.nextBilling,
    },
  });
}

/**
 * Dispatches a notification for billing payments and invoices.
 */
export async function sendPaymentNotification(options: {
  userId?: string;
  companyId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'refunded';
  invoiceId?: string;
}) {
  const formattedAmount = `${options.currency.toUpperCase()} ${(options.amount / 100).toFixed(2)}`;
  const isSuccess = options.status === 'succeeded';

  const title = isSuccess
    ? `Payment Successful: ${formattedAmount}`
    : `Payment Failed: ${formattedAmount}`;

  const message = isSuccess
    ? `We've successfully processed your payment of ${formattedAmount}. Thank you!`
    : `We were unable to process your payment of ${formattedAmount}. Please check your payment method.`;

  return createNotification({
    userId: options.userId,
    companyId: options.companyId,
    title,
    message,
    type: 'billing',
    actionUrl: '/dashboard/settings/billing',
    metadata: {
      amount: options.amount,
      currency: options.currency,
      status: options.status,
      invoiceId: options.invoiceId,
    },
  });
}

/**
 * Dispatches a welcome notification to new or newly configured users.
 */
export async function sendWelcomeNotification(options: {
  userId: string;
  userName?: string;
  companyName?: string;
}) {
  return createNotification({
    userId: options.userId,
    title: `Welcome to Dort Asia! 👋`,
    message: `Get started by exploring connected workspace apps and managing your enterprise subscriptions.`,
    type: 'system',
    actionUrl: '/dashboard',
    metadata: {
      welcome: true,
      companyName: options.companyName,
    },
  });
}

/**
 * Dispatches a security alert notification for new devices or locations.
 */
export async function sendSecurityAlertNotification(options: {
  userId: string;
  accountId?: string;
  eventType: 'new_device' | 'new_location' | 'new_device_and_location';
  browser: string;
  os: string;
  city: string | null;
  country: string | null;
}) {
  const locationStr = [options.city, options.country].filter(Boolean).join(', ') || 'Unknown Location';
  const deviceStr = `${options.browser} on ${options.os}`;
  
  return createNotification({
    userId: options.userId,
    title: `New sign-in detected`,
    message: `A new sign-in was detected from ${deviceStr} near ${locationStr}. If this wasn't you, review your active sessions.`,
    type: 'security',
    actionUrl: '/dashboard/settings/security',
    metadata: {
      eventType: options.eventType,
      browser: options.browser,
      os: options.os,
      location: locationStr,
    },
  });
}
