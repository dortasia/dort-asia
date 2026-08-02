"use client";

import React from "react";
import { motion } from "framer-motion";
import { Newspaper, Bell } from "lucide-react";
import { Footer } from "@/components/layout/footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function NewsRoomPage() {
  return (
    <div className="pt-[100px] lg:pt-[140px] bg-slate-50 min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center py-24 px-5">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="w-24 h-24 bg-blue-100 text-[#007AFF] rounded-[24px] flex items-center justify-center mx-auto mb-10 shadow-sm border border-blue-200">
            <Newspaper className="w-12 h-12" />
          </div>
          
          <h1 className="text-[36px] sm:text-[46px] lg:text-[54px] font-[800] text-slate-900 tracking-tight leading-[1.1] mb-6">
            Something Big is <br className="hidden sm:block" />
            <span className="text-[#007AFF]">Coming Soon</span>
          </h1>
          
          <p className="text-[17px] text-slate-500 font-medium leading-relaxed max-w-xl mx-auto mb-12">
            We are working hard to bring you the latest news, updates, and deep dives from the Dort Asia ecosystem. Our News Room will be launching very soon!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="h-[55px] px-8 flex items-center justify-center bg-[#007AFF] text-white font-bold rounded-[15px] hover:bg-blue-600 transition-all active:scale-95 text-[16px] gap-2 shadow-lg shadow-blue-500/20">
              <Bell className="w-5 h-5" />
              Notify Me
            </button>
            <a href="/" className="h-[55px] px-8 flex items-center justify-center bg-white text-slate-900 font-bold rounded-[15px] hover:bg-slate-50 border border-slate-200 transition-all active:scale-95 text-[16px]">
              Back to Home
            </a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
