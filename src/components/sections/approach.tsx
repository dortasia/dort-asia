"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check, ArrowRight } from "lucide-react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  WebDesign01Icon, 
  LaptopProgrammingIcon,
  DeveloperIcon,
  UserCheck01Icon
} from "@hugeicons/core-free-icons";

export function ApproachSection() {
  return (
    <section className="relative w-full py-10 md:py-14 lg:py-16 px-[16px] bg-white font-text">
      <div className="w-full mx-auto">
        
        {/* Section Header - Editorial Apple Typography */}
        <div className="w-[95%] max-w-7xl mx-auto px-4 mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[13px] md:text-[14px] font-semibold text-[#86868b] tracking-wider uppercase mb-4"
          >
            01 — The Dort Asia Approach
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
                One partner.<br />
                <span className="text-[#86868b]">Multiple ways to move forward.</span>
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
                Whether you need skilled tech talent to scale your operations, software to run your business, or technology built around your needs — Dort Asia brings everything together.
              </p>
            </motion.div>
          </div>
        </div>

        {/* 3 Pillars - 5% width reduction, centered */}
        <div className="w-[95%] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          
          {/* CARD 1: PEOPLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative bg-[#f5f5f7] rounded-[28px] md:rounded-[32px] p-7 md:p-9 flex flex-col justify-between min-h-[480px] md:min-h-[520px] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
          >
            {/* Content Top */}
            <div>
              <div className="text-[12px] font-semibold text-[#86868b] tracking-wider uppercase mb-2.5">
                Pillar 01
              </div>
              <h3 className="text-[24px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
                People
              </h3>
              <p className="text-[15px] font-medium text-[#1d1d1f] mt-1 mb-2.5">
                Tech talent & specialized teams.
              </p>
              <p className="text-[14px] text-[#86868b] leading-relaxed font-normal">
                Deploy pre-vetted software engineers, IT specialists, and dedicated technical teams for contract, project, and permanent placement in Singapore & the region.
              </p>
            </div>

            {/* Apple-styled Visual: Minimalist Talent Preview */}
            <div className="mt-8 pt-4">
              <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-2.5">
                {/* Talent Item 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-[15px] bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-[10px] bg-white border border-gray-200/80 p-1.5 flex items-center justify-center shadow-2xs shrink-0">
                      <HugeiconsIcon icon={DeveloperIcon} className="w-5 h-5 text-[#007AFF] stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-[#1d1d1f] leading-tight">Software Developers & Engineers</div>
                      <div className="text-[11px] text-[#86868b]">Full-Stack, Cloud, Mobile & AI</div>
                    </div>
                  </div>
                </div>

                {/* Talent Item 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-[15px] bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-[10px] bg-white border border-gray-200/80 p-1.5 flex items-center justify-center shadow-2xs shrink-0">
                      <HugeiconsIcon icon={UserCheck01Icon} className="w-5 h-5 text-[#007AFF] stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-[#1d1d1f] leading-tight">Specialised IT & Digital Roles</div>
                      <div className="text-[11px] text-[#86868b]">QA, DevOps, UI/UX & Tech Leads</div>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="flex items-center justify-between pt-1 px-1 text-[12px] text-[#86868b]">
                  <span>Flexible & Permanent Placement</span>
                  <span className="text-[#1d1d1f] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Hire talent <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: SOFTWARE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative bg-[#f5f5f7] rounded-[28px] md:rounded-[32px] p-7 md:p-9 flex flex-col justify-between min-h-[480px] md:min-h-[520px] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
          >
            {/* Content Top */}
            <div>
              <div className="text-[12px] font-semibold text-[#86868b] tracking-wider uppercase mb-2.5">
                Pillar 02
              </div>
              <h3 className="text-[24px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
                Software
              </h3>
              <p className="text-[15px] font-medium text-[#1d1d1f] mt-1 mb-2.5">
                Ready-to-use business products.
              </p>
              <p className="text-[14px] text-[#86868b] leading-relaxed font-normal">
                Pre-built suites designed to handle workforce management, accounting, payroll, and projects out of the box.
              </p>
            </div>

            {/* Apple-styled Visual: Minimalist App Modules */}
            <div className="mt-8 pt-4">
              <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-2.5">
                {/* App Row 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-[15px] bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-[10px] bg-white border border-gray-200/80 p-1.5 flex items-center justify-center shadow-2xs shrink-0">
                      <Image
                        src="/apps-logo/xentra-bluelogo.svg"
                        alt="Xentra People"
                        width={22}
                        height={22}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-[#1d1d1f] leading-tight">Xentra People</div>
                      <div className="text-[11px] text-[#86868b]">HR & Attendance</div>
                    </div>
                  </div>
                </div>

                {/* App Row 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-[15px] bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-[10px] bg-gradient-to-b from-[#27272a] via-[#18181b] to-[#09090b] border border-zinc-700/60 p-1.5 flex items-center justify-center shadow-2xs shrink-0">
                      <Image
                        src="/apps-logo/xentra_paynote.svg"
                        alt="Xentra Paynote"
                        width={22}
                        height={22}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-[#1d1d1f] leading-tight">Xentra Paynote</div>
                      <div className="text-[11px] text-[#86868b]">Financial Intelligence</div>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="flex items-center justify-between pt-1 px-1 text-[12px] text-[#86868b]">
                  <span>Turnkey Deployment</span>
                  <span className="text-[#1d1d1f] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Explore products <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CARD 3: TECHNOLOGY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative bg-[#f5f5f7] rounded-[28px] md:rounded-[32px] p-7 md:p-9 flex flex-col justify-between min-h-[480px] md:min-h-[520px] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)]"
          >
            {/* Content Top */}
            <div>
              <div className="text-[12px] font-semibold text-[#86868b] tracking-wider uppercase mb-2.5">
                Pillar 03
              </div>
              <h3 className="text-[24px] md:text-[28px] font-semibold text-[#1d1d1f] tracking-tight">
                Technology
              </h3>
              <p className="text-[15px] font-medium text-[#1d1d1f] mt-1 mb-2.5">
                Custom websites & software solutions.
              </p>
              <p className="text-[14px] text-[#86868b] leading-relaxed font-normal">
                We build high-performance customized websites, digital platforms, and tailor-made business software for companies across every industry.
              </p>
            </div>

            {/* Apple-styled Visual: Customized Websites & Software Preview */}
            <div className="mt-8 pt-4">
              <div className="bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.04] space-y-2.5">
                {/* Custom Item 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-[15px] bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-[10px] bg-white border border-gray-200/80 p-1.5 flex items-center justify-center shadow-2xs shrink-0">
                      <HugeiconsIcon icon={WebDesign01Icon} className="w-5 h-5 text-[#007AFF] stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-[#1d1d1f] leading-tight">Custom Websites & Portals</div>
                      <div className="text-[11px] text-[#86868b]">Tailored Web Experiences</div>
                    </div>
                  </div>
                </div>

                {/* Custom Item 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-[15px] bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-[10px] bg-white border border-gray-200/80 p-1.5 flex items-center justify-center shadow-2xs shrink-0">
                      <HugeiconsIcon icon={LaptopProgrammingIcon} className="w-5 h-5 text-[#007AFF] stroke-[1.8]" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-medium text-[#1d1d1f] leading-tight">Custom Business Software</div>
                      <div className="text-[11px] text-[#86868b]">Scalable Systems & Workflows</div>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="flex items-center justify-between pt-1 px-1 text-[12px] text-[#86868b]">
                  <span>Built for All Businesses</span>
                  <span className="text-[#1d1d1f] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Start build <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
