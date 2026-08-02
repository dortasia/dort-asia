"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import dortLogo from "@/public/DortAsiaOfflLogo.svg";

interface FullPageLoaderProps {
  messages?: string[];
}

export function FullPageLoader({ messages = ["Loading..."] }: FullPageLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const intervalId = setInterval(() => {
      setPhraseIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center min-h-screen">
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
        <motion.div 
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#007AFF] border-r-[#007AFF]"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />
        <div className="w-10 h-10 relative z-10 flex items-center justify-center animate-pulse">
            <Image src={dortLogo} alt="Dort Asia" width={32} height={32} className="w-full h-full object-contain" />
        </div>
      </div>
      <div className="h-8 relative flex items-center justify-center w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-[15px] font-bold text-slate-800 text-center absolute"
          >
            {messages[phraseIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
