"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle02Icon, Copy01Icon } from "@hugeicons/core-free-icons";
import { Loader2 } from "lucide-react";
import { generateRecoveryCodes } from "@/app/dashboard/settings/security/recovery-actions";

interface RecoveryCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecoveryCodesModal({ isOpen, onClose, onSuccess }: RecoveryCodesModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await generateRecoveryCodes();
      if (res.success && res.codes) {
        setCodes(res.codes);
      } else {
        setErrorMsg("Failed to generate codes.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    setCodes([]);
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-10"
        >
          {codes.length === 0 && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 cursor-pointer z-10"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
            </button>
          )}

          <div className="p-8">
            {codes.length > 0 ? (
              <div className="flex flex-col items-center w-full">
                <h2 className="text-[22px] font-semibold text-center text-gray-900 mb-2">Save Recovery Codes</h2>
                <p className="text-center text-[14px] text-gray-500 mb-6 px-4">
                  These are your new recovery codes. Your old codes have been invalidated. Save them securely.
                </p>
                <div className="grid grid-cols-2 gap-2 w-full mb-6">
                  {codes.map(c => (
                    <div key={c} className="bg-gray-50 border border-gray-200 p-2.5 text-center rounded-lg font-mono text-[13px] font-semibold text-gray-800 tracking-wider">
                      {c}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={copyCodes}
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
                    onClick={handleDone}
                    className="w-2/3 h-[48px] bg-gray-900 hover:bg-black text-white font-medium rounded-xl transition-colors cursor-pointer text-[14.5px]"
                  >
                    I've saved them securely
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <h2 className="text-[22px] font-semibold text-center text-gray-900 mb-2">Regenerate Codes</h2>
                <p className="text-center text-[14px] text-gray-500 mb-6 px-4">
                  Generating new recovery codes will invalidate any unused previous codes. Are you sure?
                </p>

                {errorMsg && (
                  <div className="w-full mb-4 p-3 rounded-xl bg-rose-50 text-rose-600 text-[13px] text-center border border-rose-100">
                    {errorMsg}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full h-[48px] bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] text-white font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate New Codes"}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
