"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserRemove01Icon, UserAdd01Icon, Cancel01Icon, FingerPrintIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getURL } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup" | "otp";
  initialEmail?: string;
  redirectUrl?: string;
  promptAccountNotFound?: boolean;
}

export function AuthModal({ 
  isOpen, 
  onClose,
  initialTab = "signin",
  initialEmail = "",
  redirectUrl = "/dashboard",
  promptAccountNotFound = false,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "otp">(initialTab);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUserNotFound, setIsUserNotFound] = useState(promptAccountNotFound);
  const supabase = createClient();
  const router = useRouter();
  
  const [timer, setTimer] = useState(0);
  const [resendAttempt, setResendAttempt] = useState(0);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialTab) setActiveTab(initialTab);
    if (promptAccountNotFound) setIsUserNotFound(true);
  }, [initialEmail, initialTab, promptAccountNotFound]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab, timer]);

  const handleNavigateRedirect = (url: string) => {
    onClose();
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.location.href = url;
    } else {
      router.push(url);
      router.refresh();
    }
  };

  const handleContinue = async () => {
    setErrorMsg("");
    setIsUserNotFound(false);
    setIsLoading(true);

    if (activeTab === "signup") {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match");
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes("user already registered") || error.message.toLowerCase().includes("already exists")) {
          setErrorMsg("This email is already registered. Please sign in.");
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setTimer(60);
        setResendAttempt(1);
        setActiveTab("otp");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error) {
        await fetch("/api/auth/login-method", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "email" }),
        }).catch(err => console.error("Failed to set login method cookie", err));

        await fetch("/api/auth/record-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authMethod: "email_password" }),
        }).catch(err => console.error("Failed to record login security event", err));
      }

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed")) {
          setTimer(60);
          setResendAttempt(1);
          setActiveTab("otp");
          setErrorMsg("Email not confirmed yet. Please enter the OTP code.");
        } else if (
          error.message.toLowerCase().includes("invalid login credentials") || 
          error.message.toLowerCase().includes("user not found") ||
          error.message.toLowerCase().includes("invalid grant")
        ) {
          setIsUserNotFound(true);
          setErrorMsg("Uh oh! User account not found. Please sign in with valid credentials or create a new account.");
        } else {
          setErrorMsg(error.message);
        }
      } else {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
          window.location.href = "/auth/mfa";
          return;
        } else {
          handleNavigateRedirect(redirectUrl);
        }
      }
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async () => {
    setErrorMsg("");
    setIsLoading(true);
    const token = otpValues.join("");
    
    if (token.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit OTP");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      await fetch("/api/auth/record-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authMethod: "otp" }),
      }).catch(err => console.error("Failed to record login security event", err));
      handleNavigateRedirect(redirectUrl);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const nextPath = encodeURIComponent(redirectUrl);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getURL()}auth/callback?next=${nextPath}`,
      },
    });
  };

  const handlePasskeySignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMsg("");
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;

      await fetch("/api/auth/record-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authMethod: "passkey" }),
      }).catch(err => console.error("Failed to record login security event", err));

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === 'aal2' && aalData.currentLevel === 'aal1') {
        window.location.href = "/auth/mfa";
        return;
      }
      handleNavigateRedirect(redirectUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to sign in with passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setErrorMsg("");
    setIsLoading(true);
    
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Increase timer by 30 seconds for each subsequent attempt
      const nextTimer = 60 + (resendAttempt * 30);
      setTimer(nextTimer);
      setResendAttempt((prev) => prev + 1);
    }
    setIsLoading(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = "";
      setOtpValues(newOtpValues);
      return;
    }

    if (cleaned.length > 1) {
      const newOtpValues = [...otpValues];
      for (let i = 0; i < cleaned.length && index + i < 6; i++) {
        newOtpValues[index + i] = cleaned[i];
      }
      setOtpValues(newOtpValues);
      const nextIndex = Math.min(index + cleaned.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const char = cleaned.slice(-1);
    const newOtpValues = [...otpValues];
    newOtpValues[index] = char;
    setOtpValues(newOtpValues);

    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtpValues = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtpValues[i] = pastedData[i];
    }
    setOtpValues(newOtpValues);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          >
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[940px] h-[620px] bg-white rounded-[32px] border border-gray-100 flex overflow-hidden font-text shadow-none pointer-events-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-6 right-6 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors pointer-events-auto cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
              </button>

              {/* Left Pane - Image */}
              <div className="w-1/2 h-full p-4 hidden md:block">
                <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-blue-50">
                  <Image
                    src={activeTab === "otp" ? "/img_assets/otp-page-img.png" : "/img_assets/sign-in-up-img.avif"}
                    alt="Authentication"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Right Pane - Form */}
              <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-10 lg:px-14">
                
                {activeTab === "otp" ? (
                  <div className="flex flex-col items-center w-full max-w-[380px] mx-auto">
                    <h2 className="text-[26px] font-semibold text-center text-[#1d1d1f] mb-2">
                      Enter OTP
                    </h2>
                    <p className="text-[13.5px] text-gray-500 font-normal text-center mb-8">
                      Enter the OTP Sent to you Email address
                    </p>

                    {errorMsg && (
                      <div className="mb-4 text-center text-sm text-red-500 font-medium w-full">
                        {errorMsg}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-8 w-full">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpInputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          maxLength={1}
                          value={otpValues[index]}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                          className="w-[46px] h-[52px] sm:w-[50px] sm:h-[54px] rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center text-[18px] font-semibold text-gray-900 pointer-events-auto transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between w-full mb-8 px-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("signin")}
                        className="text-[13.5px] font-semibold text-[#2b7fff] hover:text-blue-700 transition-colors cursor-pointer pointer-events-auto"
                      >
                        Edit Details
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={timer > 0 || isLoading}
                        className={`text-[13.5px] font-semibold transition-colors pointer-events-auto ${
                          timer > 0 ? "text-gray-400 cursor-not-allowed" : "text-[#2b7fff] hover:text-blue-700 cursor-pointer"
                        }`}
                      >
                        {timer > 0 ? `Resend OTP in ${formatTime(timer)}` : "Resend OTP"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isLoading}
                      className="w-full h-[50px] bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center font-semibold rounded-xl transition-colors text-[15px] cursor-pointer pointer-events-auto disabled:opacity-70"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate"}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Toggle Pill */}
                    <div className="flex items-center justify-center mx-auto mb-8 bg-[#f5f5f7] rounded-full p-1 w-fit">
                      <button
                        type="button"
                        onClick={() => setActiveTab("signin")}
                        className={`px-6 py-2 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
                          activeTab === "signin"
                            ? "bg-white text-gray-900"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Sign in
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("signup")}
                        className={`px-6 py-2 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
                          activeTab === "signup"
                            ? "bg-white text-gray-900"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Sign up
                      </button>
                    </div>

                    <h2 className="text-[26px] font-semibold text-center text-[#1d1d1f] mb-6">
                      {activeTab === "signin" ? "Sign in to Get Start the Work!" : "Create your account"}
                    </h2>

                    <div className="text-center mb-4">
                      <span className="text-[13px] text-gray-400 font-normal">
                        {activeTab === "signin" ? "Sign in using" : "Sign up using"}
                      </span>
                    </div>

                    {isUserNotFound ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-800/60 flex flex-col gap-2 text-left"
                      >
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                          <div className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                            <HugeiconsIcon icon={UserRemove01Icon} size={15} strokeWidth={2} />
                          </div>
                          <span className="text-[13.5px] font-semibold">Uh oh! User account not found</span>
                        </div>
                        <p className="text-[12px] sm:text-[12.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
                          We couldn&apos;t find an account matching {email ? <span className="font-semibold text-gray-900 dark:text-white">{email}</span> : "your credentials"}. Please sign in to your DORT Asia account or register a new one.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserNotFound(false);
                            setErrorMsg("");
                            setActiveTab("signup");
                          }}
                          className="mt-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <HugeiconsIcon icon={UserAdd01Icon} size={15} strokeWidth={2} />
                          <span>Sign up for DORT Asia with this email</span>
                        </button>
                      </motion.div>
                    ) : (
                      errorMsg && (
                        <div className="mb-4 text-center text-sm text-red-500 font-medium">
                          {errorMsg}
                        </div>
                      )
                    )}

                    {/* Google Button */}
                    <button type="button" onClick={handleGoogleSignIn} className="w-full h-[46px] flex items-center justify-center gap-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-xl transition-colors mb-3 cursor-pointer pointer-events-auto">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="font-semibold text-[14px] text-gray-700">Google</span>
                    </button>

                    {/* Passkey Button */}
                    <button type="button" onClick={handlePasskeySignIn} className="w-full h-[46px] flex items-center justify-center gap-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-xl transition-colors mb-6 cursor-pointer pointer-events-auto">
                      <HugeiconsIcon icon={FingerPrintIcon} className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-[14px] text-gray-700">Sign in with Passkey</span>
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center mb-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative bg-white px-4 text-[13px] text-gray-400 font-normal">
                        or
                      </div>
                    </div>

                    {/* Form Inputs */}
                    <div className="space-y-3.5 mb-5">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Company email Address"
                        className="w-full h-[48px] px-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[14px] font-normal placeholder:font-normal placeholder:text-gray-400 text-gray-900 pointer-events-auto"
                      />
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full h-[48px] pl-4 pr-11 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[14px] font-normal placeholder:font-normal placeholder:text-gray-400 text-gray-900 pointer-events-auto"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto cursor-pointer p-1"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <Eye className="w-5 h-5 text-gray-400" />
                          ) : (
                            <EyeOff className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {activeTab === "signup" && (
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            className="w-full h-[48px] pl-4 pr-11 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[14px] font-normal placeholder:font-normal placeholder:text-gray-400 text-gray-900 pointer-events-auto"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto cursor-pointer p-1"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <Eye className="w-5 h-5 text-gray-400" />
                            ) : (
                              <EyeOff className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Links (Only for Sign in view) */}
                    {activeTab === "signin" && (
                      <div className="flex items-center justify-end mb-5 px-1">
                        <button type="button" className="text-[13px] font-semibold text-[#2b7fff] hover:text-blue-700 transition-colors pointer-events-auto cursor-pointer">
                          Forgot Password?
                        </button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button 
                      type="button"
                      onClick={handleContinue}
                      disabled={isLoading}
                      className="w-full h-[50px] bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center font-semibold rounded-xl transition-colors text-[15px] pointer-events-auto cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
