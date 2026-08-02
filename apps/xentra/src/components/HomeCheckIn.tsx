"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, CheckCircle2, LogIn, LogOut, Clock, X } from "lucide-react";
// LogIn / LogOut kept for the modal icons only
import { createClient } from "@/utils/supabase/client";

/* ── helpers ─────────────────────────────────────────── */
function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/* ── confirmation modal ──────────────────────────────── */
function ConfirmModal({
  action,
  time,
  onConfirm,
  onCancel,
  loading,
}: {
  action: "in" | "out";
  time: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isIn = action === "in";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[400px] bg-white dark:bg-[#1C1C22] rounded-[28px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top accent strip */}
        <div
          className="h-1.5 w-full"
          style={{
            background: isIn
              ? "linear-gradient(to right, #004999, #007AFF)"
              : "linear-gradient(to right, #C93400, #FF3B30)",
          }}
        />

        <div className="px-7 py-6">
          {/* Close */}
          <div className="flex items-start justify-between mb-5">
            <div
              className="h-12 w-12 rounded-[14px] flex items-center justify-center"
              style={{
                background: isIn ? "#E5F1FF" : "#FFF1F1",
              }}
            >
              {isIn ? (
                <LogIn className="h-6 w-6 text-[#007AFF]" strokeWidth={2} />
              ) : (
                <LogOut className="h-6 w-6 text-[#FF3B30]" strokeWidth={2} />
              )}
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <h2 className="text-[20px] font-bold text-gray-900 dark:text-white leading-tight mb-1">
            {isIn ? "Clock In Confirmation" : "Clock Out Confirmation"}
          </h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium mb-5 leading-relaxed">
            {isIn
              ? "You're about to start your work session for today. Your clock-in time will be recorded."
              : "You're about to end your work session. Your total hours will be saved."}
          </p>

          {/* Time chip */}
          <div className="flex items-center gap-2 bg-[#F8F9FA] dark:bg-[#121217] rounded-[12px] px-4 py-3 mb-6 border border-[#E5E7EB] dark:border-white/5">
            <Clock className="h-4 w-4 text-gray-400" strokeWidth={2} />
            <span className="text-[13px] font-semibold text-gray-700 dark:text-white">
              {isIn ? "Clock In Time:" : "Clock Out Time:"}{" "}
              <span
                className="font-bold"
                style={{ color: isIn ? "#007AFF" : "#FF3B30" }}
              >
                {time}
              </span>
            </span>
          </div>

          {/* Location note */}
          <div className="flex items-center gap-2 text-[12px] text-gray-400 font-medium mb-6">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>Location will be recorded automatically</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-[14px] text-[14px] font-semibold bg-[#F1F3F5] dark:bg-white/5 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-[14px] text-[14px] font-bold text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              style={{
                background: isIn
                  ? "linear-gradient(to right, #004999, #007AFF)"
                  : "linear-gradient(to right, #C93400, #FF3B30)",
              }}
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                  {isIn ? "Confirm Clock In" : "Confirm Clock Out"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────── */
export default function HomeCheckIn() {
  // Locale/timezone-sensitive: set after mount so SSR HTML matches first client paint.
  const [dateStr, setDateStr] = useState("");
  // State
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showModal, setShowModal] = useState<"in" | "out" | null>(null);
  const [loading, setLoading] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [modalTime, setModalTime] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const now = new Date();
    setDateStr(
      now
        .toLocaleDateString("en-US", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
        .toUpperCase()
    );
  }, []);

  // Live timer
  useEffect(() => {
    if (clockedIn && clockInTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - clockInTime.getTime());
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [clockedIn, clockInTime]);

  // Check if already clocked in today
  useEffect(() => {
    const checkToday = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("attendance")
        .select("id, clock_in, clock_in_time, clock_out, status")
        .eq("date", today)
        .eq("employee_id", user.id)
        .order("clock_in_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.status === "present") {
        setAttendanceId(data.id);
        const cin = data.clock_in_time
          ? new Date(data.clock_in_time)
          : new Date();
        setClockInTime(cin);
        if (!data.clock_out) {
          setClockedIn(true);
          setElapsed(Date.now() - cin.getTime());
        } else {
          setClockedIn(false);
          setClockOutTime(new Date());
        }
      }
    };
    checkToday();
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const timeHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Get geolocation if available
      let location = "Web UI";
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
        );
        location = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
      } catch {}

      if (showModal === "in") {
        const { data, error } = await supabase
          .from("attendance")
          .insert({
            employee_id: user.id,
            date: today,
            status: "present",
            clock_in: timeHHMM,
            clock_in_time: now.toISOString(),
            location,
          })
          .select("id")
          .single();

        if (!error && data) {
          setAttendanceId(data.id);
          setClockInTime(now);
          setElapsed(0);
          setClockedIn(true);
        }
      } else {
        // Clock out
        if (attendanceId) {
          const cinMs = clockInTime ? clockInTime.getTime() : Date.now();
          const diffMs = Date.now() - cinMs;
          const hrs = diffMs / 3600000;
          const hh = Math.floor(hrs);
          const mm = Math.round((hrs - hh) * 60);
          const hoursStr = `${hh}h ${pad(mm)}m`;

          await supabase
            .from("attendance")
            .update({
              clock_out: timeHHMM,
              hours: hoursStr,
            })
            .eq("id", attendanceId);
        }
        setClockedIn(false);
        setClockOutTime(now);
        setElapsed(0);
      }
    } catch (e) {
      console.error("Clock action failed:", e);
    } finally {
      setLoading(false);
      setShowModal(null);
    }
  }, [showModal, attendanceId, clockInTime]);

  return (
    <>
      {/* Widget */}
      <div className="bg-[#F8F9FA] dark:bg-[#1C1C22] rounded-[24px] px-6 py-5 flex items-center justify-between mt-2 mb-8 border border-transparent transition-all font-sf">
        <div>
          <h2 className="text-[18px] font-semibold text-[#111827] dark:text-white leading-[28px]">
            {clockedIn
              ? "You're Clocked In"
              : clockOutTime
              ? "Session Ended"
              : "Ready For The Day?"}
          </h2>
          <p className="text-[12px] font-medium text-[#9CA3AF] mt-1 uppercase tracking-[0.04em]">
            {clockedIn && clockInTime
              ? `Since ${fmtTime(clockInTime)}`
              : clockOutTime
              ? `Clocked out at ${fmtTime(clockOutTime)}`
              : dateStr}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Timer */}
          <span className="text-[14px] font-medium text-[#6B7280] font-sf-rounded">
            {fmtElapsed(elapsed)}
          </span>

          {/* Button */}
          {clockOutTime && !clockedIn ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#34C759]/15 border border-[#34C759]/30">
              <CheckCircle2 className="h-4 w-4 text-[#248A3D]" strokeWidth={2.5} />
              <span className="text-[13px] font-semibold text-[#248A3D] font-sf">Done for today</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setModalTime(fmtTime(new Date()));
                setShowModal(clockedIn ? "out" : "in");
              }}
              className="text-white text-[14px] font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
              style={{
                background: clockedIn
                  ? "linear-gradient(to right, #C93400, #FF3B30)"
                  : "linear-gradient(to right, #004999, var(--user-accent))",
                width: "166px",
                height: "38px",
                borderRadius: "25px",
                border: "none",
              }}
            >
              {clockedIn ? "Clock Out" : "Clock In"}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <ConfirmModal
          action={showModal}
          time={modalTime}
          onConfirm={handleConfirm}
          onCancel={() => setShowModal(null)}
          loading={loading}
        />
      )}
    </>
  );
}
