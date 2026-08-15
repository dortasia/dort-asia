"use client";

import { motion } from "framer-motion";
import { Smartphone, BadgeCheck, BellRing } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserCheck01Icon,
  Clock01Icon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";

const HRMS_KEYWORDS = [
  "Attendance Tracking",
  "Site Pass Verification",
  "Work Permit Tracking",
  "Course Expiry Alerts",
  "GPS Geofencing",
  "Shift Rostering",
  "Overtime Calculations",
  "Digital Onboarding",
  "Leave Approvals",
  "Singapore CPF",
  "Safety Certifications",
  "Audit Telemetry",
];

const CAPABILITIES = [
  {
    title: "Core Workforce Directory",
    description: "Centralize employee profiles, digital onboarding records, org hierarchies, and company policy documents in one secure place.",
    icon: UserCheck01Icon,
  },
  {
    title: "Smart Attendance & Shifts",
    description: "Track check-ins via mobile GPS, manage shift rotas, approve leaves, and calculate overtime automatically.",
    icon: Clock01Icon,
  },
  {
    title: "Automated Payroll & CPF",
    description: "Seamlessly compute salary runs, Singapore CPF, SDL, and statutory tax deductions with direct itemized digital payslips.",
    icon: Invoice01Icon,
  },
];

export function SoftwareProductsSection() {
  return (
    <section className="relative w-full py-12 md:py-16 lg:py-20 bg-white font-text border-t border-gray-100">
      <div className="w-[95%] max-w-7xl mx-auto px-4">
        
        {/* Section Header - Editorial Apple Typography */}
        <div className="mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[13px] md:text-[14px] font-semibold text-[#86868b] tracking-wider uppercase mb-4"
          >
            02 — Software Products
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-7"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold text-[#1d1d1f] tracking-tight leading-[1.1]">
                Software that works<br />
                <span className="text-[#86868b]">the way your business does.</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 lg:pt-1"
            >
              <p className="text-[16px] md:text-[18px] text-[#424245] leading-relaxed font-normal">
                Purpose-built business software that helps teams simplify operations, automate everyday work, and make better decisions.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Product Identity Bar */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-[#f5f5f7] border border-black/[0.04] p-2 flex items-center justify-center shadow-2xs">
              <Image src="/apps-logo/xentra-bluelogo.svg" alt="Xentra" width={28} height={28} className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                Xentra People
              </h3>
              <p className="text-[13px] text-[#86868b] mt-0.5">
                All-in-one workforce, payroll & operations platform
              </p>
            </div>
          </div>
        </div>

        {/* Showcase Grid: Concept Image Viewport + Clean Capability Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-8 items-stretch">
          
          {/* Left Column: Xentra Concept Image Card (7 cols) */}
          <div className="lg:col-span-7 bg-[#f5f5f7] rounded-[28px] md:rounded-[32px] overflow-hidden border border-black/[0.04] shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
            {/* 3D Concept Graphic Area */}
            <div className="relative w-full h-[280px] sm:h-[320px] md:h-[350px] bg-white flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <Image
                src="/img_assets/xentra_concept_img.avif"
                alt="Xentra People Platform"
                fill
                className="object-contain object-center p-2 sm:p-4"
                priority
              />
            </div>

            {/* Auto-Sliding HRMS Keywords Marquee */}
            <div className="relative w-full overflow-hidden py-3 bg-white border-t border-black/[0.04]">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-white to-transparent z-10 pointer-events-none" />

              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
                className="flex items-center gap-6 sm:gap-7 whitespace-nowrap w-max"
              >
                {[...HRMS_KEYWORDS, ...HRMS_KEYWORDS].map((kw, i) => (
                  <span
                    key={i}
                    className="text-[13px] font-medium text-[#86868b] flex items-center gap-6 sm:gap-7"
                  >
                    <span>{kw}</span>
                    <span className="text-[#86868b]/40 font-light">/</span>
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Bottom Icon-Driven Feature Grid */}
            <div className="p-4 sm:p-5 bg-white border-t border-black/[0.04]">
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 rounded-[18px] bg-[#f8f8fa] border border-black/[0.03] flex flex-col items-center sm:items-start text-center sm:text-left group hover:bg-blue-50/40 hover:border-blue-100 transition-all">
                  <div className="w-8 h-8 rounded-[11px] bg-white shadow-2xs border border-black/[0.04] flex items-center justify-center text-[#007AFF] mb-2 group-hover:scale-105 transition-all">
                    <Smartphone className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="text-[12.5px] font-semibold text-[#1d1d1f] leading-tight">
                    GPS Check-In
                  </div>
                  <div className="text-[11px] text-[#86868b] mt-0.5 hidden sm:block">
                    Mobile clock-in
                  </div>
                </div>

                <div className="p-3 rounded-[18px] bg-[#f8f8fa] border border-black/[0.03] flex flex-col items-center sm:items-start text-center sm:text-left group hover:bg-blue-50/40 hover:border-blue-100 transition-all">
                  <div className="w-8 h-8 rounded-[11px] bg-white shadow-2xs border border-black/[0.04] flex items-center justify-center text-[#007AFF] mb-2 group-hover:scale-105 transition-all">
                    <BadgeCheck className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="text-[12.5px] font-semibold text-[#1d1d1f] leading-tight">
                    Site Pass
                  </div>
                  <div className="text-[11px] text-[#86868b] mt-0.5 hidden sm:block">
                    Permit verification
                  </div>
                </div>

                <div className="p-3 rounded-[18px] bg-[#f8f8fa] border border-black/[0.03] flex flex-col items-center sm:items-start text-center sm:text-left group hover:bg-blue-50/40 hover:border-blue-100 transition-all">
                  <div className="w-8 h-8 rounded-[11px] bg-white shadow-2xs border border-black/[0.04] flex items-center justify-center text-[#007AFF] mb-2 group-hover:scale-105 transition-all">
                    <BellRing className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="text-[12.5px] font-semibold text-[#1d1d1f] leading-tight">
                    Expiry Alerts
                  </div>
                  <div className="text-[11px] text-[#86868b] mt-0.5 hidden sm:block">
                    Passes & courses
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Core Capabilities (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {CAPABILITIES.map((cap) => {
              const CapIcon = cap.icon;
              return (
                <div
                  key={cap.title}
                  className="bg-[#f5f5f7] hover:bg-white rounded-[24px] p-6 border border-black/[0.03] hover:border-[#007AFF]/30 shadow-2xs hover:shadow-[0_8px_28px_rgba(0,122,255,0.06)] hover:-translate-y-0.5 transition-all duration-300 flex-1 flex flex-col justify-center"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-white shadow-2xs border border-black/[0.04] flex items-center justify-center text-[#007AFF] mb-3.5">
                    <HugeiconsIcon icon={CapIcon} className="w-5 h-5 text-[#007AFF] stroke-[1.9]" />
                  </div>
                  <h4 className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight mb-1.5">
                    {cap.title}
                  </h4>
                  <p className="text-[13.5px] text-[#86868b] leading-relaxed font-normal">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
