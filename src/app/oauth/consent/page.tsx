"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowRight01Icon,
  Shield01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/utils/supabase/client";

function ConsentContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isDenied, setIsDenied] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  // Support all variants of query param for authorization/consent id
  const authorizationId = 
    searchParams.get("consent_id") || 
    searchParams.get("id") || 
    searchParams.get("authorization_id");

  useEffect(() => {
    // Detect and apply system or browser dark/light mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    handleThemeChange(mediaQuery);
    mediaQuery.addEventListener("change", handleThemeChange);
    return () => mediaQuery.removeEventListener("change", handleThemeChange);
  }, []);
  const initRan = useRef(false);

  useEffect(() => {
    async function init() {
      if (initRan.current) return;
      initRan.current = true; // MUST SET TO TRUE TO PREVENT DOUBLE EXECUTION
      
      try {
        if (!authorizationId) {
          console.error("Missing authorization ID. Current URL params:", Object.fromEntries(searchParams.entries()));
          setError(`No authorization ID provided in the URL.`);
          setLoading(false);
          return;
        }

        // Check if user is logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // If not logged in, redirect to auth page with properly encoded return path
          const nextUrl = encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`);
          router.push(`/auth?next=${nextUrl}`);
          return;
        }

        setCurrentUser(user);

        // Fetch actual OAuth authorization details from Supabase using manual fetch for deeper error logs
        const { data: sessionData } = await supabase.auth.getSession();
        const jwt = sessionData.session?.access_token;
        
        let authDetails = null;
        let detailsError = null;

        if (jwt) {
          try {
            const res = await fetch(`https://zirmlijktxaboztjojed.supabase.co/auth/v1/oauth/authorizations/${authorizationId}`, {
              headers: {
                Authorization: `Bearer ${jwt}`,
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              }
            });
            const text = await res.text();
            console.error("RAW SUPABASE OAUTH RESPONSE:", res.status, text);
            if (!res.ok) {
              detailsError = new Error(`Supabase Error ${res.status}: ${text}`);
            } else {
              // Parse the raw response
              let parsed = JSON.parse(text);
              // Sometimes the response might be a double-encoded string
              if (typeof parsed === 'string') {
                try {
                  parsed = JSON.parse(parsed);
                } catch (e) {
                  console.error("Failed to parse inner string JSON:", e);
                }
              }
              authDetails = parsed;
            }
          } catch (e: any) {
            detailsError = e;
          }
        } else {
          detailsError = new Error("No JWT session found");
        }

        if (detailsError) {
          console.error("Authorization details error:", detailsError);
          setError(`Invalid or expired authorization request: ${detailsError.message}`);
          setLoading(false);
          return;
        }

        if (!authDetails) {
          setError(`No authorization details found for this request.`);
          setLoading(false);
          return;
        }

        // If the user already authorized, Supabase returns the redirect_url directly.
        if (authDetails.redirect_url || authDetails.url) {
          window.location.href = authDetails.redirect_url || authDetails.url;
          return;
        }

        setDetails(authDetails);
      } catch (err: any) {
        setError(err?.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [authorizationId, router, supabase, searchParams]);

  const handleApprove = async () => {
    if (!authorizationId || isAuthorizing) return;
    setIsAuthorizing(true);
    
    try {
      // Approve via Supabase OAuth API

      const { data, error } = await supabase.auth.oauth.approveAuthorization(authorizationId);
      
      if (error) {
        console.error("Approve authorization error:", error);
        
        // Show the error on screen instead of automatically redirecting
        setError(`Failed to authorize: ${error.message} (Are you sure DORT Asia Site URL is correct in Supabase?)`);
        setLoading(false);
        setIsAuthorizing(false);
        return;
      }
      
      const redirectUrl = (data as any)?.url || (data as any)?.redirect_url || (data as any)?.redirect_to;
      if (redirectUrl) {
        // Allow the authentication connecting animation to play before redirect
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1200);
      } else {
        // Fallback if no redirect URL provided in response
        const xentraUrl = process.env.NEXT_PUBLIC_XENTRA_PEOPLE_URL || "http://localhost:3000";
        setTimeout(() => {
          window.location.href = xentraUrl;
        }, 1200);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to authorize");
      setIsAuthorizing(false);
    }
  };

  const handleDeny = async () => {
    if (!authorizationId || isAuthorizing) return;
    setIsDenied(true);
    try {
      const { data, error } = await supabase.auth.oauth.denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setIsDenied(false);
      } else {
        const redirectUrl = (data as any)?.url || (data as any)?.redirect_to;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to cancel");
      setIsDenied(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#000000] transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#007AFF] dark:border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#6E6E73] dark:text-[#86868B]">Loading authorization details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const xentraUrl = process.env.NEXT_PUBLIC_XENTRA_PEOPLE_URL || "http://localhost:3000";
    const isNoLongerPending = 
      error.toLowerCase().includes("no longer pending") || 
      error.toLowerCase().includes("cannot be processed") || 
      error.toLowerCase().includes("expired");

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#000000] px-4 transition-colors duration-200 font-sans">
        <div className="bg-white dark:bg-[#1C1C1E] p-8 sm:p-10 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] border border-black/[0.06] dark:border-white/[0.08] max-w-[440px] w-full text-center flex flex-col items-center">
          
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-5 shadow-xs">
            <HugeiconsIcon icon={AlertCircleIcon} size={28} strokeWidth={2} />
          </div>

          <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
            {isNoLongerPending ? "Session Expired or Completed" : "Authorization Error"}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 text-[13.5px] leading-relaxed mb-6">
            {isNoLongerPending
              ? "This authorization request is no longer active because it was already completed or has expired. Please return to Xentra People to continue."
              : error}
          </p>

          <button 
            type="button"
            onClick={() => {
              window.location.href = `${xentraUrl}/login`;
            }}
            className="h-12 px-5 bg-[#007AFF] hover:bg-[#007AFF]/90 active:bg-[#007AFF]/95 dark:bg-[#0A84FF] dark:hover:bg-[#0A84FF]/90 text-white font-semibold text-sm rounded-xl w-full transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Return to Xentra People</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  const userAvatar = 
    currentUser?.user_metadata?.avatar_url ||
    currentUser?.user_metadata?.picture ||
    currentUser?.identities?.[0]?.identity_data?.avatar_url ||
    currentUser?.identities?.[0]?.identity_data?.picture ||
    null;

  const userEmail = currentUser?.email || "";
  const appName = details?.client?.client_name || details?.app_name || "Xentra People";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F7] dark:bg-[#000000] px-4 select-none transition-colors duration-200">
      <AnimatePresence mode="wait">
        {isAuthorizing ? (
          /* Exact Authenticating Animation View */
          <motion.div
            key="authenticating-view"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="bg-white dark:bg-[#1C1C1E] p-10 sm:p-14 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] border border-black/[0.06] dark:border-white/[0.08] max-w-[560px] w-full flex flex-col items-center text-center backdrop-blur-xl"
          >
            <h2 className="text-lg sm:text-xl font-medium text-[#6E6E73] dark:text-[#86868B] mb-12 tracking-tight">
              Authenticating your account
            </h2>

            <div className="flex items-center justify-between gap-4 sm:gap-8 w-full max-w-[460px] px-2">
              {/* DORT Asia Logo */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center shrink-0"
              >
                <div className="dark:brightness-0 dark:invert">
                  <Image
                    src="/company_logo/DortAsiaLogo.svg"
                    alt="DORT Asia"
                    width={120}
                    height={46}
                    className="h-10 sm:h-11 w-auto object-contain"
                    priority
                  />
                </div>
              </motion.div>

              {/* Animated Dashed Bridge with flowing energy beam */}
              <div className="relative flex-1 flex items-center justify-center min-w-[70px] sm:min-w-[110px] mx-2">
                {/* Dashed Line */}
                <div className="w-full border-t-2 border-dashed border-gray-300 dark:border-zinc-700" />
                
                {/* Flowing Laser / Glowing Energy Pulse */}
                <motion.div
                  animate={{
                    x: ["-70%", "70%"],
                    opacity: [0, 1, 1, 0],
                    scale: [0.7, 1.25, 1.25, 0.7]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut"
                  }}
                  className="absolute w-3 h-3 rounded-full bg-[#007AFF] dark:bg-[#0A84FF] shadow-[0_0_12px_#007AFF] border-2 border-white dark:border-[#1C1C1E]"
                />
              </div>

              {/* Xentra People Logo */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center shrink-0"
              >
                <div className="dark:brightness-0 dark:invert">
                  <Image
                    src="/apps-logo/xentra-blue-full-logo.svg"
                    alt="Xentra People"
                    width={140}
                    height={38}
                    className="h-8 sm:h-9 w-auto object-contain"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* Consent Approval Card */
          <motion.div
            key="consent-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#1C1C1E] p-8 sm:p-10 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.4)] border border-black/[0.06] dark:border-white/[0.08] max-w-[440px] w-full relative overflow-hidden backdrop-blur-xl"
          >
            {/* User Profile + App Logo Crossing Header */}
            <div className="flex items-center justify-center mb-6 pt-2">
              <div className="relative flex items-center justify-center">
                
                {/* User Profile Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm bg-gray-100 dark:bg-zinc-800/80 border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center shrink-0 z-0 relative">
                  {userAvatar && !avatarError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={userAvatar}
                      alt="User Profile"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-xl flex items-center justify-center">
                      {(userEmail.charAt(0) || "U").toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Connecting Crossing Badge */}
                <div className="w-9 h-9 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] shadow-sm -mx-3.5 z-10 relative overflow-hidden">
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 7H8a4 4 0 0 0-4 4v1" />
                      <polyline points="17 4 20 7 17 10" />
                      <path d="M4 17h12a4 4 0 0 0 4-4v-1" />
                      <polyline points="7 20 4 17 7 14" />
                    </svg>
                  </div>
                </div>

                {/* Xentra App Logo - Circular with White/Dark BG and Subtle Stroke */}
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] shadow-sm flex items-center justify-center p-3.5 shrink-0 z-0">
                  <Image
                    src="/apps-logo/xentra-bluelogo.svg"
                    alt="Xentra Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                {appName}
              </h1>
              <p className="text-[#6E6E73] dark:text-[#86868B] mt-1.5 text-sm leading-relaxed">
                is requesting access to your DORT Asia account
              </p>
              {userEmail && (
                <p className="text-xs font-medium text-[#86868B] dark:text-[#6E6E73] mt-1">
                  Signed in as <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">{userEmail}</span>
                </p>
              )}
            </div>

            {/* Permissions */}
            <div className="mb-6 border-t border-b border-black/[0.06] dark:border-white/[0.08] py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] dark:text-[#6E6E73] mb-3">
                This application will be able to:
              </h3>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-3 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Read your basic profile information</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Read your email address</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeny}
                disabled={isAuthorizing || isDenied}
                className="flex-1 h-11 px-5 border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#2C2C2E]/60 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] active:bg-gray-100 dark:active:bg-[#3A3A3C] text-[#1D1D1F] dark:text-[#F5F5F7] font-medium text-sm rounded-[12px] transition-all duration-150 active:scale-[0.98] shadow-2xs disabled:pointer-events-none disabled:opacity-40 cursor-pointer flex items-center justify-center"
              >
                {isDenied ? "Canceling..." : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isAuthorizing || isDenied}
                className="flex-1 h-11 px-5 bg-[#007AFF] hover:bg-[#007AFF]/90 active:bg-[#007AFF]/95 dark:bg-[#0A84FF] dark:hover:bg-[#0A84FF]/90 active:scale-[0.98] text-white font-medium text-sm rounded-[12px] transition-all duration-150 shadow-xs border border-blue-600/20 dark:border-blue-400/20 flex items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              >
                {isAuthorizing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin size-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authorizing...</span>
                  </span>
                ) : (
                  <span>Authorize</span>
                )}
              </button>
            </div>
            
            <p className="text-[11px] text-center text-[#86868B] dark:text-[#6E6E73] mt-5">
              Only authorize applications you trust.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ConsentContent />
    </Suspense>
  );
}
