"use client";

import { motion } from "framer-motion";
import { Compass, LayoutTemplate, Code2, TrendingUp, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const PROCESS_STEPS = [
  {
    step: "01",
    phase: "Discovery & Blueprint",
    headline: "We dissect your workflows and architect the technical foundation.",
    description:
      "Before writing a line of code, our system architects map your database schemas, operational bottlenecks, third-party integrations, and user permission models.",
    icon: Compass,
    deliverables: ["Architecture blueprint", "Database schema spec", "Technical roadmap", "Integration matrix"],
  },
  {
    step: "02",
    phase: "Interactive UX/UI Prototyping",
    headline: "We turn complex logic into frictionless, intuitive interfaces.",
    description:
      "We design responsive, pixel-perfect user journeys and clickable Figma prototypes tailored for speed, zero learning curve, and high adoption across your teams.",
    icon: LayoutTemplate,
    deliverables: ["Clickable Figma prototype", "Design system tokens", "User journey flows", "Mobile & Web layouts"],
  },
  {
    step: "03",
    phase: "Agile Engineering & QA",
    headline: "We engineer with modern type-safe frameworks and continuous testing.",
    description:
      "Full-stack production development in bi-weekly sprint cycles. Every feature is thoroughly tested, type-checked, and deployed to live preview environments for feedback.",
    icon: Code2,
    deliverables: ["Type-safe Next.js & Supabase code", "Automated CI/CD pipelines", "Unit & E2E test suites", "Branch previews"],
  },
  {
    step: "04",
    phase: "Edge Deployment & SLA Scale",
    headline: "We launch to global edge infrastructure and actively scale your platform.",
    description:
      "Zero-downtime production deployment with real-time telemetry monitoring, automated database backups, security patches, and dedicated ongoing engineering support.",
    icon: TrendingUp,
    deliverables: ["Multi-region CDN deployment", "99.99% uptime monitoring", "Point-in-time recovery", "Dedicated SLA support"],
  },
];

export function ServicesProcessSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-white font-text border-t border-gray-100">
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
            03 — Delivery Lifecycle
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
                A disciplined process.<br />
                <span className="text-[#86868b]">Zero surprises, total transparency.</span>
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
                Our 4-stage engineering lifecycle guarantees predictable timelines, bank-grade quality, and seamless handover with 100% intellectual property ownership.
              </p>
            </motion.div>
          </div>
        </div>

        {/* 4 Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {PROCESS_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-[#f5f5f7] rounded-[28px] md:rounded-[32px] p-7 md:p-8 border border-black/[0.04] hover:border-[#007AFF]/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_40px_rgba(0,122,255,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Number + Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl md:text-4xl font-semibold text-[#1d1d1f]/40 font-mono">
                      {step.step}
                    </span>

                    <div className="w-11 h-11 rounded-[14px] bg-white border border-black/[0.04] flex items-center justify-center text-[#007AFF] group-hover:scale-105 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shadow-2xs">
                      <StepIcon className="w-5 h-5 text-[#007AFF] stroke-[2]" />
                    </div>
                  </div>

                  {/* Phase & Headline */}
                  <div className="text-[12px] font-semibold text-[#007AFF] uppercase tracking-wider mb-1.5">
                    {step.phase}
                  </div>
                  <h3 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight leading-snug mb-3">
                    {step.headline}
                  </h3>

                  {/* Description */}
                  <p className="text-[13.5px] text-[#6e6e73] leading-relaxed mb-6 font-normal">
                    {step.description}
                  </p>
                </div>

                {/* Deliverables Chip Stack */}
                <div className="pt-4 border-t border-black/[0.04]">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868b] mb-2.5">
                    Key Deliverables
                  </div>
                  <div className="space-y-1.5">
                    {step.deliverables.map((del) => (
                      <div key={del} className="flex items-center gap-2 text-[12px] text-[#1d1d1f] font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] shrink-0" />
                        <span>{del}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
