"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthLayout from "@/components/layout/auth-layout";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import forgotIllust from "@/public/ForgottPassPage.svg";
import otpIllust from "@/public/OTPVectorArt.svg";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempt, setResendAttempt] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => {
        setResendTimer(t => t - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendTimer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  /* --- Email Step Handlers --- */

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMsg("Please enter a valid company email address.");
      setLoading(false);
      return;
    }

    try {
      // Simulate sending OTP
      setTimeout(() => {
        setSuccessMsg("OTP sent to your email.");
        setLoading(false);
        setStep("otp");
      }, 1000);
    } catch (err) {
      setErrorMsg("Network error. Please try again later.");
      setLoading(false);
    }
  };

  /* --- OTP Step Handlers --- */

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    const token = otp.join("");
    if (token.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    // Add real verification logic here later
    setTimeout(() => {
      setSuccessMsg("OTP Verified! Redirecting...");
      setTimeout(() => {
        router.push("/reset-password"); // Next step after OTP verification
      }, 500);
      setLoading(false);
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      setTimeout(() => {
        setSuccessMsg("A new OTP has been sent to your email.");
        const waitTime = 180 * Math.pow(2, resendAttempt);
        setResendTimer(waitTime);
        setResendAttempt(prev => prev + 1);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      setErrorMsg("Failed to resend OTP.");
      setLoading(false);
    }
  };

  /* --- Render --- */

  if (step === "otp") {
    return (
      <>
        {loading && <FullPageLoader messages={["Verifying OTP...", "Checking records...", "Securing connection..."]} />}
        <AuthLayout 
          title="Enter Your OTP" 
        subtitle="Verify it is you"
        type="forgot-password"
        illustration={otpIllust}
        hideBottomText={true}
      >
        <div className="space-y-8 mt-6 w-full max-w-[440px]">
          {errorMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-red-50 text-red-600 border border-red-200 text-[13px] font-semibold rounded-[12px] text-center">
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-green-50 text-green-600 border border-green-200 text-[13px] font-semibold rounded-[12px] text-center">
              {successMsg}
            </motion.div>
          )}



          <motion.div variants={fadeUp}>
            <div className="flex justify-between gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  disabled={loading}
                  className="w-14 h-16 bg-white border border-gray-200 rounded-[18px] text-center text-2xl font-bold text-slate-900 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all placeholder:text-gray-100 disabled:opacity-50"
                  placeholder="0"
                />
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-between px-1">
             <button 
               type="button"
               onClick={() => {
                 setErrorMsg("");
                 setSuccessMsg("");
                 setOtp(["", "", "", "", "", ""]);
                 setStep("email");
               }}
               disabled={loading}
               className="text-[16px] font-normal text-[#007AFF] hover:underline disabled:opacity-50"
             >
               Edit Details
             </button>
             <button 
               type="button"
               onClick={handleResendOtp}
               disabled={loading || resendTimer > 0} 
               className={`text-[16px] font-normal transition-colors ${resendTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-[#007AFF] hover:underline"}`}
             >
               {resendTimer > 0 ? `Resend OTP (${formatTimer(resendTimer)})` : "Resend OTP"}
             </button>
          </motion.div>

          <motion.button 
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full py-[15px] bg-[#007AFF] text-white font-bold rounded-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300 text-[18px] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Verify
          </motion.button>
        </div>
      </AuthLayout>
      </>
    );
  }

  // default "email" step
  return (
    <>
      {loading && <FullPageLoader messages={["Sending OTP...", "Connecting to servers..."]} />}
      <AuthLayout 
        title="Forgot your Password ?" 
      subtitle="Provide the details to move forward"
      type="forgot-password"
      illustration={forgotIllust}
      hideBottomText={true}
    >
      <div className="space-y-6 mt-6">
        <form className="space-y-4" onSubmit={handleEmailSubmit}>
          
          {errorMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-[12px] text-center">
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-green-50 border border-green-200 text-green-600 text-[13px] font-semibold rounded-[12px] text-center">
              {successMsg}
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="text-[14px] font-medium text-[#6D6D6D] mb-4 text-center">
            Enter the Email Address of yours
          </motion.div>

          <motion.div variants={fadeUp}>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/\s/g, ""))}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
              required
              className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
              placeholder="Enter Email"
            />
          </motion.div>

          <motion.button 
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            type="submit"
            className="w-[200px] mx-auto block py-[14px] bg-[#007AFF] text-white font-bold rounded-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300 text-[16px] mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Continue
          </motion.button>
        </form>
      </div>
    </AuthLayout>
    </>
  );
}
