"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Users, Building2, Utensils, Store, CheckCircle2,
  Zap, ShieldCheck, BarChart3, Globe, Layers, ArrowRight,
  Heart, Lightbulb, Star, Briefcase, Smartphone
} from "lucide-react";
import bannerIllust from "@/public/AboutUsBanner.svg";
import mobileBannerIllust from "@/public/AboutusMblBanner.svg";
import logoImg from "@/public/DortAsiaLogo.svg";
import vertexLogo from "@/public/Vertex.webp";
import { Footer } from "@/components/layout/footer";

// ─── Animation helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const products = [
  {
    icon: Users,
    color: "bg-[#EAF5FF]",
    iconColor: "text-[#007AFF]",
    accentColor: "#007AFF",
    title: "HRMS",
    subtitle: "Vertex — Employee Management",
    description:
      "A complete workforce platform covering everything from onboarding to payroll-ready attendance and leave tracking.",
    features: [
      "Employee profiles, roles & departments",
      "Daily attendance check-in / check-out",
      "Leave requests & approval workflows",
      "Claim submission & approval",
    ],
  },
  {
    icon: Building2,
    color: "bg-[#FFF2F2]",
    iconColor: "text-[#FF5252]",
    accentColor: "#FF5252",
    title: "Hotel Management",
    subtitle: "Folio — Property Operations",
    description:
      "Total command of your property from front desk to back office — room-by-room, guest-by-guest.",
    features: [
      "Room check-in & check-out flows",
      "Live room availability display",
      "Guest profile & booking history",
      "Payment tracking & folio generation",
    ],
  },
  {
    icon: Utensils,
    color: "bg-[#FFF8F0]",
    iconColor: "text-[#FFA31A]",
    accentColor: "#FFA31A",
    title: "Restaurant Management",
    subtitle: "Tablr — F&B Operations",
    description:
      "Streamline every table from order to bill — built for speed, designed for hospitality.",
    features: [
      "Table & dining availability management",
      "Customer data & ordering history",
      "Digital food ordering application",
      "Integrated payment receiving",
    ],
  },
  {
    icon: Store,
    color: "bg-[#F8F2FF]",
    iconColor: "text-[#7B1FA2]",
    accentColor: "#7B1FA2",
    title: "Store Management",
    subtitle: "Vendo — Retail Operations",
    description:
      "From shelf to sale — full visibility into your inventory, pricing, and store performance.",
    features: [
      "Supply & inventory tracking",
      "Expiry date monitoring & alerts",
      "Barcode scanning system",
      "Fixed pricing & sales dashboard",
    ],
  },
];

const whyChooseUs = [
  {
    icon: Layers,
    title: "All-in-One Platform",
    desc: "HR, hospitality, restaurants, and retail — managed from a single dashboard with no tool-switching.",
  },
  {
    icon: Globe,
    title: "Industry-Specific Modules",
    desc: "Each product is purpose-built for its industry, not a generic template retrofitted to your needs.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboards",
    desc: "Live monitoring of attendance, rooms, tables, and inventory so you always know what's happening.",
  },
  {
    icon: Zap,
    title: "Scales With You",
    desc: "From 5-person startups to multi-branch enterprises — our modules grow at your pace.",
  },
  {
    icon: Briefcase,
    title: "External Payroll Support",
    desc: "Seamlessly integrate with external payroll providers so your compensation runs are always accurate.",
  },
];

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    desc: "We continuously evolve our products to stay ahead of how businesses operate — not how they used to.",
    color: "bg-blue-50",
    iconColor: "text-[#007AFF]",
  },
  {
    icon: ShieldCheck,
    title: "Reliability",
    desc: "Your operations can't wait. We build for uptime, data integrity, and rock-solid performance every day.",
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    icon: Heart,
    title: "Customer-First",
    desc: "Every feature is shaped by real feedback from real businesses. You build it with us.",
    color: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    icon: Star,
    title: "Simplicity",
    desc: "Complex problems deserve elegant solutions. We strip out the noise so your team can just work.",
    color: "bg-yellow-50",
    iconColor: "text-yellow-500",
  },
];

const industries = [
  {
    icon: Users,
    label: "HR & Corporate",
    desc: "Complete HRMS for teams of any size — attendance, leave, claims and more.",
    color: "bg-[#EAF5FF]",
    iconColor: "text-[#007AFF]",
  },
  {
    icon: Building2,
    label: "Hospitality (Hotels)",
    desc: "Front-desk to back-office hotel operations on one platform.",
    color: "bg-[#FFF2F2]",
    iconColor: "text-[#FF5252]",
  },
  {
    icon: Utensils,
    label: "F&B (Restaurants)",
    desc: "Table management, ordering, and billing — built for high-volume service.",
    color: "bg-[#FFF8F0]",
    iconColor: "text-[#FFA31A]",
  },
  {
    icon: Store,
    label: "Retail & Store",
    desc: "Inventory, barcode scanning, and sales analytics for modern retailers.",
    color: "bg-[#F8F2FF]",
    iconColor: "text-[#7B1FA2]",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="pt-[100px] lg:pt-[140px] bg-white min-h-screen">

      {/* ── 1. Hero Banner ─────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto pb-8 lg:pb-12 mt-2 lg:mt-4">
        
        {/* Desktop Banner (Hidden on mobile/tablet) */}
        <div className="hidden lg:block relative rounded-[30px] lg:rounded-[50px] overflow-hidden lg:h-[313px] min-h-[220px]">
          {/* SVG background — fills full banner width, illustration anchored right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src={bannerIllust}
              alt=""
              fill
              className="object-cover object-right"
              priority
            />
          </motion.div>

          {/* Text overlay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-full lg:w-[58%] h-full flex flex-col justify-center p-8 lg:px-16 xl:px-20"
          >
            <span className="text-[#6D6D6D] text-[18px] font-bold mb-3 block">About Us</span>
            <h1 className="text-[30px] font-bold text-[#007AFF] leading-[1.3] mb-5 tracking-tight">
              Powering Businesses with Smart SaaS Solutions
            </h1>
            <div className="space-y-4 text-[#6D6D6D] text-[18px] leading-[1.6] font-semibold max-w-[800px]">
              <p>
                Dort Asia is an all-in-one SaaS platform designed to simplify operations across HR, hospitality, restaurants, and retail — helping businesses manage smarter, faster, and more efficiently.
              </p>
              <p>
                We provide a unified platform that helps organizations streamline operations, automate daily workflows, and gain real-time insights.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Mobile / Tablet Banner (Visible below lg) */}
        <div className="block lg:hidden relative rounded-[30px] overflow-hidden">
          
          {/* SVG at its natural aspect ratio (404×589) — no fill/stretch */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            aria-hidden="true"
          >
            <Image
              src={mobileBannerIllust}
              alt=""
              width={404}
              height={589}
              className="w-full h-auto block"
              priority
            />
          </motion.div>

          {/* Text overlay: absolutely pinned to top 50% — safe above illustration (y=307) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 px-6 pt-8 max-h-[50%] overflow-hidden"
          >
            <span className="text-[#4E4E4E] text-[15px] font-bold mb-2 block">About Us</span>
            <h1 className="text-[20px] font-bold text-[#007AFF] leading-[1.2] mb-3 tracking-tight">
              Powering Businesses with Smart SaaS Solutions
            </h1>
            <div className="space-y-2 text-[#6D6D6D] text-[12px] leading-[1.55] font-semibold">
              <p>
                Dort Asia is an all-in-one SaaS platform designed to simplify operations across HR, hospitality, restaurants, and retail — helping businesses manage smarter, faster, and more efficiently.
              </p>
              <p>
                Dort Asia is a modern SaaS company focused on delivering all-in-one business management solutions across multiple industries. We provide a unified platform that helps organizations streamline operations, automate daily workflows, and gain real-time insights.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Who We Are ──────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-12 lg:py-16 border-t border-slate-50">
        <AnimSection>
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-gray-200 shadow-sm mb-8">
              <ShieldCheck className="w-4 h-4 text-[#007AFF]" />
              <span className="text-[13px] font-bold text-slate-600">Our Story</span>
            </div>
            
            <motion.h2 variants={fadeUp} className="text-[32px] sm:text-[42px] lg:text-[48px] text-slate-900 leading-[1.2] font-bold tracking-tight mb-10">
              We build enterprise-grade software that <br className="hidden lg:block" />
              <span className="text-[#007AFF]">adapts to your business.</span>
            </motion.h2>
            
            <motion.div variants={fadeUp} className="text-[18px] text-slate-500 leading-relaxed font-medium space-y-6 max-w-3xl mx-auto">
              <p>
                Dort Asia was founded with a single vision: <strong className="text-slate-800">make enterprise-grade business software accessible to every growing company in Asia.</strong> We saw SMEs struggling with expensive, complicated tools designed for Fortune 500 companies — and we built something better.
              </p>
              <p>
                Our platform is purpose-built for the industries that power Asia's economy — HR & corporate, hospitality, food & beverage, and retail. We believe software should adapt to your business, not the other way around.
              </p>
              <p>
                Our core values are <strong className="text-slate-800">simplicity, reliability, and scalability.</strong> Whether you're a 10-person team or a multi-branch operation, Dort Asia grows with you.
              </p>
            </motion.div>
          </div>
        </AnimSection>
      </section>

      {/* ── 3. What We Do (Product Suite) ─────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-slate-50 border-y border-slate-100">
        <div className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto">
          <AnimSection>
            <div className="text-center mb-20 lg:mb-24">
              <h2 className="text-[36px] sm:text-[42px] lg:text-[48px] font-bold text-slate-900 tracking-tight leading-[1.15]">
                An Ecosystem Built <br className="hidden sm:block" /> For Your Industry
              </h2>
              <p className="mt-6 text-[18px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Four powerful pillars — each purpose-built for its industry, all working transparently together under one platform.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
              {products.map((product, i) => {
                const Icon = product.icon;
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="bg-white p-2 sm:p-3 rounded-[40px] sm:rounded-[50px] border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 relative group h-full"
                  >
                    <div className={`${product.color} rounded-[32px] sm:rounded-[42px] p-8 lg:p-12 h-full flex flex-col`}>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-8">
                        <div>
                          <p className={`text-[14px] font-bold ${product.iconColor} uppercase tracking-wide mb-3`}>
                            {product.title}
                          </p>
                          <h3 className="text-[24px] lg:text-[28px] font-bold text-slate-900 leading-tight">
                            {product.subtitle.split(' — ')[0]} <br />
                            <span className="text-slate-500 font-medium text-[20px] lg:text-[22px]">{product.subtitle.split(' — ')[1]}</span>
                          </h3>
                        </div>
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
                          <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${product.iconColor}`} />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[17px] text-slate-600 leading-relaxed font-medium mb-10 min-h-[50px]">
                        {product.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-4 mt-auto border-t border-slate-900/5 pt-8">
                        {product.features.map((feat, j) => (
                          <li key={j} className="flex items-start gap-4">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white shadow-sm">
                              <CheckCircle2 className="w-4 h-4" style={{ color: product.accentColor }} />
                            </div>
                            <span className="text-[16px] font-bold text-slate-700">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ── 4. Why Choose Us ──────────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-24 lg:py-32 bg-white">
        <AnimSection>
          <div className="text-center mb-20 lg:mb-24">
            <h2 className="text-[36px] sm:text-[42px] lg:text-[48px] font-bold text-slate-900 tracking-tight leading-[1.15]">
              Why Businesses Choose <br className="hidden sm:block" /> Dort Asia
            </h2>
            <p className="mt-6 text-[18px] text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
              We built the platform we wish existed — and thousands of businesses now rely on it every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-6xl mx-auto">
            {whyChooseUs.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`bg-[#F8F9FA] p-8 lg:p-12 rounded-[40px] border border-gray-100 flex flex-col justify-between h-full group transition-all hover:bg-white hover:shadow-xl hover:border-gray-200 ${i >= 3 ? "md:col-span-2 lg:col-span-1 lg:max-w-none" : ""} ${i === 4 ? "md:col-span-2 lg:col-start-2" : ""}`}
                >
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-[#007AFF] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-8 group-hover:-translate-y-2 group-hover:shadow-blue-500/40 transition-all duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-[22px] font-bold text-slate-900 mb-4">{item.title}</h3>
                    <p className="text-[16px] text-slate-500 font-medium leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimSection>
      </section>

      {/* ── 5. Our Values ──────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-16 lg:py-24 bg-slate-50/60">
        <AnimSection>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[13px] font-bold rounded-full mb-4">
              What Drives Us
            </span>
            <h2 className="text-[28px] lg:text-[36px] font-bold text-slate-900 tracking-tight">
              Our Values
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((val, i) => {
              const Icon = val.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-white rounded-[28px] p-8 flex flex-col gap-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 ${val.color} rounded-2xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${val.iconColor}`} />
                  </div>
                  <h3 className="text-[18px] font-bold text-slate-900">{val.title}</h3>
                  <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{val.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </AnimSection>
      </section>

      {/* ── 6. Industries We Serve ────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto py-16 lg:py-24">
        <AnimSection>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-[#EAF5FF] text-[#007AFF] text-[13px] font-bold rounded-full mb-4">
              Industries
            </span>
            <h2 className="text-[28px] lg:text-[36px] font-bold text-slate-900 tracking-tight">
              Industries We Serve
            </h2>
            <p className="mt-4 text-[17px] text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
              Built for the sectors that drive Asia's economy — each module is tailored, not adapted.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {industries.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`${ind.color} rounded-[28px] p-8 flex flex-col gap-4`}
                >
                  <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-6 h-6 ${ind.iconColor}`} />
                  </div>
                  <h3 className="text-[17px] font-bold text-slate-900">{ind.label}</h3>
                  <p className="text-[14px] text-slate-600 font-medium leading-relaxed">{ind.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </AnimSection>
      </section>

      {/* ── 7. CTA ────────────────────────────────────────────────────────── */}
      <section className="px-5 lg:px-10 xl:px-14 max-w-[2200px] mx-auto pb-24 pt-4">
        <AnimSection>
          <motion.div
            variants={fadeUp}
            className="bg-[#007AFF] rounded-[40px] lg:rounded-[50px] p-12 lg:p-20 text-center relative overflow-hidden"
          >
            {/* Subtle circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-[13px] font-bold rounded-full mb-6">
                Get Started Today
              </span>
              <h2 className="text-[28px] lg:text-[40px] font-bold text-white leading-[1.2] tracking-tight mb-6">
                Ready to transform<br className="hidden sm:block" /> your business?
              </h2>
              <p className="text-white/80 text-[17px] font-medium mb-10 leading-relaxed">
                Join the waiting list today and be among the first to experience the simplest way to manage your growing team — across every industry.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="#demo"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 h-[54px] bg-white text-slate-900 text-[16px] font-bold rounded-[15px] hover:bg-slate-100 transition-all active:scale-95"
                >
                  Book a Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#contact"
                  className="flex items-center justify-center w-full sm:w-auto px-8 h-[54px] bg-white/15 text-white text-[16px] font-bold rounded-[15px] border border-white/30 hover:bg-white/25 transition-all active:scale-95"
                >
                  Contact Sales
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
