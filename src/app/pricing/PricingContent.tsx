"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Check, Info } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultiple02Icon,
  Building02Icon,
  Database01Icon,
  Clock01Icon,
  Wallet02Icon,
  SecurityCheckIcon,
  AiCloud01Icon,
  SourceCodeIcon,
  CustomerService01Icon,
  HierarchySquare02Icon,
  CrownIcon,
  Diamond01Icon,
  Folder02Icon
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

export interface PlanPriceItem {
  amount: number;
  formatted: string;
  standardFormatted?: string;
  savingsFormatted?: string;
  effectiveMonthlyFormatted?: string;
  stripePriceId?: string;
}

export interface DynamicPricingData {
  starter: {
    monthly: PlanPriceItem;
    annual: PlanPriceItem;
  };
}

interface FeatureRow {
  name: string;
  starter: string | boolean;
  enterprise: string | boolean;
  badge?: string;
}

interface FeatureCategory {
  category: string;
  features: FeatureRow[];
}

interface AddonPricingRow {
  name: string;
  category: string;
  monthly: string;
  yearly: string;
  availability: string;
}

function PremiumSuccessModal({ onSyncSuccess }: { onSyncSuccess: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');
  const [isOpen, setIsOpen] = useState(success === 'true');

  useEffect(() => {
    if (success === 'true' && sessionId) {
      fetch('/api/stripe/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      }).then(() => {
        onSyncSuccess();
      }).catch(err => console.error('Error syncing:', err));
    }
  }, [success, sessionId, onSyncSuccess]);

  const handleClose = () => {
    setIsOpen(false);
    router.replace('/pricing', { scroll: false });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[24px] w-full max-w-sm p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
      >
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
        <div className="w-16 h-16 bg-[#E8F3FF] text-[#2b7fff] rounded-full flex items-center justify-center mb-6">
          <Check className="w-8 h-8 stroke-[3]" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">Payment Successful!</h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Welcome to Xentra. Your subscription is now active and ready to use.
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 px-6 rounded-full bg-[#2b7fff] hover:bg-[#1a6eff] text-white font-semibold text-[15px] transition-all shadow-[0_4px_16px_rgba(43,127,255,0.25)] hover:shadow-[0_6px_22px_rgba(43,127,255,0.35)] active:scale-[0.99]"
        >
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

const CATEGORIZED_FEATURES: FeatureCategory[] = [
  {
    category: "EMPLOYEES",
    features: [
      { name: "Employee Limit", starter: "30 Employees", enterprise: "Custom / Unlimited" },
      { name: "Departments", starter: true, enterprise: true },
      { name: "Employee Directory", starter: true, enterprise: true },
      { name: "Employee Profiles", starter: true, enterprise: true },
      { name: "Identity Management — NRIC / FIN / PR", starter: true, enterprise: true },
      { name: "Passport & Document Storage", starter: true, enterprise: true },
      { name: "Employee Export — CSV / Excel", starter: true, enterprise: true },
    ],
  },
  {
    category: "PAYROLL",
    features: [
      { name: "Monthly Payroll", starter: true, enterprise: true },
      { name: "CPF Calculation", starter: true, enterprise: true },
      { name: "SINDA / CDAC / SDF", starter: true, enterprise: true },
      { name: "Foreign Worker Levy", starter: true, enterprise: true },
      { name: "Payslip Generation", starter: true, enterprise: true },
      { name: "Payslip PDF Download", starter: true, enterprise: true },
      { name: "Salary Advance", starter: true, enterprise: true },
      { name: "Payroll History", starter: true, enterprise: true },
      { name: "Custom Payslip Design", starter: false, enterprise: true },
      { name: "Payroll Approval Flow", starter: "Single-Level", enterprise: "Custom / Multi-Tier" },
    ],
  },
  {
    category: "ATTENDANCE",
    features: [
      { name: "Check-In / Check-Out", starter: true, enterprise: true },
      { name: "Attendance History", starter: true, enterprise: true },
      { name: "Timesheets", starter: true, enterprise: true },
      { name: "Timesheet & Attendance Integration", starter: true, enterprise: true },
      { name: "Payroll Attendance Integration", starter: true, enterprise: true },
      { name: "Active Site Passes", starter: true, enterprise: true },
    ],
  },
  {
    category: "DOCUMENTS & STORAGE",
    features: [
      { name: "Cloud Storage", starter: "10 GB", enterprise: "Custom Storage" },
      { name: "Employee Documents", starter: true, enterprise: true },
      { name: "Custom Uploads", starter: true, enterprise: true },
    ],
  },
  {
    category: "CLOUD INTEGRATIONS",
    features: [
      { name: "Cloud Integrations", starter: false, enterprise: true },
      { name: "Backup Options on Cloud Integrations", starter: false, enterprise: true },
    ],
  },
  {
    category: "SECURITY & ADMINISTRATION",
    features: [
      { name: "Role-Based Permissions", starter: "Standard", enterprise: "Custom Enterprise" },
      { name: "Reports-To Hierarchy", starter: true, enterprise: true },
      { name: "Audit History", starter: true, enterprise: true },
      { name: "Priority Support", starter: false, enterprise: "Dedicated 24/7 SLA" },
      { name: "API / Integrations", starter: false, enterprise: true },
    ],
  }
];

const MODULAR_ADDONS_PRICING: AddonPricingRow[] = [
  {
    name: "10 Employees Capacity Pack",
    category: "Employee Capacity",
    monthly: "S$25 / month",
    yearly: "S$300 / year",
    availability: "Stackable • All Plans"
  },
  {
    name: "25 Employees Capacity Pack",
    category: "Employee Capacity",
    monthly: "S$55 / month",
    yearly: "S$660 / year",
    availability: "Stackable • All Plans"
  },
  {
    name: "50 Employees Capacity Pack",
    category: "Employee Capacity",
    monthly: "S$100 / month",
    yearly: "S$1,200 / year",
    availability: "Stackable • All Plans"
  },
  {
    name: "10 GB Cloud Storage Pack",
    category: "Storage",
    monthly: "S$10 / month",
    yearly: "S$120 / year",
    availability: "Stackable • All Plans"
  },
  {
    name: "50 GB Cloud Storage Pack",
    category: "Storage",
    monthly: "S$30 / month",
    yearly: "S$360 / year",
    availability: "Stackable • All Plans"
  },
  {
    name: "100 GB Cloud Storage Pack",
    category: "Storage",
    monthly: "S$50 / month",
    yearly: "S$600 / year",
    availability: "Stackable • All Plans"
  }
];

let cachedPlan: string | null = null;
let hasLoadedSubscription = false;

export function PricingContent({ pricingData }: { pricingData: DynamicPricingData }) {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('annual');
  const [isLoadingPlan, setIsLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(cachedPlan);
  const [isFetchingPlan, setIsFetchingPlan] = useState(!hasLoadedSubscription);
  
  // Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [selectedPlanForCompany, setSelectedPlanForCompany] = useState<string | null>(null);

  const fetchSubscription = useCallback(() => {
    fetch('/api/user/subscription')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const plan = data.plan || null;
          cachedPlan = plan;
          setCurrentPlan(plan);
        }
      })
      .catch((err) => console.error('Error fetching subscription:', err))
      .finally(() => {
        hasLoadedSubscription = true;
        setIsFetchingPlan(false);
      });
  }, []);

  useEffect(() => {
    if (!hasLoadedSubscription) {
      fetchSubscription();
    }
  }, [fetchSubscription]);

  const handleCheckout = async (plan: string) => {
    setIsLoadingPlan(plan);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/auth');
      setIsLoadingPlan(null);
      return;
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan, 
          planId: plan, 
          appId: 'xentra_people', 
          interval: billingInterval 
        }),
      });
      const data = await res.json();
      
      if (data.error === 'COMPANY_REQUIRED' || data.error === 'ORGANIZATION_REQUIRED') {
        setSelectedPlanForCompany(plan);
        setIsCompanyModalOpen(true);
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        alert('Failed to start checkout. ' + (data.error || ''));
      }
    } catch (err) {
      console.error('Error starting checkout:', err);
    } finally {
      setIsLoadingPlan(null);
    }
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !selectedPlanForCompany) return;

    setIsLoadingPlan(selectedPlanForCompany);
    setIsCompanyModalOpen(false);

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: selectedPlanForCompany, 
          planId: selectedPlanForCompany,
          appId: 'xentra_people',
          companyName: companyName.trim(),
          organizationName: companyName.trim(),
          interval: billingInterval 
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        alert('Failed to start checkout. ' + (data.error || ''));
      }
    } catch (err) {
      console.error('Error starting checkout with company:', err);
    } finally {
      setIsLoadingPlan(null);
    }
  };

  const starterPrice = billingInterval === 'annual' ? pricingData.starter.annual : pricingData.starter.monthly;

  return (
    <main className="min-h-screen bg-[#fafafa] font-text flex flex-col relative overflow-hidden">
      <Navbar />

      <Suspense fallback={null}>
        <PremiumSuccessModal onSyncSuccess={fetchSubscription} />
      </Suspense>

      {/* Company Name Modal */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsCompanyModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Create your Company</h3>
            <p className="text-sm text-gray-500 mb-6">Enter your company name to attach this subscription to.</p>
            
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#2b7fff] focus:border-[#2b7fff] transition-all outline-none"
                />
              </div>
              <button 
                type="submit"
                disabled={!companyName.trim()}
                className="w-full py-3 px-4 rounded-xl bg-[#2b7fff] hover:bg-[#1a6eff] text-white font-semibold transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                Continue to Checkout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section with Full-Fit Background Image */}
      <section className="relative w-full pt-28 md:pt-36 pb-16 px-6 md:px-10 overflow-hidden isolate">
        
        {/* Full-Fit Background Image Container */}
        <div className="absolute inset-0 w-full h-[900px] md:h-[1020px] z-0 overflow-hidden pointer-events-none">
          <Image
            src="/img_assets/Subscription_page.avif"
            alt="Subscription Background"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#032338]/35 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/80 mb-4">
              <HugeiconsIcon icon={CrownIcon} className="w-3.5 h-3.5 text-blue-600" />
              2026 Launch Pricing • Founding Customer Offer
            </div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.1] mb-4"
            >
              Affordable plans for every stage
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[16px] md:text-[18px] text-[#1d1d1f]/80 leading-relaxed font-normal mb-6"
            >
              Connect your people with workforce operations. Special launch pricing applies for the first 12 months.
            </motion.p>

            {/* BILLING INTERVAL TOGGLE (Monthly vs Annual) */}
            <div className="inline-flex items-center justify-center p-1.5 rounded-2xl bg-white/90 backdrop-blur-xl border border-gray-200 shadow-md">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  billingInterval === 'monthly'
                    ? 'bg-[#18181b] text-white shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                Monthly Billing
              </button>

              <button
                type="button"
                onClick={() => setBillingInterval('annual')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  billingInterval === 'annual'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <span>Annual Billing</span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                  billingInterval === 'annual'
                    ? 'bg-white text-blue-600'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Save ~16%
                </span>
              </button>
            </div>

            <p className="text-xs text-[#86868b] font-medium mt-4">
              All prices presented in Singapore Dollars (SGD) • GST added where applicable
            </p>
          </div>

          {/* 2 Unified Apple-Style Frosted Glass Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-20 md:mb-24 items-stretch max-w-5xl mx-auto">
            {isFetchingPlan ? (
              <>
                {[1, 2].map((i) => (
                  <div 
                    key={i}
                    className="bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[32px] p-8 lg:p-9 flex flex-col justify-between shadow-[0_16px_45px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)]"
                  >
                    <div className="animate-pulse">
                      <div className="w-24 h-7 bg-gray-200/80 rounded-md mb-8"></div>
                      <div className="w-32 h-5 bg-gray-200/80 rounded-md mb-4"></div>
                      <div className="w-40 h-12 bg-gray-200/80 rounded-md mb-8"></div>
                      <div className="w-full h-10 bg-gray-200/80 rounded-md mb-8"></div>
                      <div className="w-20 h-4 bg-gray-200/80 rounded-md mb-5"></div>
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                          <div key={item} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-md bg-gray-200/80 shrink-0"></div>
                            <div className="h-4 bg-gray-200/80 rounded-md w-full"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="w-full mt-10 h-[52px] rounded-full bg-gray-200/80 animate-pulse"></div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* CARD 1: Starter Plan */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white/65 backdrop-blur-3xl border border-white/80 rounded-[32px] p-8 lg:p-9 flex flex-col justify-between shadow-[0_16px_45px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] hover:bg-white/75 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] transition-all duration-300 relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Image 
                        src="/apps-logo/xentra-blue-full-logo.svg" 
                        alt="Xentra Logo" 
                        width={120} 
                        height={32} 
                        className="h-7 w-auto object-contain"
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Launch Offer
                      </span>
                    </div>

                    <h3 className="text-[18px] font-semibold text-[#1d1d1f] mb-1.5">
                      Xentra Plus
                    </h3>

                    {billingInterval === 'annual' ? (
                      <div>
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-[42px] lg:text-[48px] font-bold text-[#1d1d1f] tracking-tight leading-none">
                            {pricingData.starter.annual.formatted}
                          </span>
                          <span className="text-[14px] font-medium text-[#86868b]">
                            /year
                          </span>
                        </div>
                        <div className="text-xs text-blue-600 font-semibold mb-1">
                          {pricingData.starter.annual.effectiveMonthlyFormatted || 'Effective S$83.25 / month'}
                        </div>
                        <div className="text-xs text-[#86868b] mb-4 flex items-center gap-1.5">
                          <span>Standard: <s className="text-[#86868b]">{pricingData.starter.annual.standardFormatted || 'S$1,299/yr'}</s></span>
                          <span className="text-emerald-600 font-semibold">• {pricingData.starter.annual.savingsFormatted || 'Save S$300/yr'}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1.5 mb-1">
                          <span className="text-[44px] lg:text-[52px] font-bold text-[#1d1d1f] tracking-tight leading-none">
                            {pricingData.starter.monthly.formatted}
                          </span>
                          <span className="text-[15px] font-medium text-[#86868b]">
                            /month
                          </span>
                        </div>
                        <div className="text-xs text-[#86868b] mb-4 flex items-center gap-1.5">
                          <span>Standard: <s className="text-[#86868b]">{pricingData.starter.monthly.standardFormatted || 'S$129/mo'}</s></span>
                          <span className="text-emerald-600 font-semibold">• {pricingData.starter.monthly.savingsFormatted || 'Save S$30/mo'}</span>
                        </div>
                      </div>
                    )}

                    <p className="text-[13.5px] text-[#48484a] leading-relaxed mb-6 font-normal">
                      A complete HRMS for startups and small SMEs.
                    </p>

                    <div className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-wider mb-3.5">
                      Included Capabilities:
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={UserMultiple02Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>Up to 30 Employees</strong> capacity</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Building02Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>Single Company Tenant</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Database01Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>10 GB Cloud Storage</strong> & Document Vault</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Clock01Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span>GPS Check-In/Out & Late Attendance Tracking</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Wallet02Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span>Monthly Payroll, CPF, SDL & FWL Calculation</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Folder02Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span>Leave Types, Approvals & Calendar Management</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={SecurityCheckIcon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span>Work-Pass Tracking & Document Expiry Alerts</span>
                      </li>
                    </ul>
                  </div>

                    <Link 
                      href="/dashboard/marketplace/xentra-people"
                      className="w-full mt-8 py-3.5 px-6 rounded-full text-white font-semibold text-[15px] transition-all shadow-[0_4px_16px_rgba(43,127,255,0.25)] hover:shadow-[0_6px_22px_rgba(43,127,255,0.35)] active:scale-[0.99] bg-[#2b7fff] hover:bg-[#1a6eff] text-center block"
                    >
                      View in Marketplace
                    </Link>
                </motion.div>

                {/* CARD 2: Enterprise Plan */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white/65 backdrop-blur-3xl border border-white/80 rounded-[32px] p-8 lg:p-9 flex flex-col justify-between shadow-[0_16px_45px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] hover:bg-white/75 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Image 
                        src="/apps-logo/xentra-blue-full-logo.svg" 
                        alt="Xentra Logo" 
                        width={120} 
                        height={32} 
                        className="h-7 w-auto object-contain"
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Enterprise
                      </span>
                    </div>

                    <h3 className="text-[18px] font-semibold text-[#1d1d1f] mb-1.5">
                      Enterprise Plan
                    </h3>

                    <div className="flex items-baseline gap-1.5 mb-1 h-[44px] lg:h-[52px] items-center">
                      <span className="text-[36px] lg:text-[44px] font-bold text-[#1d1d1f] tracking-tight leading-none">
                        Custom
                      </span>
                    </div>

                    <div className="text-xs text-[#86868b] mb-4">
                      {billingInterval === 'annual' ? 'Custom annual commercial terms & SLAs' : 'Tailored commercial arrangements & SLAs'}
                    </div>

                    <p className="text-[13.5px] text-[#48484a] leading-relaxed mb-6 font-normal">
                      Advanced capabilities for multi-company operations and complex requirements.
                    </p>

                    <div className="text-[13px] font-semibold text-[#1d1d1f] uppercase tracking-wider mb-3.5">
                      Included Capabilities:
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={UserMultiple02Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>Custom Employee Capacity</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Building02Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>Multi-Company Architecture</strong></span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={HierarchySquare02Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>Equity Management</strong> (Cap Table & Investors)</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={AiCloud01Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span><strong>AI Assistant & OCR Onboarding</strong> Included</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={SourceCodeIcon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span>API Access, Webhooks & Custom Integrations</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={CustomerService01Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span>Dedicated Support Manager & 24/7 SLA</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Diamond01Icon} className="w-[18px] h-[18px] text-blue-600 mt-0.5 shrink-0" />
                        <span>White Label Portal Branding Available</span>
                      </li>
                    </ul>
                  </div>

                  {currentPlan === 'enterprise' ? (
                    <button 
                      disabled
                      className="w-full mt-8 py-3.5 px-6 rounded-full bg-gray-400 text-white font-semibold text-[15px] transition-all cursor-not-allowed opacity-80"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <a 
                      href="mailto:contact@dortasia.com?subject=Enterprise%20Plan%20Inquiry"
                      className="w-full mt-8 py-3.5 px-6 rounded-full bg-[#18181b] hover:bg-[#27272a] text-white font-semibold text-[15px] transition-all shadow-[0_4px_16px_rgba(24,24,27,0.15)] hover:shadow-[0_6px_22px_rgba(24,24,27,0.25)] active:scale-[0.99] flex items-center justify-center text-center cursor-pointer"
                    >
                      Contact Sales
                    </a>
                  )}
                </motion.div>
              </>
            )}
          </div>

          {/* MAIN PLAN FEATURE COMPARISON TABLE */}
          <div className="mb-20">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 mb-3">
                <HugeiconsIcon icon={CrownIcon} className="w-3.5 h-3.5 text-blue-600" />
                Comprehensive Plan Matrix
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-2.5">
                Compare plan capabilities & limits
              </h2>
              <p className="text-sm sm:text-base text-[#6e6e73]">
                Review side-by-side feature breakdowns, storage tiers, and workforce management entitlements.
              </p>
            </div>

            <div className="w-full overflow-hidden rounded-[28px] border border-gray-200/90 shadow-[0_12px_45px_rgba(0,0,0,0.03)] bg-white/90 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[760px]">
                  {/* Dark Table Header */}
                  <thead>
                    <tr className="bg-[#18181b] text-white">
                      <th className="py-5 px-6 text-left font-semibold text-[15px] w-1/3">
                        Plan Features
                      </th>
                      <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/3">
                        Xentra Plus
                      </th>
                      
                      <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/3">
                        Enterprise Plan
                      </th>
                    </tr>
                  </thead>

                  {/* Price Row */}
                  <tbody>
                    <tr className="bg-white/95 border-b border-gray-200">
                      <td className="py-4.5 px-6 text-[15px] font-semibold text-[#1d1d1f]">
                        {billingInterval === 'annual' ? 'Price / year (Launch Offer)' : 'Price / month (Launch Offer)'}
                      </td>
                      <td className="py-4.5 px-6 text-center border-l border-gray-100">
                        {billingInterval === 'annual' ? (
                          <div>
                            <span className="text-[17px] font-bold text-[#1d1d1f]">
                              {pricingData.starter.annual.formatted} / yr
                            </span>
                            <span className="text-xs text-blue-600 font-semibold block">
                              {pricingData.starter.annual.effectiveMonthlyFormatted || 'Effective S$83.25 / mo'}
                            </span>
                            <span className="text-[11px] text-gray-400 block">
                              Standard {pricingData.starter.annual.standardFormatted || 'S$1,299/yr'}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[17px] font-bold text-[#1d1d1f]">
                              {pricingData.starter.monthly.formatted} / mo
                            </span>
                            <span className="text-xs text-gray-500 block">
                              Standard {pricingData.starter.monthly.standardFormatted || 'S$129/mo'}
                            </span>
                          </div>
                        )}
                      </td>
                      
                      <td className="py-4.5 px-6 text-center text-[15px] font-bold text-[#1d1d1f] border-l border-gray-100">
                        Custom Sales
                      </td>
                    </tr>
                  </tbody>

                  {/* Categorized Rows from Specification */}
                  {CATEGORIZED_FEATURES.map((catGroup) => (
                    <tbody key={catGroup.category} className="divide-y divide-gray-100">
                      {/* Category Header Row */}
                      <tr className="bg-gray-50/90 border-t border-b border-gray-200/80 text-[#1d1d1f]">
                        <td colSpan={3} className="py-3 px-6 text-[13px] font-bold tracking-wider uppercase">
                          <span>{catGroup.category}</span>
                        </td>
                      </tr>

                      {/* Category Features */}
                      {catGroup.features.map((feature) => (
                        <tr 
                          key={feature.name}
                          className="hover:bg-gray-50/60 transition-colors bg-white/70"
                        >
                          {/* Feature Name */}
                          <td className="py-3.5 px-6 text-[14px] font-medium text-[#1d1d1f]">
                            <div className="flex items-center justify-between pr-4">
                              <span>{feature.name}</span>
                              {feature.badge && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                  {feature.badge}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Starter Value */}
                          <td className="py-3.5 px-6 text-center text-[13.5px] text-[#1d1d1f] font-medium border-l border-gray-100">
                            {typeof feature.starter === "boolean" ? (
                              feature.starter ? (
                                <div className="w-5 h-5 rounded-full bg-[#18181b] mx-auto flex items-center justify-center text-white shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <span className="text-gray-300 font-normal">—</span>
                              )
                            ) : (
                              <span>{feature.starter}</span>
                            )}
                          </td>

                          {/* Enterprise Value */}
                          <td className="py-3.5 px-6 text-center text-[13.5px] text-[#1d1d1f] font-medium border-l border-gray-100">
                            {typeof feature.enterprise === "boolean" ? (
                              feature.enterprise ? (
                                <div className="w-5 h-5 rounded-full bg-[#18181b] mx-auto flex items-center justify-center text-white shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              ) : (
                                <span className="text-gray-300 font-normal">—</span>
                              )
                            ) : (
                              <span>{feature.enterprise}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            </div>
          </div>

          {/* DEDICATED MODULAR ADD-ON PACKS PRICING TABLE (STANDARD RATES, NO OFFER DISCOUNT) */}
          <div className="mb-14">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-3">
                <HugeiconsIcon icon={Building02Icon} className="w-3.5 h-3.5 text-blue-600" />
                Modular Add-On Packs
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-2.5">
                Scale capacity with stackable add-ons
              </h2>
              <p className="text-sm sm:text-base text-[#6e6e73]">
                Expand your workforce and document storage capacity. Fixed standard monthly and annual rates.
              </p>
            </div>

            <div className="w-full overflow-hidden rounded-[28px] border border-gray-200/90 shadow-[0_12px_45px_rgba(0,0,0,0.03)] bg-white/95 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[760px]">
                  <thead>
                    <tr className="bg-[#18181b] text-white">
                      <th className="py-5 px-6 text-left font-semibold text-[15px] w-1/3">
                        Add-On Capacity Pack
                      </th>
                      <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/3">
                        Monthly Price
                      </th>
                      <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/3">
                        Annual Price
                      </th>
                      <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/3">
                        Availability & Rules
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100 bg-white/80">
                    {MODULAR_ADDONS_PRICING.map((addon) => (
                      <tr 
                        key={addon.name}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        {/* Pack Name */}
                        <td className="py-4 px-6 text-[14.5px] font-semibold text-[#1d1d1f]">
                          <div className="flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                            <span>{addon.name}</span>
                          </div>
                        </td>

                        {/* Monthly Rate */}
                        <td className="py-4 px-6 text-center text-[14px] font-bold text-[#1d1d1f] border-l border-gray-100">
                          {addon.monthly}
                        </td>

                        {/* Yearly Rate (Standard) */}
                        <td className="py-4 px-6 text-center text-[14px] font-medium text-slate-700 border-l border-gray-100">
                          {addon.yearly}
                        </td>

                        {/* Availability */}
                        <td className="py-4 px-6 text-center text-xs font-medium text-[#6e6e73] border-l border-gray-100">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200/80">
                            {addon.availability}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add-on rules & stacking callout box */}
            <div className="mt-6 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#52525b]">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">
                    Add-On Stacking & Permanent Fixed Pricing:
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    • <strong>100% Stackable:</strong> Add as many capacity packs as your business requires.<br />
                    • <strong>Fixed Rates:</strong> Add-on capacity prices are fixed standard rates.
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0 bg-slate-100 px-3 py-1.5 rounded-lg">
                Permanent Fixed Rates
              </span>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
