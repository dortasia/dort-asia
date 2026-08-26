"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface CorePlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export function CorePlatformModal({ isOpen, onClose, userEmail }: CorePlatformModalProps) {
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
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                <img src="/company_logo/DortAsiaOfflLogo.svg" alt="Dort Asia" className="w-10 h-10 object-contain" />
              </div>
            </div>

            <h2 className="text-[20px] font-semibold text-center text-gray-900 mb-2">
              Core Platform
            </h2>
            <div className="flex justify-center mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-medium">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3.5 h-3.5" />
                Active
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[12px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Account</p>
                <p className="text-[14px] text-gray-900 font-medium truncate">{userEmail}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-[12px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Apps</p>
                <p className="text-[14px] text-gray-900 font-medium">Xentra People, Xentra Paynote</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-[12.5px] text-gray-500">
                Your primary Dort Asia identity is securely connected. This connection cannot be removed.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
