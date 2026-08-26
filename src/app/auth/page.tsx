"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserRemove01Icon, UserAdd01Icon, Shield01Icon, FingerPrintIcon } from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";
import { getURL } from "@/lib/utils";
function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const nextUrl = searchParams.get("next") || "/dashboard";
  const initialEmailParam = searchParams.get("email") || "";
  const initialTabParam = (searchParams.get("tab") as "signin" | "signup") || "signin";
  const isPromptAccountNotFound = searchParams.get("prompt") === "account_not_found" || searchParams.get("error") === "unauthenticated";

  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "otp">(initialTabParam);
  const [email, setEmail] = useState(initialEmailParam);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUserNotFound, setIsUserNotFound] = useState(isPromptAccountNotFound);
  const [timer, setTimer] = useState(0);
  const [resendAttempt, setResendAttempt] = useState(0);

  const handleNavigateNext = (url: string) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      window.location.href = url;
    } else {
      router.push(url);
      router.refresh();
    }
  };

  // Check if user is already signed in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        handleNavigateNext(nextUrl);
      }
    });
  }, [supabase, router, nextUrl]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTab, timer]);

  const handleContinue = async () => {
    setErrorMsg("");
    setIsUserNotFound(false);
    setIsLoading(true);

    if (activeTab === "signup") {
      if (!firstName.trim() || !lastName.trim() || !companyName.trim()) {
        setErrorMsg("Please fill in your first name, last name, and company name.");
        setIsLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            companyName: companyName.trim(),
          },
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("user already registered") ||
          error.message.toLowerCase().includes("already exists")
        ) {
          setErrorMsg("This email is already registered. Please sign in.");
          setActiveTab("signin");
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
        email: email,
        password: password,
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
        }
        handleNavigateNext(nextUrl);
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
      
      handleNavigateNext(nextUrl);
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    const nextPath = encodeURIComponent(nextUrl);
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
      handleNavigateNext(nextUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to sign in with passkey");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
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
      setTimer(60);
      setResendAttempt((prev) => prev + 1);
    }
    setIsLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newOtp = [...otpValues];
      newOtp[index] = "";
      setOtpValues(newOtp);
      return;
    }

    if (cleaned.length > 1) {
      const newOtp = [...otpValues];
      for (let i = 0; i < cleaned.length && index + i < 6; i++) {
        newOtp[index + i] = cleaned[i];
      }
      setOtpValues(newOtp);
      const nextIndex = Math.min(index + cleaned.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const char = cleaned.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = char;
    setOtpValues(newOtp);

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

    const newOtp = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpValues(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] dark:bg-zinc-950 p-4 sm:p-6 select-none font-text">
      
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <div className="dark:brightness-0 dark:invert">
          <Image
            src="/company_logo/DortAsiaLogo.svg"
            alt="DORT Asia"
            width={140}
            height={44}
            className="h-10 w-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[440px] bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 p-8 sm:p-10 flex flex-col items-center"
      >
        {/* User Account Not Found Alert Banner */}
        <AnimatePresence>
          {isUserNotFound && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/90 dark:border-rose-800/60 flex flex-col gap-2 text-left overflow-hidden"
            >
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={UserRemove01Icon} size={15} strokeWidth={2} />
                </div>
                <span className="text-[14px] font-semibold">Uh oh! User account not found</span>
              </div>
              <p className="text-[12.5px] text-gray-600 dark:text-gray-300 leading-relaxed">
                {email ? (
                  <>
                    No DORT Asia account found for <span className="font-semibold text-gray-900 dark:text-white">{email}</span>. Please verify your credentials or create a new account.
                  </>
                ) : (
                  <>You need an active DORT Asia account to access this service. Please sign in or create a new account below.</>
                )}
              </p>
              {activeTab === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsUserNotFound(false);
                    setErrorMsg("");
                    setActiveTab("signup");
                  }}
                  className="mt-1 py-2 px-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full shadow-xs"
                >
                  <HugeiconsIcon icon={UserAdd01Icon} size={15} strokeWidth={2} />
                  <span>Sign up for a new DORT Asia account</span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Selector */}
        {activeTab !== "otp" && (
          <div className="flex items-center justify-center mx-auto mb-6 bg-[#f5f5f7] dark:bg-zinc-800 rounded-full p-1 w-fit">
            <button
              type="button"
              onClick={() => {
                setActiveTab("signin");
                setErrorMsg("");
              }}
              className={`px-6 py-2 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
                activeTab === "signin"
                  ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrorMsg("");
              }}
              className={`px-6 py-2 rounded-full text-[14px] font-semibold transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Sign up
            </button>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2 text-center">
          {activeTab === "otp"
            ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-emerald-500">✅</span> Account created
                </div>
              )
            : activeTab === "signin"
            ? "Sign in to DORT Asia"
            : "Create your DORT Asia account"}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
          {activeTab === "otp"
            ? (
                <>
                  We've sent a verification email to: <span className="font-semibold text-gray-900 dark:text-white">{email}</span><br />
                  Please verify your email to continue.
                </>
              )
            : activeTab === "signin"
            ? "Authenticate to access all connected applications."
            : "Get started with your universal DORT Asia identity."}
        </p>

        {errorMsg && !isUserNotFound && (
          <div className="mb-5 w-full p-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs text-left border border-red-500/20">
            {errorMsg}
          </div>
        )}

        {activeTab === "otp" ? (
          <div className="w-full flex flex-col items-center">
            <div className="flex items-center justify-center gap-2 mb-6 w-full">
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
                  className="w-11 h-12 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center text-lg font-semibold text-gray-900 dark:text-white transition-all"
                />
              ))}
            </div>

            <div className="flex items-center justify-between w-full mb-6 px-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setActiveTab("signin");
                }}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timer > 0 || isLoading}
                className={`font-semibold transition-colors ${
                  timer > 0
                    ? "text-gray-400 dark:text-zinc-500 cursor-not-allowed"
                    : "text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                }`}
              >
                {timer > 0 ? `Resend OTP in ${formatTime(timer)}` : "Resend OTP"}
              </button>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center font-semibold rounded-xl transition-colors text-sm cursor-pointer disabled:opacity-70 mb-3 shadow-xs"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full h-11 flex items-center justify-center gap-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors mb-3 cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            
            {/* Passkey / Biometrics Button */}
            <button
              type="button"
              onClick={handlePasskeySignIn}
              className="w-full h-11 flex items-center justify-center gap-3 bg-[#f5f5f7] hover:bg-[#e8e8ed] dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl transition-colors mb-5 cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              <HugeiconsIcon icon={FingerPrintIcon} className="w-5 h-5" />
              <span>Sign in with Passkey / Biometrics</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
              <span className="absolute bg-white dark:bg-zinc-900 px-3 text-xs text-gray-400 font-medium">or</span>
            </div>

            {/* Email & Password */}
            <div className="space-y-3 mb-6">
              {activeTab === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Name"
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                </>
              )}

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Company Email"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              {activeTab === "signup" && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-gray-200 dark:border-zinc-700 bg-transparent focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center font-semibold rounded-xl transition-colors text-sm cursor-pointer disabled:opacity-70 shadow-xs"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : activeTab === "signin" ? "Sign In" : "Create Dort Asia Account"}
            </button>
          </div>
        )}
      </motion.div>

      {/* Trust Footer */}
      <div className="mt-8 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <HugeiconsIcon icon={Shield01Icon} size={15} strokeWidth={2} className="text-emerald-500" />
        <span>Secure authentication</span>
        <span className="mx-1">&middot;</span>
        <span>DORT Single Sign-On</span>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-zinc-950">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
