"use client";

import { useEffect, useState, useCallback } from "react";
import useSWR from "swr";
import { 
  Monitor, 
  Smartphone, 
  Loader2, 
  Globe, 
  ShieldAlert, 
  LogOut, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Session {
  id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  city: string;
  country_name: string;
  last_seen_at: string;
  is_current: boolean;
}

interface ToastState {
  type: "success" | "error";
  message: string;
}

const fetchSessions = async () => {
  const res = await fetch("/api/auth/sessions", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const data = await res.json();
  return data.sessions || [];
};

export function ActiveSessionsList() {
  const { data: sessions = [], isLoading, mutate: fetchSessionsData } = useSWR<Session[]>("activeSessions", fetchSessions, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Handle ESC key to dismiss modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        setSessionToRevoke(null);
        setShowRevokeAllModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting]);

  const confirmRevokeIndividual = async () => {
    if (!sessionToRevoke || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionToRevoke.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign out session");
      }

      setToast({
        type: "success",
        message: data.message || `Signed out of ${sessionToRevoke.browser} on ${sessionToRevoke.os}.`,
      });

      setSessionToRevoke(null);
      await fetchSessionsData();
    } catch (error: any) {
      console.error("Session sign-out error:", error);
      setToast({
        type: "error",
        message: error.message || "Failed to sign out of the device. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmRevokeAllOthers = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/sessions/revoke-others", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to sign out other sessions");
      }

      const count = data.revokedCount ?? otherSessions.length;
      setToast({
        type: "success",
        message: data.message || `Signed out of ${count} other device${count === 1 ? "" : "s"}.`,
      });

      setShowRevokeAllModal(false);
      await fetchSessionsData();
    } catch (error: any) {
      console.error("Revoke all others error:", error);
      setToast({
        type: "error",
        message: error.message || "Failed to sign out of other devices. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl">
        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className={`flex items-center justify-between p-3.5 rounded-xl border text-[13px] font-medium shadow-sm transition-all ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer ml-3"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Global "Sign out all other devices" Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Sessions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            These are the devices currently signed in to your Dort Asia account.
          </p>
        </div>

        {otherSessions.length > 0 && (
          <button
            onClick={() => setShowRevokeAllModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200/80 dark:border-rose-900/60 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out all other devices</span>
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl">
            <p className="text-sm text-gray-500">No active sessions found.</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-zinc-900 border rounded-xl transition-all ${
                session.is_current
                  ? "border-gray-300 dark:border-zinc-700 shadow-2xs"
                  : "border-gray-200 dark:border-zinc-800"
              }`}
            >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-gray-50 dark:bg-zinc-800 rounded-lg shrink-0">
                {session.device_type === "mobile" || session.device_type === "tablet" ? (
                  <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-[14.5px] text-gray-900 dark:text-white">
                    {session.browser} on {session.os}
                  </h4>
                  {session.is_current && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/50 rounded-full">
                      Current Device
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[13px] text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    {[session.city, session.country_name].filter(Boolean).join(", ") || "Local Development"}
                  </span>
                  <span>&middot;</span>
                  <span>
                    Last active {new Date(session.last_seen_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {!session.is_current && (
              <button
                onClick={() => setSessionToRevoke(session)}
                className="mt-3 sm:mt-0 px-3 py-1.5 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 rounded-lg transition-colors cursor-pointer self-end sm:self-auto"
              >
                Sign out
              </button>
            )}
            </div>
          ))
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Individual Session Sign-Out Confirmation Modal                  */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {sessionToRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setSessionToRevoke(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-zinc-800 z-10 space-y-4 text-gray-900 dark:text-gray-100"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Sign out this device?
                  </h3>
                  <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    This will end the session on{" "}
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {sessionToRevoke.browser} on {sessionToRevoke.os}
                    </span>
                    . You&apos;ll need to sign in again on that device.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSessionToRevoke(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRevokeIndividual}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Signing out..." : "Sign out"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* 2. "Sign out all other devices" Confirmation Modal                */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showRevokeAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setShowRevokeAllModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Modal Dialog Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-zinc-800 z-10 space-y-4 text-gray-900 dark:text-gray-100"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Sign out all other devices?
                  </h3>
                  <p className="text-[13.5px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    This will sign you out of all other active sessions. Your current device will remain signed in.
                  </p>
                  <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-gray-200/60 dark:border-zinc-800">
                    {otherSessions.length} other device{otherSessions.length === 1 ? "" : "s"} will be signed out.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowRevokeAllModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRevokeAllOthers}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Signing out..." : "Sign out all other devices"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
