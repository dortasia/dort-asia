"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import authIllustDefault from "@/public/SignUP.svg";
import logoImg from "@/public/DortAsiaLogo.svg";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: "login" | "register" | "forgot-password";
  illustration?: any;
  hideBottomText?: boolean;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export default function AuthLayout({ children, title, subtitle, type, illustration, hideBottomText }: AuthLayoutProps) {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left Side: Illustration */}
      <div className="hidden lg:flex flex-col items-end justify-center bg-white relative overflow-hidden p-12 lg:pr-20">
        <div className="absolute top-12 left-12 z-20">
          <Link href="/" className="flex items-center gap-1.5 group font-semibold text-[#075CDB] hover:text-[#064ab0] transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-[15px]">Back</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 w-full max-w-lg"
        >
          <Image 
            src={illustration || authIllustDefault} 
            alt="Dort Asia Auth" 
            className="w-full h-auto"
            priority
          />
        </motion.div>
      </div>

      {/* Right Side: Form Content */}
      <div className="flex flex-col items-start justify-center p-6 sm:p-10 lg:p-12 lg:pl-20 overflow-y-auto">
        <div className="w-full max-w-md">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.05 } }
            }}
          >
            <motion.div variants={fadeUp} className="mb-6 text-center">
              <Link href="/" className="inline-block mb-4 lg:hidden">
                <Image src={logoImg} alt="Dort Asia" className="h-7 w-auto mx-auto" />
              </Link>
              <h1 className="text-[28px] font-semibold text-[#030408] mb-1 tracking-tight">{title}</h1>
              <p className="text-[20px] text-[#6D6D6D] font-normal">{subtitle}</p>
            </motion.div>

            {children}

            {!hideBottomText && (
              <motion.p variants={fadeUp} className="mt-6 text-center text-[13px] text-[#142F5D] font-medium">
                {type === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <Link href="/register" className="text-[#075CDB] font-bold hover:underline">
                      Create Account
                    </Link>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#075CDB] font-bold hover:underline">
                      Sign In
                    </Link>
                  </>
                )}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
