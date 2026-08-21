"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, Landmark, Store, Briefcase, Check, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroup02Icon,
  Wallet02Icon,
  Store02Icon,
  OfficeIcon,
  Factory01Icon,
  Hospital02Icon,
} from "@hugeicons/core-free-icons";

const INDUSTRIES = [
  {
    id: "workforce",
    title: "Workforce & Industrial Operations",
    subtitle: "Construction, Manufacturing & Field Services",
    icon: Factory01Icon,
    tag: "High Operations",
    description:
      "Automate heavy daily operational workflows, field attendance, dynamic shift rotas, and compliance across distributed sites and facilities.",
    solutions: [
      "GPS geofenced mobile clock-ins & biometric site passes",
      "Singapore CPF, Foreign Worker Levy & digital payslips",
      "Safety course expiry & permit tracking alerts",
      "Dynamic multi-shift rostering & overtime automation"
    ],
    metric: "100% Audit Readiness",
  },
  {
    id: "fintech",
    title: "Fintech & Financial Intelligence",
    subtitle: "Banking, Accounting & Payment Systems",
    icon: Wallet02Icon,
    tag: "High Security",
    description:
      "Bespoke financial ledgers, automated tax calculations, high-throughput invoice reconciliation, and bank-grade data security.",
    solutions: [
      "Real-time ledger sync & automated invoice generation",
      "Multi-currency conversion & payment gateway routing",
      "Bank-grade JWT encryption & PCI-DSS compliance",
      "Instant tax computation (GST/VAT) & audit logging"
    ],
    metric: "Sub-10ms Transaction Sync",
  },
  {
    id: "retail",
    title: "Retail & Multi-Outlet Chains",
    subtitle: "Hospitality, F&B & Chain Stores",
    icon: Store02Icon,
    tag: "Multi-Branch",
    description:
      "Streamline operations across dozens of physical outlets with unified staff scheduling, inventory sync, and real-time sales telemetry.",
    solutions: [
      "Multi-branch employee transfers & unified scheduling",
      "Real-time POS data aggregation & inventory threshold alerts",
      "Fast onboarding for high-turnover seasonal staff",
      "Automated tip pooling & shift differential pay calculations"
    ],
    metric: "Centralized Branch Telemetry",
  },
  {
    id: "enterprise",
    title: "Professional Services & SaaS Platforms",
    subtitle: "Consulting, Healthcare & Digital Agencies",
    icon: OfficeIcon,
    tag: "Scalable Logic",
    description:
      "Deliver frictionless client portals, role-based dashboards, secure document vaults, and AI-powered workflow automation.",
    solutions: [
      "White-labeled client portals with custom subdomains",
      "Encrypted document storage & digital signature workflows",
      "AI-driven automated reporting & document synthesis",
      "Custom SLA support tiers with 99.99% uptime guarantees"
    ],
    metric: "Enterprise SOC2 Mindset",
  },
];

export function ServicesIndustriesSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-[#fafafc] font-text border-t border-gray-100">
      <div className="w-[95%] max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[13px] md:text-[14px] font-semibold text-[#86868b] tracking-wider uppercase mb-3"
          >
            02 — Industry Solutions
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.12]">
                Architected for the realities<br />
                <span className="text-[#86868b]">of your specific industry.</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 lg:pt-1"
            >
              <p className="text-[16px] md:text-[17.5px] text-[#515154] leading-relaxed font-normal">
                Generic off-the-shelf software often fails unique operational nuances. We build specialized platforms that fit your exact business workflows like a glove.
              </p>
            </motion.div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {INDUSTRIES.map((ind, idx) => {
            const IconComp = ind.icon;
            return (
              <motion.div
                key={ind.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-white rounded-[28px] md:rounded-[32px] p-7 md:p-9 border border-black/[0.05] shadow-[0_2px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.06)] hover:border-[#007AFF]/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Icon + Tag + Metric */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-[16px] bg-[#f5f5f7] border border-black/[0.04] p-2 flex items-center justify-center text-[#007AFF] group-hover:scale-105 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shadow-2xs">
                      <HugeiconsIcon icon={IconComp} className="w-6 h-6 text-[#007AFF] stroke-[1.9]" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-semibold text-[#515154] bg-[#f5f5f7] px-3 py-1 rounded-full border border-black/[0.03]">
                        {ind.tag}
                      </span>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="text-[12px] font-semibold text-[#007AFF] uppercase tracking-wider mb-1">
                    {ind.subtitle}
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-[#1d1d1f] tracking-tight mb-3">
                    {ind.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[14.5px] text-[#6e6e73] leading-relaxed mb-6 font-normal">
                    {ind.description}
                  </p>

                  {/* Solutions List */}
                  <div className="space-y-2.5 pt-5 border-t border-gray-100 mb-6">
                    {ind.solutions.map((sol) => (
                      <div key={sol} className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <div className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="leading-snug">{sol}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Metric & Link */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#86868b] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>{ind.metric}</span>
                  </span>

                  <Link
                    href="/work-with-us"
                    className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#1d1d1f] group-hover:text-[#007AFF] transition-colors"
                  >
                    <span>Explore solution</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
