"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

function KoboyoUserKeyIllustration() {
  return (
    <div className="flex items-center justify-center mb-6 text-[#0071E3] dark:text-[#0A84FF]">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        aria-label="User key"
        viewBox="0 0 181 138"
        className="h-14 w-auto transition-transform duration-300 hover:scale-105 drop-shadow-xs"
      >
        <path d="M54.7 7a35 35 0 0 0-22.6 18.9 38 38 0 0 0-.4 27.3C39.4 70 60.2 78.3 76 70.8a34 34 0 0 0 16.9-16c2.7-5.3 3.1-7.2 3.1-14.3 0-4.9-.6-10-1.6-12.9A39 39 0 0 0 76.8 9a41 41 0 0 0-22.1-2m18.7 6.4a28 28 0 0 1 14.6 14c3 6.1 3.2 7.2 2.8 14A26 26 0 0 1 81.4 61c-5.7 5-11 7-18.4 7a28 28 0 0 1-25.8-16.3c-2.7-5.6-3-16.8-.7-22.3 6-14.5 23.2-21.9 36.9-16m68 58.5c-7.6 3.4-13.6 14.2-12.1 21.8.4 2.4-.7 3.9-8.9 11.8l-9.4 9v7.1c0 4.1.5 7.5 1.2 8.2s4.2 1.2 8.8 1.2c8.3 0 11-1.4 11-5.8q-.2-2.4 2.4-2.2c3 0 5.9-2.7 5.2-4.7q-.6-1.5 2.4-2.6c1.7-.6 3.2-1.8 3.5-2.7.4-1.1 1.6-1.4 5.2-1.2 6.1.4 14.8-3.8 18.1-8.7a21.3 21.3 0 0 0-7.9-31.2c-5-2.5-14-2.5-19.5 0m17.5 5.1c5.2 2.6 8.1 7.5 8.1 13.4a15 15 0 0 1-6.7 13.3c-3.4 2.6-4.3 2.8-11.5 2.6-7.7-.1-8.3.1-7.9 3.4.1.8-.9 1.3-2.2 1.3-3.1 0-5.1 2.3-4.2 4.9.5 1.7.1 2-3.2 2.3-3.6.3-3.8.5-4.1 4.1l-.3 3.7H117v-4.9c0-4.8.1-4.9 9.4-14s9.4-9.2 8.5-12.9c-3-13.1 11.6-23.6 24-17.2"/>
        <path d="M149.5 86c-3.8 4.2 2.5 10 6.6 5.9q3.5-3.3.3-6.3c-2.1-2.2-4.7-2-6.9.4m-102-3.9a46 46 0 0 0-29.9 15.1 38 38 0 0 0-9.3 23.9c-.5 6.7-.4 7.9 1.1 8.5 3 1.2 4.3-1.3 4.8-9.4 1-15.9 11.4-27.5 28.6-31.6 8.4-2.1 27.3-2.9 36.7-1.6a47 47 0 0 1 20.6 7.6c1.6 1.9 4.8 1.8 5.6-.3 1.3-3.4-10.4-9.9-21.6-11.9-8.4-1.5-27.3-1.6-36.6-.3"/>
      </svg>
    </div>
  );
}

function MFAChallengeForm() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const nextUrl = (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) 
    ? rawNext 
    : "/dashboard";

  const supabase = createClient();

  useEffect(() => {
    checkAAL();
  }, []);

  const checkAAL = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;

      if (data.currentLevel === "aal2") {
        router.push(nextUrl);
        return;
      }

      if (data.nextLevel !== "aal2") {
        router.push(nextUrl);
        return;
      }

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factorsData.totp.find(f => f.status === "verified");
      if (!totpFactor) {
        setErrorMsg("No verified authenticator app found for this account.");
        setIsLoading(false);
        return;
      }

      setFactorId(totpFactor.id);
      setIsLoading(false);
      
      // Auto-focus first digit box
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    } catch (e: any) {
      setErrorMsg("Failed to verify security credentials.");
      setIsLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    setErrorMsg("");
    const cleanVal = val.replace(/\D/g, "");
    
    if (!cleanVal) {
      const newDigits = [...digits];
      newDigits[index] = "";
      setDigits(newDigits);
      return;
    }

    // Single digit input
    const char = cleanVal[cleanVal.length - 1];
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto advance to next box
    if (index < 5 && char) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 6 digits entered
    const completeCode = newDigits.join("");
    if (completeCode.length === 6 && !newDigits.includes("")) {
      submitCode(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move to previous box if current is empty
        digitInputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      submitCode(pasted);
    } else {
      const nextIdx = Math.min(pasted.length, 5);
      digitInputRefs.current[nextIdx]?.focus();
    }
  };

  const submitCode = async (codeToVerify: string) => {
    if (!factorId || codeToVerify.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    setErrorMsg("");

    try {
      const challengeRes = await supabase.auth.mfa.challenge({ factorId });
      if (challengeRes.error) throw challengeRes.error;

      const verifyRes = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeRes.data.id,
        code: codeToVerify,
      });

      if (verifyRes.error) throw verifyRes.error;

      await fetch("/api/auth/record-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authMethod: "mfa_totp" }),
      }).catch(err => console.error("Failed to record login security event", err));

      router.push(nextUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMsg("Incorrect verification code. Please check your authenticator app.");
      setIsVerifying(false);
      setDigits(Array(6).fill(""));
      digitInputRefs.current[0]?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = digits.join("");
    if (fullCode.length === 6) {
      submitCode(fullCode);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/login-method', { method: 'DELETE' }).catch(() => {});
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
        <p className="text-[13.5px] text-gray-500 font-medium">Checking security requirements...</p>
      </div>
    );
  }

  const isComplete = digits.every(d => d !== "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[440px] bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_16px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border border-gray-100 dark:border-zinc-800/80 p-8 sm:p-10 flex flex-col items-center text-center relative"
    >
      {/* Koboyo User Key Illustration */}
      <KoboyoUserKeyIllustration />

      {/* Typography */}
      <h1 className="text-[23px] sm:text-[25px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
        Two-Step Verification
      </h1>
      <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-[310px] leading-relaxed mb-7">
        Enter the 6-digit code generated by your authenticator app to complete sign in.
      </p>

      {/* 6-Digit Passcode Input Grid (Apple 2FA Style with 10px radius) */}
      <form onSubmit={handleManualSubmit} className="w-full flex flex-col items-center">
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-6 w-full max-w-[340px]">
          {/* First Group of 3 Digits */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[0, 1, 2].map((idx) => (
              <input
                key={idx}
                ref={(el) => {
                  digitInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digits[idx]}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                className={`w-11 h-13 sm:w-12 sm:h-14 rounded-[10px] border text-center font-mono text-[22px] font-semibold transition-all duration-150 outline-none select-none ${
                  digits[idx]
                    ? "border-gray-400/90 dark:border-zinc-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs"
                    : "border-gray-200 dark:border-zinc-700/80 bg-gray-50/80 dark:bg-zinc-800/50 text-gray-900 dark:text-white"
                } focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15 focus:bg-white dark:focus:bg-zinc-800`}
              />
            ))}
          </div>

          {/* Apple-style middle separator dot/dash */}
          <div className="w-2.5 flex items-center justify-center">
            <span className="w-1.5 h-0.5 rounded-full bg-gray-300 dark:bg-zinc-600" />
          </div>

          {/* Second Group of 3 Digits */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[3, 4, 5].map((idx) => (
              <input
                key={idx}
                ref={(el) => {
                  digitInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={1}
                value={digits[idx]}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                className={`w-11 h-13 sm:w-12 sm:h-14 rounded-[10px] border text-center font-mono text-[22px] font-semibold transition-all duration-150 outline-none select-none ${
                  digits[idx]
                    ? "border-gray-400/90 dark:border-zinc-500 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs"
                    : "border-gray-200 dark:border-zinc-700/80 bg-gray-50/80 dark:bg-zinc-800/50 text-gray-900 dark:text-white"
                } focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15 focus:bg-white dark:focus:bg-zinc-800`}
              />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="w-full mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[13px] font-medium border border-rose-200/80 dark:border-rose-800/50 text-center"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Controls */}
        <div className="w-full space-y-3 pt-1">
          <button
            type="submit"
            disabled={!isComplete || isVerifying}
            className="w-full h-[48px] bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] text-white font-medium rounded-full transition-all text-[15px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,113,227,0.25)]"
          >
            {isVerifying ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[2.2]" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-[13.5px] font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer py-1.5"
          >
            Cancel and sign out
          </button>
        </div>
      </form>
    </motion.div>
  );
}

export default function MFAPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-text">
      {/* Brand Header with SVG Logo */}
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="dark:brightness-0 dark:invert transition-opacity hover:opacity-85">
          <Image
            src="/company_logo/DortAsiaLogo.svg"
            alt="DORT Asia"
            width={140}
            height={44}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      {/* Main Apple MFA Card */}
      <Suspense fallback={
        <div className="w-full max-w-[440px] h-[460px] bg-white dark:bg-zinc-900 rounded-[32px] border border-gray-100 dark:border-zinc-800 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
        </div>
      }>
        <MFAChallengeForm />
      </Suspense>

      {/* Subtle Security Trust Footer */}
      <div className="mt-8 text-center">
        <p className="text-[12.5px] text-gray-400 dark:text-gray-500 font-medium">
          Protected by DORT Asia Universal SSO
        </p>
      </div>
    </div>
  );
}

