"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SynopsisItem {
  id: string;
  label: string;
}

const SYNOPSIS_ITEMS: SynopsisItem[] = [
  { id: "purpose", label: "Our Purpose" },
  { id: "what-we-do", label: "What We Do" },
  { id: "what-we-achieve", label: "What We Achieve" },
  { id: "capabilities", label: "Capabilities" },
  { id: "approach", label: "Our Approach" },
  { id: "why-us", label: "Why DORT Asia" },
  { id: "leadership", label: "Leadership" },
  { id: "cta", label: "Get in Touch" },
];

export function PageSynopsisCard() {
  const [activeId, setActiveId] = useState<string>("overview");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sidebar once scrolled past 250px
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Track active section
      const sectionElements = SYNOPSIS_ITEMS.map((item) => ({
        id: item.id,
        el: document.getElementById(item.id),
      })).filter((item) => item.el !== null);

      const scrollPosition = window.scrollY + 250;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const item = sectionElements[i];
        if (item.el && item.el.offsetTop <= scrollPosition) {
          setActiveId(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed left-6 md:left-10 top-1/2 -translate-y-1/2 z-40 hidden 2xl:flex flex-col font-text w-[200px]"
        >
          {/* List of synopsis items */}
          <div className="flex flex-col space-y-3">
            {SYNOPSIS_ITEMS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-left transition-all flex flex-col group ${
                    isActive
                      ? "text-[#1d1d1f] font-medium text-[16px] scale-[1.02]"
                      : "text-[#86868b] hover:text-[#1d1d1f] font-normal text-[14px]"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
