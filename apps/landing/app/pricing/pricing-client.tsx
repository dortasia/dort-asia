"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users, HardDrive, GitBranch, UserCog, MapPin, CalendarOff,
  Receipt, Shield, Banknote, Smartphone, ClipboardCheck, LayoutDashboard,
  FolderKanban, Handshake, Truck, PieChart, Landmark, BarChart2,
  BellRing, TrendingUp, Building2, LineChart, Bot, ScanLine,
  Code2, GraduationCap, Headphones, ChevronDown, ChevronUp
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  text: string;
  bold: boolean;
  blue?: boolean;
  icon?: LucideIcon;
  nestedFeatures?: Feature[];
};

const START_FEATURES: Feature[] = [
  { text: "Up to 30 Employees",               bold: true,  icon: Users },
  { text: "10 GB Storage",                     bold: true,  icon: HardDrive },
  { text: "2 Branches",                        bold: true,  icon: GitBranch },
  { text: "Core HR & Employee Management",     bold: false, icon: UserCog },
  { text: "Attendance with GPS Clock In/Out",  bold: false, icon: MapPin },
  { text: "Leave Management",                  bold: false, icon: CalendarOff },
  { text: "Claims Management",                 bold: false, icon: Receipt },
  { text: "Advanced RBAC & Custom Workflows",  bold: false, icon: Shield },
  { text: "Payroll with CPF & SDL",            bold: false, icon: Banknote },
  { text: "Employee Self Service (Mobile App)",bold: false, icon: Smartphone },
  { text: "Manager Approval Workflows",        bold: false, icon: ClipboardCheck },
  { text: "Dashboard & Basic Reports",         bold: false, icon: LayoutDashboard },
];

const BUSINESS_FEATURES: Feature[] = [
  { text: "Up to 70 Employees",                          bold: true,  icon: Users },
  { text: "20 GB Storage",                               bold: true,  icon: HardDrive },
  { text: "5 Branch",                                    bold: true,  icon: GitBranch },
  { text: "Everything in Starter",                       bold: false, blue: true, nestedFeatures: START_FEATURES },
  { text: "Project Management",                          bold: false, icon: FolderKanban },
  { text: "Client Management",                           bold: false, icon: Handshake },
  { text: "Vendor Management",                           bold: false, icon: Truck },
  { text: "Project Finance & Cost Allocation",           bold: false, icon: PieChart },
  { text: "Finance Module (Ledger, Cash, Bank)",         bold: false, icon: Landmark },
  { text: "Advanced Analytics & Reports",                bold: false, icon: BarChart2 },
  { text: "Smart Alerts (Work Pass, Contract, Budget)",  bold: false, icon: BellRing },
  { text: "Revenue & Profitability Tracking",            bold: false, icon: TrendingUp },
];

const ENTERPRISE_FEATURES: Feature[] = [
  { text: "Customizable Employees Counts",               bold: true,  icon: Users },
  { text: "Customizable Storage Size",                   bold: true,  icon: HardDrive },
  { text: "Customizable Branch Count",                   bold: true,  icon: GitBranch },
  { text: "Everything in Starter",                       bold: false, blue: true, nestedFeatures: START_FEATURES },
  { text: "Everything in Business",                      bold: false, blue: true, nestedFeatures: BUSINESS_FEATURES },
  { text: "Multi-Company Operations",                    bold: false, icon: Building2 },
  { text: "Equity Management (Cap Table, Investors)",    bold: false, icon: LineChart },
  { text: "AI Assistant & Automation",                   bold: false, icon: Bot },
  { text: "OCR Employee Onboarding",                     bold: false, icon: ScanLine },
  { text: "API Access & Custom Integrations",            bold: false, icon: Code2 },
  { text: "Dedicated Support & Training",                bold: false, icon: GraduationCap },
  { text: "Priority Support & Consulting",               bold: false, icon: Headphones },
];

/* ── Price Reveal Animation ── */
function PriceReveal({
  actualPrice,
  offerPrice,
  period,
  offLabel,
  delay = 0,
}: {
  actualPrice: string;
  offerPrice: string;
  period: string;
  offLabel: string;
  delay?: number;
}) {
  const [phase, setPhase] = useState<"actual" | "switching" | "offer">("actual");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("switching"), delay);
    const t2 = setTimeout(() => setPhase("offer"), delay + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [delay]);

  return (
    <div className="mb-8 flex flex-col items-center relative">
      <div className="flex items-center justify-center gap-1.5 w-full relative" style={{ minHeight: 56 }}>
        <span className="text-[18px] font-semibold text-[#111827] mt-1">SGD</span>

        {/* Price number — flips from actual to offer */}
        <div className="relative" style={{ height: 56, overflow: "hidden", textAlign: "center" }}>
          {/* Invisible placeholder to force correct width */}
          <span className="text-[44px] font-bold leading-none tracking-tight opacity-0 pointer-events-none block px-1">
            {actualPrice.length > offerPrice.length ? actualPrice : offerPrice}
          </span>
          {/* Actual price (slides up and out) */}
          <motion.span
            className="text-[44px] font-bold text-[#6B7280] line-through leading-none tracking-tight absolute inset-0 flex items-center justify-center px-1"
            initial={{ y: 0, opacity: 1 }}
            animate={{
              y: phase === "actual" ? 0 : -56,
              opacity: phase === "actual" ? 1 : 0,
            }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            {actualPrice}
          </motion.span>
          {/* Offer price (slides up from below) */}
          <motion.span
            className="text-[44px] font-bold text-[#111827] leading-none tracking-tight absolute inset-0 flex items-center justify-center px-1"
            initial={{ y: 56, opacity: 0 }}
            animate={{
              y: phase === "offer" ? 0 : 56,
              opacity: phase === "offer" ? 1 : 0,
            }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            {offerPrice}
          </motion.span>
        </div>

        <span className="text-[18px] font-semibold text-[#111827] mt-1">{period}</span>

        {/* Off badge — pops in after switch */}
        <motion.span
          className="absolute -top-3 -right-2 px-2.5 py-1 bg-[#D1FAE5] text-[#059669] text-[10px] font-bold rounded-full overflow-hidden shadow-sm"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase === "offer" ? 1 : 0,
            opacity: phase === "offer" ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.1 }}
        >
          <span className="relative z-10">{offLabel}</span>
          {/* shimmer sweep */}
          <motion.span
            className="absolute top-0 left-0 w-[35%] h-full"
            style={{
              background: "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)",
            }}
            initial={{ x: "-150%", skewX: -15 }}
            animate={{ x: "250%", skewX: -15 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "linear", repeat: Infinity, repeatDelay: 2 }}
          />
        </motion.span>
      </div>

      {/* "Actual price" note — fades out when offer shows */}
      <motion.p
        className="text-[12px] text-[#D4AF37] font-medium mt-2"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "offer" ? 0.6 : 1 }}
        transition={{ duration: 0.4 }}
      >
        Actual Price SGD {actualPrice}, Limited Offer
      </motion.p>
      <motion.p
        className="text-[11px] text-[#6B7280] mt-0.5"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "offer" ? 0.6 : 1 }}
        transition={{ duration: 0.4 }}
      >
        excl of GST
      </motion.p>
    </div>
  );
}

export function PricingClient() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="bg-white min-h-screen text-slate-900 pt-32 pb-24 font-sans">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <h1 className="text-[28px] sm:text-[32px] font-bold text-[#111827] mb-3">
            Subscription Plans
          </h1>
          <p className="text-[14px] sm:text-[15px] text-[#6B7280] max-w-2xl mx-auto mb-10">
            Choose the perfect plan for your business. Start with a special first-year offer and scale as your team grows.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 bg-[#F9FAFB] border border-[#F3F4F6] rounded-full">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-8 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                billing === "monthly"
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-8 py-2.5 rounded-full text-[14px] font-medium transition-all ${
                billing === "annual"
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-[#4B5563] hover:text-[#111827]"
              }`}
            >
              Yearly
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } }
          }}
          className="grid lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto"
        >

          {/* ── Starter ── */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
            transition={{ duration: 0.5 }} 
            className="bg-white rounded-3xl p-8 border border-gray-200"
          >
            <h3 className="text-[22px] font-semibold text-[#111827] mb-1">Starter</h3>
            <p className="text-[13px] text-[#6B7280] mb-8">For startups &amp; small SMEs</p>

            <PriceReveal
              key={billing + "-starter"}
              actualPrice={billing === "monthly" ? "129" : "1,548"}
              offerPrice={billing === "monthly" ? "99" : "1,188"}
              period={billing === "monthly" ? "/ Month" : "/ Year"}
              offLabel="23% OFF"
              delay={800}
            />

            <Link
              href="/register"
              className="w-full block text-center py-3.5 bg-[#007AFF] text-white text-[15px] font-semibold rounded-[14px] hover:bg-[#0062CC] transition-colors mb-10"
            >
              Get Started
            </Link>

            <FeatureList features={START_FEATURES} />
          </motion.div>

          {/* ── Business ── */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
            transition={{ duration: 0.5 }} 
            className="bg-white rounded-3xl p-8 border border-gray-200 relative"
          >
            <div className="absolute -top-[14px] right-6 px-4 py-1.5 bg-[#FFEFE5] text-[#E0643A] text-[11px] font-medium rounded-full">
              Highly Recommended
            </div>

            <h3 className="text-[22px] font-semibold text-[#111827] mb-1">Business</h3>
            <p className="text-[13px] text-[#6B7280] mb-8">For growing teams &amp; service companies</p>

            <PriceReveal
              key={billing + "-business"}
              actualPrice={billing === "monthly" ? "249" : "2,988"}
              offerPrice={billing === "monthly" ? "199" : "2,388"}
              period={billing === "monthly" ? "/ Month" : "/ Year"}
              offLabel="20% OFF"
              delay={950}
            />

            <Link
              href="/register"
              className="w-full block text-center py-3.5 bg-[#007AFF] text-white text-[15px] font-semibold rounded-[14px] hover:bg-[#0062CC] transition-colors mb-10"
            >
              Get Started
            </Link>

            <FeatureList features={BUSINESS_FEATURES} />
          </motion.div>

          {/* ── Enterprise ── */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} 
            transition={{ duration: 0.5 }} 
            className="bg-white rounded-3xl p-8 border border-gray-200"
          >
            <h3 className="text-[22px] font-semibold text-[#111827] mb-1">Enterprise</h3>
            <p className="text-[13px] text-[#6B7280] mb-8">For large organizations &amp; Company Grps</p>

            <div className="mb-8 flex flex-col items-center justify-center h-[72px]">
              <span className="text-[24px] font-bold text-[#111827] tracking-tight mb-2">
                Customizable
              </span>
              <p className="text-[12px] text-[#6B7280]">Get quote for your business</p>
            </div>

            <Link
              href="/contact"
              className="w-full block text-center py-3.5 bg-[#007AFF] text-white text-[15px] font-semibold rounded-[14px] hover:bg-[#0062CC] transition-colors mb-10"
            >
              Contact Sales
            </Link>

            <FeatureList features={ENTERPRISE_FEATURES} />
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

/* ── Reusable feature list ── */
function FeatureList({ features }: { features: Feature[] }) {
  return (
    <ul className="space-y-[14px]">
      {features.map((feat, i) => {
        const Icon = feat.icon;

        // Blue divider row (e.g., "Everything in Starter +")
        if (feat.blue) {
          return <CollapsibleDivider key={i} feat={feat} />;
        }

        return (
          <li key={i} className="flex items-start gap-3">
            {Icon && (
              <span className={`shrink-0 mt-[1px] ${feat.bold ? "text-[#111827]" : "text-[#9CA3AF]"}`}>
                <Icon
                  size={16}
                  strokeWidth={feat.bold ? 2.2 : 1.8}
                />
              </span>
            )}
            <span
              className={`text-[13px] leading-snug ${
                feat.bold ? "font-semibold text-[#111827]" : "font-medium text-[#6B7280]"
              }`}
            >
              {feat.text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function getExtendedFeatures(features: Feature[]) {
  // Exclude the first 3 items (limits) and any divider/blue rows
  return features.slice(3).filter((feat) => !feat.blue);
}

function CollapsibleDivider({ feat }: { feat: Feature }) {
  const [isOpen, setIsOpen] = useState(false);
  const extendedFeatures = feat.nestedFeatures ? getExtendedFeatures(feat.nestedFeatures) : [];

  return (
    <li className="pt-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[13px] font-semibold text-[#007AFF] hover:text-[#0056B3] transition-colors focus:outline-none"
      >
        <span>{feat.text}</span>
        {isOpen ? (
          <ChevronUp size={14} className="stroke-[2.5]" />
        ) : (
          <ChevronDown size={14} className="stroke-[2.5]" />
        )}
      </button>

      {isOpen && extendedFeatures.length > 0 && (
        <div className="mt-3 pl-4 border-l border-gray-200 py-1 space-y-[14px]">
          <FeatureList features={extendedFeatures} />
        </div>
      )}
    </li>
  );
}
