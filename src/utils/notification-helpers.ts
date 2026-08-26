import { NotificationItem } from "@/hooks/useNotifications";
import { marketplaceApps } from "@/data/marketplace";
import { getCrossAppUrl } from "@/config/urls";

export interface SubscriptionDetailsInfo {
  appName: string;
  planName: string;
  billingInterval: string;
  status: string;
  statusType: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete';
  launchUrl: string;
  title: string;
  description: string;
  primaryCtaText: string;
}

export interface ResolvedAppInfo {
  name: string;
  icon: string;
  iconBg: string;
  subscription?: SubscriptionDetailsInfo;
}

function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(/[\s_-]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function getAppInfoForNotification(notif: NotificationItem): ResolvedAppInfo | null {
  const meta = notif.metadata || {};
  const slug = (meta.appSlug || meta.app_slug || "").toLowerCase();
  const logo = meta.appLogo || meta.app_logo;
  const rawName = meta.appName || meta.app_name || "";
  const title = notif.title || "";
  const message = notif.message || "";
  const combined = `${title} ${message} ${rawName} ${slug}`.toLowerCase();

  // Check if this notification is associated with an app or subscription event
  const isAppOrSub = 
    notif.type === 'subscription' || 
    notif.type === 'app' || 
    slug.length > 0 || 
    Boolean(logo) || 
    combined.includes("xentra people") || 
    combined.includes("xentra paynote") ||
    combined.includes("subscription active") ||
    combined.includes("subscription canceled");

  if (!isAppOrSub) return null;

  let appName = rawName;
  let icon = "/apps-logo/xentra-bluelogo.svg";
  let iconBg = "bg-white border-gray-200/90 dark:border-zinc-800 shadow-xs";
  let resolvedSlug = slug;

  if (slug === 'xentra-paynote' || combined.includes("xentra paynote") || combined.includes("paynote") || logo?.includes("paynote")) {
    appName = appName || "Xentra Paynote";
    icon = "/apps-logo/xentra_paynote.svg";
    iconBg = "bg-zinc-900 border-zinc-700/60 shadow-xs";
    resolvedSlug = "xentra-paynote";
  } else if (slug === 'xentra-people' || combined.includes("xentra people") || combined.includes("xentra") || logo?.includes("xentra") || notif.type === 'subscription') {
    appName = appName || "Xentra People";
    icon = "/apps-logo/xentra-bluelogo.svg";
    iconBg = "bg-white border-gray-200/90 dark:border-zinc-800 shadow-xs";
    resolvedSlug = "xentra-people";
  } else if (slug) {
    const matched = marketplaceApps.find(a => a.slug === slug || a.id === slug);
    if (matched) {
      appName = appName || matched.name;
      icon = matched.icon;
      iconBg = matched.iconBackground || "bg-white border-gray-200/90 dark:border-zinc-800 shadow-xs";
      resolvedSlug = matched.slug;
    }
  } else if (logo) {
    appName = appName || "Workspace App";
    icon = logo;
    iconBg = "bg-white border-gray-200/90 dark:border-zinc-800 shadow-xs";
  } else {
    appName = appName || "Xentra People";
    icon = "/apps-logo/xentra-bluelogo.svg";
    iconBg = "bg-white border-gray-200/90 dark:border-zinc-800 shadow-xs";
    resolvedSlug = "xentra-people";
  }

  // Format subscription details
  let subscription: SubscriptionDetailsInfo | undefined = undefined;

  if (notif.type === 'subscription' || notif.type === 'app' || meta.plan || meta.status || combined.includes('subscription')) {
    // 1. Resolve Plan Name
    let rawPlan = meta.plan || meta.planName || meta.plan_name;
    if (!rawPlan && message) {
      const match = message.match(/Your\s+([A-Za-z0-9_-]+)\s+plan/i);
      if (match) rawPlan = match[1];
    }
    const planName = rawPlan ? capitalizeWords(rawPlan) : "Starter";

    // 2. Resolve Billing Interval
    let rawBilling = meta.billingCycle || meta.billing_cycle || meta.billingInterval || meta.billing_interval;
    const billingInterval = rawBilling ? capitalizeWords(rawBilling) : "Monthly";

    // 3. Resolve Status
    let rawStatus = (meta.status || "active").toLowerCase();
    let status = "Active";
    let statusType: 'active' | 'trialing' | 'canceled' | 'past_due' | 'incomplete' = 'active';

    if (rawStatus === 'canceled' || rawStatus === 'deleted' || combined.includes('canceled') || combined.includes('cancelled')) {
      status = "Canceled";
      statusType = 'canceled';
    } else if (rawStatus === 'trialing') {
      status = "Trialing";
      statusType = 'trialing';
    } else if (rawStatus === 'past_due') {
      status = "Past Due";
      statusType = 'past_due';
    } else {
      status = "Active";
      statusType = 'active';
    }

    // 4. Resolve Launch URL
    let launchUrl = notif.actionUrl || "";
    if (resolvedSlug === 'xentra-people' || appName.toLowerCase().includes('people')) {
      launchUrl = getCrossAppUrl('xentraPeople') || process.env.NEXT_PUBLIC_XENTRA_PEOPLE_URL || 'https://xentrapeople.dortasia.com';
    } else if (resolvedSlug === 'xentra-paynote' || appName.toLowerCase().includes('paynote')) {
      launchUrl = getCrossAppUrl('xentraPaynote') || process.env.NEXT_PUBLIC_XENTRA_PAYNOTE_URL || 'https://xentrapaynote.dortasia.com';
    } else if (!launchUrl || launchUrl === '/dashboard/subscriptions') {
      launchUrl = resolvedSlug ? `/dashboard/marketplace/${resolvedSlug}` : '/dashboard/marketplace';
    }

    // 5. Clean customer-facing title & message
    const formattedTitle = statusType === 'canceled'
      ? `Your ${appName} subscription has ended`
      : statusType === 'past_due'
      ? `Payment required for your ${appName} subscription`
      : `Your ${appName} subscription is active`;

    const formattedDesc = statusType === 'canceled'
      ? `Your subscription for ${appName} has ended.`
      : `Your ${planName} plan is now active. You can start using ${appName} right away.`;

    const primaryCtaText = `Open ${appName} →`;

    subscription = {
      appName,
      planName,
      billingInterval,
      status,
      statusType,
      launchUrl,
      title: formattedTitle,
      description: formattedDesc,
      primaryCtaText,
    };
  }

  return {
    name: appName,
    icon,
    iconBg,
    subscription,
  };
}
