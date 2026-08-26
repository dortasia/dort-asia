"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Users, 
  UserCheck, 
  Clock, 
  CreditCard, 
  Calendar, 
  Folder, 
  FileText, 
  LayoutDashboard, 
  HardDrive
} from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon as HugeCheckmark } from "@hugeicons/core-free-icons";

interface AppPlansSectionProps {
  appName?: string;
  appSlug?: string;
  plans?: any[];
  hasSubscription?: boolean;
  onSubscribe?: (plan: any) => void;
  isCheckoutLoading?: boolean;
}

const XENTRA_CORE_INCLUSIONS = [
  { label: "Employee management", icon: Users },
  { label: "Employee profiles", icon: UserCheck },
  { label: "Attendance management", icon: Clock },
  { label: "Payroll management", icon: CreditCard },
  { label: "Timesheets", icon: Calendar },
  { label: "Document management", icon: Folder },
  { label: "Employee records", icon: FileText },
  { label: "HR operations dashboard", icon: LayoutDashboard },
];

const XENTRA_PLAN_LIMITS = [
  { label: "30 Employees", icon: Users },
  { label: "10 GB Storage", icon: HardDrive },
];

export function AppPlansSection({ 
  appName = "App", 
  appSlug = "", 
  plans = [],
  hasSubscription = false,
  onSubscribe,
  isCheckoutLoading = false
}: AppPlansSectionProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const isAnnual = billingInterval === "yearly";

  const displayedPlans = plans.filter(p => p.billingInterval === (isAnnual ? 'yearly' : 'monthly') || p.billingInterval === 'monthly');

  if (!plans || plans.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto py-16 px-4 text-center text-gray-500">
        No plans are currently available for this application. Please check back later or contact support.
      </div>
    );
  }

  return (
    <div className="space-y-12 w-full max-w-7xl mx-auto pt-6 pb-16 px-1 flex flex-col items-center">
      {/* 1. Top Billing Toggle (Centered) */}
      <div className="flex items-center justify-center gap-3.5">
        <span className={`text-[15px] font-semibold transition-colors ${!isAnnual ? "text-gray-900" : "text-gray-500"}`}>
          Monthly
        </span>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isAnnual}
          onClick={() => setBillingInterval(isAnnual ? "monthly" : "yearly")}
          className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full bg-gray-900 p-1 transition-colors duration-200 ease-in-out focus:outline-hidden"
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isAnnual ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>

        <span className={`text-[15px] font-semibold transition-colors ${isAnnual ? "text-gray-900" : "text-gray-500"}`}>
          Yearly
        </span>

        {/* Brand Theme Badge: Save 20% */}
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-[#0061FF] border border-blue-200 shadow-2xs">
          Save 20%
        </span>
      </div>

      {/* Dynamic Plan Cards - Centered */}
      <div className="w-full flex flex-wrap justify-center items-stretch gap-8">
        {displayedPlans.map((plan, idx) => {
           // Calculate annual vs monthly pricing logic if the DB plan is inherently monthly
           const isPlanMonthlyOnly = plan.billingInterval === 'monthly';
           const basePrice = plan.planCode === 'starter' ? plan.price - 30 : plan.price;
           const displayPrice = isAnnual && isPlanMonthlyOnly ? (basePrice * 12 * 0.8) / 12 : basePrice;
           const annualTotal = displayPrice * 12;
           const saveAmount = (basePrice * 12) - annualTotal;

           return (
             <div key={plan.id || idx} className="w-full max-w-[440px] bg-white rounded-[32px] border border-gray-200 p-8 lg:p-9 flex flex-col justify-between shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all duration-200">
               <div className="space-y-6">
                 <div>
                   <h3 className="text-[22px] font-bold text-gray-900 tracking-tight">{plan.name}</h3>
                   <p className="text-[14px] text-gray-500 mt-1">{plan.description}</p>
                 </div>

                 {/* Price Display */}
                 <div className="pt-2 pb-1">
                   <div className="flex items-baseline flex-wrap gap-2">
                     <div className="flex items-baseline">
                       <span className="text-[#0061FF] font-bold text-2xl mr-1">{plan.currency === 'SGD' ? 'S$' : plan.currency}</span>
                       <span className="text-5xl font-black text-gray-900 tracking-tight">
                         {Math.round(displayPrice)}
                       </span>
                       <span className="text-[14px] text-gray-500 font-medium ml-1.5">/monthly</span>
                     </div>
                     {plan.price > displayPrice && (
                       <span className="text-gray-400 line-through text-lg font-semibold ml-2">
                         S${Math.round(plan.price)}
                       </span>
                     )}
                   </div>
                   {isAnnual && isPlanMonthlyOnly && saveAmount > 0 ? (
                     <div className="text-[12px] text-emerald-600 font-semibold mt-1">
                       Billed annually (S${Math.round(annualTotal)}/yr) • Save S${Math.round(saveAmount)}/yr
                     </div>
                   ) : plan.planCode === 'starter' && !isAnnual && (
                     <div className="text-[12px] text-emerald-600 font-semibold mt-1">
                       Includes S$30/mo Launch Offer discount!
                     </div>
                   )}
                 </div>

                 {/* Select Plan Button */}
                 <button
                   onClick={() => onSubscribe && onSubscribe(plan)}
                   disabled={isCheckoutLoading}
                   className="w-full block py-3.5 px-6 rounded-full border border-gray-200 bg-[#0061FF] hover:bg-blue-700 disabled:opacity-70 text-white text-[15px] font-bold text-center transition-all shadow-2xs cursor-pointer active:scale-98"
                 >
                   {isCheckoutLoading ? "Loading..." : hasSubscription ? "Launch Xentra" : (plan.ctaText || "Subscribe")}
                 </button>
               </div>

               {/* Features Inset Container */}
               <div className="bg-transparent space-y-6 mt-8 border-t border-gray-100 pt-7">
                 {/* Core Inclusions */}
                 {appSlug === 'xentra-people' ? (
                   <div className="space-y-3.5">
                     <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">Core Inclusions</div>
                     <ul className="space-y-3 text-[14px] text-gray-800 font-medium">
                       {XENTRA_CORE_INCLUSIONS.map((item, fIdx) => {
                         const ItemIcon = item.icon;
                         return (
                           <li key={fIdx} className="flex items-center gap-3">
                             <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shrink-0 shadow-2xs">
                               <ItemIcon className="w-3.5 h-3.5 stroke-[2]" />
                             </div>
                             <span>{item.label}</span>
                           </li>
                         );
                       })}
                     </ul>
                   </div>
                 ) : (
                   <div className="space-y-3.5">
                     <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">Core Inclusions</div>
                     <ul className="space-y-3 text-[14px] text-gray-800 font-medium">
                       {(plan.features || []).map((feature: string, fIdx: number) => (
                         <li key={fIdx} className="flex items-center gap-3">
                           <div className="w-7 h-7 rounded-lg bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shrink-0 shadow-2xs">
                             <HugeiconsIcon icon={HugeCheckmark} className="w-4 h-4 text-[#0061FF]" />
                           </div>
                           <span>{feature}</span>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {/* Plan Limits */}
                 {appSlug === 'xentra-people' ? (
                   <div className="space-y-3.5 pt-4 border-t border-gray-100/80">
                     <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">Plan Limits</div>
                     <ul className="space-y-3 text-[14px] text-gray-800 font-medium">
                       {XENTRA_PLAN_LIMITS.map((limit, lIdx) => {
                         const LimitIcon = limit.icon;
                         return (
                           <li key={lIdx} className="flex items-center gap-3">
                             <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                               <LimitIcon className="w-3.5 h-3.5 stroke-[2]" />
                             </div>
                             <span>{limit.label}</span>
                           </li>
                         );
                       })}
                     </ul>
                   </div>
                 ) : (
                   plan.features && plan.features.length > 0 && (
                     <div className="space-y-3.5 pt-4 border-t border-gray-100/80">
                       <div className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">Plan Limits</div>
                       <ul className="space-y-3 text-[14px] text-gray-800 font-medium">
                         {plan.features.map((limit: string, lIdx: number) => (
                           <li key={lIdx} className="flex items-center gap-3">
                             <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                               <HugeiconsIcon icon={HugeCheckmark} className="w-4 h-4 text-gray-500" />
                             </div>
                             <span>{limit}</span>
                           </li>
                         ))}
                       </ul>
                     </div>
                   )
                 )}
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
}
