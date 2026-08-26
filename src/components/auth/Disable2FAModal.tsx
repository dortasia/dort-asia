"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, InformationCircleIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { Loader2 } from "lucide-react";
import { create2FANotification } from "@/app/dashboard/settings/security/actions";

interface Disable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function Disable2FAModal({ isOpen, onClose, onSuccess }: Disable2FAModalProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setVerificationCode("");
      setErrorMsg("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleVerifyAndDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. Fetch current verified factor
      const { data: mfaData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totpFactor = mfaData?.totp.find((f) => f.status === "verified");
      if (!totpFactor) {
        // No verified factor found, maybe already disabled?
        onSuccess();
        return;
      }

      // 2. Check current AAL (optional logging/assertion, but challenge+verify handles promotion)
      const { data: initialAalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      // 3. Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });
      if (challengeError) {
        throw challengeError;
      }

      // 4. Verify the user's 6-digit TOTP
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) {
        setErrorMsg("Incorrect verification code. Please try again.");
        setIsLoading(false);
        return; // Do NOT unenroll
      }

      // 5. Confirm AAL2
      const { data: updatedAalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (updatedAalData?.currentLevel !== "aal2") {
        throw new Error("Failed to achieve AAL2. Please try again.");
      }

      // 6. Unenroll the factor
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      });

      if (unenrollError) {
        throw unenrollError;
      }

      // 7. Refresh session to downgrade AAL2 JWT back to normal
      await supabase.auth.refreshSession();

      // Trigger notification
      try {
        await create2FANotification('2fa_disabled');
      } catch (notifErr) {
        console.error("Failed to create 2FA disabled notification:", notifErr);
      }

      onSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while disabling 2FA. Please try again.");
    } finally {
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
            disabled={isLoading}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 cursor-pointer z-10 disabled:opacity-50"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>

          <div className="p-8">
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                <HugeiconsIcon icon={Shield01Icon} className="w-6 h-6" />
              </div>
            </div>

            <h2 className="text-[20px] font-semibold text-center text-gray-900 mb-2">
              Disable two-factor authentication?
            </h2>
            <p className="text-center text-[13.5px] text-gray-500 mb-6">
              Enter the 6-digit code from your authenticator app to confirm this change.
            </p>

            <form onSubmit={handleVerifyAndDisable} className="space-y-6">
              <div className="space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] h-[54px] rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all font-mono text-gray-900 placeholder:text-gray-300"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 text-[12.5px] font-medium text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                  <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 h-[46px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-[14px] cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 h-[46px] bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white flex items-center justify-center font-medium rounded-xl transition-colors text-[14px] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Disable"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
