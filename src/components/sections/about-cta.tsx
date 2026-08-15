"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function AboutCtaSection() {
  return (
    <section id="cta" className="w-full py-24 md:py-32 px-6 md:px-10 bg-[#0a0a0a] flex justify-center font-text relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-full flex justify-between">
          <div className="w-[1px] h-full bg-white/[0.03]" />
          <div className="w-[1px] h-full bg-white/[0.03]" />
          <div className="w-[1px] h-full bg-white/[0.03]" />
        </div>
        {/* Glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="max-w-[1000px] w-full relative z-10 flex flex-col items-center text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-6xl lg:text-[72px] font-bold text-white tracking-tight leading-[1.05] mb-8"
        >
          Ready to build <br /> something remarkable?
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-[18px] md:text-[20px] text-white/60 font-medium leading-relaxed max-w-2xl mb-12"
        >
          Let's discuss your technology needs. Whether it's scaling your engineering team or building enterprise software from the ground up, we're ready.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link 
            href="/contact" 
            className="inline-flex items-center gap-4 bg-white hover:bg-gray-100 text-[#0a0a0a] px-8 py-4 rounded-full transition-all duration-300 font-bold text-[16px] group shadow-[0_8px_30px_rgba(255,255,255,0.12)] hover:shadow-[0_8px_40px_rgba(255,255,255,0.2)]"
          >
            Start a Conversation
            <div className="bg-[#0a0a0a] text-white rounded-full p-1.5 group-hover:scale-110 transition-transform duration-300">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
