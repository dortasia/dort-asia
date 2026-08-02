"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";
import { useAppStore } from "@/store";
import type {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from "@supabase/supabase-js";

type AttendanceRow = {
  id: string;
  date: string;
  status?: string | null;
  employee_id: string;
  clock_in?: string | null;
  clock_out?: string | null;
};

type ToastNotification = {
  id: string;
  name: string;
  action: string;
  actionTime: string;
  toastTime: string;
  initials: string;
  color: string;
  bg: string;
};

// Web Audio API Ding Sound generator
function playDingSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Oscillator 1 - Sine wave (Main tone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Envelope for Osc 1
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    
    // Oscillator 2 - High chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1760, ctx.currentTime); // A6
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    // Envelope for Osc 2
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);
    osc1.stop(ctx.currentTime + 1.2);
    osc2.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

function formatAMPM(date: Date) {
  let hours = date.getHours();
  let minutes: any = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + minutes + ' ' + ampm;
}

// Convert "09:02" to "09:02 AM" using IST
function formatStringHMToAMPM(hmStr: string) {
  if (!hmStr || !hmStr.includes(":")) return hmStr;
  const [h, m] = hmStr.split(":");
  let hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12;
  hr = hr ? hr : 12; 
  const pHR = hr < 10 ? '0' + hr : hr.toString();
  return `${pHR}:${m} ${ampm}`;
}

export default function RealtimeAttendanceToast() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const supabase = createClient();
  const clockedOutRefs = useRef<Set<string>>(new Set());
  const cachedSidebar = useAppStore((state) => state.cachedSidebar);
  const isAdmin = cachedSidebar?.isSuperAdmin;

  const todayDate = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000).toISOString().split("T")[0];

  useEffect(() => {
    // Only subscribe to real-time events for Admins
    if (!isAdmin) return;
    const channel = supabase
      .channel('global-attendance-toast')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance' },
        async (payload: RealtimePostgresInsertPayload<AttendanceRow>) => {
          // It's a newly inserted attendance row. This implies a Clock In.
          const newAtt = payload.new;
          if (newAtt && newAtt.date === todayDate && newAtt.status && newAtt.status.toLowerCase() === 'present') {
            
            // Try fetching employee info
            const { data: emp } = await supabase.from('employees').select('name').eq('id', newAtt.employee_id).single();
            const { data: userEmp } = await supabase.from('employees').select('name').eq('user_id', newAtt.employee_id).single();
            
            const empName = emp?.name || userEmp?.name || "Unknown Employee";
            const initials = getInitials(empName);
            const { bg, color } = getAvatarColor(empName);
            
            // Format timestamps
            const actionTimeStr = newAtt.clock_in ? formatStringHMToAMPM(newAtt.clock_in) : "--";
            
            // Notification current time
            const now = new Date(); // browser is assumed to be in the correct local timezone
            const toastTimeStr = formatAMPM(now);

            const newToast: ToastNotification = {
              id: newAtt.id,
              name: empName,
              action: `successfully Clocked In at ${actionTimeStr}`,
              actionTime: actionTimeStr,
              toastTime: toastTimeStr,
              initials,
              color,
              bg,
            };

            // Play sound and add to state
            playDingSound();
            setToasts((prev) => [...prev, newToast]);

            // Auto dismiss after 6 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter(t => t.id !== newToast.id));
            }, 6000);
          }
        }
      )
      // Listen to clock out events (which are UPDATES)
      .on(
         'postgres_changes',
         { event: 'UPDATE', schema: 'public', table: 'attendance' },
         async (payload: RealtimePostgresUpdatePayload<AttendanceRow>) => {
           const newAtt = payload.new;
           const oldAtt = payload.old;
           
           if (!newAtt || newAtt.date !== todayDate || !newAtt.clock_out) return;

           // Deduplicate if we already toasted for this clock-out
           if (clockedOutRefs.current.has(newAtt.id)) return;
           
           // If replica identity full IS available, avoid re-triggering on unrelated updates
           if (oldAtt && oldAtt.clock_out === newAtt.clock_out) return;

           // We consider this a valid new clock-out event
           clockedOutRefs.current.add(newAtt.id);

           const { data: emp } = await supabase.from('employees').select('name').eq('id', newAtt.employee_id).single();
           const { data: userEmp } = await supabase.from('employees').select('name').eq('user_id', newAtt.employee_id).single();
            
             const empName = emp?.name || userEmp?.name || "Unknown Employee";
             const initials = getInitials(empName);
             const { bg, color } = getAvatarColor(empName);
            
             const actionTimeStr = formatStringHMToAMPM(newAtt.clock_out);
             const now = new Date();
             const toastTimeStr = formatAMPM(now);

             const newToast: ToastNotification = {
               id: newAtt.id + '-out',
               name: empName,
               action: `successfully Clocked Out at ${actionTimeStr}`,
               actionTime: actionTimeStr,
               toastTime: toastTimeStr,
               initials,
               color,
               bg,
             };

             playDingSound();
             setToasts((prev) => [...prev, newToast]);
             setTimeout(() => setToasts((prev) => prev.filter(t => t.id !== newToast.id)), 6000);
         }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, todayDate, isAdmin]);

  // Don't render the toast list if there are no toasts or if the user is not an Admin
  if (!isAdmin || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-[#71717A]/95 backdrop-blur-md rounded-[30px] pr-6 pl-2.5 py-2.5 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-w-[340px] max-w-[420px] pointer-events-auto border border-white/10 animate-in slide-in-from-bottom-5 fade-in duration-300 relative overflow-hidden"
        >
          {/* Avatar Area */}
          <div 
            className="h-[46px] w-[46px] rounded-full shrink-0 flex items-center justify-center font-bold text-[16px] mr-3 z-10"
            style={{ backgroundColor: toast.bg, color: toast.color }}
          >
            {toast.initials}
          </div>
          
          {/* Text Area */}
          <div className="flex flex-col flex-1 justify-center z-10 pt-1">
            <span className="text-white text-[15px] cursor-default font-medium leading-tight">
              {toast.name} has {toast.action}.
            </span>
            <span className="text-[#D4D4D8] text-[11px] font-semibold text-right mt-1 tracking-wide block w-full">
              {toast.toastTime}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
