"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MarketplaceApp } from "@/data/marketplace";
import { AppScreenshotGallery } from "./AppScreenshotGallery";
import { AppPlansSection } from "./AppPlansSection";
import { createClient } from "@/utils/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  SmartPhone01Icon, 
  Layers01Icon, 
  StarIcon, 
  Store01Icon, 
  CheckmarkCircle02Icon, 
  Shield01Icon, 
  Globe02Icon, 
  FlashIcon,
  ArrowLeft01Icon,
  SparklesIcon,
  Building01Icon,
  CheckmarkBadge01Icon
} from "@hugeicons/core-free-icons";
import { 
  Check, 
  Smartphone, 
  Download, 
  ExternalLink, 
  Users, 
  Clock, 
  CreditCard, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sparkles,
  Layers,
  CalendarCheck,
  FileCheck2,
  UserCheck,
  Loader2
} from "lucide-react";

interface AppDetailsViewProps {
  app: MarketplaceApp;
}

const SECTION_TABS = [
  { id: "overview", label: "Overview" },
  { id: "plans", label: "Plans" },
];

export function AppDetailsView({ app }: AppDetailsViewProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(searchParams.get("success") === "true");
  const supabase = createClient();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 12; // Poll for about 1 minute (5s * 12)

    async function checkSubscription() {
      try {
        const { data, error } = await supabase.schema('subscriptions').rpc('get_company_subscriptions');
        if (!error && Array.isArray(data)) {
          const isSubbed = data.some((sub: any) => sub.app_slug === app.slug && (sub.status === 'active' || sub.status === 'trialing'));
          setHasSubscription(isSubbed);
          
          if (isSubbed && isProvisioning) {
             setIsProvisioning(false);
          } else if (!isSubbed && isProvisioning && attempts < maxAttempts) {
             attempts++;
             timeoutId = setTimeout(checkSubscription, 5000);
          } else if (!isSubbed && isProvisioning && attempts >= maxAttempts) {
             setIsProvisioning(false); // Stop polling after a minute
          }
        }
      } catch (err) {
        console.error("Failed to check subscription status:", err);
      }
    }
    
    checkSubscription();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [app.slug, supabase, isProvisioning]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleSubscribe = async () => {
    if (!app.pricingPlans || app.pricingPlans.length === 0) {
      // Fallback if no plans are fetched from DB
      window.location.href = `/dashboard/subscriptions?app=${app.slug}`;
      return;
    }
    
    // Use the primary/first plan for the header subscribe button
    const plan = app.pricingPlans[0];
    
    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appSlug: app.slug,
          appId: app.id,
          planId: plan.id, // The UUID from marketplace.app_plans
          interval: plan.billingInterval === 'yearly' ? 'year' : 'month',
        }),
      });
      const session = await response.json();
      if (session.error) {
        throw new Error(session.error);
      }
      if (session.url) {
        window.location.href = session.url;
      } else {
        setIsCheckoutLoading(false);
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setIsCheckoutLoading(false);
    }
  };

  const handleViewPlanClick = () => {
    setActiveTab("plans");
    const element = document.getElementById("tab-nav-container");
    if (element) {
      const yOffset = -20;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const isAvailable = app.status === "available";

  return (
    <div className="w-full text-gray-900">
      {/* 1. TOP SECTION: Frosted Glassmorphic Banner ending seamlessly at the marked line */}
      <div className="relative w-full px-4 md:px-8 pt-4 pb-16 space-y-2.5">
        {/* Full-width Background Hero Banner */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <Image
            src={app.heroImage}
            alt={`${app.name} banner background`}
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Grayish Frosted Glass Overlay with subtle bottom fade and NO line */}
        <div 
          className="absolute inset-0 -z-10"
          style={{
            background: "linear-gradient(135deg, rgba(232, 236, 244, 0.94) 0%, rgba(218, 224, 234, 0.88) 100%)",
            backdropFilter: "blur(50px) saturate(180%)",
            WebkitBackdropFilter: "blur(50px) saturate(180%)",
          }}
        />

        {/* Breadcrumb Navigation inside the top section */}
        <div className="flex items-center gap-2 text-[12.5px] font-medium text-gray-500 pb-2">
          <Link 
            href="/dashboard/marketplace" 
            className="inline-flex items-center gap-1.5 hover:text-gray-900 transition-colors group cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Marketplace</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{app.name}</span>
        </div>

        {/* Inner Application Card - Overlapping smoothly lower */}
        <div className="relative mt-6 -mb-24 z-10 bg-white/95 backdrop-blur-2xl rounded-[20px] border border-white p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-5">
            {/* App Icon */}
            <div className={`relative w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-[20px] overflow-hidden shrink-0 border border-gray-200/80 shadow-md shadow-gray-900/5 flex items-center justify-center p-2.5 ${app.iconBackground || "bg-white"}`}>
              <Image
                src={app.icon}
                alt={`${app.name} logo`}
                fill
                className="object-contain p-1.5"
              />
            </div>

            {/* Title, Badge & Tagline (Description removed) */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                  {app.name}
                </h1>
                {app.badge && (
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white/90 border border-white/20 shadow-xs"
                    style={{
                      background: "linear-gradient(135deg, rgba(45, 48, 56, 0.85) 0%, rgba(22, 24, 28, 0.85) 100%)",
                    }}
                  >
                    {app.badge}
                  </span>
                )}
              </div>
              <p className="text-[14.5px] font-semibold text-gray-700">
                {app.tagline}
              </p>
            </div>
          </div>

          {/* Action Buttons: View Plan on left, Subscribe on right */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleViewPlanClick}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-[13.5px] font-medium rounded-full text-center border border-gray-200 shadow-xs transition-colors cursor-pointer"
            >
              View Plan
            </button>
            {isProvisioning ? (
              <button
                disabled
                className="px-7 py-2.5 bg-blue-50 text-[#0061FF] text-[13.5px] font-semibold rounded-full text-center flex items-center gap-2 cursor-not-allowed border border-blue-100"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Setting up workspace...</span>
              </button>
            ) : hasSubscription ? (
              <Link
                href={`/dashboard/${app.slug}`}
                className="px-7 py-2.5 bg-green-500 hover:bg-green-600 text-white text-[13.5px] font-semibold rounded-full text-center transition-all shadow-sm active:scale-98 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Launch Xentra
              </Link>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={!isAvailable || isCheckoutLoading}
                className="px-7 py-2.5 bg-[#0061FF] hover:bg-blue-700 disabled:opacity-70 text-white text-[13.5px] font-semibold rounded-full text-center transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                {isCheckoutLoading ? "Loading..." : isAvailable ? "Subscribe" : "Pre-Subscribe"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. BODY CONTENT SECTION */}
      <div className="w-full px-4 md:px-8 pt-20 pb-8 space-y-8">
        {/* Separated Metadata Strip: Left-aligned with Premium Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pb-6 border-b border-gray-200 text-left">
          <div className="flex flex-col items-start justify-start">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">PLATFORM</div>
            <div className="text-[14px] font-semibold text-gray-900 mt-1.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shadow-2xs shrink-0">
                <HugeiconsIcon icon={SmartPhone01Icon} className="w-4 h-4 text-[#0061FF]" />
              </div>
              <span>{app.platform}</span>
            </div>
          </div>

          <div className="flex flex-col items-start justify-start">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">CATEGORY</div>
            <div className="text-[14px] font-semibold text-gray-900 mt-1.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shadow-2xs shrink-0">
                <HugeiconsIcon icon={Layers01Icon} className="w-4 h-4 text-[#0061FF]" />
              </div>
              <span>{app.category}</span>
            </div>
          </div>

          <div className="flex flex-col items-start justify-start">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">RATING</div>
            <div className="text-[14px] font-semibold text-gray-900 mt-1.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shadow-2xs shrink-0">
                <HugeiconsIcon icon={StarIcon} className="w-4 h-4 text-[#0061FF]" />
              </div>
              <span>{app.rating.score} ★ <span className="text-gray-400 font-normal text-[12.5px]">({app.rating.count})</span></span>
            </div>
          </div>

          <div className="flex flex-col items-start justify-start">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">STATUS</div>
            <div className="text-[14px] font-semibold text-gray-900 mt-1.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50/90 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shadow-2xs shrink-0">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-[#0061FF]" />
              </div>
              <span className="capitalize">{app.status.replace("_", " ")}</span>
            </div>
          </div>
        </div>

        {/* Screenshots Gallery Section (Moved above sticky navigation) */}
        {app.screenshots && app.screenshots.length > 0 && (
          <div className="pt-2 pb-8 -mx-4 md:-mx-8">
            <AppScreenshotGallery 
              screenshots={app.screenshots} 
              appName={app.name} 
            />
          </div>
        )}

        {/* 3. MAIN CONTENT AREA */}
        <div className="space-y-6">
          {/* Sticky Section Navigation */}
          <div id="tab-nav-container" className="sticky top-0 z-30 -mx-4 px-4 md:mx-0 md:px-0 py-2">
            <nav className="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-none py-1">
              {SECTION_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 py-2 rounded-full text-[13.5px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-gray-900 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content Display Area */}
          <div className="min-h-[400px]">
            {/* 1. Overview Section */}
            {activeTab === "overview" && (
              <section id="overview" className="w-full max-w-6xl pt-2 pb-14 px-1 animate-fadeIn space-y-12 text-left">
                {app.slug === 'xentra-people' ? (
                  <>
                    {/* Header & Main Overview Narrative */}
                    <div className="space-y-5 text-left max-w-4xl">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Overview</h2>
                      
                      <div className="space-y-4 text-[15.5px] leading-relaxed text-gray-700">
                        <p className="text-lg md:text-[21px] font-semibold text-gray-900 leading-snug">
                          Xentra People is an all-in-one employee management and HR platform purpose-built to simplify, automate, and modernize how businesses manage their workforce.
                        </p>
                        <p>
                          Managing a growing team often leads to fragmented spreadsheets, disconnected attendance logs, and high-friction payroll runs. Xentra People solves this by unifying core workforce administration into a single, cohesive cloud platform. From onboarding new hires and maintaining centralized employee directories to tracking daily clock-ins and generating statutory-compliant payroll, your entire HR operation works seamlessly together.
                        </p>
                        <p>
                          Built specifically for modern enterprises, startups, and expanding regional teams, Xentra People combines enterprise-grade reliability with intuitive daily usability. The platform reduces administrative overhead by up to 70%, eliminating error-prone manual calculations while ensuring total compliance and data confidentiality.
                        </p>
                      </div>
                    </div>

                    {/* Deep-Dive Operational Pillars with Rich Paragraphs */}
                    <div className="space-y-8 text-left">
                      <div className="border-b border-gray-200/80 pb-4">
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Everything your team needs</h3>
                        <p className="text-[14.5px] text-gray-500 mt-1">
                          Comprehensive capabilities structured to streamline every phase of employee lifecycle management.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-7">
                        {/* Domain 1: Employee Lifecycle & Directory */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-7 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all flex flex-col justify-between text-left space-y-4">
                          <div className="space-y-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shadow-[0_2px_10px_-2px_rgba(0,97,255,0.12)] shrink-0">
                              <Users className="w-5 h-5 stroke-[2]" />
                            </div>
                            <h4 className="text-[18px] font-bold text-gray-900">Centralized Employee Management</h4>
                            <p className="text-[14.5px] text-gray-600 leading-relaxed">
                              Maintain a single, reliable source of truth for your entire workforce across all departments and locations. Xentra People enables HR teams to organize company departmental structures, reporting hierarchies, and job designations with precision.
                            </p>
                            <p className="text-[14px] text-gray-600 leading-relaxed">
                              Every employee has a comprehensive digital profile detailing contact information, emergency contacts, identification records, contract types, joining dates, and complete employment status history—eliminating scattered paper files and duplicate entries.
                            </p>
                          </div>
                          <ul className="space-y-2.5 text-[13.5px] text-gray-700 font-medium border-t border-gray-100 pt-4">
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Dynamic organizational directory and reporting line hierarchy</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Full-time, part-time, contract, and probationary status tracking</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Emergency contacts, identification data, and profile change history</span>
                            </li>
                          </ul>
                        </div>

                        {/* Domain 2: Attendance Tracking & Timesheet Automation */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-7 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all flex flex-col justify-between text-left space-y-4">
                          <div className="space-y-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shadow-[0_2px_10px_-2px_rgba(0,97,255,0.12)] shrink-0">
                              <Clock className="w-5 h-5 stroke-[2]" />
                            </div>
                            <h4 className="text-[18px] font-bold text-gray-900">Attendance & Timesheet Automation</h4>
                            <p className="text-[14.5px] text-gray-600 leading-relaxed">
                              Say goodbye to manual punch cards, attendance disputes, and messy time-tracking spreadsheets. Employees can log clock-ins and clock-outs seamlessly with verified timestamps, giving managers immediate visibility into shift attendance.
                            </p>
                            <p className="text-[14px] text-gray-600 leading-relaxed">
                              The system automatically aggregates daily working hours, distinguishes regular shifts from overtime (OT), and prepares weekly timesheet summaries. Supervisors can review, verify, and approve timesheets in seconds before passing finalized hours to payroll.
                            </p>
                          </div>
                          <ul className="space-y-2.5 text-[13.5px] text-gray-700 font-medium border-t border-gray-100 pt-4">
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Real-time clock-in and clock-out logging with timestamp verification</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Automated daily working duration and overtime (OT) calculations</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>One-click supervisor timesheet verification and approval workflows</span>
                            </li>
                          </ul>
                        </div>

                        {/* Domain 3: Payroll Operations & Statutory Compliance */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-7 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all flex flex-col justify-between text-left space-y-4">
                          <div className="space-y-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shadow-[0_2px_10px_-2px_rgba(0,97,255,0.12)] shrink-0">
                              <CreditCard className="w-5 h-5 stroke-[2]" />
                            </div>
                            <h4 className="text-[18px] font-bold text-gray-900">Compliant Payroll Processing</h4>
                            <p className="text-[14.5px] text-gray-600 leading-relaxed">
                              Execute recurring monthly payroll runs quickly and accurately. Xentra People features a flexible payroll calculation engine designed to handle base salaries, variable allowances, recurring deductions, and claims without complex formula setups.
                            </p>
                            <p className="text-[14px] text-gray-600 leading-relaxed">
                              Engineered with statutory compliance built in, the platform automatically calculates Singapore CPF contributions (employer and employee portions), Skill Development Levy (SDL), and community funds (CDAC, MBMF, SINDA, ECF), generating confidential digital payslips instantly.
                            </p>
                          </div>
                          <ul className="space-y-2.5 text-[13.5px] text-gray-700 font-medium border-t border-gray-100 pt-4">
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Singapore statutory contribution automation (CPF, SDL, Self-Help Groups)</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Customizable recurring allowances, unpaid leave deductions, and bonuses</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Itemized digital payslip generation with secure employee download access</span>
                            </li>
                          </ul>
                        </div>

                        {/* Domain 4: Digital Document Storage & Governance */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-7 shadow-2xs hover:border-gray-300 hover:shadow-xs transition-all flex flex-col justify-between text-left space-y-4">
                          <div className="space-y-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/80 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shadow-[0_2px_10px_-2px_rgba(0,97,255,0.12)] shrink-0">
                              <FileText className="w-5 h-5 stroke-[2]" />
                            </div>
                            <h4 className="text-[18px] font-bold text-gray-900">Document Management & Records</h4>
                            <p className="text-[14.5px] text-gray-600 leading-relaxed">
                              Safeguard sensitive personnel documents with enterprise-grade cloud security. Xentra People gives organizations a dedicated document vault for employment contracts, government IDs, academic credentials, and performance evaluations.
                            </p>
                            <p className="text-[14px] text-gray-600 leading-relaxed">
                              Granular role-based access controls ensure that only authorized HR personnel and managers can view sensitive records. Maintain full audit readiness with complete document history, file categorization, and automated expiry notifications.
                            </p>
                          </div>
                          <ul className="space-y-2.5 text-[13.5px] text-gray-700 font-medium border-t border-gray-100 pt-4">
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Encrypted storage for employee contracts, identification, and certificates</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Granular role-based permissions preventing unauthorized document access</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-blue-50/90 border border-blue-200/70 flex items-center justify-center text-[#0061FF] shrink-0 mt-0.5 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </span>
                              <span>Centralized compliance tracking, document categorization, and audit trail</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Built for modern teams - Narrative Section */}
                    <div className="bg-gradient-to-br from-gray-50/90 to-blue-50/20 rounded-2xl border border-gray-200/80 p-6 md:p-8 space-y-6 text-left">
                      <div className="space-y-3 max-w-4xl">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Built for modern teams</h3>
                        <p className="text-[15px] text-gray-600 leading-relaxed">
                          Xentra People is architected to eliminate the friction between employee management, timekeeping, and payroll processing. By bringing every essential HR function into one connected ecosystem, your leadership team gains real-time visibility while employees enjoy a transparent, modern workplace experience.
                        </p>
                        <p className="text-[14.5px] text-gray-600 leading-relaxed">
                          Whether your organization operates with an in-office, remote, or hybrid workforce, Xentra People provides the flexibility and structure needed to scale without adding administrative complexity.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="bg-white/90 rounded-xl border border-gray-200/70 p-4 space-y-2 shadow-2xs">
                          <div className="flex items-center gap-2.5 text-gray-900 font-bold text-[14px]">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shrink-0 shadow-2xs">
                              <Building2 className="w-3.5 h-3.5 stroke-[2]" />
                            </div>
                            <span>Singapore Ready</span>
                          </div>
                          <p className="text-[13px] text-gray-500 leading-snug">
                            Pre-configured calculation logic aligned with Singapore MOM and CPF standards.
                          </p>
                        </div>

                        <div className="bg-white/90 rounded-xl border border-gray-200/70 p-4 space-y-2 shadow-2xs">
                          <div className="flex items-center gap-2.5 text-gray-900 font-bold text-[14px]">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shrink-0 shadow-2xs">
                              <ShieldCheck className="w-3.5 h-3.5 stroke-[2]" />
                            </div>
                            <span>Enterprise Security</span>
                          </div>
                          <p className="text-[13px] text-gray-500 leading-snug">
                            Multi-tenant isolation, encrypted storage, and strict role-based permission control.
                          </p>
                        </div>

                        <div className="bg-white/90 rounded-xl border border-gray-200/70 p-4 space-y-2 shadow-2xs">
                          <div className="flex items-center gap-2.5 text-gray-900 font-bold text-[14px]">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0061FF] shrink-0 shadow-2xs">
                              <Layers className="w-3.5 h-3.5 stroke-[2]" />
                            </div>
                            <span>Connected Platform</span>
                          </div>
                          <p className="text-[13px] text-gray-500 leading-snug">
                            Native integration with Dort Asia accounts, subscriptions, and platform apps.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* How It Works Section */}
                    <div className="space-y-6 text-left">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">How it works</h3>
                        <p className="text-[14.5px] text-gray-500 mt-1">
                          Get your organization up and running in three simple steps.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2.5 shadow-2xs">
                          <div className="text-[12px] font-black text-[#0061FF] uppercase tracking-wider">Step 01</div>
                          <h4 className="text-[16px] font-bold text-gray-900">Setup Organization</h4>
                          <p className="text-[13.5px] text-gray-600 leading-relaxed">
                            Configure company departments, job titles, and reporting structures. Add your employees to the directory and issue secure access credentials.
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2.5 shadow-2xs">
                          <div className="text-[12px] font-black text-[#0061FF] uppercase tracking-wider">Step 02</div>
                          <h4 className="text-[16px] font-bold text-gray-900">Track Daily Operations</h4>
                          <p className="text-[13.5px] text-gray-600 leading-relaxed">
                            Staff log daily attendance and shift hours. The system automatically computes working times, tracks overtime, and prepares timesheets for review.
                          </p>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-2.5 shadow-2xs">
                          <div className="text-[12px] font-black text-[#0061FF] uppercase tracking-wider">Step 03</div>
                          <h4 className="text-[16px] font-bold text-gray-900">Run Payroll & Records</h4>
                          <p className="text-[13.5px] text-gray-600 leading-relaxed">
                            Execute automated monthly payroll runs with full statutory deductions. Generate itemized digital payslips and store compliance documents.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subtle Bottom CTA */}
                    <div className="pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                      <div>
                        <h4 className="text-base font-bold text-gray-900">Ready to get started?</h4>
                        <p className="text-sm text-gray-500 mt-0.5">Explore flexible subscription plans tailored for your team.</p>
                      </div>
                      <button
                        onClick={() => handleTabChange("plans")}
                        className="px-6 py-2.5 bg-[#0061FF] hover:bg-blue-700 text-white text-sm font-semibold rounded-full text-center transition-all shadow-xs active:scale-98 cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <span>View Plans</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-8 text-[15.5px] leading-relaxed text-gray-700">
                    <div className="space-y-5">
                      <p>{app.longDescription}</p>
                      {app.description && app.description !== app.longDescription && (
                        <p>{app.description}</p>
                      )}
                    </div>
                    {app.features && app.features.length > 0 && (
                      <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Core Features</h3>
                        <ul className="list-disc pl-5 space-y-3">
                          {app.features.map(feat => (
                            <li key={feat.id}>
                              <strong className="text-gray-900 font-semibold">{feat.title}: </strong>
                              <span>{feat.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}


            {/* 3. Plans & Pricing Section */}
            {activeTab === "plans" && (
              <section id="plans" className="max-w-7xl mx-auto pt-4 pb-12 px-1 animate-fadeIn">
                <AppPlansSection 
                  appName={app.name} 
                  appSlug={app.slug} 
                  plans={app.pricingPlans}
                  hasSubscription={hasSubscription}
                  onSubscribe={(plan) => {
                    // Similar to handleSubscribe but for a specific plan
                    setIsCheckoutLoading(true);
                    fetch('/api/stripe/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        appSlug: app.slug,
                        appId: app.id,
                        planId: plan.id,
                        interval: plan.billingInterval === 'yearly' ? 'year' : 'month',
                      }),
                    })
                    .then(res => res.json())
                    .then(session => {
                      if (session.error) throw new Error(session.error);
                      if (session.url) window.location.href = session.url;
                    })
                    .catch(err => {
                      console.error("Checkout failed:", err);
                      setIsCheckoutLoading(false);
                    });
                  }}
                  isCheckoutLoading={isCheckoutLoading}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
