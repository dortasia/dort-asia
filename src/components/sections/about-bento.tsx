"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function AboutBentoSection() {
  return (
    <section id="what-we-achieve" className="w-full py-16 md:py-24 px-6 md:px-10 bg-white flex justify-center font-text">
      <div className="max-w-[1400px] w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Tall Card - Partnership */}
          <motion.div 
            initial={{ opacity: 0, y: 35, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="lg:w-[29%] bg-[#f5f5f7] rounded-[32px] overflow-hidden flex flex-col"
          >
            <div className="w-full relative overflow-hidden flex items-start justify-center">
              <motion.div
                initial={{ scale: 1.08, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.15, ease: "easeOut" }}
                className="w-full"
              >
                <Image 
                  src="/img_assets/handshake.avif" 
                  alt="Partnership" 
                  width={600} 
                  height={400} 
                  className="w-full h-auto object-cover"
                  priority
                />
              </motion.div>
            </div>
            <div className="p-8 md:p-10 lg:p-12 flex flex-col gap-4 mt-auto">
              <h3 className="text-3xl md:text-[34px] font-bold text-[#1d1d1f] leading-[1.1] tracking-tight">
                Partnership<br/>That Powers Growth
              </h3>
              <p className="text-[17px] text-[#1d1d1f]/60 leading-relaxed font-medium mt-2">
                We build long-term partnerships with businesses by delivering reliable technology, solutions, and talent.
              </p>
              
              <div className="mt-8">
                <Link href="/contact" className="inline-flex items-center gap-3 bg-[#1d1d1f] hover:bg-black text-white px-5 py-3 rounded-full transition-colors font-medium text-[15px] group">
                  Work With Us
                  <div className="bg-white text-black rounded-full p-1 group-hover:scale-105 transition-transform">
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Increased Width Cards */}
          <div className="lg:w-[71%] flex flex-col gap-6">
            
            {/* Top Row of Right Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              
              {/* Earth Card */}
              <motion.div 
                initial={{ opacity: 0, y: 35, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#f5f5f7] rounded-[32px] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[340px]"
              >
                <div className="w-[60%] relative z-10">
                  <h3 className="text-2xl md:text-[28px] font-bold text-[#1d1d1f] leading-[1.15] tracking-tight mb-4">
                    Global Perspective<br/>Local Impact
                  </h3>
                  <p className="text-[16px] text-[#1d1d1f]/60 leading-relaxed font-medium">
                    Delivering technology and workforce solutions that create value across businesses and borders.
                  </p>
                </div>
                <motion.div 
                  initial={{ scale: 0.85, opacity: 0, rotate: -6 }}
                  whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-4 md:right-6 bottom-4 md:bottom-6 w-[45%] h-[65%] flex items-end justify-end pointer-events-none"
                >
                  <Image 
                    src="/img_assets/earth.avif" 
                    alt="Global Perspective" 
                    width={400} 
                    height={400} 
                    className="object-contain drop-shadow-xl w-full h-full object-right-bottom"
                  />
                </motion.div>
              </motion.div>

              {/* Chess Card */}
              <motion.div 
                initial={{ opacity: 0, y: 35, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#f5f5f7] rounded-[32px] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[340px]"
              >
                <div className="w-[60%] relative z-10">
                  <h3 className="text-2xl md:text-[28px] font-bold text-[#1d1d1f] leading-[1.15] tracking-tight mb-4">
                    Integrity in<br/>Everything We Do
                  </h3>
                  <p className="text-[16px] text-[#1d1d1f]/60 leading-relaxed font-medium">
                    We operate with transparency, accountability, and a commitment to doing what's right.
                  </p>
                </div>
                {/* Chess image elevated by 16px (bottom-[16px]) with smooth entrance */}
                <motion.div 
                  initial={{ y: 24, opacity: 0, scale: 0.92 }}
                  whileInView={{ y: 0, opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-4 md:right-6 bottom-[16px] w-[38%] h-[80%] flex items-end justify-end pointer-events-none"
                >
                  <Image 
                    src="/img_assets/chess.avif" 
                    alt="Integrity" 
                    width={300} 
                    height={400} 
                    className="object-contain drop-shadow-xl h-full w-auto object-right-bottom"
                  />
                </motion.div>
              </motion.div>

            </div>

            {/* Bottom Row - Compute Setup */}
            <motion.div 
              initial={{ opacity: 0, y: 35, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#f5f5f7] rounded-[32px] p-8 md:p-10 lg:p-12 relative overflow-hidden flex flex-col justify-center min-h-[340px]"
            >
              <div className="md:w-[45%] relative z-10">
                <h3 className="text-[28px] md:text-[34px] font-bold text-[#1d1d1f] leading-[1.15] tracking-tight mb-4">
                  Technology. Solutions.<br/>Talent. All in One.
                </h3>
                <p className="text-[17px] text-[#1d1d1f]/60 leading-relaxed font-medium">
                  From business software to digital solutions and skilled professionals — we provide everything businesses need to build, operate, and grow.
                </p>
              </div>
              
              {/* Desktop image position */}
              <motion.div 
                initial={{ x: 28, opacity: 0, scale: 0.94 }}
                whileInView={{ x: 0, opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.46, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:flex absolute right-0 top-0 bottom-0 w-[55%] items-center justify-end pointer-events-none py-8 pr-4 md:pr-8"
              >
                <Image 
                  src="/img_assets/compute-setup.avif" 
                  alt="Compute Setup" 
                  width={700} 
                  height={500} 
                  className="object-contain drop-shadow-2xl w-full h-full object-right"
                />
              </motion.div>
              
              {/* Mobile image position */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="md:hidden mt-8 w-full flex justify-center pointer-events-none relative z-10"
              >
                <Image 
                  src="/img_assets/compute-setup.avif" 
                  alt="Compute Setup" 
                  width={500} 
                  height={400} 
                  className="object-contain w-full h-auto drop-shadow-xl"
                />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
