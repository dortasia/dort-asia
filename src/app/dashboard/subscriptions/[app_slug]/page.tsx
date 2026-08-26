"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getCrossAppUrl } from "@/config/urls";
import { 
  ArrowLeft, 
  ExternalLink, 
  Loader2, 
  SlidersHorizontal,
  MoreHorizontal,
  ShoppingBag,
  XCircle,
  CheckCircle2,
  CreditCard
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Layers01Icon } from "@hugeicons/core-free-icons";

interface Invoice {
  invoice_id: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  invoice_url: string | null;
  due_at: string | null;
  paid_at: string | null;
}

interface PlanFeature {
  feature_key: string;
  name: string;
  description: string | null;
  enabled: boolean;
}

interface EntitlementUsage {
  limit: string | number;
  usage: string | number;
}

interface AppSubscriptionDetails {
  app: {
    slug: string;
    name: string;
    logo_url: string | null;
    description: string | null;
  };
  subscription: {
    id: string;
    status: string;
    starts_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
  };
  plan: {
    name: string;
    description: string | null;
    billing_interval: string;
  };
  pricing: {
    base_price: number;
    currency: string;
    final_price: number;
    savings: number;
    discount: {
      type: string;
      amount: number;
      starts_at: string;
      expires_at: string | null;
      promotion_name: string;
    } | null;
  };
  features: PlanFeature[];
  entitlements: Record<string, EntitlementUsage>;
  billing: {
    invoices: Invoice[];
  };
}

type PageProps = {
  params: Promise<{ app_slug: string }>;
  searchParams?: Promise<{ success?: string; session_id?: string }>;
};

export default function AppSubscriptionDetailsPage({ params }: PageProps) {
  const { app_slug } = use(params);
  const [details, setDetails] = useState<AppSubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const supabase = createClient();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [expectedCancelState, setExpectedCancelState] = useState<boolean | null>(null);

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: details?.app.slug })
      });
      if (res.ok) {
        setExpectedCancelState(true);
        setIsCancelModalOpen(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to cancel subscription");
      }
    } catch (err) {
      alert("Failed to cancel subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleKeepSubscription = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch("/api/stripe/subscription/uncancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: details?.app.slug })
      });
      if (res.ok) {
        setExpectedCancelState(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to keep subscription");
      }
    } catch (err) {
      alert("Failed to keep subscription");
    } finally {
      setCancelLoading(false);
    }
  };

  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let attempts = 0;
    
    async function fetchDetails() {
      try {
        const { data, error } = await supabase.schema('subscriptions').rpc("get_app_subscription_details", {
          target_app_slug: app_slug
        });
        if (error) throw error;
        
        if (data && ['active', 'trialing', 'past_due', 'canceled'].includes(data.subscription.status)) {
          setDetails(data);
          setLoading(false);
          
          if (expectedCancelState !== null && data.subscription.cancel_at_period_end === expectedCancelState) {
            setExpectedCancelState(null);
          }

          if (pollInterval) clearInterval(pollInterval);
        } else if (!isSuccess) {
          setLoading(false);
        } else {
          // isSuccess is true, but no active subscription yet
          attempts++;
          if (attempts >= 30) {
            if (pollInterval) clearInterval(pollInterval);
            setLoading(false);
            setTimeoutReached(true);
          }
        }
      } catch (err: any) {
        console.error("Failed to load subscription details", err);
        if (!isSuccess) {
          setLoading(false);
        } else {
          attempts++;
          if (attempts >= 30) {
            if (pollInterval) clearInterval(pollInterval);
            setLoading(false);
            setTimeoutReached(true);
          }
        }
      }
    }
    
    fetchDetails();
    
    if ((isSuccess && !details && !timeoutReached) || expectedCancelState !== null) {
      pollInterval = setInterval(fetchDetails, 2000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [app_slug, supabase, isSuccess, expectedCancelState]); // exclude details/timeoutReached to avoid resetting attempts

  const handlePortalRedirect = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      // Handle error gracefully
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] flex flex-col items-center justify-center gap-4 text-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        {isSuccess && (
          <p className="text-[14px] text-gray-500">Processing subscription, please wait...</p>
        )}
      </div>
    );
  }

  if (timeoutReached && !details) {
    return (
      <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] text-gray-900">
        <button 
          onClick={() => router.push('/dashboard/subscriptions')}
          className="inline-flex items-center gap-2 text-[13.5px] font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Subscriptions</span>
        </button>

        <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Processing Payment</h2>
          <p className="text-[14px] text-gray-500 mt-2 leading-relaxed">
            Your payment was received, but we're still confirming your subscription. Your account has not been charged again. Please refresh in a moment.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button 
              onClick={() => {
                setTimeoutReached(false);
                setLoading(true);
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-black text-white text-[13.5px] font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
            >
              Refresh status
            </button>
            <button 
              onClick={() => router.push('/dashboard/subscriptions')}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-[13.5px] font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              Back to subscriptions
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] text-gray-900">
        <button 
          onClick={() => router.push('/dashboard/subscriptions')}
          className="inline-flex items-center gap-2 text-[13.5px] font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Subscriptions</span>
        </button>

        <div className="p-8 bg-white border border-gray-200 rounded-2xl text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <HugeiconsIcon icon={Layers01Icon} className="w-6 h-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Subscription Not Found</h2>
          <p className="text-[14px] text-gray-500 mt-1">We couldn't find an active subscription for this app.</p>
          <button 
            onClick={() => router.push('/dashboard/subscriptions')}
            className="mt-6 px-5 py-2.5 bg-black text-white text-[13.5px] font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
          >
            Return to Subscriptions Hub
          </button>
        </div>
      </div>
    );
  }

  // Helpers for dynamic stats
  const appSlug = details.app.slug;
  const appLogo = details.app.logo_url || (appSlug === 'xentra-paynote' ? '/apps-logo/xentra_paynote.svg' : '/apps-logo/xentra-bluelogo.svg');
  const appLogoBg = appSlug === 'xentra-paynote' ? 'bg-zinc-900 border-zinc-700/60' : 'bg-white border-white/20';

  const launchUrl = appSlug === 'xentra-people' || details.app.name.toLowerCase().includes('people')
    ? (getCrossAppUrl('xentraPeople') || process.env.NEXT_PUBLIC_XENTRA_PEOPLE_URL || 'https://xentrapeople.dortasia.com')
    : appSlug === 'xentra-paynote' || details.app.name.toLowerCase().includes('paynote')
    ? (getCrossAppUrl('xentraPaynote') || process.env.NEXT_PUBLIC_XENTRA_PAYNOTE_URL || 'https://xentrapaynote.dortasia.com')
    : `/dashboard/marketplace/${appSlug}`;

  // 1. Team Size extraction
  let teamSizeStr = "50 users";
  if (details.entitlements) {
    const empEnt = Object.entries(details.entitlements).find(([k]) => k.includes('employee') || k.includes('member') || k.includes('user'));
    if (empEnt && empEnt[1]) {
      const limitVal = String(empEnt[1].limit);
      if (limitVal.toLowerCase() === 'unlimited' || limitVal === '-1' || limitVal === 'null') {
        teamSizeStr = "Unlimited";
      } else {
        teamSizeStr = `${limitVal} users`;
      }
    }
  }

  // 2. Storage Limit extraction
  let storageLimitStr = "10 GB";
  if (details.entitlements) {
    const storageEnt = Object.entries(details.entitlements).find(([k]) => k.includes('storage'));
    if (storageEnt && storageEnt[1]) {
      const limitVal = String(storageEnt[1].limit);
      if (limitVal.toLowerCase() === 'unlimited' || limitVal === '-1' || limitVal === 'null') {
        storageLimitStr = "Unlimited";
      } else {
        const numBytes = Number(limitVal);
        if (!isNaN(numBytes) && numBytes > 0) {
          const gb = Math.round(numBytes / (1024 * 1024 * 1024));
          storageLimitStr = gb >= 1000 ? `${(gb / 1024).toFixed(1)} TB` : `${gb} GB`;
        } else {
          storageLimitStr = limitVal;
        }
      }
    }
  }

  // 3. Renewal Date extraction
  const renewalDateStr = details.subscription.current_period_end
    ? new Date(details.subscription.current_period_end).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Aug 26, 2027';

  // Invoices list
  const invoicesList = details.billing?.invoices || [];

  return (
    <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] text-gray-900 space-y-8">
      
      {/* 1. Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="hover:text-gray-900 transition-colors cursor-pointer"
        >
          Home
        </button>
        <span>›</span>
        <button 
          onClick={() => router.push('/dashboard/subscriptions')} 
          className="hover:text-gray-900 transition-colors cursor-pointer"
        >
          Subscriptions
        </button>
        <span>›</span>
        <span className="text-gray-900 font-semibold">{details.app.name}</span>
      </div>

      {/* 2. Heading Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {details.app.name}
          </h1>
          <p className="text-[14.5px] text-gray-500 mt-1">
            Manage your subscription, plan details, and billing history.
          </p>
        </div>

        {/* Top Right: Filters Pill Bar and Three Dot Menu Button */}
        <div className="flex items-center gap-2.5 relative">
          {/* Filters Pill Button */}
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200/90 text-gray-700 text-[13px] font-medium rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
            <span>Filters</span>
          </button>

          {/* Three-Dot Menu Button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`w-9.5 h-9.5 bg-white hover:bg-gray-50 border border-gray-200/90 rounded-xl flex items-center justify-center text-gray-700 transition-all shadow-2xs cursor-pointer active:scale-95 ${
                menuOpen ? 'ring-2 ring-gray-200 bg-gray-50' : ''
              }`}
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setMenuOpen(false)} 
                />
                
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200/90 dark:border-zinc-800 p-1.5 z-30 animate-in fade-in-50 zoom-in-95 duration-150 overflow-hidden">
                  {/* 1. Open App */}
                  <a
                    href={launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                    <span>Open {details.app.name}</span>
                  </a>

                  {/* 2. Open in Marketplace */}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(`/dashboard/marketplace/${details.app.slug}`);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    <span>Open in Marketplace</span>
                  </button>

                  <div className="my-1 border-t border-gray-100 dark:border-zinc-800" />

                  {/* 3. Cancel/Keep Subscription */}
                  {details.subscription.status === 'canceled' || details.subscription.status === 'ended' ? null : details.subscription.cancel_at_period_end ? (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleKeepSubscription();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-zinc-800/80 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Keep subscription</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setIsCancelModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Cancel subscription</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Black Hero Card with App Logo & Stats Grid */}
      <div className="bg-[#0D0E12] rounded-[24px] sm:rounded-[28px] border border-[#1E222B] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Top Row: App Logo, Plan Name, Badge & Change Plan Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* App Logo Frame - Full Fit like Marketplace */}
            <div className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-[16px] overflow-hidden flex items-center justify-center shrink-0 border border-white/20 shadow-md ${appLogoBg}`}>
              <img 
                src={appLogo} 
                alt={details.app.name} 
                className="w-full h-full object-cover" 
              />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight capitalize">
                  {details.plan.name}
                </h2>
                {details.subscription.status === 'canceled' || details.subscription.status === 'ended' ? (
                  <span className="px-3 py-0.5 rounded-full text-[11.5px] font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 backdrop-blur-md uppercase tracking-wide">
                    SUBSCRIPTION ENDED
                  </span>
                ) : details.subscription.cancel_at_period_end ? (
                  <span className="px-3 py-0.5 rounded-full text-[11.5px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 backdrop-blur-md uppercase tracking-wide">
                    CANCELLATION SCHEDULED
                  </span>
                ) : (
                  <span className="px-3 py-0.5 rounded-full text-[11.5px] font-medium bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
                    Active Plan
                  </span>
                )}
              </div>
              <p className="text-[13.5px] text-zinc-400 mt-1 line-clamp-2">
                {details.subscription.status === 'canceled' || details.subscription.status === 'ended'
                  ? "Your subscription has ended and is no longer active."
                  : details.subscription.cancel_at_period_end 
                  ? `Your subscription remains active until ${renewalDateStr}. It will not renew after that date.` 
                  : (details.plan.description || details.app.description || "Advanced features for scaling teams and enterprises")}
              </p>
            </div>
          </div>

          {details.subscription.status === 'canceled' || details.subscription.status === 'ended' ? (
            <button
              onClick={() => router.push(`/pricing?app=${details.app.slug}`)}
              className="px-5 py-2 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 text-white text-[13.5px] font-semibold transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0 active:scale-95 min-w-[140px]"
            >
              Reactivate Plan
            </button>
          ) : details.subscription.cancel_at_period_end ? (
            <button
              onClick={handleKeepSubscription}
              disabled={cancelLoading}
              className="px-5 py-2 rounded-full border border-white hover:bg-gray-100 text-black bg-white text-[13.5px] font-semibold transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0 active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[140px]"
            >
              {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Keep subscription"}
            </button>
          ) : (
            <button
              onClick={() => router.push(`/pricing?app=${details.app.slug}`)}
              className="px-5 py-2 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 text-white text-[13.5px] font-semibold transition-all cursor-pointer shadow-sm self-start sm:self-auto shrink-0 active:scale-95 min-w-[140px]"
            >
              Change Plan
            </button>
          )}
        </div>

        {/* Bottom Row: 5 Stats Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 pt-6 mt-6 border-t border-white/10">
          <div>
            <div className="text-[12px] text-zinc-400 font-medium">
              {details.plan.billing_interval === 'yearly' || details.plan.billing_interval === 'annual' ? 'Annual Cost' : 'Monthly Cost'}
            </div>
            <div className="text-[20px] sm:text-[22px] font-bold text-white mt-1">
              {details.pricing.final_price === 0 ? 'Free' : `${details.pricing.currency === 'SGD' ? 'S$' : details.pricing.currency} ${details.pricing.final_price}`}
            </div>
          </div>

          <div>
            <div className="text-[12px] text-zinc-400 font-medium">Billing Cycle</div>
            <div className="text-[15px] sm:text-[16px] font-semibold text-white mt-1 capitalize">
              {details.plan.billing_interval === 'yearly' || details.plan.billing_interval === 'annual' ? 'Annual' : 'Monthly'}
            </div>
          </div>

          <div>
            <div className="text-[12px] text-zinc-400 font-medium">Team Size</div>
            <div className="text-[15px] sm:text-[16px] font-semibold text-white mt-1">
              {teamSizeStr}
            </div>
          </div>

          <div>
            <div className="text-[12px] text-zinc-400 font-medium">Storage Limit</div>
            <div className="text-[15px] sm:text-[16px] font-semibold text-white mt-1">
              {storageLimitStr}
            </div>
          </div>

          <div>
            <div className="text-[12px] text-zinc-400 font-medium">
              {details.subscription.status === 'canceled' || details.subscription.status === 'ended' 
                ? "Ended On" 
                : details.subscription.cancel_at_period_end 
                ? "Access Until" 
                : "Renewal Date"}
            </div>
            <div className="text-[15px] sm:text-[16px] font-semibold text-white mt-1">
              {renewalDateStr}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Payment History Section */}
      <div className="space-y-4 pt-2">
        {/* Header with Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[19px] sm:text-[20px] font-bold text-gray-900 tracking-tight">
              Payment History
            </h3>
            <p className="text-[13.5px] text-gray-500 mt-0.5">
              Your bills will be sent to the default email and payment method.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePortalRedirect}
              disabled={portalLoading}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200/90 text-gray-700 text-[13px] font-semibold rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-2 active:scale-95"
            >
              {portalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />}
              <span>Manage Billing</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/settings/billing')}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-[13px] font-semibold rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              All Invoices
            </button>
          </div>
        </div>

        {/* Clean Modern Payment History Table */}
        <div className="bg-white rounded-[22px] border border-gray-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Payment Method</th>
                  <th className="py-3.5 px-6">Reference</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13.5px]">
                {invoicesList.length > 0 ? (
                  invoicesList.map((inv, idx) => {
                    const cardLogo = "/icons/stripe.svg";
                    const cardName = "Stripe";

                    return (
                      <tr key={inv.invoice_id || idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={cardLogo} 
                              alt={cardName} 
                              className="h-4 w-auto object-contain shrink-0" 
                            />
                            <span className="font-semibold text-gray-900">{cardName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600 font-mono text-[13px]">
                          ....{inv.invoice_id ? inv.invoice_id.slice(-4) : '9852'}
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          {inv.currency || 'SGD'} {inv.amount_paid > 0 ? inv.amount_paid : inv.amount_due > 0 ? inv.amount_due : details.pricing.final_price}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {inv.paid_at 
                            ? new Date(inv.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : (inv.due_at 
                              ? new Date(inv.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {inv.status === 'paid' ? 'Paid' : (inv.status || 'Paid')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {inv.invoice_url ? (
                            <a
                              href={inv.invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              <span>PDF</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[12.5px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src="/icons/stripe.svg" 
                          alt="Stripe" 
                          className="h-4 w-auto object-contain shrink-0" 
                        />
                        <span className="font-semibold text-gray-900">Stripe</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 font-mono text-[13px]">
                      ....9852
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {details.pricing.currency === 'SGD' ? 'S$' : details.pricing.currency} {details.pricing.final_price}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {details.subscription.current_period_start
                        ? new Date(details.subscription.current_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Paid
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={handlePortalRedirect}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        <span>Receipt</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">
                Cancel your subscription?
              </h3>
              <p className="text-[14.5px] text-gray-500 mt-2.5 leading-relaxed">
                Your subscription will remain active until the end of your current billing period. After that, it will not renew.
              </p>
              
              <div className="flex flex-col gap-2.5 mt-8">
                <button
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={cancelLoading}
                  className="w-full px-4 py-3 rounded-[14px] bg-gray-900 hover:bg-black text-white text-[14.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Keep subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelLoading}
                  className="w-full px-4 py-3 rounded-[14px] border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[14.5px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                >
                  {cancelLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cancel subscription"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
