"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroup02Icon,
  OfficeIcon,
  Briefcase02Icon,
  Factory01Icon,
  Building06Icon,
  TeamWorkIcon,
  HierarchyCircle02Icon,
  WorkflowCircle01Icon,
  Structure01Icon,
} from "@hugeicons/core-free-icons";

const ANIMATED_WORDS = [
  { text: "Workforce", icon: UserGroup02Icon },
  { text: "Company", icon: OfficeIcon },
  { text: "Business", icon: Briefcase02Icon },
  { text: "Industry", icon: Factory01Icon },
  { text: "Enterprise", icon: Building06Icon },
  { text: "Team", icon: TeamWorkIcon },
  { text: "Organization", icon: HierarchyCircle02Icon },
  { text: "Operation", icon: WorkflowCircle01Icon },
  { text: "Workplace", icon: OfficeIcon },
  { text: "Department", icon: Structure01Icon },
];

export function Hero() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ANIMATED_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const currentWord = ANIMATED_WORDS[wordIndex];

  return (
    <section className="relative w-full pt-0 pb-8 px-[16px] bg-white">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full bg-white flex justify-center border-none outline-none ring-0 shadow-none"
      >
        {/* Hero landscape background image */}
        <Image
          src="/img_assets/hero-section-img.avif"
          alt="Dort Asia Hero Section"
          width={2880}
          height={1600}
          className="w-full h-auto object-contain block rounded-t-none rounded-b-2xl border-none outline-none ring-0 shadow-none"
          priority
          quality={100}
        />

        {/* Hero Content Overlay */}
        <div className="absolute top-[24%] md:top-[22%] lg:top-[20%] left-0 right-0 px-6 flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl md:text-3xl lg:text-[40px] font-bold text-[#0a1128] tracking-tight text-center leading-[1.3] flex flex-wrap items-center justify-center gap-y-1"
          >
            <span className="mr-2">One Platform. Every</span>

            {/* Apple-styled Tumbler Animated Pill Bar */}
            <span className="inline-flex items-center relative overflow-hidden h-[44px] md:h-[50px] lg:h-[54px] px-4 md:px-5 py-1 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100/60 align-middle">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord.text}
                  initial={{ y: 35, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -35, opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  className="flex items-center gap-2.5 whitespace-nowrap text-[#2b7fff] font-semibold text-2xl md:text-3xl lg:text-[38px] [font-family:var(--font-sf-pro-rounded)] tracking-normal"
                >
                  <HugeiconsIcon
                    icon={currentWord.icon}
                    className="w-5 h-5 md:w-6 md:h-6 text-[#2b7fff] shrink-0 stroke-[2.2]"
                  />
                  <span>{currentWord.text}</span>
                </motion.span>
              </AnimatePresence>
            </span>

            <span className="ml-0.5">. Infinite Possibilities.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[14px] md:text-[16px] text-gray-500 max-w-[760px] text-center mt-3.5 leading-relaxed font-medium"
          >
            We deliver business software, digital solutions, and skilled technology professionals that help organizations strengthen operations, accelerate innovation, and scale.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-7 flex items-center bg-white rounded-full p-1.5 shadow-none max-w-md w-full mx-auto"
          >
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 bg-transparent border-none outline-none text-[14.5px] font-medium text-gray-800 placeholder:text-gray-400 px-5 py-2 min-w-0"
            />
            <button className="bg-[#2b7fff] hover:bg-[#1a6eff] text-white px-6 py-2.5 rounded-full font-medium text-[14.5px] tracking-tight transition-colors whitespace-nowrap shadow-none">
              Request
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
