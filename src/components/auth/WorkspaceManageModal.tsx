"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface WorkspaceManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: {
    provider_email?: string;
    connected_at: string;
    scopes: string[];
  } | null;
  onDisconnect: () => Promise<void>;
  onReconnect: () => void;
}

export function WorkspaceManageModal({ isOpen, onClose, connection, onDisconnect, onReconnect }: WorkspaceManageModalProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen || !connection) return null;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
      onClose();
    } catch (e) {
      console.error("Disconnect failed", e);
    } finally {
      setIsDisconnecting(false);
      setShowConfirm(false);
    }
  };

  const formattedDate = new Date(connection.connected_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isDisconnecting && onClose()}
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
            disabled={isDisconnecting}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-900 cursor-pointer z-10 disabled:opacity-50"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>

          <div className="p-8">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden">
                <GoogleIcon className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-[20px] font-semibold text-center text-gray-900 mb-2">
              Google Workspace
            </h2>
            <div className="flex justify-center mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[12px] font-medium">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-3.5 h-3.5" />
                Connected
              </span>
            </div>

            {showConfirm ? (
              <div className="space-y-6">
                <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 text-center">
                  <p className="text-[13.5px] text-rose-800 font-medium mb-1">Disconnect Google Workspace?</p>
                  <p className="text-[12.5px] text-rose-600/80">
                    Disconnecting Google Workspace will stop identity synchronization. You can still log in with Google, but workspace features will be disabled.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDisconnecting}
                    className="flex-1 h-[42px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors text-[13.5px] cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="flex-1 h-[42px] bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center font-medium rounded-xl transition-colors text-[13.5px] cursor-pointer disabled:opacity-70"
                  >
                    {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[12px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Account</p>
                  <p className="text-[14px] text-gray-900 font-medium truncate">{connection.provider_email || 'Linked Account'}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[12px] text-gray-500 font-medium mb-2 uppercase tracking-wider">Permissions</p>
                  <ul className="space-y-2">
                    {connection.scopes.map(scope => (
                      <li key={scope} className="flex items-center gap-2 text-[13.5px] text-gray-700">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-emerald-500" />
                        <span className="capitalize">{scope}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[12px] text-gray-400 mt-3 pt-3 border-t border-gray-200">
                    Connected {formattedDate}
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="flex-1 h-[42px] bg-white border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-gray-700 font-medium rounded-xl transition-colors text-[13.5px] cursor-pointer"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onReconnect();
                    }}
                    className="flex-1 h-[42px] bg-gray-900 hover:bg-black text-white flex items-center justify-center font-medium rounded-xl transition-colors text-[13.5px] cursor-pointer"
                  >
                    Reconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
