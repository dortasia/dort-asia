"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, InformationCircleIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { Loader2 } from "lucide-react";

interface StepUpMfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StepUpMfaModal({ isOpen, onClose, onSuccess }: StepUpMfaModalProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Fetch current verified factor
      const { data: mfaData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totpFactor = mfaData?.totp.find((f) => f.status === "verified");
      if (!totpFactor) {
        throw new Error("No verified 2FA factor found.");
      }

      // 2. Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeError) {
        throw challengeError;
      }

      // 3. Verify the user's 6-digit TOTP
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) {
        setErrorMsg("Incorrect verification code. Please try again.");
        setIsLoading(false);
        return;
      }

      // 4. Confirm AAL2
      const { data: updatedAalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (updatedAalData?.currentLevel !== "aal2") {
        throw new Error("Failed to achieve AAL2. Please try again.");
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[440px] bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden font-text"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
                <HugeiconsIcon icon={Shield01Icon} className="w-[18px] h-[18px] text-blue-600" />
                Security Verification
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 p-3.5 rounded-xl bg-blue-50/50 border border-blue-100/50 flex gap-3 text-left">
                <HugeiconsIcon icon={InformationCircleIcon} className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-gray-600 leading-relaxed">
                  Please enter the 6-digit code from your authenticator app to continue.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-600 text-[13px] font-medium">
                  <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-700 ml-1">
                    Authentication Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full h-[46px] px-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-[14px] font-semibold tracking-[0.2em] text-center text-gray-900"
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 h-[42px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-[13.5px] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="flex-1 h-[42px] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-[13.5px] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
