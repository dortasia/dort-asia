"use client";

import Image from "next/image";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth/AuthModal";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Check } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserMultiple02Icon,
  Building02Icon,
  IdentityCardIcon,
  HierarchySquare02Icon,
  Wallet02Icon,
  File02Icon,
  Clock01Icon,
  CheckmarkBadge01Icon,
  Database01Icon,
  AiCloud01Icon,
  SecurityCheckIcon,
  CustomerService01Icon,
  SourceCodeIcon
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";

// Streamline Timesheet & Attendance Sync Icon
function StreamlineTimesheetIcon({ className = "w-[18px] h-[18px] text-[#1d1d1f] shrink-0" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M11.795 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
      <circle cx="17.5" cy="17.5" r="3.5" />
      <polyline points="17.5 16 17.5 17.5 18.5 18.5" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="3" y1="11" x2="21" y2="11" />
    </svg>
  );
}

interface FeatureRow {
  name: string;
  starter: string | boolean;
  professional: string | boolean;
  enterprise: string | boolean;
}

interface FeatureCategory {
  category: string;
  features: FeatureRow[];
}

function PremiumSuccessModal({ onSyncSuccess }: { onSyncSuccess: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');
  const [isOpen, setIsOpen] = useState(success === 'true');

  useEffect(() => {
    if (success === 'true' && sessionId) {
      // Manually trigger sync so that the database is updated even without webhooks
      fetch('/api/stripe/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      }).then(() => {
        onSyncSuccess(); // Tell parent to refetch
      }).catch(err => console.error('Error syncing:', err));
    }
  }, [success, sessionId, onSyncSuccess]);

  const handleClose = () => {
    setIsOpen(false);
    // Remove query params so it doesn't show again on refresh
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
          Welcome to Premium. Your subscription is now active and ready to use.
        </p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-full py-3.5 px-6 rounded-full bg-[#2b7fff] hover:bg-[#1a6eff] text-white font-medium text-[15px] transition-all shadow-[0_4px_16px_rgba(43,127,255,0.25)] hover:shadow-[0_6px_22px_rgba(43,127,255,0.35)] active:scale-[0.99]"
        >
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

const CATEGORIZED_FEATURES: FeatureCategory[] = [
  {
    category: "Employees",
    features: [
      { name: "Employee Limit", starter: "25", professional: "100", enterprise: "Unlimited" },
      { name: "Departments", starter: "Up to 5", professional: "Unlimited", enterprise: "Unlimited" },
      { name: "Employee Directory", starter: true, professional: true, enterprise: true },
      { name: "Employee Profiles", starter: true, professional: true, enterprise: true },
      { name: "Identity Management — NRIC / FIN / PR", starter: true, professional: true, enterprise: true },
      { name: "Passport & Document Storage", starter: true, professional: true, enterprise: true },
      { name: "Employee Export — CSV / Excel", starter: true, professional: true, enterprise: true },
    ],
  },
  {
    category: "Payroll",
    features: [
      { name: "Monthly Payroll", starter: true, professional: true, enterprise: true },
      { name: "CPF Calculation", starter: true, professional: true, enterprise: true },
      { name: "SINDA / CDAC / SDF", starter: true, professional: true, enterprise: true },
      { name: "Foreign Worker Levy", starter: true, professional: true, enterprise: true },
      { name: "Payslip Generation", starter: true, professional: true, enterprise: true },
      { name: "Payslip PDF Download", starter: true, professional: true, enterprise: true },
      { name: "Salary Advance", starter: false, professional: true, enterprise: true },
      { name: "Payroll History", starter: true, professional: true, enterprise: true },
      { name: "Custom Payslip Design", starter: "Basic", professional: "Advanced", enterprise: "Full" },
      { name: "Payroll Approval Flow", starter: "Single Level", professional: "Multi-Level", enterprise: "Custom" },
    ],
  },
  {
    category: "Attendance",
    features: [
      { name: "Check-In / Check-Out", starter: true, professional: true, enterprise: true },
      { name: "Attendance History", starter: true, professional: true, enterprise: true },
      { name: "Timesheets", starter: false, professional: true, enterprise: true },
      { name: "Timesheet & Attendance Integration", starter: false, professional: true, enterprise: true },
      { name: "Payroll Attendance Integration", starter: false, professional: true, enterprise: true },
      { name: "Active Site Passes", starter: false, professional: "15 Passes", enterprise: "25 Passes" },
    ],
  },
  {
    category: "Documents & Storage",
    features: [
      { name: "Cloud Storage", starter: "5 GB", professional: "50 GB", enterprise: "250 GB" },
      { name: "Employee Documents", starter: true, professional: true, enterprise: true },
      { name: "Custom Uploads", starter: false, professional: true, enterprise: true },
    ],
  },
  {
    category: "Cloud Integrations",
    features: [
      { name: "Cloud Integrations", starter: false, professional: false, enterprise: true },
      { name: "Backup Options on Cloud Integrations", starter: false, professional: false, enterprise: true },
    ],
  },
  {
    category: "Security & Administration",
    features: [
      { name: "Role-Based Permissions", starter: true, professional: true, enterprise: true },
      { name: "Reports-To Hierarchy", starter: true, professional: true, enterprise: true },
      { name: "Audit History", starter: true, professional: true, enterprise: true },
      { name: "Priority Support", starter: "Standard", professional: "Priority", enterprise: "Dedicated" },
      { name: "API / Integrations", starter: false, professional: false, enterprise: true },
    ],
  },
];

let cachedPlan: string | null = null;
let hasLoadedSubscription = false;

export default function PricingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(cachedPlan);
  const [isFetchingPlan, setIsFetchingPlan] = useState(!hasLoadedSubscription);
  
  // Company Modal State
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [selectedPlanForCompany, setSelectedPlanForCompany] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/user/subscription');
      if (res.ok) {
        const data = await res.json();
        const plan = data.plan || null;
        cachedPlan = plan;
        setCurrentPlan(plan);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      hasLoadedSubscription = true;
      setIsFetchingPlan(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedSubscription) {
      fetchSubscription();
    }
  }, []);

  const handleCheckout = async (plan: string) => {
    setIsLoadingPlan(plan);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setIsAuthModalOpen(true);
      setIsLoadingPlan(null);
      return;
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      
      if (data.error === 'COMPANY_REQUIRED') {
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

  const handleUpgrade = async () => {
    setIsLoadingPlan('upgrade');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Portal error:', data.error);
        alert('Failed to open upgrade portal. ' + (data.error || ''));
      }
    } catch (err) {
      console.error('Error opening portal:', err);
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
        body: JSON.stringify({ plan: selectedPlanForCompany, companyName: companyName.trim() }),
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

  return (
    <main className="min-h-screen bg-[#fafafa] font-text flex flex-col relative overflow-hidden">
      <Navbar />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
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
                className="w-full py-3 px-4 rounded-xl bg-[#2b7fff] hover:bg-[#1a6eff] text-white font-medium transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              >
                Continue to Checkout
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section with Full-Fit Background Image */}
      <section className="relative w-full pt-28 md:pt-36 pb-20 px-6 md:px-10 overflow-hidden isolate">
        
        {/* Full-Fit Background Image Container */}
        <div className="absolute inset-0 w-full h-[900px] md:h-[1020px] z-0 overflow-hidden pointer-events-none">
          <Image
            src="/img_assets/Subscription_page.avif"
            alt="Subscription Background"
            fill
            className="object-cover object-top"
            priority
          />
          {/* Subtle gradient overlay with gentle top/bottom blend and soft vignette matching about us page */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#032338]/35 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-14 md:mb-18">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-[56px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.1] mb-5"
            >
              Affordable plans for every budget
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[16px] md:text-[18px] text-[#1d1d1f]/80 leading-relaxed font-normal"
            >
              Explore our range of pricing options designed to fit any budget, offering exceptional value and flexibility to meet your unique needs
            </motion.p>
          </div>

          {/* 3 Unified Apple-Style Frosted Glass Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-24 md:mb-32 items-stretch">
            {isFetchingPlan ? (
              <>
                {[1, 2, 3].map((i) => (
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
                {/* CARD 1: Starter Plan (Apple Frosted Glass) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[32px] p-8 lg:p-9 flex flex-col justify-between shadow-[0_16px_45px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] hover:bg-white/70 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  <div>
                    <div className="mb-4">
                      <Image 
                        src="/apps-logo/xentra-blue-full-logo.svg" 
                        alt="Xentra Logo" 
                        width={120} 
                        height={32} 
                        className="h-7 w-auto object-contain"
                      />
                    </div>
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">
                      Starter Plan
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-3.5">
                      <span className="text-[44px] lg:text-[52px] font-semibold text-[#1d1d1f] tracking-tight leading-none">
                        S$99
                      </span>
                      <span className="text-[15px] font-medium text-[#86868b]">
                        /month
                      </span>
                    </div>
                    <p className="text-[14px] text-[#86868b] leading-relaxed mb-8">
                      Perfect for Small Teams, Startups, and Growing Businesses
                    </p>

                    <div className="text-[14px] font-semibold text-[#1d1d1f] mb-4">
                      Features:
                    </div>
                    <ul className="space-y-3.5">
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={UserMultiple02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Up to 30 Employees</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Building02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>1 Branch</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Wallet02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Monthly Payroll & CPF / Levy Calculation</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={File02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Payslip Generation & PDF Download</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Clock01Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Check-In / Out & Attendance History</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Database01Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>10 GB Cloud Storage & Employee Documents</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={SecurityCheckIcon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Role-Based Permissions & Standard Support</span>
                      </li>
                    </ul>
                  </div>

                  {(!currentPlan || currentPlan === 'starter') && (
                    <button 
                      onClick={() => handleCheckout('starter')}
                      disabled={isLoadingPlan === 'starter' || currentPlan === 'starter'}
                      className={`w-full mt-10 py-3.5 px-6 rounded-full text-white font-medium text-[15px] transition-all shadow-[0_4px_16px_rgba(43,127,255,0.25)] hover:shadow-[0_6px_22px_rgba(43,127,255,0.35)] active:scale-[0.99] disabled:opacity-50 ${currentPlan === 'starter' ? 'bg-[#73a7f4] cursor-not-allowed' : 'bg-[#2b7fff] hover:bg-[#1a6eff]'}`}
                    >
                      {isLoadingPlan === 'starter' ? 'Loading...' : currentPlan === 'starter' ? 'Current Plan' : 'Subscribe'}
                    </button>
                  )}
                </motion.div>

                {/* CARD 2: Business Plan (Apple Frosted Glass) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[32px] p-8 lg:p-9 flex flex-col justify-between shadow-[0_16px_45px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] hover:bg-white/70 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  <div>
                    <div className="mb-4">
                      <Image 
                        src="/apps-logo/xentra-blue-full-logo.svg" 
                        alt="Xentra Logo" 
                        width={120} 
                        height={32} 
                        className="h-7 w-auto object-contain"
                      />
                    </div>
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">
                      Business Plan
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-3.5">
                      <span className="text-[44px] lg:text-[52px] font-semibold text-[#1d1d1f] tracking-tight leading-none">
                        S$199
                      </span>
                      <span className="text-[15px] font-medium text-[#86868b]">
                        /month
                      </span>
                    </div>
                    <p className="text-[14px] text-[#86868b] leading-relaxed mb-8">
                      Perfect for Scaling Businesses, Fast Growing Teams, and Companies
                    </p>

                    <div className="text-[14px] font-semibold text-[#1d1d1f] mb-4">
                      Features:
                    </div>
                    <ul className="space-y-3.5">
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={UserMultiple02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Up to 60 Employees</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Building02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>1 Branch</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={IdentityCardIcon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>15 Active Site Passes & Attendance Integration</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <StreamlineTimesheetIcon className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Timesheets & Payroll Attendance Sync</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Multi-Level Payroll Approval & Salary Advance</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Database01Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>20 GB Cloud Storage & Custom Uploads</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={CustomerService01Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Priority Support & Advanced Payslip Design</span>
                      </li>
                    </ul>
                  </div>

                  {(!currentPlan || currentPlan === 'starter' || currentPlan === 'business') && (
                    <button 
                      onClick={() => currentPlan === 'starter' ? handleUpgrade() : handleCheckout('business')}
                      disabled={isLoadingPlan === 'business' || isLoadingPlan === 'upgrade' || currentPlan === 'business'}
                      className={`w-full mt-10 py-3.5 px-6 rounded-full text-white font-medium text-[15px] transition-all shadow-[0_4px_16px_rgba(43,127,255,0.25)] hover:shadow-[0_6px_22px_rgba(43,127,255,0.35)] active:scale-[0.99] disabled:opacity-50 ${currentPlan === 'business' ? 'bg-[#73a7f4] cursor-not-allowed' : 'bg-[#2b7fff] hover:bg-[#1a6eff]'}`}
                    >
                      {isLoadingPlan === 'business' || isLoadingPlan === 'upgrade' ? 'Loading...' : currentPlan === 'business' ? 'Current Plan' : currentPlan === 'starter' ? 'Upgrade' : 'Subscribe'}
                    </button>
                  )}
                </motion.div>

                {/* CARD 3: Enterprise Plan (Apple Frosted Glass) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[32px] p-8 lg:p-9 flex flex-col justify-between shadow-[0_16px_45px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)] hover:bg-white/70 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  <div>
                    <div className="mb-4">
                      <Image 
                        src="/apps-logo/xentra-blue-full-logo.svg" 
                        alt="Xentra Logo" 
                        width={120} 
                        height={32} 
                        className="h-7 w-auto object-contain"
                      />
                    </div>
                    <h3 className="text-[17px] font-semibold text-[#1d1d1f] mb-3">
                      Enterprise Plan
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-3.5 h-[44px] lg:h-[52px] items-center">
                      <span className="text-[36px] lg:text-[44px] font-semibold text-[#1d1d1f] tracking-tight leading-none">
                        Custom
                      </span>
                    </div>
                    <p className="text-[14px] text-[#86868b] leading-relaxed mb-8">
                      Tailored for Large Enterprises, Custom Scale & High Operations
                    </p>

                    <div className="text-[14px] font-semibold text-[#1d1d1f] mb-4">
                      Features:
                    </div>
                    <ul className="space-y-3.5">
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={UserMultiple02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Unlimited Employees</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Building02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Unlimited Departments</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={IdentityCardIcon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>25 Active Site Passes & Complete Attendance Sync</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={HierarchySquare02Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Full Custom Payslip Design & Approval Flows</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={Database01Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>250 GB Cloud Storage & Custom Uploads</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={AiCloud01Icon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>Cloud Integrations & Cloud Backup Options</span>
                      </li>
                      <li className="flex items-center gap-3 text-[14px] text-[#1d1d1f]">
                        <HugeiconsIcon icon={SourceCodeIcon} className="w-[18px] h-[18px] text-[#1d1d1f] shrink-0" />
                        <span>API / Dedicated Integrations & 24/7 SLA Support</span>
                      </li>
                    </ul>
                  </div>

                  {currentPlan === 'enterprise' ? (
                    <button 
                      disabled
                      className="w-full mt-10 py-3.5 px-6 rounded-full bg-gray-400 text-white font-medium text-[15px] transition-all cursor-not-allowed opacity-80"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <a 
                      href="mailto:contact@dortasia.com?subject=Enterprise%20Plan%20Inquiry"
                      className="w-full mt-10 py-3.5 px-6 rounded-full bg-[#18181b] hover:bg-[#27272a] text-white font-medium text-[15px] transition-all shadow-[0_4px_16px_rgba(24,24,27,0.15)] hover:shadow-[0_6px_22px_rgba(24,24,27,0.25)] active:scale-[0.99] flex items-center justify-center text-center cursor-pointer"
                    >
                      Contact Sales
                    </a>
                  )}
                </motion.div>
              </>
            )}
          </div>

          {/* Categorized Comparison Table Section (Apple Glass Container) */}
          <div className="w-full overflow-hidden rounded-[28px] border border-gray-200/90 shadow-[0_12px_45px_rgba(0,0,0,0.03)] bg-white/85 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[760px]">
                {/* Dark Table Header */}
                <thead>
                  <tr className="bg-[#18181b] text-white">
                    <th className="py-5 px-6 text-left font-semibold text-[15px] w-2/5">
                      Features Overview
                    </th>
                    <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/5">
                      Starter Plan
                    </th>
                    <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/5">
                      Business Plan
                    </th>
                    <th className="py-5 px-6 text-center font-semibold text-[15px] w-1/5">
                      Enterprise Plan
                    </th>
                  </tr>
                </thead>

                {/* Price Row */}
                <tbody>
                  <tr className="bg-white/95 border-b border-gray-200">
                    <td className="py-4.5 px-6 text-[15px] font-semibold text-[#1d1d1f]">
                      Price / month
                    </td>
                    <td className="py-4.5 px-6 text-center text-[16px] font-bold text-[#1d1d1f] border-l border-gray-100">
                      S$99
                    </td>
                    <td className="py-4.5 px-6 text-center text-[16px] font-bold text-[#1d1d1f] border-l border-gray-100">
                      S$199
                    </td>
                    <td className="py-4.5 px-6 text-center text-[15px] font-bold text-[#1d1d1f] border-l border-gray-100">
                      Contact Sales
                    </td>
                  </tr>
                </tbody>

                {/* Categorized Rows */}
                {CATEGORIZED_FEATURES.map((catGroup) => (
                  <tbody key={catGroup.category} className="divide-y divide-gray-100">
                    {/* Category Header Row */}
                    <tr className="bg-gray-50/90 border-t border-b border-gray-200/80">
                      <td colSpan={4} className="py-3 px-6 text-[13px] font-bold text-[#1d1d1f] tracking-wider uppercase">
                        {catGroup.category}
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
                          {feature.name}
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

                        {/* Professional Value */}
                        <td className="py-3.5 px-6 text-center text-[13.5px] text-[#1d1d1f] font-medium border-l border-gray-100">
                          {typeof feature.professional === "boolean" ? (
                            feature.professional ? (
                              <div className="w-5 h-5 rounded-full bg-[#18181b] mx-auto flex items-center justify-center text-white shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <span className="text-gray-300 font-normal">—</span>
                            )
                          ) : (
                            <span>{feature.professional}</span>
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
      </section>

      <Footer />
    </main>
  );
}
