"use client";

import { motion, useInView, AnimatePresence, Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import logoImg from "@/public/Vertex.webp";
import dortLogo from "@/public/DortAsiaLogo.svg";
import footerLogoIcon from "@/public/DortAsiaOfflLogo.svg";
import {
  ArrowRight,
  Users,
  BarChart3,
  Menu,
  X,
  Lock,
  ChevronDown,
  CheckCircle2,
  Calendar,
  Clock,
  XCircle,
  Building2,
  Activity,
  Briefcase,
  ChevronRight,
  ShieldCheck,
  Zap,
  LayoutGrid,
  FileText,
  Smartphone,
  Globe,
  Store,
  Utensils,
  ChevronsRight,
  Wallet
} from "lucide-react";

import heroIllust from "@/public/illustrations/hero_hrms.png";
import ctaIllust from "@/public/illustrations/cta_hrms.png";
import bottomBanner from "@/public/BottomBanner.svg";
import mobileTabBanner from "@/public/Mobile_Tab Banner.svg";
import feedbackIllust from "@/public/FeedBack.svg";
import quotesIcon from "@/public/FeedbackQuotes.svg";
import { Star } from "lucide-react";
import { User } from "@supabase/supabase-js";

// ─── Animation Variants ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimSection({
  children,
  className,
  variants = stagger,
}: {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ecosystemModules = [
  {
    icon: null,
    title: "Vertex",
    subtitle: "Employee Management",
    desc: "Manage employee information in one place with structured profiles, roles, and easy access to essential details, Employees, Attendance, and Leaves Management All In One Place",
    available: true,
    status: "New Version 26",
    date: "Released 19 Aug 2025",
    bgColor: "bg-[#F1F8FF]",
    accentColor: "text-[#007AFF]",
    btnColor: "bg-[#007AFF]",
    btnText: "Get Started"
  },
  {
    icon: Utensils,
    title: "Tablr",
    subtitle: "Restaurant Management",
    desc: "Tablr is an all-in-one restaurant management platform built for modern operators who refuse to choose between speed and control. From real-time table management and smart reservations to kitchen order flow and staff scheduling",
    available: false,
    status: "Coming Soon",
    date: "To be Announced",
    bgColor: "bg-[#FFF8F0]",
    accentColor: "text-[#FFA31A]",
    btnColor: "bg-[#FFA31A]",
    btnText: "Notify Me"
  },
  {
    icon: Wallet,
    title: "Payd",
    subtitle: "Employee Payroll",
    desc: "Payd is a modern payroll platform built for businesses that take people seriously. Automate salary runs, calculate deductions, and stay compliant with tax regulations — all without the complexity of legacy payroll software.",
    available: false,
    status: "Coming Soon",
    date: "To be Announced",
    bgColor: "bg-[#F2FFF8]",
    accentColor: "text-[#00C853]",
    btnColor: "bg-[#00C853]",
    btnText: "Notify Me"
  },
  {
    icon: Store,
    title: "Vendo",
    subtitle: "Store Management",
    desc: "Vendo is the all-in-one store management platform designed for ambitious retailers ready to scale. Manage your product catalog, track inventory across locations, handle customer orders, and measure store performance from a single command center.",
    available: false,
    status: "Coming Soon",
    date: "To be Announced",
    bgColor: "bg-[#F8F2FF]",
    accentColor: "text-[#7B1FA2]",
    btnColor: "bg-[#7B1FA2]",
    btnText: "Notify Me"
  },
  {
    icon: Building2,
    title: "Folio",
    subtitle: "Hotel Management",
    desc: "Folio is a next-generation hotel management platform built for operators who want total command of their property — from check-in to checkout and everything in between. Named after the hotel folio — the complete record of a guest's stay",
    available: false,
    status: "Coming Soon",
    date: "To be Announced",
    bgColor: "bg-[#FFF2F2]",
    accentColor: "text-[#FF5252]",
    btnColor: "bg-[#FF5252]",
    btnText: "Notify Me"
  }
];

const testimonials = [
  {
    name: "John Doe",
    feedback: "Dort Asia simplified our entire HR workflow. We cut admin time by 60% in the first month. Best Ui Experience and had smooth and faster workflows",
    stars: 5,
    date: "9 days ago"
  },
  {
    name: "John Doe",
    feedback: "Dort Asia simplified our entire HR workflow. We cut admin time by 60% in the first month. Best Ui Experience and had smooth and faster workflows",
    stars: 5,
    date: "9 days ago"
  }
];

const problems = [
  {
    icon: LayoutGrid,
    title: "Fragmented Tools",
    desc: "Managing employees across multiple spreadsheets and apps is exhausting.",
    color: "bg-blue-50",
    textColor: "text-blue-600"
  },
  {
    icon: Clock,
    title: "Manual Attendance",
    desc: "Paper logs and manual tracking lead to errors and payroll disputes.",
    color: "bg-green-50",
    textColor: "text-green-600"
  },
  {
    icon: FileText,
    title: "Complex Compliance",
    desc: "Keeping up with local labor laws and leave policies is a full-time job.",
    color: "bg-purple-50",
    textColor: "text-purple-600"
  },
  {
    icon: Zap,
    title: "No Real-time Data",
    desc: "Making decisions without real-time visibility into your workforce is risky.",
    color: "bg-orange-50",
    textColor: "text-orange-600"
  }
];

const useCases = [
  { 
    icon: Users, 
    title: "Companies", 
    desc: "Manage employees easily without the overhead of big ERPs. Optimized workflows for your industry." 
  },
  { 
    icon: Building2, 
    title: "Hotels", 
    desc: "Track staff attendance and shifts across departments. Optimized workflows for your industry." 
  },
  { 
    icon: Utensils, 
    title: "Restaurants", 
    desc: "Handle high-turnover shifts and clock-ins effortlessly. Optimized workflows for your industry." 
  },
  { 
    icon: Store, 
    title: "Retail Stores", 
    desc: "Monitor workforce across multiple store locations. Optimized workflows for your industry." 
  },
];

// ─── Hero ────────────────────────────────────────────────────────────────────

function getVertexUrl(session: any) {
  const baseHrmsUrl = (process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL!).replace(/\/$/, "");
  if (session) {
    return `${baseHrmsUrl}/api/auth/callback?access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
  }
  return baseHrmsUrl;
}

function MobileHero({ user, session }: { user: User | null; session: any }) {
  return (
    <section className="pt-[100px] pb-12 bg-white overflow-hidden">
      <div className="px-6 flex flex-col items-start w-full">
        {/* 1. Illustration at Top */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full mb-10"
        >
          <Image 
            src="/HeroSection_Vertex_VectorImage.svg" 
            alt="Vertex Ecosystem" 
            width={772} 
            height={520} 
            className="w-full h-auto"
            priority
          />
        </motion.div>

        {/* 2. Vertex Branding */}
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-[45px] h-[45px]">
            <Image src={logoImg} alt="Vertex Logo" width={45} height={45} className="w-full h-auto" />
          </div>
          <span className="text-[32px] font-bold text-slate-900 tracking-tight">VERTEX</span>
        </motion.div>

        {/* 3. Headline */}
        <motion.h1 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-[28px] font-bold text-slate-900 leading-[1.2] tracking-tight mb-6"
        >
          <span className="text-[#007AFF]">Empower</span> your workforce <br /> 
          with an intuitive ecosystem.
        </motion.h1>

        {/* 4. Subheadline */}
        <motion.p 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-[16px] text-slate-500 leading-relaxed mb-10 font-medium"
        >
          Manage Employees, Attendance, and Leaves — All in One Place. A simple HRMS built for growing teams to manage employees, track attendance, and handle leave approvals without complexity. 
          Designed to replace scattered tools with one clean, reliable system that just works.
        </motion.p>

        {/* 5. Buttons */}
        <motion.div 
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center gap-3 w-full mb-16"
        >
          <Link
            href="#demo"
            className="flex-1 h-[53px] flex items-center justify-center bg-[#F8F8F8] text-slate-900 font-bold rounded-[15px] hover:bg-slate-200 transition-all active:scale-95 text-[15px]"
          >
            Book a Demo
          </Link>
          <Link
            href={getVertexUrl(session)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-[53px] flex items-center justify-center bg-[#007AFF] text-white font-bold rounded-[15px] hover:bg-blue-600 transition-all active:scale-95 text-[15px]"
          >
            Get Started
          </Link>
        </motion.div>
      </div>

      {/* 6. Product Ticker */}
      <div className="bg-[#EEF4FF] py-5 overflow-hidden whitespace-nowrap">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-10 items-center px-6"
        >
          {[
            "Leave Management",
            "Claims Management",
            "Employee Management",
            "Events Management",
            "Attendance Management",
            "Specialized Mobile Application"
          ].map((service, idx) => (
            <span key={idx} className="text-[14px] font-bold text-slate-400 uppercase tracking-wide">
              {service}
            </span>
          ))}
          {/* Duplicate for infinite effect */}
          {[
            "Leave Management",
            "Claims Management",
            "Employee Management",
            "Events Management",
            "Attendance Management",
            "Specialized Mobile Application"
          ].map((service, idx) => (
            <span key={`dup-${idx}`} className="text-[14px] font-bold text-slate-400 uppercase tracking-wide">
              {service}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Hero({ user, session }: { user: User | null; session: any }) {
  return (
    <>
      {/* Mobile & Tablet View */}
      <div className="lg:hidden">
        <MobileHero user={user} session={session} />
      </div>

      {/* Desktop View */}
      <section className="hidden lg:block relative pt-[177px] pb-24 lg:pb-0 overflow-hidden bg-white">
      <div className="relative z-10 max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <AnimSection>
            <motion.div variants={fadeUp} className="flex items-center gap-4 mb-10">
               <div className="w-[60px] h-[60px] flex items-center justify-center">
                  <Image src={logoImg} alt="Vertex Logo" width={60} height={60} className="w-full h-auto" />
               </div>
               <span className="text-[35px] font-semibold text-slate-900 tracking-tight">VERTEX</span>
            </motion.div>

            <motion.h1 
              variants={fadeUp}
              className="text-[30px] font-semibold text-slate-900 leading-[1.2] tracking-tight mb-8"
            >
              <span className="text-[#007AFF]">Empower</span> your workforce <br /> 
              with an intuitive ecosystem.
            </motion.h1>

            <motion.p 
              variants={fadeUp}
              className="text-[18px] text-slate-500 leading-relaxed max-w-xl mb-12 font-normal"
            >
              Manage Employees, Attendance, and Leaves — All in One Place. A simple HRMS built for growing teams to manage employees, track attendance, and handle leave approvals without complexity. <br className="hidden sm:block" />
              Designed to replace scattered tools with one clean, reliable system that just works.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="#demo"
                style={{ width: '223px', height: '53px' }}
                className="flex items-center justify-center bg-[#F8F8F8] text-slate-900 font-normal rounded-[15px] hover:bg-slate-200 transition-all active:scale-95 text-[17px]"
              >
                Book a Demo
              </Link>
              <Link
                href={getVertexUrl(session)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: '223px', height: '53px' }}
                className="flex items-center justify-center bg-[#007AFF] text-white font-normal rounded-[15px] hover:bg-blue-600 transition-all active:scale-95 text-[17px]"
              >
                Get Started
              </Link>
            </motion.div>
          </AnimSection>

          <AnimSection className="relative flex justify-end">
            <motion.div 
               variants={fadeUp}
               className="relative z-10 translate-x-12"
            >
               <Image 
                 src="/HeroSection_Vertex_VectorImage.svg" 
                 alt="Vertex Workforce Ecosystem" 
                 width={772} 
                 height={520} 
                 className="w-full h-auto"
                 priority
               />
            </motion.div>
          </AnimSection>
        </div>
      </div>

      {/* Service Ribbon */}
      <div className="mt-24 bg-blue-50/50 border-y border-blue-100 py-6">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-between gap-8">
               {[
                  "Leave Management",
                  "Claims Management",
                  "Employee Management",
                  "Events Management",
                  "Attendance Management",
                  "Specialized Mobile Application"
               ].map((service) => (
                  <span key={service} className="text-[14px] font-bold text-slate-500 whitespace-nowrap">
                     {service}
                  </span>
               ))}
            </div>
         </div>
        </div>
      </section>
    </>
  );
}

// ─── Bottom Banner ───────────────────────────────────────────────────────────

function MobileTabBanner() {
  return (
    <div className="lg:hidden relative w-full h-[600px] overflow-hidden rounded-[35px] shadow-lg">
      <Image 
        src={mobileTabBanner} 
        alt="Start with DORT" 
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 flex flex-col pt-12 pb-10 px-8">
        <div className="mb-auto">
          <h2 className="text-[28px] font-bold text-white leading-tight mb-4 tracking-tight">
            Start with DORT.<br />Expand as you grow.
          </h2>
          <p className="text-[15px] font-medium text-white/90 leading-relaxed max-w-[260px]">
            Join the waiting list today and get early access. The simplest way to manage your Businesses.
          </p>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <button className="w-[157px] h-[48px] bg-white text-slate-900 text-[15px] font-bold rounded-[15px] hover:bg-slate-100 transition-all active:scale-95 shadow-md flex items-center justify-center">
            Contact for Sales
          </button>
          <button className="text-white text-[15px] font-bold hover:underline transition-all pr-2">
            Join Wait List
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomBanner() {
  return (
    <section className="pb-24 bg-white">
      <div className="max-w-[2200px] mx-auto w-[calc(100%-40px)] lg:w-[calc(100%-128px)]">
        <AnimSection>
          <div className="hidden lg:block relative w-full h-[421px] overflow-hidden rounded-[50px] shadow-sm">
             <Image 
               src={bottomBanner} 
               alt="Start with HR" 
               fill
               className="object-cover object-[90%_center]"
               priority
             />
             
             {/* Content Overlay */}
             <div className="absolute inset-0 flex flex-col justify-center px-[50px]">
                <div className="max-w-3xl">
                  <h2 className="text-white text-[40px] font-semibold leading-[1.2] mb-6">
                    Start with HR.<br />
                    Expand as you grow.
                  </h2>
                  <p className="text-white text-opacity-100 text-[25px] font-medium mb-10 max-w-2xl leading-tight">
                    Join the waiting list today and get early access. The simplest way to manage your growing team.
                  </p>
                  
                  <div className="flex items-center gap-12">
                    <button className="w-[198px] h-[61px] bg-white text-slate-900 text-[18px] font-normal rounded-[15px] hover:bg-slate-50 transition-all active:scale-95 shadow-none flex items-center justify-center">
                      Contact for Sales
                    </button>
                    <button className="text-white text-[18px] font-normal hover:text-white/80 transition-all">
                      Join Wait List
                    </button>
                  </div>
                </div>
             </div>
          </div>
          <MobileTabBanner />
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Problem Section ─────────────────────────────────────────────────────────

function ProblemSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24">
        <AnimSection>
          <div className="text-center mb-20">
            <h2 className="text-[32px] sm:text-[38px] font-bold text-slate-900 tracking-tight leading-tight">
              Is your business struggling <br /> with fragmented tools?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {problems.map((p, i) => (
              <motion.div 
                key={i} 
                variants={fadeUp}
                className="bg-[#EFF6FF] p-10 rounded-[35px] flex flex-col justify-between h-[230px] relative overflow-visible group z-10"
              >
                 <p className="text-[15px] text-slate-500 font-bold leading-relaxed max-w-[90%]">
                    {p.desc}
                 </p>
                 
                 <div className="flex items-end justify-between gap-4 mt-auto">
                    <div className="w-[68px] h-[68px] bg-[#007AFF] rounded-full flex items-center justify-center shadow-none -mb-10 -ml-10 transition-transform group-hover:scale-105 shrink-0">
                       <p.icon className="w-6 h-6 text-white stroke-[2.5]" />
                    </div>
                    <h3 className="text-[20px] font-bold text-slate-900 tracking-tight text-right flex-1">
                      {p.title}
                    </h3>
                 </div>
              </motion.div>
            ))}
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Feedback Section ───────────────────────────────────────────────────────

function TestimonialCard({ t }: { t: any }) {
  return (
    <motion.div 
      variants={fadeUp}
      className="bg-[#F8F9FA] p-8 rounded-[35px] border border-gray-50 flex flex-col justify-between h-full relative"
    >
      <div className="mb-4">
         <div className="mb-4">
            <Image 
              src={quotesIcon} 
              alt="Quote" 
              width={38} 
              height={38}
              className="opacity-40"
            />
         </div>
         <h4 className="text-[18px] font-bold text-slate-900 mb-2">{t.name}</h4>
         <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
            {t.feedback}
         </p>
      </div>

      <div className="flex items-center justify-between mt-6">
         <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-5 h-5 ${i < t.stars ? "fill-[#FFCC00] text-[#FFCC00]" : "text-gray-200"}`} 
              />
            ))}
         </div>
         <span className="text-[13px] text-slate-400 font-medium">Posted {t.date}</span>
      </div>
    </motion.div>
  );
}

function FeedbackSection() {
  return (
    <section className="pb-24 bg-white">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24">
        <AnimSection>
          <div className="mb-12">
             <h2 className="text-[28px] font-bold text-slate-900 tracking-tight">
                Feedback From the Companies
             </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
             {/* Illustration */}
             <motion.div variants={fadeUp} className="lg:col-span-4 flex items-center justify-center lg:justify-start">
                <Image 
                  src={feedbackIllust} 
                  alt="Feedback Illustration" 
                  width={387} 
                  height={259}
                  className="w-full max-w-[387px] h-auto object-contain"
                />
             </motion.div>
             
             {/* Cards */}
             <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
                {testimonials.map((t, i) => (
                   <TestimonialCard key={i} t={t} />
                ))}
             </div>
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Why This Exists ─────────────────────────────────────────────────────────

function WhyThisExists() {
  return (
    <section id="why-exists" className="py-24 bg-white border-y border-gray-100">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24 text-center">
        <AnimSection>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-gray-200 shadow-sm mb-8">
            <ShieldCheck className="w-4 h-4 text-brand-blue" />
            <span className="text-[13px] font-bold text-slate-600">Our Focus</span>
          </div>
          <motion.p variants={fadeUp} className="text-[22px] sm:text-[36px] text-slate-900 leading-[1.3] font-black tracking-tight mb-6">
            HR management shouldn't be complicated. <br className="hidden sm:block" />
            <span className="text-brand-blue">We built Dort Asia to be the easiest HRMS you've ever used.</span>
          </motion.p>
          <motion.p variants={fadeUp} className="text-[17px] text-slate-500 font-medium max-w-2xl mx-auto">
            From easy onboarding to real-time attendance, we handle the administrative headache so you can focus on building your business.
          </motion.p>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24 flex flex-col gap-32">
        
        {/* Employee Management */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <AnimSection>
             <div className="relative">
                
                <motion.div variants={fadeUp} className="bg-white p-2 rounded-[40px] border border-gray-100 shadow-xl relative z-10">
                   <div className="bg-slate-50 rounded-[32px] p-6 lg:p-8">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                         <div className="flex items-center justify-between mb-6">
                            <div className="font-bold text-slate-800 text-xl">Employee Directory</div>
                            <div className="px-3 py-1 bg-brand-blue text-white text-[12px] font-bold rounded-lg">+ Add New</div>
                         </div>
                         <div className="flex flex-col gap-4">
                            {[
                               { name: "John Doe", role: "Developer", initial: "JD", bg: "bg-blue-100", text: "text-brand-blue" },
                               { name: "Priya", role: "HR Manager", initial: "PR", bg: "bg-green-100", text: "text-brand-green" }
                            ].map((emp) => (
                               <div key={emp.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-full ${emp.bg} ${emp.text} flex items-center justify-center font-bold text-[13px]`}>{emp.initial}</div>
                                     <div>
                                        <p className="font-bold text-slate-900 text-[14px]">{emp.name}</p>
                                        <p className="text-slate-500 text-[13px] font-medium">{emp.role}</p>
                                     </div>
                                  </div>
                                  <div className="text-brand-blue"><ChevronRight className="w-4 h-4"/></div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </motion.div>
             </div>
          </AnimSection>
          <AnimSection>
            <motion.div variants={fadeUp} className="space-y-6">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-brand-blue shadow-sm border border-blue-100">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-[36px] sm:text-[48px] font-[900] text-slate-900 mb-6 tracking-tight leading-tight">Employee Management</h3>
              <p className="text-[18px] text-slate-500 leading-relaxed mb-8 max-w-md font-medium">
                Maintain structured employee records in a centralized system. Access data instantly and organize your team effortlessly.
              </p>
              <ul className="space-y-4">
                {[
                  "Store comprehensive employee profiles",
                  "Organize departments and reporting lines",
                  "Define custom roles and access levels"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                    </div>
                    <span className="text-[17px] font-semibold text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimSection>
        </div>

        {/* Attendance Tracking */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <AnimSection className="order-2 lg:order-1">
            <motion.div variants={fadeUp} className="space-y-6">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-brand-green shadow-sm border border-green-100">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-[36px] sm:text-[48px] font-[900] text-slate-900 mb-6 tracking-tight leading-tight">Attendance Tracking</h3>
              <p className="text-[18px] text-slate-500 leading-relaxed mb-8 max-w-md font-medium">
                Daily attendance logging made simple. Get real-time visibility and ensure payroll accuracy.
              </p>
              <ul className="space-y-4">
                {[
                  "One-click daily check-in and check-out",
                  "Automated late and absence tracking",
                  "Real-time visibility for managers"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-green" />
                    </div>
                    <span className="text-[17px] font-semibold text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimSection>
          <AnimSection className="order-1 lg:order-2">
             <div className="relative">
                
                <motion.div variants={fadeUp} className="bg-white p-2 rounded-[40px] border border-gray-100 shadow-xl relative z-10">
                   <div className="bg-slate-50 rounded-[32px] p-6 lg:p-8">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                         <div className="font-bold text-slate-800 text-xl mb-6">Weekly Attendance</div>
                         <div className="flex flex-col gap-3">
                            {[
                               { day: "Monday", status: "Present", color: "bg-green-100 text-green-700", Icon: CheckCircle2 },
                               { day: "Tuesday", status: "Present", color: "bg-green-100 text-green-700", Icon: CheckCircle2 },
                               { day: "Wednesday", status: "Absent", color: "bg-red-100 text-red-700", Icon: XCircle }
                            ].map((row) => (
                               <div key={row.day} className="flex items-center justify-between p-3 rounded-xl border border-slate-50 bg-slate-100/50">
                                  <p className="font-bold text-slate-700 text-[14px]">{row.day}</p>
                                  <div className={`flex items-center gap-1.5 px-2.5 py-1 ${row.color} rounded-md text-[13px] font-bold`}>
                                     <row.Icon className="w-3.5 h-3.5"/> {row.status}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </motion.div>
             </div>
          </AnimSection>
        </div>

        {/* Leave Management */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <AnimSection>
             <div className="relative">
                
                <motion.div variants={fadeUp} className="bg-white p-2 rounded-[40px] border border-gray-100 shadow-xl relative z-10">
                   <div className="bg-slate-50 rounded-[32px] p-6 lg:p-8">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-[100px] z-0"></div>
                         <div className="relative z-10">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-brand-purple">
                              <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                            <p className="font-black text-slate-900 text-2xl mb-1">Sick Leave Request</p>
                            <p className="text-slate-500 text-[15px] font-medium mb-8">Apr 14 - Apr 15</p>
                            
                            <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                               <div className="flex items-center gap-2 flex-1">
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                  <span className="text-[15px] font-bold text-slate-700">Approved</span>
                               </div>
                               <div className="px-4 py-2 bg-slate-100 text-slate-900 text-[13px] font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors">Details</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
             </div>
          </AnimSection>
          <AnimSection>
            <motion.div variants={fadeUp} className="space-y-6">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-brand-purple shadow-sm border border-purple-100">
                <Calendar className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-[36px] sm:text-[48px] font-[900] text-slate-900 mb-6 tracking-tight leading-tight">Leave & Approvals</h3>
              <p className="text-[18px] text-slate-500 leading-relaxed mb-8 max-w-md font-medium">
                Eliminate paperwork with digital leave workflows. Define policies and approve requests in seconds.
              </p>
              <ul className="space-y-4">
                {[
                  "Digital leave application for employees",
                  "Multi-level approval workflows",
                  "Automatic leave balance calculations"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-[17px] font-semibold text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimSection>
        </div>

        {/* Insights & Reports */}
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <AnimSection className="order-2 lg:order-1">
            <motion.div variants={fadeUp} className="space-y-6">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-orange-600 shadow-sm border border-orange-100">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-[36px] sm:text-[48px] font-[900] text-slate-900 mb-6 tracking-tight leading-tight">Basic Insights</h3>
              <p className="text-[18px] text-slate-500 leading-relaxed mb-8 max-w-md font-medium">
                Make data-driven decisions with real-time workforce analytics and clean reporting.
              </p>
              <ul className="space-y-4">
                {[
                  "Visual attendance trend reports",
                  "Monthly employee summaries",
                  "Core workforce metric tracking"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-[17px] font-semibold text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimSection>
          <AnimSection className="order-1 lg:order-2">
             <div className="relative">
                
                <motion.div variants={fadeUp} className="bg-white p-2 rounded-[40px] border border-gray-100 shadow-xl relative z-10">
                   <div className="bg-slate-50 rounded-[32px] p-6 lg:p-8">
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                         <div className="font-bold text-slate-900 text-xl mb-8 flex items-center gap-2">
                            Attendance Trends
                         </div>
                         <div className="h-40 flex items-end justify-between gap-2 px-2">
                            {[40, 65, 30, 90, 50, 75, 45].map((h, i) => (
                              <div key={i} className="w-full bg-orange-50 rounded-t-lg relative group overflow-hidden">
                                 <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="absolute bottom-0 w-full bg-orange-500 rounded-t-lg transition-all duration-300 group-hover:bg-orange-600"
                                 ></motion.div>
                              </div>
                            ))}
                         </div>
                         <div className="flex justify-between mt-4 text-[11px] font-bold text-slate-400 px-2 uppercase tracking-widest">
                           <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                         </div>
                      </div>
                   </div>
                </motion.div>
             </div>
          </AnimSection>
        </div>
      </div>
    </section>
  );
}

// ─── Product Ecosystem ───────────────────────────────────────────────────────

function ProductEcosystem({ session }: { session: any }) {
  return (
    <section id="products" className="py-24 bg-white">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24">
        <AnimSection>
          <motion.div variants={fadeUp} className="text-center mb-20">
            <h2 className="text-[40px] font-bold text-slate-900 mb-2">
              Our All New Products
            </h2>
            <p className="text-[16px] text-slate-400 font-medium">
              the Products we introduced to manage your business
            </p>
          </motion.div>

          {/* Centered Grid of Fixed-Size Cards */}
          <div className="flex flex-col items-center gap-10">
            <div className="grid lg:grid-cols-2 gap-10">
              {ecosystemModules.slice(0, 4).map((mod) => (
                <div key={mod.title} className="flex justify-center">
                  <ProductCard mod={mod} session={session} />
                </div>
              ))}
            </div>
            
            <div className="flex justify-center w-full">
               <ProductCard mod={ecosystemModules[4]} session={session} />
            </div>
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

function ProductCard({ mod, session }: { mod: any; session: any }) {
  // Extract hex from bg-[#HEX]
  const colorHex = mod.btnColor.match(/#([a-fA-F0-9]{6})/)?.[0] || "#007AFF";

  return (
    <motion.div
      variants={fadeUp}
      whileHover="hover"
      initial="initial"
      className={`relative p-8 rounded-[25px] ${mod.bgColor} transition-all duration-300 overflow-hidden w-full lg:w-[638px] lg:h-[302px] h-auto flex flex-col justify-between group`}
    >
      {/* Interactive Bubbles - Dynamic Color Match */}
      <motion.div 
        variants={{
          initial: { x: 40, y: -40, opacity: 0, scale: 0.8 },
          hover: { x: 0, y: 0, opacity: 0.2, scale: 1 }
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute -top-10 -right-10 w-64 h-64 rounded-full blur-2xl pointer-events-none z-0"
        style={{ backgroundColor: colorHex }}
      />
      <motion.div 
        variants={{
          initial: { x: -40, y: 40, opacity: 0, scale: 0.8 },
          hover: { x: 0, y: 0, opacity: 0.15, scale: 1 }
        }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }}
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-2xl pointer-events-none z-0"
        style={{ backgroundColor: colorHex }}
      />
      <motion.div 
        variants={{
          initial: { x: 40, opacity: 0, scale: 0.8 },
          hover: { x: 0, opacity: 0.15, scale: 1 }
        }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="absolute top-1/2 -right-10 w-32 h-32 rounded-full blur-xl pointer-events-none z-0"
        style={{ backgroundColor: colorHex }}
      />

      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              {mod.icon ? (
                <mod.icon className={`w-7 h-7 ${mod.accentColor}`} />
              ) : (
                 <Image src={logoImg} alt="Vertex" width={28} height={28} />
              )}
            </div>
            <div className="text-right">
               <p className={`text-[13px] font-normal opacity-80 ${mod.accentColor}`}>{mod.status}</p>
               <p className="text-[11px] font-medium text-slate-400">{mod.date}</p>
            </div>
          </div>

          <h3 className="text-[19px] font-bold text-slate-900 mb-3">
            {mod.title} - <span className="font-semibold text-slate-700">{mod.subtitle}</span>
          </h3>
          <p className="text-[14px] leading-relaxed text-slate-500 font-normal line-clamp-3 max-w-[90%]">
            {mod.desc}
          </p>
        </div>

        <div className="flex items-center justify-end gap-6 mt-4">
          <Link href="#contact" className={`text-[14px] font-normal ${mod.accentColor} opacity-80 hover:opacity-100 transition-colors`}>
             Contact Sales
          </Link>
          {mod.available ? (
            <Link
              href={mod.title === "Vertex" ? getVertexUrl(session) : mod.href}
              target={mod.title === "Vertex" ? "_blank" : undefined}
              rel={mod.title === "Vertex" ? "noopener noreferrer" : undefined}
              className={`px-8 py-2.5 ${mod.btnColor} text-white text-[14px] font-normal rounded-xl hover:brightness-110 transition-all active:scale-95 shadow-none flex items-center justify-center`}
            >
              {mod.btnText}
            </Link>
          ) : (
            <button className={`px-8 py-2.5 ${mod.btnColor} text-white text-[14px] font-normal rounded-xl hover:brightness-110 transition-all active:scale-95 shadow-none`}>
              {mod.btnText}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Use Cases ───────────────────────────────────────────────────────────────

function UseCases() {
  return (
    <section id="use-cases" className="py-24 bg-white">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24">
        <AnimSection>
          <motion.div variants={fadeUp} className="text-center mb-24">
            <h2 className="text-[40px] font-bold text-slate-900 mb-2">
              Built for Different Businesses
            </h2>
            <p className="text-[16px] text-slate-400 font-medium">
              The Products build for Different types of businesses
            </p>
          </motion.div>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 w-full max-w-[1600px]">
              {useCases.map((uc, i) => (
                <motion.div 
                  key={i} 
                  variants={fadeUp} 
                  className="relative bg-slate-50 p-6 pt-12 rounded-[25px] border border-transparent transition-all duration-300 text-center flex flex-col items-center w-full max-w-[383px] min-h-[171px] justify-center mx-auto"
                >
                   {/* Floating Icon */}
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-100">
                      <uc.icon className="w-8 h-8 text-[#007AFF]" />
                   </div>
                   
                   <h3 className="text-[18px] font-bold text-slate-900 mb-2">{uc.title}</h3>
                   <p className="text-[13px] text-slate-500 font-normal leading-relaxed">
                      {uc.desc}
                   </p>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-slate-50 border-y border-gray-100">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24 text-center">
        <AnimSection>
          <motion.h2 variants={fadeUp} className="text-[32px] sm:text-[44px] font-[900] text-slate-900 tracking-tight mb-4">
            Simple Pricing
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
            <motion.div variants={fadeUp} className="bg-white p-8 rounded-[40px] border border-brand-blue shadow-xl shadow-blue-500/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 px-4 py-1 bg-brand-blue text-white text-[10px] font-black uppercase tracking-widest rounded-bl-xl">Popular</div>
               <h3 className="text-xl font-black text-slate-900 mb-2">Early Access</h3>
               <div className="text-4xl font-black text-slate-900 mb-6 flex items-center justify-center gap-1">
                 Free <span className="text-sm font-bold text-slate-400">/ forever</span>
               </div>
               <ul className="text-left space-y-4 mb-8">
                 {["Full HRMS features", "Unlimited employees", "All basic reports", "Standard support"].map(f => (
                   <li key={f} className="flex items-center gap-3 text-[15px] font-semibold text-slate-600">
                     <CheckCircle2 className="w-5 h-5 text-brand-blue" /> {f}
                   </li>
                 ))}
               </ul>
               <Link href="/pricing" className="w-full py-5 bg-brand-blue text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] inline-flex items-center justify-center">
                 View Subscription Plans
               </Link>
               <p className="mt-4 text-[13px] font-bold text-slate-400">No credit card required</p>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-slate-50 p-8 rounded-[40px] border border-gray-200">
               <h3 className="text-xl font-black text-slate-700 mb-2">Paid Plan</h3>
               <div className="text-4xl font-black text-slate-400 mb-6 flex items-center justify-center gap-1">
                 Soon
               </div>
               <ul className="text-left space-y-4 mb-8 opacity-50">
                 {["Payroll automation", "Advanced insights", "Role permissions", "Priority support"].map(f => (
                   <li key={f} className="flex items-center gap-3 text-[14px] font-bold text-slate-600">
                     <Lock className="w-4 h-4 text-slate-400" /> {f}
                   </li>
                 ))}
               </ul>
               <button className="w-full py-4 bg-white text-slate-400 font-black rounded-full border border-gray-200 cursor-not-allowed">
                 Coming Soon
               </button>
            </motion.div>
          </div>
        </AnimSection>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24">
        <motion.div 
           initial={{ opacity: 0, scale: 0.98 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="relative bg-gradient-to-br from-blue-700 to-indigo-800 rounded-[64px] p-10 lg:p-24 flex flex-col lg:flex-row items-center justify-between gap-16 overflow-hidden shadow-2xl shadow-blue-900/40"
        >
           <div className="absolute inset-0 bg-grid-light opacity-5 pointer-events-none"></div>
           <div className="relative z-10 max-w-xl">
             <h2 className="text-white text-[40px] sm:text-[56px] font-[900] leading-[1.1] mb-8">
                Start with HR. <br /> 
                <span className="text-blue-200">Expand as you grow.</span>
             </h2>
             <p className="text-blue-100 text-[20px] font-medium leading-relaxed mb-12 max-w-md">
                Join the waiting list today and get early access. The simplest way to manage your growing team.
             </p>
             <button className="px-12 py-5 bg-white text-blue-700 text-[18px] font-bold rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95">
                Join Waitlist Now
             </button>
           </div>
           
           <div className="relative z-10 w-full max-w-xl">
             <Image 
                src={ctaIllust} 
                alt="Manage with ease" 
                className="w-full h-auto drop-shadow-[0_35px_60px_rgba(0,0,0,0.3)] hover:translate-y-[-10px] transition-transform duration-700"
                width={800}
                height={600}
             />
           </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────

const footerProducts = [
  { name: "Vertex", subtitle: "Employee Management", color: "bg-blue-500" },
  { name: "Tablr", subtitle: "Restaurant Management", color: "bg-orange-500" },
  { name: "Payd", subtitle: "Employee Payroll", color: "bg-green-500" },
  { name: "Vendo", subtitle: "Store Management", color: "bg-purple-500" },
  { name: "Folio", subtitle: "Hotel Management", color: "bg-red-500" },
];

const footerLinks = {
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Documentation", href: "#" },
    { label: "Status", href: "#" },
    { label: "Community", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "#" },
    { label: "GDPR", href: "#" },
  ],
};

function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-[#0A0A0F] text-white">
      {/* Main Footer */}
      <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image src={footerLogoIcon} alt="Dort Asia" width={32} height={35} className="w-auto h-8" />
                <span className="text-[22px] font-bold text-white tracking-[0.01em]">Dort Asia</span>
              </div>
              <p className="text-[15px] text-slate-400 leading-relaxed font-medium max-w-sm">
                The all-in-one business app hub for modern companies. One platform, every tool your team needs to grow.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {[
                { label: "X", href: "https://x.com/dortasia?s=11", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>) },
                { label: "LinkedIn", href: "https://www.linkedin.com/company/dort-asia/", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>) },
                { label: "Instagram", href: "https://www.instagram.com/dortasiaig?igsh=MThwaGNkMWVlaDl0Yg==", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>) },
                { label: "YouTube", href: "https://youtube.com/@dortasiayt?si=4W9whVtgUmn1UsXh", icon: (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.002 3.002 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>) },
              ].map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-[14px] font-semibold text-slate-300 mb-3">Stay in the loop</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button className="px-5 py-3 bg-[#007AFF] hover:bg-blue-500 rounded-xl text-[14px] font-semibold text-white transition-all active:scale-95 shrink-0">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Products Column */}
          <div className="lg:col-span-3">
            <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-6">Our Products</h3>
            <div className="flex flex-col gap-4">
              {footerProducts.map((p) => (
                <a key={p.name} href="#" className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 ${p.color} rounded-lg flex items-center justify-center shrink-0 opacity-90 group-hover:opacity-100 transition-opacity`}>
                    <span className="text-[11px] font-bold text-white">{p.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-slate-300 group-hover:text-white transition-colors">{p.name}</p>
                    <p className="text-[12px] text-slate-600">{p.subtitle}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-6">{title}</h3>
                <ul className="flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href}
                        className="text-[14px] font-medium text-slate-400 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-[2200px] mx-auto px-6 lg:px-16 xl:px-24 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-slate-600 font-medium" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} Dort Asia Technologies Pte. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Cookies", href: "#" },
            ].map((l) => (
              <a key={l.label} href={l.href} className="text-[13px] text-slate-600 hover:text-slate-400 transition-colors font-medium">{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[13px] text-slate-600 font-medium">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setSession(session);
      } catch (err) {
        console.error("Error fetching session on landing page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserSession();
  }, []);

  return (
    <div className="bg-white">
      <Hero user={user} session={session} />
      <ProductEcosystem session={session} />
      <UseCases />
      <BottomBanner />
      <ProblemSection />
      <FeedbackSection />
      <Footer />
    </div>
  );
}
