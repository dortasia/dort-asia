"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { Layers01Icon, ArrowRight01Icon, ArrowLeft01Icon, Store01Icon } from "@hugeicons/core-free-icons";
import { Loader2, Users, HardDrive, CheckCircle2 } from "lucide-react";

interface AppSubscription {
  app_id?: string;
  app_slug: string;
  app_name: string;
  app_logo: string | null;
  plan_name: string;
  status: string;
  billing_interval: string;
  price: number;
  currency: string;
  current_period_end?: string;
  entitlements?: any[];
}

export default function SubscriptionsHubPage() {
  const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const [subsRes, entsRes] = await Promise.all([
          supabase.schema("subscriptions").rpc("get_company_subscriptions"),
          supabase.rpc("get_company_entitlements")
        ]);
        
        if (subsRes.error) throw subsRes.error;
        if (entsRes.error) throw entsRes.error;

        const subs = subsRes.data || [];
        const ents = entsRes.data || [];

        // Map entitlements to subscriptions based on app_name or app_id 
        // (get_company_subscriptions returns app_slug and app_name. 
        // We'll map by finding the entitlements for the app if they have an app_id, 
        // but since we only have app_slug in subs, we might need a workaround or just match by app_id if we have it).
        // Let's assume subs might have app_id or we can fetch it. If not, we will just display limits if they exist.
        
        // As a robust approach, we map entitlements back to the sub where possible.
        // But get_company_subscriptions actually might not return app_id. We'll do our best.
        // Wait, get_company_subscriptions returns app_slug. 
        
        const enrichedSubs = subs.map((sub: any) => {
           // We will map entitlements based on app_slug if possible, but entitlements only have app_id.
           // However, for Xentra People (app_slug: xentra-people), we can find employees.max and storage.bytes in the ents array.
           // Since ents belong to the company, we can filter them. If there's only 1 app, it's easy.
           const appEnts = ents.filter((e: any) => e.app_id); // we just attach all relevant ents for now or specific ones
           return { ...sub, entitlements: ents }; 
        });

        setSubscriptions(enrichedSubs);
      } catch (err: any) {
        console.error("Failed to load subscriptions", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const handleManageClick = (appSlug: string) => {
    setPortalLoading(appSlug);
    router.push(`/dashboard/subscriptions/${appSlug}`);
  };

  const renderEntitlements = (sub: AppSubscription) => {
    // If it's Xentra People, extract specific known keys
    if ((sub.app_slug === 'xentra-people' || sub.app_slug === 'xentra_people') && sub.entitlements) {
       const empEnt = sub.entitlements.find(e => e.entitlement_key === 'employees.max');
       const storageEnt = sub.entitlements.find(e => e.entitlement_key === 'storage.bytes');
       
       return (
         <div className="mt-5 space-y-2.5">
           {empEnt && empEnt.enabled && empEnt.limits?.max && (
             <div className="flex items-center gap-2.5 text-[13px] text-gray-700">
               <Users className="w-4 h-4 text-gray-400" />
               <span>{empEnt.limits.max} Employees</span>
             </div>
           )}
           {storageEnt && storageEnt.enabled && storageEnt.limits?.max && (
             <div className="flex items-center gap-2.5 text-[13px] text-gray-700">
               <HardDrive className="w-4 h-4 text-gray-400" />
               <span>{Math.round(storageEnt.limits.max / (1024 * 1024 * 1024))} GB Storage</span>
             </div>
           )}
         </div>
       );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen p-6 md:p-10 max-w-[1400px] text-gray-900">
      <button 
        onClick={() => router.push('/dashboard/settings/billing')}
        className="flex items-center gap-2 text-[13.5px] font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6 group cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Billing Settings</span>
      </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">App Subscriptions</h1>
          <p className="text-[14.5px] text-gray-500 mt-1.5">
            Manage your active subscriptions, workspace plans, and app entitlements.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : subscriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subscriptions.map((sub) => (
            <div
              key={sub.app_slug}
              className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3.5">
                    {(() => {
                      const logo = sub.app_logo || (sub.app_slug === 'xentra-paynote' ? '/apps-logo/xentra_paynote.svg' : '/apps-logo/xentra-bluelogo.svg');
                      const bg = sub.app_slug === 'xentra-paynote' ? 'bg-zinc-900 border-zinc-700/60' : 'bg-white border-gray-200/80';
                      return (
                        <div className={`w-12 h-12 rounded-[15px] overflow-hidden border shadow-xs flex items-center justify-center p-2 shrink-0 ${bg}`}>
                          <img src={logo} alt={sub.app_name} className="w-full h-full object-contain" />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="text-[16px] font-bold text-gray-900">{sub.app_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[13px] text-gray-500 capitalize">{sub.plan_name} Plan</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          sub.status === 'active' || sub.status === 'trialing'
                            ? 'bg-green-50 text-green-700 border border-green-200/60'
                            : sub.status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200/60'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200/60'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-[12px] text-gray-400 font-medium uppercase tracking-wider mb-1">Current Billing</div>
                  <div className="text-[20px] font-bold text-gray-900">
                    {sub.price === 0 ? 'Free' : `${sub.currency === 'SGD' ? 'S$' : sub.currency} ${sub.price}`}
                    {sub.price > 0 && <span className="text-[13px] font-normal text-gray-500 ml-1">/ {sub.billing_interval.replace('_', ' ')}</span>}
                  </div>
                </div>

                {/* Render Dynamic Entitlements */}
                {renderEntitlements(sub)}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => handleManageClick(sub.app_slug)}
                  disabled={portalLoading === sub.app_slug}
                  className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-900 text-[13.5px] font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 cursor-pointer"
                >
                  {portalLoading === sub.app_slug ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Manage Subscription</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 border border-gray-100 border-dashed rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4">
            <HugeiconsIcon icon={Store01Icon} className="w-6 h-6 text-gray-500" />
          </div>
          <h3 className="text-[16px] font-semibold text-gray-900">No Active Subscriptions</h3>
          <p className="text-[14px] text-gray-500 mt-1 max-w-[300px] text-center">
            Your workspace is not subscribed to any apps yet. Explore the marketplace to get started.
          </p>
          <button 
            onClick={() => router.push('/dashboard/apps')}
            className="mt-6 px-5 py-2.5 bg-black text-white text-[13.5px] font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
          >
            Explore Apps
          </button>
        </div>
      )}
    </div>
  );
}
