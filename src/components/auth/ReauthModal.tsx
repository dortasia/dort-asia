"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, InformationCircleIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Loader2 } from "lucide-react";

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
  hasEmailPassword: boolean;
  actionIntent: string; // Used to store intent in sessionStorage for OAuth redirect
  initialError?: string;
}

export function ReauthModal({ isOpen, onClose, onSuccess, userEmail, hasEmailPassword, actionIntent, initialError }: ReauthModalProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialError || "");

  // Update error message if initialError prop changes
  useEffect(() => {
    if (initialError) {
      setErrorMsg(initialError);
    }
  }, [initialError]);

  const supabase = createClient();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsLoading(true);
    setErrorMsg("");
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (error) throw error;
      
      onSuccess();
    } catch (err: any) {
      setErrorMsg("Incorrect password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleReauth = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const destination = `${window.location.pathname}?action=${encodeURIComponent(actionIntent)}`;
      const res = await fetch("/api/auth/reauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next: destination })
      });
      
      if (!res.ok) {
        throw new Error("Failed to initialize secure re-authentication.");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
            ...(userEmail ? { login_hint: userEmail } : {}),
          },
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to re-authenticate with Google.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 cursor-pointer z-10"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>

          <div className="p-8">
            <div className="mb-6 flex justify-center">
              <img src="https://koboyo.com/icons/svg/lock-closed.svg" alt="Security" className="h-[72px] w-auto opacity-80" />
            </div>

            <h2 className="text-[20px] font-semibold text-center text-gray-900 mb-2">
              Verify it's you
            </h2>
            <p className="text-center text-[13.5px] text-gray-500 mb-6">
              Please re-authenticate to continue.
            </p>

            {hasEmailPassword ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 rounded-[12px] border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-[14px] text-gray-900"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-[12.5px] font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full h-[46px] bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center font-medium rounded-xl transition-colors text-[14px] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {errorMsg && (
                  <div className="flex items-center gap-2 text-[12.5px] font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                
                <button
                  onClick={handleGoogleReauth}
                  disabled={isLoading}
                  className="w-full h-[48px] px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center gap-3 transition-colors text-[14px] font-semibold text-gray-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  ) : (
                    <>
                      <GoogleIcon className="w-5 h-5" />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
