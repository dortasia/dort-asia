"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import AuthLayout from "@/components/layout/auth-layout";
import { FullPageLoader } from "@/components/ui/full-page-loader";

import { createClient } from "@/utils/supabase/client";
import { hrmsUrl, isTrustedRedirect } from "@/utils/routes";

const fadeUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

export default function LoginPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for existing session or logout parameter
  useEffect(() => {
    const handleAuth = async () => {
      try {
        const pendingFlow = localStorage.getItem("dort_pending_flow");
        if (pendingFlow) {
          router.replace("/register");
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const isLogout = params.get("logout") === "true";
        const supabase = createClient();

        if (isLogout) {
          // Log out from landing page and clear query parameter
          await supabase.auth.signOut();
          router.replace("/login");
          setCheckingSession(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // If redirected from HRMS, send user back to HRMS with auth tokens
          const redirectTarget = params.get("redirect");
          if (redirectTarget) {
            const dest =
              redirectTarget === "hrms"
                ? hrmsUrl(session)
                : isTrustedRedirect(redirectTarget)
                ? redirectTarget
                : null;
            if (dest) {
              window.location.href = dest;
              return;
            }
          }

          // Check if this user is a Super Admin (has a companies row)
          // or a regular employee — employees go straight to HRMS
          const { data: companyData } = await supabase
            .from("companies")
            .select("id")
            .eq("super_admin_id", session.user.id)
            .maybeSingle();

          if (companyData) {
            // Super Admin → landing home page
            router.replace("/");
          } else {
            // Employee → redirect directly to HRMS with session tokens
            window.location.href = hrmsUrl(session);
          }
        } else {
          setCheckingSession(false);
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setCheckingSession(false);
      }
    };

    handleAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    // Email validation
    if (!email.includes("@") || !email.includes(".")) {
      setErrorMsg("Please enter a valid company email address.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data.session) {
        // Check if there is a redirect target first
        const redirectTarget = new URLSearchParams(window.location.search).get("redirect");
        if (redirectTarget) {
          const dest =
            redirectTarget === "hrms"
              ? hrmsUrl(data.session)
              : isTrustedRedirect(redirectTarget)
              ? redirectTarget
              : null;
          if (dest) {
            window.location.href = dest;
            return;
          }
        }

        // Check if this user is a Super Admin (has a companies row)
        // or a regular employee — employees go straight to HRMS
        const { data: companyData } = await supabase
          .from("companies")
          .select("id")
          .eq("super_admin_id", data.session.user.id)
          .maybeSingle();

        if (companyData) {
          // Super Admin → landing home page
          router.push("/");
        } else {
          // Employee → redirect directly to HRMS with session tokens
          window.location.href = hrmsUrl(data.session);
        }
      } else {
        router.push("/");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {(loading || checkingSession) && (
        <FullPageLoader 
          messages={
            checkingSession 
              ? ["Checking session...", "Redirecting to workspace..."] 
              : ["Authenticating...", "Checking credentials...", "Checking access level...", "Redirecting to workspace..."]
          } 
        />
      )}
      <AuthLayout 
        title="WELCOME BACK" 
        subtitle="Provide Credentials to get in"
        type="login"
      >
      <div className="space-y-6 mt-4">
        <form className="space-y-4" onSubmit={handleLogin}>
          
          {errorMsg && (
            <motion.div variants={fadeUp} className="p-3 bg-red-50 border border-red-200 text-red-600 text-[13px] font-semibold rounded-[12px] text-center">
              {errorMsg}
            </motion.div>
          )}

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
              placeholder="Registered Email"
            />
          </motion.div>

          <motion.div variants={fadeUp}>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full px-6 py-[14px] bg-white border border-gray-200 rounded-[18px] text-[15px] font-medium text-slate-900 placeholder:text-slate-300 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/5 outline-none transition-all"
              placeholder="Password"
            />
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
               <input 
                 type="checkbox" 
                 id="remember" 
                 checked={rememberMe}
                 onChange={(e) => setRememberMe(e.target.checked)}
                 className="w-5 h-5 rounded-[6px] border-gray-300 text-[#007AFF] focus:ring-[#007AFF]/20 cursor-pointer transition-all" 
               />
               <label htmlFor="remember" className="text-[14px] font-medium text-[#6D6D6D] cursor-pointer">Remember me</label>
             </div>
             <Link href="/forgot-password" className="text-[14px] font-semibold text-[#6D6D6D] hover:text-[#007AFF] transition-colors">
               Forgot Password ?
             </Link>
          </motion.div>

          <motion.button 
            variants={fadeUp}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            type="submit"
            className="w-full py-[15px] bg-[#007AFF] text-white font-bold rounded-[15px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all duration-300 text-[16px] mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            Continue
          </motion.button>
        </form>

        <motion.div variants={fadeUp} className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-[13px]">
            <span className="px-3 bg-white text-slate-500 font-medium">or sign in with</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
           <motion.button 
             type="button"
             variants={fadeUp}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={async () => {
               const supabase = createClient();
               await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/api/auth/callback` } });
             }}
             className="flex items-center justify-center gap-3 px-4 py-3 bg-[#F8F9FA] border border-gray-100 rounded-full hover:bg-gray-50 transition-all cursor-pointer"
           >
             <svg width="18" height="18" viewBox="0 0 18 18">
               <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.248h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
               <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.248c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
               <path d="M3.964 10.717c-.18-.54-.282-1.117-.282-1.717s.102-1.177.282-1.717V4.951H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.049l3.007-2.332z" fill="#FBBC05"/>
               <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.048.957 4.951l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
             </svg>
             <span className="text-[14px] font-semibold text-slate-700">Google</span>
           </motion.button>

           <motion.button 
             type="button"
             variants={fadeUp}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
             onClick={async () => {
               const supabase = createClient();
               await supabase.auth.signInWithOAuth({ provider: 'azure', options: { redirectTo: `${window.location.origin}/api/auth/callback` } });
             }}
             className="flex items-center justify-center gap-3 px-4 py-3 bg-[#F8F9FA] border border-gray-100 rounded-full hover:bg-gray-50 transition-all cursor-pointer"
           >
             <svg width="18" height="18" viewBox="0 0 23 23">
               <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
               <path fill="#f35325" d="M1 1h10v10H1z"/>
               <path fill="#81bc06" d="M12 1h10v10H12z"/>
               <path fill="#05a6f0" d="M1 12h10v10H1z"/>
               <path fill="#ffba08" d="M12 12h10v10H12z"/>
             </svg>
             <span className="text-[14px] font-semibold text-slate-700">Microsoft</span>
           </motion.button>
         </div>
      </div>
    </AuthLayout>
    </>
  );
}
