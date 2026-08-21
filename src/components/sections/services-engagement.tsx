"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  LaptopProgrammingIcon,
  ArtificialIntelligence01Icon,
  CloudSavingDone02Icon,
} from "@hugeicons/core-free-icons";

const ENGAGEMENT_MODELS = [
  {
    number: "01",
    title: "Dedicated Engineering Squads",
    tagline: "Staff Augmentation & Dedicated Teams",
    icon: UserGroupIcon,
    badge: "Most Popular",
    badgeColor: "bg-blue-50 text-[#007AFF] border-blue-100",
    description:
      "Fully integrated, pre-vetted engineering squads embedded directly into your product sprints. Managed by senior technical leads with flexible scaling.",
    highlights: [
      "Full-stack engineers, QA, and tech leads",
      "Fast 48-hour onboarding & sprint alignment",
      "Direct communication in your Slack / Jira",
      "Flexible monthly squad scaling"
    ],
    ctaText: "Hire a Squad",
    href: "/work-with-us",
  },
  {
    number: "02",
    title: "End-to-End Product Delivery",
    tagline: "Fixed-Scope & Milestone Delivery",
    icon: LaptopProgrammingIcon,
    badge: "Turnkey",
    badgeColor: "bg-purple-50 text-purple-600 border-purple-100",
    description:
      "From discovery and interactive prototyping to production engineering and cloud deployment. We build your bespoke web apps, platforms, and SaaS products.",
    highlights: [
      "Comprehensive discovery & architecture blueprint",
      "Interactive Figma UX/UI prototypes",
      "Milestone-based delivery & SLA guarantees",
      "100% intellectual property ownership"
    ],
    ctaText: "Start a Build",
    href: "/work-with-us",
  },
  {
    number: "03",
    title: "System Modernization & Cloud",
    tagline: "Architecture Refactoring & Scale",
    icon: CloudSavingDone02Icon,
    badge: "Enterprise",
    badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
    description:
      "Refactor legacy monoliths into lightning-fast, cloud-native microservices with zero downtime, robust API integrations, and database migrations.",
    highlights: [
      "Monolith to microservices migration",
      "Next.js, Node & Supabase cloud pipelines",
      "Sub-100ms global Edge CDN optimization",
      "Bank-grade encryption & SOC2 adherence"
    ],
    ctaText: "Modernize Stack",
    href: "/work-with-us",
  },
  {
    number: "04",
    title: "AI & Workflow Automation",
    tagline: "Autonomous Agentic Systems",
    icon: ArtificialIntelligence01Icon,
    badge: "GenAI & Agents",
    badgeColor: "bg-amber-50 text-amber-600 border-amber-100",
    description:
      "Integrate enterprise generative AI, multi-agent tool callers, and automated background jobs directly into your core business operations.",
    highlights: [
      "Autonomous tool-calling LLM agents",
      "Vector database semantic search & RAG",
      "Automated document & data ingestion",
      "Model-agnostic routing (OpenAI, Gemini, Claude)"
    ],
    ctaText: "Deploy AI",
    href: "/work-with-us",
  },
];

export function ServicesEngagementSection() {
  return (
    <section className="relative w-full py-14 md:py-20 bg-[#fafafc] font-text border-t border-gray-100">
      <div className="w-[95%] max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[13px] md:text-[14px] font-semibold text-[#86868b] tracking-wider uppercase mb-3"
          >
            04 — Engagement Models
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
                Flexible partnerships.<br />
                <span className="text-[#86868b]">Built around your roadmap.</span>
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
                Whether you need dedicated talent to augment existing teams or end-to-end execution of a major technical milestone, we offer clear, transparent engagement structures.
              </p>
            </motion.div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {ENGAGEMENT_MODELS.map((model, idx) => {
            const IconComp = model.icon;
            return (
              <motion.div
                key={model.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-white rounded-[28px] md:rounded-[32px] p-7 md:p-9 border border-black/[0.05] shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] hover:border-[#007AFF]/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Number + Badge + Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[#1d1d1f]/40 font-mono">
                        {model.number}
                      </span>
                      <span className={`text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full border ${model.badgeColor}`}>
                        {model.badge}
                      </span>
                    </div>

                    <div className="w-11 h-11 rounded-[14px] bg-[#f5f5f7] border border-black/[0.04] p-2 flex items-center justify-center text-[#007AFF] group-hover:scale-105 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shadow-2xs">
                      <HugeiconsIcon icon={IconComp} className="w-5 h-5 text-[#007AFF] stroke-[1.9]" />
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div className="text-[12px] font-semibold text-[#007AFF] uppercase tracking-wider mb-1.5">
                    {model.tagline}
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-[#1d1d1f] tracking-tight mb-3">
                    {model.title}
                  </h3>

                  <p className="text-[14.5px] text-[#6e6e73] leading-relaxed mb-6 font-normal">
                    {model.description}
                  </p>

                  {/* Key Highlights Checklist */}
                  <div className="space-y-2.5 pt-5 border-t border-gray-100 mb-6">
                    {model.highlights.map((item) => (
                      <div key={item} className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0 mt-0.5 stroke-[2.2]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Trigger */}
                <div className="pt-4">
                  <Link
                    href={model.href}
                    className="w-full inline-flex items-center justify-between px-5 py-3 rounded-full bg-[#f5f5f7] hover:bg-[#1d1d1f] text-[#1d1d1f] hover:text-white font-semibold text-[14px] transition-all group/btn"
                  >
                    <span>{model.ctaText}</span>
                    <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center group-hover/btn:scale-105 transition-transform">
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
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
