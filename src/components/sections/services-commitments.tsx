"use client";

import { motion } from "framer-motion";
import { Lock, Zap, ShieldCheck, MessageSquareCode, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const COMMITMENTS = [
  {
    icon: Lock,
    title: "100% Intellectual Property Ownership",
    tagline: "No Vendor Lock-In",
    description:
      "All source code, database architectures, Figma designs, and cloud infrastructure belong entirely to you from day one. You have full commercial freedom with zero licensing traps.",
    points: [
      "Full repository access & documentation handover",
      "No proprietary platform lock-in",
      "Complete freedom to deploy anywhere"
    ],
  },
  {
    icon: Zap,
    title: "Type-Safe Modern Architecture",
    tagline: "Zero Technical Debt",
    description:
      "We build exclusively with modern, battle-tested technologies — Next.js 16, TypeScript, Supabase, Node, and Flutter. We enforce compile-time type safety across your entire stack.",
    points: [
      "Strict end-to-end TypeScript schemas",
      "Server Components with sub-100ms hydration",
      "Automated CI/CD with linting & test suites"
    ],
  },
  {
    icon: ShieldCheck,
    title: "SOC2 & Bank-Grade Security Mindset",
    tagline: "Data Privacy & Compliance",
    description:
      "Enterprise security isn’t an afterthought. We implement row-level security (RLS), role-based access control, cryptographic hashing, and automated audit logging out of the box.",
    points: [
      "Row-Level Security & JWT encryption",
      "Granular user permissions & audit logs",
      "Automated point-in-time database backups"
    ],
  },
  {
    icon: MessageSquareCode,
    title: "Direct Senior Engineering Access",
    tagline: "Zero Bureaucracy",
    description:
      "No non-technical account managers playing telephone. You communicate and collaborate directly with senior full-stack architects and tech leads in your dedicated Slack or Teams.",
    points: [
      "Direct engineer communication in Slack/Teams",
      "Bi-weekly sprint reviews & live demo builds",
      "Transparent Jira/Linear project telemetry"
    ],
  },
];

export function ServicesCommitmentsSection() {
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
            05 — Engineering Commitments
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
                Engineering guarantees.<br />
                <span className="text-[#86868b]">Built on trust and technical excellence.</span>
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
                When you partner with Dort Asia, you receive uncompromising engineering rigor, transparent project telemetry, and guaranteed intellectual property security.
              </p>
            </motion.div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {COMMITMENTS.map((comm, idx) => {
            const IconComp = comm.icon;
            return (
              <motion.div
                key={comm.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative bg-white rounded-[28px] md:rounded-[32px] p-7 md:p-9 border border-black/[0.05] shadow-[0_2px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_45px_rgba(0,0,0,0.06)] hover:border-[#007AFF]/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-[16px] bg-[#f5f5f7] border border-black/[0.04] p-2 flex items-center justify-center text-[#007AFF] group-hover:scale-105 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shadow-2xs">
                      <IconComp className="w-6 h-6 stroke-[2]" />
                    </div>

                    <span className="text-[11.5px] font-semibold text-[#007AFF] bg-blue-50/70 border border-blue-100/80 px-3 py-1 rounded-full">
                      {comm.tagline}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-semibold text-[#1d1d1f] tracking-tight mb-3">
                    {comm.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[14.5px] text-[#6e6e73] leading-relaxed mb-6 font-normal">
                    {comm.description}
                  </p>

                  {/* Points Checklist */}
                  <div className="space-y-2.5 pt-5 border-t border-gray-100 mb-2">
                    {comm.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-2.5 text-[13.5px] text-[#1d1d1f]">
                        <div className="w-4 h-4 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                        </div>
                        <span className="leading-snug">{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-5 border-t border-gray-100 flex items-center justify-between text-[13px] font-semibold text-[#1d1d1f]">
                  <span>Guaranteed SLA Standard</span>
                  <Link
                    href="/work-with-us"
                    className="inline-flex items-center gap-1 text-[#007AFF] hover:underline"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
