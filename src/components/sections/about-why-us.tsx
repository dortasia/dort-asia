"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "Top 1%", label: "Vetted Tech Talent" },
  { value: "3x", label: "Faster Deployment" },
  { value: "99.9%", label: "System Reliability" },
];

export function AboutWhyUsSection() {
  return (
    <section id="why-us" className="w-full py-24 md:py-32 px-6 md:px-10 bg-white flex justify-center font-text">
      <div className="max-w-[1400px] w-full flex flex-col lg:flex-row gap-12 lg:gap-24">
        
        {/* Left Column: Heading & Context */}
        <div className="lg:w-1/2 flex flex-col justify-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-sm font-semibold text-[#86868b] uppercase tracking-wider mb-6"
          >
            Why DORT Asia
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-[56px] font-bold text-[#1d1d1f] tracking-tight leading-[1.05] mb-8"
          >
            Beyond just code. <br className="hidden md:block" />
            A true technology partner.
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[17px] md:text-[18px] text-[#1d1d1f]/70 font-medium leading-relaxed max-w-lg"
          >
            We bridge the gap between business strategy and technical execution. Whether you need elite engineering talent or a custom enterprise platform, we take ownership of the outcomes to ensure technology drives your bottom line.
          </motion.p>
        </div>

        {/* Right Column: Key Differentiators / Stats */}
        <div className="lg:w-1/2 flex flex-col gap-6">
          {/* Main Differentiator Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#1d1d1f] text-white p-10 md:p-12 rounded-[32px] flex flex-col justify-center min-h-[300px] relative overflow-hidden"
          >
            {/* Subtle background glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
            
            <h4 className="text-2xl md:text-[28px] font-bold tracking-tight mb-4 leading-[1.2]">
              Engineering Excellence
            </h4>
            <p className="text-[16px] text-white/70 font-medium leading-relaxed">
              We adhere to stringent architectural standards. From proprietary cloud infrastructure to autonomous AI automations, our solutions are rigorously tested to guarantee enterprise-grade security and scale.
            </p>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {stats.slice(0, 2).map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 + 0.2 }}
                className="bg-[#f5f5f7] p-8 rounded-[32px] flex flex-col justify-center"
              >
                <div className="text-4xl md:text-[42px] font-bold text-[#1d1d1f] tracking-tighter mb-2">
                  {stat.value}
                </div>
                <div className="text-[14px] font-semibold text-[#1d1d1f]/50 uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
