"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Users, CheckCircle2, ArrowRight, Clock, Calendar, FileText,
  ShieldCheck, BarChart3, Smartphone, Zap, Globe, Briefcase,
  ChevronRight, Activity, Star, Building2, MapPin, Network, 
  UserPlus, Key, Settings, Rocket
} from "lucide-react";
import vertexLogo from "@/public/Vertex.webp";
import heroIllust from "@/public/HeroSection_Vertex_VectorImage.svg";
import { Footer } from "@/components/layout/footer";

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const coreModules = [
  {
    icon: Users,
    title: "Employee Management",
    description: "Structured profiles with roles, departments, and quick access to all essential details.",
    color: "#007AFF",
  },
  {
    icon: Clock,
    title: "Attendance Tracking",
    description: "Daily check-in/check-out with real-time monitoring across all locations.",
    color: "#10B981",
  },
  {
    icon: Calendar,
    title: "Leave Management",
    description: "Automated leave requests, approval workflows, and balance tracking.",
    color: "#8B5CF6",
  },
  {
    icon: FileText,
    title: "Claims & Approvals",
    description: "Submit, review, and approve expense claims with audit-ready documentation.",
    color: "#F59E0B",
  },
  {
    icon: Activity,
    title: "Events Management",
    description: "Plan and track company events, meetings, and team activities in one place.",
    color: "#EF4444",
  },
  {
    icon: Smartphone,
    title: "Mobile Application",
    description: "Full-featured mobile app for employees to manage tasks on-the-go.",
    color: "#06B6D4",
  },
];

const whyVertex = [
  { icon: Zap, title: "Lightning Fast", desc: "Built for speed — no bloated enterprise lag. Everything loads instantly." },
  { icon: ShieldCheck, title: "Secure by Default", desc: "Enterprise-grade security with role-based access and encrypted data at rest." },
  { icon: Globe, title: "Cloud-Native", desc: "Access from anywhere, anytime. Zero installation, automatic updates." },
  { icon: BarChart3, title: "Real-Time Dashboards", desc: "Live analytics on attendance, leave patterns, and workforce trends." },
  { icon: Briefcase, title: "Built for SMEs", desc: "Purpose-built for growing teams — no Fortune 500 complexity." },
  { icon: Star, title: "Always Improving", desc: "Regular feature updates based on customer feedback and industry needs." },
];

const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 2s", label: "Page Load" },
  { value: "v26", label: "Latest Release" },
  { value: "24/7", label: "Support" },
];

const onboardingSteps = [
  {
    title: "Register Company",
    description: "Create your free Dort Asia account.",
    icon: Building2,
  },
  {
    title: "Setup Profile & Branches",
    description: "Add multiple locations and details.",
    icon: MapPin,
  },
  {
    title: "Departments & Roles",
    description: "Create structured access levels.",
    icon: Network,
  },
  {
    title: "Onboard Employees",
    description: "Bulk invite or add members manually.",
    icon: UserPlus,
  },
  {
    title: "Create Credentials",
    description: "Secure login access for everyone.",
    icon: Key,
  },
  {
    title: "Setup Rules",
    description: "Configure attendance & leave policies.",
    icon: Settings,
  },
  {
    title: "Go Live",
    description: "Start your streamlined HR operations.",
    icon: Rocket,
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function VertexPage() {
  return (
    <div className="pt-[100px] lg:pt-[140px] bg-white min-h-screen">

      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto mt-2 lg:mt-4 mb-20">
        <div className="bg-gradient-to-b from-white to-[#D7EAFF] rounded-[40px] lg:rounded-[50px] p-8 lg:p-14 xl:pl-20 xl:pr-10 xl:py-16 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 w-full">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-1 max-w-[480px]"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-0">
                  <Image src={vertexLogo} alt="Vertex Logo" width={38} height={38} className="w-[38px] h-[38px]" />
                  <span className="text-[32px] lg:text-[34px] font-[900] text-[#111111] tracking-tight ml-2">VERTEX</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-sm mt-1">
                  <div className="w-2 h-2 rounded-full bg-[#00E536]"></div>
                  <span className="text-[#007AFF] text-[10px] font-bold">Version 26 Available</span>
                </div>
              </div>

              <h1 className="text-[32px] sm:text-[36px] lg:text-[40px] font-bold text-black leading-[1.2] tracking-tight mb-5">
                <span className="text-[#007AFF]">Empower</span> your workforce{" "}
                <br className="hidden sm:block" />
                with an intuitive ecosystem.
              </h1>

              <div className="text-[13px] text-[#6D6D6D] leading-[1.65] font-bold mb-10 max-w-[390px]">
                <p className="mb-4">
                  Manage Employees, Attendance, and Leaves — All in One<br/>
                  Place. A simple HRMS built for growing teams to manage<br/>
                  employees, track attendance, and handle leave approvals<br/>
                  without complexity.
                </p>
                <p>
                  Designed to replace scattered tools with one clean,<br/>
                  reliable system that just works.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Link
                  href="#demo"
                  className="w-[145px] h-[48px] flex items-center justify-center bg-[#FCFCFD] text-[#0A0A0A] font-bold rounded-[12px] hover:bg-white transition-all active:scale-95 text-[14px]"
                >
                  Book a Demo
                </Link>
                <Link
                  href="/register"
                  className="w-[145px] h-[48px] flex items-center justify-center bg-[#007AFF] text-white font-bold rounded-[12px] hover:bg-blue-600 transition-all active:scale-95 text-[14px]"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>

          {/* Right — Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-1 max-w-[650px] w-full"
          >
            <Image
              src={heroIllust}
              alt="Vertex Workforce Ecosystem"
              width={772}
              height={520}
              className="w-full h-auto"
              priority
            />
          </motion.div>
        </div>
        </div>
      </section>

      {/* ── 2. Stats Bar ────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-10 lg:py-14">
          <AnimSection>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-4xl mx-auto text-center">
              {stats.map((stat, i) => (
                <motion.div key={i} variants={fadeUp} className="space-y-1">
                  <p className="text-[32px] lg:text-[40px] font-bold text-[#007AFF] tracking-tight">{stat.value}</p>
                  <p className="text-[14px] text-slate-500 font-semibold">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ── 3. Core Modules ─────────────────────────────────────────────────── */}
      <section id="features" className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-24 lg:py-32">
        <AnimSection>
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100 shadow-sm mb-6">
              <Users className="w-4 h-4 text-[#007AFF]" />
              <span className="text-[13px] font-bold text-[#007AFF]">Core Modules</span>
            </div>
            <h2 className="text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-slate-900 tracking-tight leading-[1.15]">
              Everything You Need, <br className="hidden sm:block" /> Nothing You Don't
            </h2>
            <p className="mt-5 text-[17px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Six powerful modules working together seamlessly to manage your entire workforce lifecycle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {coreModules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-[#F8F9FA] p-8 lg:p-10 rounded-[32px] border border-gray-100 group hover:bg-white hover:shadow-xl hover:border-gray-200 transition-all duration-300"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:-translate-y-1 transition-transform duration-300"
                    style={{ backgroundColor: mod.color + "15", boxShadow: `0 8px 20px ${mod.color}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: mod.color }} />
                  </div>
                  <h3 className="text-[20px] font-bold text-slate-900 mb-3">{mod.title}</h3>
                  <p className="text-[15px] text-slate-500 font-medium leading-relaxed">{mod.description}</p>
                </motion.div>
              );
            })}
          </div>
        </AnimSection>
      </section>

      {/* ── 3.5 Onboarding Timeline ─────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-24 lg:py-32 bg-slate-50/40 border-t border-slate-100">
        <AnimSection>
          <div className="text-center mb-20 lg:mb-28">
            <h2 className="text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-slate-900 tracking-tight leading-[1.15]">
              Get Started in Minutes
            </h2>
            <p className="mt-5 text-[17px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              A seamless, 7-step onboarding process to get your entire workforce up and running smoothly.
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative px-2 sm:px-4">
            {/* Center Line (Desktop) */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-slate-200 -translate-x-1/2 rounded-full hidden md:block" />
            
            {/* Timeline Steps */}
            <div className="space-y-8 md:space-y-12">
              {onboardingSteps.map((step, idx) => {
                const isEven = idx % 2 === 0;
                const Icon = step.icon;
                return (
                  <motion.div 
                    key={idx}
                    variants={fadeUp}
                    className="relative flex flex-row items-center justify-start md:justify-center group w-full"
                  >
                    {/* Continuous Line (Mobile Only) */}
                    {idx !== onboardingSteps.length - 1 && (
                       <div className="md:hidden absolute left-[27px] top-[56px] bottom-[-48px] w-[2px] bg-slate-200" />
                    )}

                    {/* Desktop Left Container */}
                    <div className="hidden md:flex w-1/2 justify-end pr-10 lg:pr-14">
                      {isEven && (
                        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 transition-all duration-300 w-full max-w-[360px] text-right group-hover:-translate-y-1 hover:shadow-md hover:border-[#29ABE2]/30 cursor-default">
                          <h3 className="text-[17px] font-bold text-slate-900 mb-1">{step.title}</h3>
                          <p className="text-[14px] text-slate-500 font-medium">{step.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Center Node */}
                    <div className="relative z-10 w-14 h-14 shrink-0 rounded-full bg-white border-[3px] border-[#29ABE2] flex items-center justify-center text-[#29ABE2] shadow-sm group-hover:scale-110 group-hover:bg-[#29ABE2] group-hover:text-white transition-all duration-300">
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Desktop Right Container OR Mobile Always Container */}
                    <div className="flex-1 md:flex-none md:w-1/2 flex justify-start pl-6 md:pl-10 lg:pl-14">
                      
                      {/* Mobile-only Card (shows for Even items) */}
                      {isEven && (
                         <div className="md:hidden bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 w-full max-w-[360px] group-hover:-translate-y-1 transition-all duration-300 hover:shadow-md hover:border-[#29ABE2]/30 cursor-default">
                           <h3 className="text-[17px] font-bold text-slate-900 mb-1">{step.title}</h3>
                           <p className="text-[14px] text-slate-500 font-medium">{step.description}</p>
                         </div>
                      )}

                      {/* Desktop & Mobile Card (shows for Odd items) */}
                      {!isEven && (
                         <div className="bg-white p-6 rounded-[16px] shadow-sm border border-slate-100 w-full max-w-[360px] text-left group-hover:-translate-y-1 transition-all duration-300 hover:shadow-md hover:border-[#29ABE2]/30 cursor-default">
                           <h3 className="text-[17px] font-bold text-slate-900 mb-1">{step.title}</h3>
                           <p className="text-[14px] text-slate-500 font-medium">{step.description}</p>
                         </div>
                      )}

                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </AnimSection>
      </section>

      {/* ── 4. Why Vertex ───────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100 py-24 lg:py-32">
        <div className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto">
          <AnimSection>
            <div className="text-center mb-16 lg:mb-20">
              <h2 className="text-[32px] sm:text-[40px] lg:text-[46px] font-bold text-slate-900 tracking-tight leading-[1.15]">
                Why Teams Choose Vertex
              </h2>
              <p className="mt-5 text-[17px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Built from the ground up for businesses that want simplicity without sacrificing power.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto">
              {whyVertex.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="flex items-start gap-5"
                  >
                    <div className="w-12 h-12 bg-[#007AFF] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-[15px] text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ── 5. CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-24 lg:py-32">
        <AnimSection>
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-[40px] lg:rounded-[50px] bg-gradient-to-br from-[#007AFF] to-[#0055CC] p-10 lg:p-20 text-center"
          >
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Image src={vertexLogo} alt="Vertex" width={40} height={40} className="rounded-xl" />
                <span className="text-white text-[28px] lg:text-[34px] font-bold tracking-tight">VERTEX</span>
              </div>
              <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-bold text-white leading-[1.2] tracking-tight mb-5">
                Ready to transform your <br className="hidden sm:block" /> workforce management?
              </h2>
              <p className="text-[17px] text-blue-100 font-medium leading-relaxed max-w-xl mx-auto mb-10">
                Join growing businesses across Asia that trust Vertex to manage their teams smarter, faster, and more efficiently.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="h-[55px] px-10 flex items-center justify-center bg-white text-[#007AFF] font-bold rounded-[15px] hover:bg-blue-50 transition-all active:scale-95 text-[16px] gap-2 shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#demo"
                  className="h-[55px] px-10 flex items-center justify-center bg-white/10 text-white font-bold rounded-[15px] hover:bg-white/20 transition-all active:scale-95 text-[16px] border border-white/20"
                >
                  Book a Demo
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimSection>
      </section>

      <Footer />
    </div>
  );
}
