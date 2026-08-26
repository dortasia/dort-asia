"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  CreditCardIcon, 
  Invoice01Icon, 
  Layers01Icon
} from "@hugeicons/core-free-icons";
import { Loader2 } from "lucide-react";

export default function BillingSettingsPage() {
  const [portalLoading, setPortalLoading] = useState<string | null>(null);
  const router = useRouter();

    const handlePortalRedirect = async (actionKey: string, fallbackUrl = "/dashboard/settings/billing") => {
    setPortalLoading(actionKey);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
      router.push(fallbackUrl);
    } catch {
      router.push(fallbackUrl);
    } finally {
      setPortalLoading(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-8">
        
        {/* 1. Subscriptions Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">
              Subscriptions
            </h3>
            <p className="text-[13.5px] text-gray-500 mt-0.5">Manage your active Dort Asia workspace plan and seat entitlements.</p>
          </div>

          <div
            onClick={() => router.push("/dashboard/subscriptions")}
            className="flex items-center justify-between p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                <HugeiconsIcon icon={Layers01Icon} className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-gray-900 group-hover:text-black transition-colors">
                  App Subscriptions & Plans
                </h4>
                <p className="text-[12.5px] text-gray-500 mt-0.5">
                  Manage active subscriptions, workspace plans, and app entitlements.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-gray-900 shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span>Manage Subscriptions</span>
              <span>→</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* 2. Billing Details Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">
              Billing Details
            </h3>
            <p className="text-[13.5px] text-gray-500 mt-0.5">Payment methods, billing address, and organization tax information.</p>
          </div>

          <div
            onClick={() => handlePortalRedirect("billing")}
            className="flex items-center justify-between p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                <HugeiconsIcon icon={CreditCardIcon} className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-gray-900 group-hover:text-black transition-colors">
                  Payment Methods & Cards
                </h4>
                <p className="text-[12.5px] text-gray-500 mt-0.5">
                  Manage credit cards, default payment method, and billing contact details.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-gray-900 shrink-0 group-hover:translate-x-0.5 transition-transform">
              {portalLoading === "billing" ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              ) : (
                <>
                  <span>Manage Details</span>
                  <span>→</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* 3. Invoice History Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-[16px] font-semibold text-gray-900">
              Invoice History
            </h3>
            <p className="text-[13.5px] text-gray-500 mt-0.5">Access past receipts, tax invoices, and transaction statements.</p>
          </div>

          <div
            onClick={() => handlePortalRedirect("invoices")}
            className="flex items-center justify-between p-5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                <HugeiconsIcon icon={Invoice01Icon} className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <h4 className="text-[14.5px] font-semibold text-gray-900 group-hover:text-black transition-colors">
                  Past Invoices & Receipts
                </h4>
                <p className="text-[12.5px] text-gray-500 mt-0.5">
                  View and download PDF receipts, itemized invoices, and billing history.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[13.5px] font-medium text-gray-900 shrink-0 group-hover:translate-x-0.5 transition-transform">
              {portalLoading === "invoices" ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              ) : (
                <>
                  <span>View Invoices</span>
                  <span>→</span>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

