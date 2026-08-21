"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Code2, Users, Layers, ShieldCheck, Zap, Globe } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  PackageIcon,
  LaptopProgrammingIcon,
  CloudSavingDone02Icon,
  ArtificialIntelligence01Icon,
  Layers01Icon,
  Factory01Icon,
} from "@hugeicons/core-free-icons";
import { Compass } from "lucide-react";

const QUICK_CAPABILITIES = [
  { name: "Services Catalog", icon: Layers01Icon, href: "#catalog" },
  { name: "Industry Solutions", icon: Factory01Icon, href: "#industries" },
  { name: "Engagement Models", icon: CloudSavingDone02Icon, href: "#engagement" },
  { name: "Delivery Lifecycle", icon: Compass, isLucide: true, href: "#process" },
  { name: "Commitments & Guarantees", icon: ShieldCheck, isLucide: true, href: "#commitments" },
];

const METRICS_BAR = [
  { label: "Talent Deployment", value: "48h Fast Match", desc: "Top 1% vetted developers & leads" },
  { label: "Engineering Standard", value: "100% Type-Safe", desc: "Next.js, TypeScript & Supabase" },
  { label: "Delivery Guarantee", value: "Full IP Ownership", desc: "Transparent sprints & milestone SLA" },
  { label: "Ecosystem Breadth", value: "23+ Platforms", desc: "AI, cloud engines & microservices" },
];

export function ServicesHero() {
  return (
    <section className="relative w-full pt-28 pb-16 md:pt-36 md:pb-24 px-6 md:px-10 bg-[#fafafc] border-b border-gray-100 overflow-hidden isolate">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-100/40 via-purple-50/30 to-cyan-50/40 blur-3xl pointer-events-none -z-10 rounded-full" />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Editorial Pill Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-200/90 text-[12px] md:text-[13px] font-semibold text-[#1d1d1f] tracking-wide uppercase mb-6 shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Enterprise Services & Digital Solutions</span>
        </motion.div>

        {/* Main Editorial Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-bold text-[#1d1d1f] tracking-tight leading-[1.08] mb-6"
        >
          Comprehensive Services.<br />
          <span className="text-[#86868b]">Engineered for Modern Business.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="text-[16px] md:text-[19px] text-[#515154] max-w-3xl mx-auto leading-relaxed font-normal mb-8"
        >
          From pre-vetted technology talent and ready-to-deploy software products to bespoke digital platforms and AI systems, Dort Asia brings complete technological capabilities together under one roof.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-14"
        >
          <Link
            href="/work-with-us"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full font-semibold text-[15px] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-[0.99] group"
          >
            <span>Start a Project</span>
            <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </Link>

          <a
            href="#custom-tech"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 text-[#1d1d1f] rounded-full font-semibold text-[15px] transition-all border border-gray-200/90 shadow-2xs hover:border-gray-300"
          >
            <span>Explore Capabilities</span>
          </a>
        </motion.div>

        {/* Quick Capabilities Segmented Anchor Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="flex items-center justify-center flex-wrap gap-2 md:gap-2.5 max-w-4xl mx-auto pt-2"
        >
          {QUICK_CAPABILITIES.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-[#1d1d1f] text-[#515154] hover:text-white border border-gray-200/80 hover:border-[#1d1d1f] text-[13px] font-medium transition-all shadow-2xs group select-none"
            >
              {item.isLucide ? (
                <item.icon className="w-3.5 h-3.5 text-[#007AFF] group-hover:text-white transition-colors" />
              ) : (
                <HugeiconsIcon icon={item.icon as any} className="w-3.5 h-3.5 text-[#007AFF] group-hover:text-white transition-colors" />
              )}
              <span>{item.name}</span>
            </a>
          ))}
        </motion.div>

      </div>

      {/* Hero Metrics Strip */}
      <div className="max-w-6xl mx-auto mt-14 pt-8 border-t border-gray-200/70">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {METRICS_BAR.map((m, idx) => (
            <div key={idx} className="text-left md:text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] mb-1">
                {m.label}
              </div>
              <div className="text-lg md:text-xl font-bold text-[#1d1d1f] tracking-tight">
                {m.value}
              </div>
              <div className="text-[12px] text-[#6e6e73] mt-0.5 font-normal">
                {m.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
