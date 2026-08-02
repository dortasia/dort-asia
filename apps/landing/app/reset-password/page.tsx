"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FullPageLoader } from "@/components/ui/full-page-loader";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // 1. Password validation (Complexity)
    const hasCap = /[A-Z]/.test(password);
    const hasSmall = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasCap || !hasSmall || !hasNum || !hasSpecial) {
      setErrorMsg("Password must contain: at least one capital letter, one small letter, one number, and one special character.");
      return;
    }

    // 2. Anti-Spoofing (Blacklist "admin")
    const lowerPass = password.toLowerCase();
    if (lowerPass.includes("admin")) {
      setErrorMsg("Password is Too Weak, Try Another");
      return;
    }

    // Note: We skip personal info checking here because we would typically need 
    // to fetch the user's data first, but basic string checks still apply.

    // 3. Match validation
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Setup real supabase reset logic here
      // await supabase.auth.updateUser({ password: password });
      
      setTimeout(() => {
        setSuccessMsg("Password updated successfully! Redirecting...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }, 1000);
    } catch (err: any) {
      setErrorMsg("Failed to update password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <FullPageLoader messages={["Updating Password...", "Securing your account...", "Finalizing changes..."]} />}
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
        initial="initial"
        animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
        className="w-full max-w-[440px]"
      >
        <motion.div variants={fadeUp} className="mb-8">
          <h1 className="text-[26px] font-bold text-slate-900 mb-2 tracking-tight">Update New Password</h1>
          <p className="text-[17px] text-slate-500 font-medium">Provide New Password to Secure your Account</p>
        </motion.div>

        {errorMsg && (
          <motion.div variants={fadeUp} className="p-3 mb-6 bg-red-50 text-red-600 border border-red-200 text-[13px] font-semibold rounded-[12px] text-center">
            {errorMsg}
          </motion.div>
        )}

        {successMsg && (
          <motion.div variants={fadeUp} className="p-3 mb-6 bg-green-50 text-green-600 border border-green-200 text-[13px] font-semibold rounded-[12px] text-center">
            {successMsg}
          </motion.div>
        )}

        <form className="space-y-4" onSubmit={handleUpdatePassword}>
          <motion.div variants={fadeUp}>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all text-center"
              placeholder="New Password"
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all text-center"
              placeholder="Confirm Password"
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
      </motion.div>
    </main>
    </>
  );
}
