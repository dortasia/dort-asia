"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { completeRecoveryEnrollment } from "@/app/dashboard/settings/security/recovery-actions";

export default function RecoverySetupPage() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const isEnrollingRef = useRef(false);

  useEffect(() => {
    startEnrollment();
  }, []);

  const startEnrollment = async () => {
    if (isEnrollingRef.current) return;
    isEnrollingRef.current = true;
    
    try {
      // Create a new factor for the recovered account
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Dort Asia Authenticator (Recovery)",
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        if (data.totp) {
          setQrCodeUri(data.totp.uri);
          setManualSecret(data.totp.secret);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize recovery setup. Please try again.");
    } finally {
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

    const char = cleanVal[cleanVal.length - 1];
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (index < 5 && char) {
      digitInputRefs.current[index + 1]?.focus();
    }

    const completeCode = newDigits.join("");
    if (completeCode.length === 6 && !newDigits.includes("")) {
      submitCode(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
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
      // Create challenge
      const challengeRes = await supabase.auth.mfa.challenge({ factorId });
      if (challengeRes.error) throw challengeRes.error;

      // Complete enrollment via server action (consumes recovery token and unenrolls old factors)
      const res = await completeRecoveryEnrollment(factorId, challengeRes.data.id, codeToVerify);
      
      if (!res.success) {
        throw new Error(res.error || "Failed to verify new authenticator.");
      }

      // Success, session is now natively AAL2
      router.push("/dashboard/settings/account");
      router.refresh();
      
    } catch (err: any) {
      setErrorMsg(err.message || "Incorrect verification code. Please check your app.");
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

  const copyToClipboard = () => {
    if (manualSecret) {
      navigator.clipboard.writeText(manualSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/login-method', { method: 'DELETE' }).catch(() => {});
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const isComplete = digits.every(d => d !== "");

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-zinc-950 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-text">
      {/* Brand Header */}
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

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] bg-white dark:bg-zinc-900 rounded-[32px] shadow-[0_16px_50px_-12px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-zinc-800/80 p-8 sm:p-10 flex flex-col items-center text-center relative"
      >
        <h1 className="text-[23px] sm:text-[25px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
          Setup New Authenticator
        </h1>
        <p className="text-[14px] text-gray-500 dark:text-gray-400 max-w-[310px] leading-relaxed mb-7">
          Scan the QR code below with your authenticator app to complete the recovery process.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0071E3] mb-4" />
            <p className="text-[13.5px] text-gray-500 font-medium">Generating secure key...</p>
          </div>
        ) : (
          <div className="w-full">
            {qrCodeUri && (
              <div className="flex flex-col items-center mb-6">
                <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm mb-4">
                  <QRCodeSVG value={qrCodeUri} size={160} />
                </div>
                
                <div className="w-full max-w-[280px]">
                  <p className="text-[12.5px] text-gray-500 text-center mb-2">
                    Can&apos;t scan? Enter this key manually
                  </p>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/80 rounded-lg p-2.5">
                    <code className="text-[13px] font-mono text-gray-800 dark:text-gray-200 flex-1 text-center tracking-wider truncate">
                      {manualSecret}
                    </code>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer flex-shrink-0"
                    >
                      {copied ? (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

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

                {/* Separator */}
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
                    className="w-full mb-5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[13px] font-medium border border-rose-200/80 dark:border-rose-800/50 text-center flex items-center justify-center gap-2"
                  >
                    <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Controls */}
              <div className="w-full space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={!isComplete || isVerifying || !factorId}
                  className="w-full h-[48px] bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] text-white font-medium rounded-full transition-all text-[15px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(0,113,227,0.25)]"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Verify and Recover</span>
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
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[12.5px] text-gray-400 dark:text-gray-500 font-medium">
          Protected by DORT Asia Universal SSO
        </p>
      </div>
    </div>
  );
}
