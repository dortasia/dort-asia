"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Shield01Icon, CheckmarkCircle02Icon, InformationCircleIcon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { create2FANotification } from "@/app/dashboard/settings/security/actions";
import { generateRecoveryCodes } from "@/app/dashboard/settings/security/recovery-actions";

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorModal({ isOpen, onClose, onSuccess }: TwoFactorModalProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  const supabase = createClient();

  const isEnrollingRef = useRef(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setFactorId(null);
      setQrCodeUri(null);
      setManualSecret(null);
      setVerificationCode("");
      setErrorMsg("");
      setSuccess(false);
      setShowRecovery(false);
      setRecoveryCodes([]);
      startEnrollment();
    } else {
      isEnrollingRef.current = false;
      // Cleanup unverified factor if modal is closed before success
      if (factorId && !success) {
        supabase.auth.mfa.unenroll({ factorId }).catch(() => {});
      }
    }
  }, [isOpen]);

  const startEnrollment = async () => {
    if (isEnrollingRef.current) return;
    isEnrollingRef.current = true;
    setIsEnrolling(true);
    setErrorMsg("");
    
    try {
      const { data: mfaData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      if (mfaData && mfaData.totp) {
        console.log("[MFA Debug] Current TOTP Factors:", mfaData.totp.map(f => ({
          id: f.id,
          friendly_name: f.friendly_name,
          factor_type: f.factor_type,
          status: f.status
        })));

        const existingFactors = mfaData.totp.filter(f => f.friendly_name === "Dort Asia Authenticator");
        
        let hasVerified = false;
        
        for (const existingFactor of existingFactors) {
          if (existingFactor.status === "verified") {
            hasVerified = true;
          } else if (existingFactor.status === "unverified") {
            console.log(`[MFA Debug] Unenrolling stale unverified factor: ${existingFactor.id}`);
            const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: existingFactor.id });
            if (unenrollError) throw unenrollError;
          }
        }
        
        if (hasVerified) {
          setSuccess(true);
          setTimeout(() => onSuccess(), 2000);
          return;
        }
      }

      console.log("[MFA Debug] Calling enroll()...");
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Dort Asia Authenticator",
      });

      if (error) {
        console.error("[MFA Debug] Enroll failed:", error);
        throw error;
      }

      if (data) {
        setFactorId(data.id);
        // Supabase returns the totp object with secret and uri
        if (data.totp) {
          setQrCodeUri(data.totp.uri);
          setManualSecret(data.totp.secret);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to start 2FA enrollment. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    
    if (verificationCode.length !== 6) {
      setErrorMsg("Please enter a valid 6-digit code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      // Create challenge
      const challengeRes = await supabase.auth.mfa.challenge({ factorId });
      if (challengeRes.error) {
        throw challengeRes.error;
      }

      // Verify challenge
      const verifyRes = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeRes.data.id,
        code: verificationCode,
      });

      if (verifyRes.error) {
        throw verifyRes.error;
      }

      // Trigger server-side notification
      try {
        await create2FANotification('2fa_enabled');
      } catch (notifErr) {
        console.error("Failed to create 2FA notification:", notifErr);
      }

      // Generate recovery codes
      try {
        setIsGeneratingCodes(true);
        const result = await generateRecoveryCodes();
        if (result.success && result.codes) {
          setRecoveryCodes(result.codes);
          setShowRecovery(true);
        } else {
          setSuccess(true);
          setTimeout(() => onSuccess(), 2000);
        }
      } catch (e) {
        console.error("Failed to generate recovery codes:", e);
        setSuccess(true);
        setTimeout(() => onSuccess(), 2000);
      } finally {
        setIsGeneratingCodes(false);
      }
      
    } catch (err: any) {
      setErrorMsg("That code is incorrect or expired. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (manualSecret) {
      navigator.clipboard.writeText(manualSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 cursor-pointer z-10"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>

          <div className="p-8">
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                {success ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-6 h-6 text-emerald-600" />
                ) : (
                  <HugeiconsIcon icon={Shield01Icon} className="w-6 h-6" />
                )}
              </div>
            </div>

            <h2 className="text-[22px] font-semibold text-center text-gray-900 mb-2">
              {showRecovery ? "Save Recovery Codes" : success ? "2FA Enabled" : "Secure your account"}
            </h2>
            <p className="text-center text-[14px] text-gray-500 mb-8 px-4">
              {showRecovery 
                ? "If you lose your authenticator app, these codes are the only way to regain access. Keep them safe."
                : success 
                ? "Your account is now protected by Two-Factor Authentication." 
                : "Add an authenticator app to protect your Dort Asia account."}
            </p>

            {showRecovery ? (
              <div className="flex flex-col items-center w-full">
                 <div className="grid grid-cols-2 gap-2 w-full mb-6">
                   {recoveryCodes.map(c => (
                      <div key={c} className="bg-gray-50 border border-gray-200 p-2.5 text-center rounded-lg font-mono text-[13px] font-semibold text-gray-800 tracking-wider">
                        {c}
                      </div>
                   ))}
                 </div>
                 
                 <div className="flex gap-3 w-full">
                   <button
                     type="button"
                     onClick={copyRecoveryCodes}
                     className="w-1/3 h-[48px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                   >
                     {copied ? (
                       <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-emerald-600" />
                     ) : (
                       <HugeiconsIcon icon={Copy01Icon} className="w-4 h-4" />
                     )}
                     <span className="text-[13.5px]">{copied ? "Copied" : "Copy"}</span>
                   </button>
                   
                   <button
                     onClick={() => {
                        setShowRecovery(false);
                        setSuccess(true);
                        setTimeout(() => onSuccess(), 2000);
                     }}
                     className="w-2/3 h-[48px] bg-gray-900 hover:bg-black text-white font-medium rounded-xl transition-colors cursor-pointer text-[14.5px]"
                   >
                     I've saved them securely
                   </button>
                 </div>
              </div>
            ) : success ? (
              <div className="flex justify-center pb-2">
                <button
                  onClick={onSuccess}
                  className="w-full h-[48px] bg-gray-900 hover:bg-black text-white font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : isEnrolling || isGeneratingCodes ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                <p className="text-[14px]">
                  {isGeneratingCodes ? "Generating recovery codes..." : "Generating setup key..."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleVerify} className="space-y-6">
                
                {qrCodeUri && (
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm mb-4">
                      <QRCodeSVG value={qrCodeUri} size={160} />
                    </div>
                    
                    <div className="w-full">
                      <p className="text-[12.5px] text-gray-500 text-center mb-2">
                        Can&apos;t scan? Enter this setup key manually
                      </p>
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                        <code className="text-[13px] font-mono text-gray-800 flex-1 text-center tracking-wider truncate">
                          {manualSecret}
                        </code>
                        <button
                          type="button"
                          onClick={copyToClipboard}
                          className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500 hover:text-gray-900 cursor-pointer flex-shrink-0"
                          title="Copy setup key"
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

                <div className="border-t border-gray-100 pt-6">
                  <label className="block text-[14px] font-medium text-gray-700 mb-2 text-center">
                    Enter the 6-digit verification code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-2xl tracking-[0.5em] h-[54px] rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-mono text-gray-900 placeholder:text-gray-300"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-[13px] font-medium text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <HugeiconsIcon icon={InformationCircleIcon} className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6 || !factorId}
                  className="w-full h-[48px] bg-[#3b82f6] hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center font-medium rounded-xl transition-colors text-[14.5px] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Enable"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
