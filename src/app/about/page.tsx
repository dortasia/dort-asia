"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AboutBentoSection } from "@/components/sections/about-bento";
import { AboutOfferingsSection } from "@/components/sections/about-offerings";
import { AboutCapabilitiesSection } from "@/components/sections/about-capabilities";
import { AboutApproachSection } from "@/components/sections/about-approach";
import { AboutWhyUsSection } from "@/components/sections/about-why-us";
import { AboutLeadershipSection } from "@/components/sections/about-leadership";
import { AboutCtaSection } from "@/components/sections/about-cta";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white font-text flex flex-col justify-between relative">
      <Navbar />

      {/* Body 1: Our Purpose (Hero Section) */}
      <section id="purpose" className="relative w-full py-24 md:py-32 px-6 md:px-10 overflow-hidden isolate min-h-[900px] md:min-h-[1020px] flex flex-col justify-center">
        {/* Full-Fit Background Image Container */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          <Image
            src="/img_assets/about-us.avif"
            alt="About Us Background"
            fill
            className="object-cover object-top"
            priority
          />
          {/* Subtle gradient overlay with gentle top/bottom blend and soft left vignette for typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#032338]/35 via-transparent to-transparent pointer-events-none" />
        </div>

        <div className="w-full relative z-10">
          {/* Left-Aligned Header Section Vertically Centered */}
          <div className="text-left max-w-2xl lg:max-w-3xl">
            {/* Clean Minimalist Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-[58px] font-bold text-white tracking-[-0.03em] leading-[1.08] mb-6 drop-shadow-[0_4px_24px_rgba(0,30,60,0.45)]"
            >
              Technology That Moves<br className="hidden sm:inline" />
              {" "}Businesses Forward
            </motion.h1>

            {/* Refined Minimalist Subtitle */}
            <div className="space-y-4 max-w-2xl">
              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="text-[16px] md:text-[17.5px] text-white/95 font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,25,50,0.4)]"
              >
                DORT Asia exists to help businesses solve real operational and technology challenges by bringing together software, digital innovation, and skilled talent under one platform.
              </motion.p>

              <motion.p 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.18 }}
                className="text-[15px] md:text-[16.5px] text-white/85 font-normal leading-relaxed drop-shadow-[0_2px_10px_rgba(0,25,50,0.4)]"
              >
                We combine practical technology solutions with experienced professionals to help organizations improve operations, build new capabilities, and scale with confidence.
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Body 2: What We Do */}
      <AboutOfferingsSection />

      {/* Body 3: What We Help Businesses Achieve */}
      <AboutBentoSection />

      {/* Body 4: Technology Capabilities */}
      <AboutCapabilitiesSection />

      {/* Body 5: Our Approach */}
      <AboutApproachSection />

      {/* Body 6: Why DORT Asia */}
      <AboutWhyUsSection />

      {/* Leadership: Company Lead */}
      <AboutLeadershipSection />

      {/* Body 7: CTA */}
      <AboutCtaSection />

      <Footer />
    </main>
  );
}
