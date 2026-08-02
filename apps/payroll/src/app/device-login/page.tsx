"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Smartphone, CheckCircle, RefreshCw, Shield } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DeviceLogin() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "waiting" | "approved" | "error"
  >("idle");
  const [deviceCode, setDeviceCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Realtime subscription: listen for the row to become 'approved' ──────────
  useEffect(() => {
    if (status !== "waiting" || !requestId) return;

    const channel = supabase
      .channel(`device-auth-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "device_auth_requests",
          filter: `id=eq.${requestId}`,
        },
        async (payload) => {
          if (payload.new.status === "approved") {
            setStatus("approved");
            channel.unsubscribe();

            // ── Call verify to exchange for real session tokens ────────────
            try {
              const res = await fetch("/api/auth/device/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ request_id: requestId }),
              });
              const data = await res.json();

              if (!res.ok) throw new Error(data.error || "Verification failed");

              if (data.access_token && data.refresh_token) {
                // Set session directly — no Supabase redirect needed
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token: data.access_token,
                  refresh_token: data.refresh_token,
                });
                if (sessionError) throw sessionError;
                // Give the session a moment to persist, then navigate
                setTimeout(() => {
                  window.location.href = "/";
                }, 800);
              } else if (data.action_link) {
                // Fallback: use the magic link if tokens weren't returned
                window.location.href = data.action_link;
              } else {
                throw new Error(data.error || "No session data returned");
              }
            } catch (err: any) {
              setErrorMsg(err.message);
              setStatus("error");
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [status, requestId]);

  // ── Initiate device login ─────────────────────────────────────────────────
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/device/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to initiate device login");

      setDeviceCode(data.device_code);
      setRequestId(data.request_id);
      setStatus("waiting");
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  };

  const handleReset = () => {
    channelRef.current?.unsubscribe();
    setStatus("idle");
    setDeviceCode("");
    setRequestId("");
    setErrorMsg("");
  };

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] to-[#F8F9FA] dark:from-[#07070B] dark:to-[#0B0B0F] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#1A1A1E] rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-white/5 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute -top-[120px] -right-[120px] w-[320px] h-[320px] bg-[#007AFF] opacity-[0.04] dark:opacity-[0.07] rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-[120px] -left-[120px] w-[280px] h-[280px] bg-[#5856D6] opacity-[0.03] dark:opacity-[0.05] rounded-full blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Smartphone className="w-8 h-8 text-[#007AFF]" />
          </div>
          <h1 className="text-[28px] font-bold text-gray-900 dark:text-white mb-2">
            Device Login
          </h1>
          <p className="text-[15px] text-gray-500 dark:text-gray-400">
            Sign in securely using your Vertex mobile app.
          </p>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-[14px] font-medium text-center border border-red-100 dark:border-red-500/20">
            {errorMsg}
          </div>
        )}

        {/* ── IDLE / ERROR: Email form ───────────────────────────────── */}
        {(status === "idle" || status === "error") && (
          <form onSubmit={handleInitiate} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="device-login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                className="w-full bg-[#F4F4F5] dark:bg-[#121217] border border-transparent focus:border-[#007AFF] focus:bg-white dark:focus:bg-[#1A1A1E] text-gray-900 dark:text-white rounded-xl px-4 py-3.5 text-[15px] outline-none transition-all"
              />
            </div>
            <button
              id="device-login-submit"
              type="submit"
              className="w-full bg-[#007AFF] hover:bg-[#0062CC] text-white font-bold text-[15px] py-4 rounded-xl shadow-lg shadow-[#007AFF]/20 transition-all active:scale-[0.98]"
            >
              Continue with Device
            </button>
          </form>
        )}

        {/* ── LOADING ───────────────────────────────────────────────── */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-10 relative z-10">
            <RefreshCw className="w-10 h-10 text-[#007AFF] animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Generating device code…
            </p>
          </div>
        )}

        {/* ── WAITING: Show the code ────────────────────────────────── */}
        {status === "waiting" && (
          <div className="flex flex-col items-center relative z-10">
            {/* Step hint */}
            <div className="w-full bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-4 mb-6 flex gap-3 items-start border border-blue-100 dark:border-blue-500/15">
              <Shield className="w-5 h-5 text-[#007AFF] mt-0.5 shrink-0" />
              <p className="text-[13px] text-blue-700 dark:text-blue-300 leading-snug">
                Open the <strong>Vertex app</strong> on your phone. A popup will appear showing this code. Tap <strong>Approve</strong> to sign in.
              </p>
            </div>

            {/* Code display */}
            <div className="w-full bg-[#F4F4F5] dark:bg-[#121217] py-10 rounded-2xl flex flex-col items-center mb-6 border border-gray-200 dark:border-white/5 shadow-inner">
              <span className="text-[11px] font-bold tracking-[3px] text-[#007AFF] uppercase mb-3">
                Verification Code
              </span>
              <span
                id="device-code-display"
                className="text-[64px] font-black text-gray-900 dark:text-white tracking-[0.35em] ml-[0.35em] leading-none"
              >
                {deviceCode}
              </span>
            </div>

            {/* Waiting indicator */}
            <div className="flex items-center gap-2 text-[14px] text-gray-400 mb-4">
              <RefreshCw className="w-4 h-4 animate-spin opacity-60" />
              Waiting for approval on your phone…
            </div>

            <button
              onClick={handleReset}
              className="text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors underline underline-offset-2"
            >
              Cancel &amp; start over
            </button>
          </div>
        )}

        {/* ── APPROVED ──────────────────────────────────────────────── */}
        {status === "approved" && (
          <div className="flex flex-col items-center justify-center py-8 relative z-10">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-[22px] font-bold text-gray-900 dark:text-white mb-2">
              Approved!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Setting up your session…
            </p>
            <div className="mt-4">
              <RefreshCw className="w-5 h-5 text-[#007AFF] animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
