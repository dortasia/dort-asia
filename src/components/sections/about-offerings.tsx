"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  UserCheck01Icon,
  LaptopProgrammingIcon,
  Settings01Icon,
  PackageIcon,
  Wallet02Icon,
  SparklesIcon,
  CodeIcon,
  DatabaseIcon,
  Layers01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import Image from "next/image";

export function AboutOfferingsSection() {
  const [activeProduct, setActiveProduct] = useState<"people" | "paynote">("people");

  return (
    <section id="what-we-do" className="w-full py-16 md:py-24 px-6 md:px-10 bg-white font-text flex justify-center">
      <div className="max-w-[1400px] w-full">
        
        {/* 3 Pro-Level Hyper-Minimalist Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ======================================================== */}
          {/* CARD 1: TECHNOLOGY TALENT */}
          {/* ======================================================== */}
          <motion.div
            id="talent"
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="group bg-[#f5f5f7] rounded-[32px] p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-[580px] hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] transition-all duration-300 relative"
          >
            {/* Visual Mockup Area */}
            <div className="w-full h-[230px] rounded-2xl bg-white/80 backdrop-blur-md border border-black/[0.04] p-5 flex flex-col justify-between shadow-2xs relative overflow-hidden group-hover:bg-white transition-colors duration-300">
              
              {/* Top Badge Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2b7fff]/10 text-[#2b7fff] flex items-center justify-center">
                    <HugeiconsIcon icon={UserCheck01Icon} className="w-4 h-4" />
                  </div>
                  <span className="text-[13px] font-semibold text-[#1d1d1f]">Engineering Squad</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Top 1% Vetted</span>
                </div>
              </div>

              {/* Middle Interactive Floating Candidate Stack */}
              <div className="space-y-2 my-1">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f5f5f7] border border-black/[0.03]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center text-[11px] font-bold">
                      TS
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-[#1d1d1f] block leading-tight">Full-Stack Architect</span>
                      <span className="text-[10px] text-[#86868b] block">Next.js • Node • Postgres</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#2b7fff]">Available</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f5f5f7]/60 border border-black/[0.02]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#2b7fff] text-white flex items-center justify-center text-[11px] font-bold">
                      AI
                    </div>
                    <div>
                      <span className="text-[12px] font-bold text-[#1d1d1f] block leading-tight">AI Systems Engineer</span>
                      <span className="text-[10px] text-[#86868b] block">Python • PyTorch • LLMs</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600">Active Lead</span>
                </div>
              </div>

              {/* Bottom Metric Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] text-[#86868b] font-medium">
                <span>48h Fast Onboarding</span>
                <span className="text-[#1d1d1f] font-semibold">98.4% Retention</span>
              </div>
            </div>

            {/* Text & Button Area (Matching Bento Typography Style) */}
            <div className="mt-8 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-3xl md:text-[34px] font-bold text-[#1d1d1f] leading-[1.15] tracking-tight">
                  Technology<br />Talent
                </h3>
                <p className="text-[16px] md:text-[17px] text-[#1d1d1f]/60 leading-relaxed font-medium mt-3">
                  We provide high-caliber software engineers, system architects, and technical leaders to scale your product roadmap with confidence.
                </p>
              </div>

              {/* Dark Pill Action Button */}
              <div className="mt-8">
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-3 bg-[#1d1d1f] hover:bg-black text-white px-5 py-3 rounded-full transition-all font-medium text-[15px] group"
                >
                  <span>Work With Us</span>
                  <div className="bg-white text-black rounded-full p-1 group-hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>


          {/* ======================================================== */}
          {/* CARD 2: SOFTWARE SOLUTIONS */}
          {/* ======================================================== */}
          <motion.div
            id="solutions"
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="group bg-[#f5f5f7] rounded-[32px] p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-[580px] hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] transition-all duration-300 relative"
          >
            {/* Visual Mockup Area */}
            <div className="w-full h-[230px] rounded-2xl bg-[#18181b] text-white p-5 flex flex-col justify-between shadow-2xs relative overflow-hidden">
              
              {/* Terminal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center">
                    <HugeiconsIcon icon={LaptopProgrammingIcon} className="w-4 h-4" />
                  </div>
                  <span className="text-[12px] font-mono text-zinc-300">system.core.prod</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>99.99% UPTIME</span>
                </div>
              </div>

              {/* Middle Service Nodes */}
              <div className="space-y-1.5 my-1 font-mono text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2b7fff]" />
                    <span className="text-zinc-200">Custom Cloud Platforms</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-sans font-semibold">Active</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span className="text-zinc-300">Autonomous AI Automations</span>
                  </div>
                  <span className="text-zinc-400 text-[10px]">&lt; 35ms</span>
                </div>
              </div>

              {/* Bottom Specs Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-400">
                <span className="text-zinc-300">Bespoke Architecture</span>
                <span className="text-emerald-400 font-sans font-semibold">Enterprise Ready</span>
              </div>
            </div>

            {/* Text & Button Area (Matching Bento Typography Style) */}
            <div className="mt-8 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-3xl md:text-[34px] font-bold text-[#1d1d1f] leading-[1.15] tracking-tight">
                  Software<br />Solutions
                </h3>
                <p className="text-[16px] md:text-[17px] text-[#1d1d1f]/60 leading-relaxed font-medium mt-3">
                  Custom software, web applications, and enterprise systems tailored to automate your operations and unlock new capabilities.
                </p>
              </div>

              {/* Dark Pill Action Button */}
              <div className="mt-8">
                <Link 
                  href="/contact" 
                  className="inline-flex items-center gap-3 bg-[#1d1d1f] hover:bg-black text-white px-5 py-3 rounded-full transition-all font-medium text-[15px] group"
                >
                  <span>Work With Us</span>
                  <div className="bg-white text-black rounded-full p-1 group-hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>


          {/* ======================================================== */}
          {/* CARD 3: SOFTWARE PRODUCTS */}
          {/* ======================================================== */}
          <motion.div
            id="products"
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="group bg-[#f5f5f7] rounded-[32px] p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-[580px] hover:shadow-[0_24px_48px_rgba(0,0,0,0.06)] transition-all duration-300 relative"
          >
            {/* Visual Mockup Area */}
            <div className="w-full h-[230px] rounded-2xl bg-white/80 backdrop-blur-md border border-black/[0.04] p-5 flex flex-col justify-between shadow-2xs relative overflow-hidden group-hover:bg-white transition-colors duration-300">
              
              {/* Product Tabs Switcher */}
              <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-xl">
                <button
                  onClick={() => setActiveProduct("people")}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    activeProduct === "people"
                      ? "bg-white text-[#1d1d1f] shadow-2xs"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  Xentra People
                </button>
                <button
                  onClick={() => setActiveProduct("paynote")}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                    activeProduct === "paynote"
                      ? "bg-white text-[#1d1d1f] shadow-2xs"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  Xentra Paynote
                </button>
              </div>

              {/* Dynamic Product Preview */}
              <AnimatePresence mode="wait">
                {activeProduct === "people" ? (
                  <motion.div
                    key="people"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-xl bg-blue-50/70 border border-blue-100/80 my-1"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-bold text-[#1d1d1f]">HRMS & Attendance GPS</span>
                      <span className="text-[10px] font-bold text-[#2b7fff] bg-white px-2 py-0.5 rounded-full">Live App</span>
                    </div>
                    <p className="text-[11px] text-[#424245] leading-snug">
                      Automated Singapore CPF, digital roster, and mobile check-ins.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="paynote"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 rounded-xl bg-zinc-900 text-white border border-zinc-800 my-1"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-bold text-white">Smart Financial Ledger</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-zinc-800 px-2 py-0.5 rounded-full">Automated</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Instant tax reporting, invoice intelligence & audit sync.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Metric Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-[11px] text-[#86868b] font-medium">
                <span>Purpose-Built SaaS</span>
                <span className="text-[#1d1d1f] font-semibold flex items-center gap-1">
                  Ready to Deploy <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </span>
              </div>
            </div>

            {/* Text & Button Area (Matching Bento Typography Style) */}
            <div className="mt-8 flex flex-col justify-between flex-1">
              <div>
                <h3 className="text-3xl md:text-[34px] font-bold text-[#1d1d1f] leading-[1.15] tracking-tight">
                  Software<br />Products
                </h3>
                <p className="text-[16px] md:text-[17px] text-[#1d1d1f]/60 leading-relaxed font-medium mt-3">
                  Off-the-shelf business software engineered to automate payroll, workforce management, and enterprise billing out of the box.
                </p>
              </div>

              {/* Dark Pill Action Button */}
              <div className="mt-8">
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center gap-3 bg-[#1d1d1f] hover:bg-black text-white px-5 py-3 rounded-full transition-all font-medium text-[15px] group"
                >
                  <span>Work With Us</span>
                  <div className="bg-white text-black rounded-full p-1 group-hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
