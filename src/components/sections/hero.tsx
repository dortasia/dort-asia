"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ANIMATED_WORDS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/work-with-us?email=${encodeURIComponent(email.trim())}`);
    } else {
      router.push('/work-with-us');
    }
  };

  const currentWord = ANIMATED_WORDS[wordIndex];

  return (
    <section className="relative w-full pt-0 pb-4 md:pb-8 px-0 md:px-[16px] bg-white overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full bg-white flex justify-center border-none outline-none ring-0 shadow-none"
      >
        {/* Desktop landscape hero background image */}
        <Image
          src="/img_assets/hero-section-img.avif"
          alt="Dort Asia Hero Section"
          width={2880}
          height={1600}
          className="w-full h-auto object-contain hidden md:block rounded-t-none rounded-b-2xl border-none outline-none ring-0 shadow-none"
          priority
          quality={100}
        />

        {/* Mobile portrait hero background image */}
        <Image
          src="/img_assets/hero-section-mobile.avif"
          alt="Dort Asia Hero Section"
          width={941}
          height={1672}
          className="w-full h-auto object-contain block md:hidden border-none outline-none ring-0 shadow-none"
          priority
          quality={100}
        />

        {/* Hero Content Overlay */}
        <div className="absolute top-[6%] xs:top-[7%] sm:top-[9%] md:top-[22%] lg:top-[20%] left-0 right-0 px-4 sm:px-6 flex flex-col items-center z-10">
          <h1 className="sr-only">
            One Platform. Every Business. Infinite Possibilities.
          </h1>

          {/* Mobile Apple-style Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="md:hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-gray-200/80 text-[11px] xs:text-[12px] font-semibold text-[#1d1d1f] tracking-wide uppercase mb-2.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2b7fff]" />
            <span>Software & Tech Talent</span>
          </motion.div>

          {/* Mobile-Optimized Clean Typography Layout */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="md:hidden flex flex-col items-center text-center"
          >
            <span className="text-[25px] xs:text-[29px] font-bold text-[#0a1128] tracking-tight leading-tight">
              One Platform.
            </span>

            <div className="flex items-center justify-center gap-2 my-1 xs:my-1.5">
              <span className="text-[25px] xs:text-[29px] font-bold text-[#0a1128] tracking-tight leading-none">
                Every
              </span>

              {/* Apple-styled Tumbler Animated Pill Bar for Mobile */}
              <span className="inline-flex items-center justify-center relative overflow-hidden h-[40px] xs:h-[44px] min-w-[155px] xs:min-w-[175px] px-3.5 xs:px-4 py-0.5 rounded-full bg-white shadow-[0_4px_24px_rgba(0,0,0,0.09)] border border-gray-200/90 align-middle">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={currentWord.text}
                    initial={{ y: 22, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -22, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center gap-2 whitespace-nowrap text-[#2b7fff] font-bold text-[19px] xs:text-[22px] tracking-tight"
                  >
                    <HugeiconsIcon
                      icon={currentWord.icon}
                      className="w-4.5 h-4.5 xs:w-5 xs:h-5 text-[#2b7fff] shrink-0 stroke-[2.4]"
                    />
                    <span>{currentWord.text}</span>
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>

            <span className="text-[25px] xs:text-[29px] font-bold text-[#0a1128] tracking-tight leading-tight">
              Infinite Possibilities.
            </span>
          </motion.div>

          {/* Desktop Typography Layout (md and above) */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden md:flex text-3xl lg:text-[40px] font-bold text-[#0a1128] tracking-tight text-center leading-[1.3] flex-wrap items-center justify-center gap-y-1"
          >
            <span className="mr-2">One Platform. Every</span>

            {/* Apple-styled Tumbler Animated Pill Bar for Desktop */}
            <span className="inline-flex items-center relative overflow-hidden h-[50px] lg:h-[54px] px-5 py-1 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100/60 align-middle">
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWord.text}
                  initial={{ y: 35, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -35, opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  className="flex items-center gap-2.5 whitespace-nowrap text-[#2b7fff] font-semibold text-3xl lg:text-[38px] tracking-normal"
                >
                  <HugeiconsIcon
                    icon={currentWord.icon}
                    className="w-6 h-6 text-[#2b7fff] shrink-0 stroke-[2.2]"
                  />
                  <span>{currentWord.text}</span>
                </motion.span>
              </AnimatePresence>
            </span>

            <span className="ml-0.5">. Infinite Possibilities.</span>
          </motion.div>

          {/* Subtitle / Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-[13.5px] xs:text-[14.5px] md:text-[16px] text-[#4b5563] md:text-gray-500 max-w-[340px] xs:max-w-[380px] sm:max-w-[500px] md:max-w-[760px] text-center mt-2.5 xs:mt-3 leading-relaxed font-normal px-2 sm:px-0"
          >
            We deliver business software, digital solutions, and skilled technology professionals that help organizations strengthen operations, accelerate innovation, and scale.
          </motion.p>

          {/* Mobile Dual Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="mt-4 flex items-center justify-center gap-2.5 w-full max-w-[310px] mx-auto md:hidden"
          >
            <Link
              href="/work-with-us"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1d1d1f] active:bg-black text-white text-[13.5px] font-semibold rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all"
            >
              <span>Work With Us</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-white/95 active:bg-white text-[#1d1d1f] text-[13.5px] font-semibold rounded-full border border-gray-200/90 shadow-2xs transition-all"
            >
              <span>Pricing</span>
            </Link>
          </motion.div>

          {/* Desktop Email Input Bar */}
          <motion.form
            onSubmit={handleRequest}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-7 hidden md:flex items-center bg-white rounded-full p-1.5 md:shadow-none max-w-md w-full mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email..."
              className="flex-1 bg-transparent border-none outline-none text-[14.5px] font-medium text-gray-800 placeholder:text-gray-400 px-5 py-2 min-w-0"
            />
            <button
              type="submit"
              className="bg-[#2b7fff] hover:bg-[#1a6eff] text-white px-6 py-2.5 rounded-full font-semibold text-[14.5px] tracking-tight transition-colors whitespace-nowrap shadow-none cursor-pointer"
            >
              Request
            </button>
          </motion.form>
        </div>
      </motion.div>
    </section>
  );
}
