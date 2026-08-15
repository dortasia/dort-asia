"use client";

import { motion } from "framer-motion";

const phases = [
  {
    number: "01",
    title: "Discovery & Strategy",
    description: "We dive deep into your operational challenges, aligning technology initiatives with your core business objectives to ensure maximum ROI.",
  },
  {
    number: "02",
    title: "Engineering & Build",
    description: "Our multidisciplinary teams execute with precision, utilizing modern architectures to deliver scalable, secure, and robust solutions.",
  },
  {
    number: "03",
    title: "Scale & Optimize",
    description: "We streamline performance, optimize infrastructure bottlenecks, and expand technical capacity to support rapid business growth.",
  },
  {
    number: "04",
    title: "Management & Support",
    description: "Continuous monitoring, proactive maintenance, and dedicated technical oversight to keep your platform resilient and evolving.",
  }
];

export function AboutApproachSection() {
  return (
    <section id="approach" className="w-full py-24 md:py-32 px-6 md:px-10 bg-[#fafafa] flex justify-center font-text relative overflow-hidden">
      <div className="max-w-[1400px] w-full relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-20 md:mb-28">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mb-4"
          >
            Our Approach
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-[44px] font-bold text-[#1d1d1f] tracking-tight leading-[1.15]"
          >
            Methodical execution. <br className="hidden md:block" />
            Measurable results.
          </motion.h3>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {phases.map((phase, index) => (
              <motion.div 
                key={phase.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: index * 0.15 + 0.2 }}
                className="relative flex flex-col items-center text-center sm:items-start sm:text-left group"
              >
                {/* Node Container with seamlessly aligned connecting line */}
                <div className="relative w-full flex justify-center sm:justify-start items-center mb-8">
                  {/* Node/Number Bubble */}
                  <div className="w-[88px] h-[88px] bg-white rounded-full flex items-center justify-center border border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.04)] relative z-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] shrink-0">
                    <span className="text-2xl font-bold text-[#1d1d1f] tracking-tighter">
                      {phase.number}
                    </span>
                  </div>

                  {/* Connecting Line to next node (Desktop only, omitted on the last step) */}
                  {index < phases.length - 1 && (
                    <div className="hidden lg:block absolute left-[44px] right-[-2.5rem] h-[1px] bg-black/[0.08] z-0 overflow-hidden">
                      <motion.div 
                        initial={{ scaleX: 0, transformOrigin: "left" }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.2 + 0.3, ease: "easeInOut" }}
                        className="w-full h-full bg-black/25"
                      />
                    </div>
                  )}
                </div>
                
                <h4 className="text-[20px] lg:text-[22px] font-bold text-[#1d1d1f] mb-4 tracking-tight">
                  {phase.title}
                </h4>
                <p className="text-[15px] lg:text-[16px] text-[#1d1d1f]/60 leading-relaxed font-medium">
                  {phase.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
