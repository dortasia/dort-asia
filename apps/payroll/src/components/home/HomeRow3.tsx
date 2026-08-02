"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { createClient } from "@/utils/supabase/client";

/* ── types ──────────────────────────────────────────── */
interface Birthday {
  month: string;
  day: number;
  name: string;
  initials: string;
  daysUntil: number;
}

interface PendingProfile {
  name: string;
  initials: string;
  role: string;
  pct: number;
}

type EmployeeRow = {
  name: string;
  email?: string | null;
  mobile?: string | null;
  designation?: string | null;
  department_id?: string | null;
  date_of_birth?: string | null;
  policy_end_date?: string | null;
  custom_fields?: Record<string, unknown> | null;
  bank_name?: string | null;
};

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── birthday helpers ────────────────────────────────── */
function nextBirthday(dob: string): { date: Date; daysUntil: number } {
  const d = new Date(dob);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  const candidate = thisYear < today
    ? new Date(today.getFullYear() + 1, d.getMonth(), d.getDate())
    : thisYear;

  const daysUntil = Math.ceil((candidate.getTime() - today.getTime()) / 86_400_000);
  return { date: candidate, daysUntil };
}

/* ── profile completion calculator ──────────────────── */
function calcCompletion(emp: Record<string, any>): number {
  const fields = [
    emp.name, emp.email, emp.mobile, emp.designation,
    emp.department_id, emp.date_of_birth,
    emp.policy_end_date,
    emp.custom_fields?.blood_group,
    emp.custom_fields?.emergency_contact_name,
    emp.custom_fields?.education_level,
    emp.bank_name || emp.custom_fields?.bank_name,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

/* ── birthday pill colour ────────────────────────────── */
// Helpers removed for theme styling uniformity

/* ── component ───────────────────────────────────────── */
export default function HomeRow3() {
  const setSamOpen = useAppStore((s) => s.setSamOpen);

  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [pending, setPending]     = useState<PendingProfile[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: employees, error } = await supabase
          .from("employees")
          .select("name, email, mobile, designation, department_id, date_of_birth, policy_end_date, custom_fields, bank_name")
          .eq("company_id", user.id)
          .order("name");

        if (error || !employees) return;

        // ── Upcoming Birthdays (next 60 days) ──
        const WINDOW = 60;
        const upcomingBirthdays: Birthday[] = (employees as EmployeeRow[])
          .filter((e: EmployeeRow) => e.date_of_birth)
          .map((e: EmployeeRow) => {
            const { date, daysUntil } = nextBirthday(e.date_of_birth!);
            return {
              month: MONTH_SHORT[date.getMonth()],
              day: date.getDate(),
              name: e.name,
              initials: getInitials(e.name),
              daysUntil,
            };
          })
          .filter((b: Birthday) => b.daysUntil <= WINDOW)
          .sort((a: Birthday, b: Birthday) => a.daysUntil - b.daysUntil)
          .slice(0, 8);

        setBirthdays(upcomingBirthdays);

        // ── Pending profiles ──
        const incomplete: PendingProfile[] = (employees as EmployeeRow[])
          .map((emp: EmployeeRow) => ({ emp, pct: calcCompletion(emp) }))
          .filter(({ pct }: { pct: number }) => pct < 100)
          .sort((a: { pct: number }, b: { pct: number }) => a.pct - b.pct)
          .slice(0, 2)
          .map(({ emp, pct }: { emp: EmployeeRow; pct: number }) => ({
            name: emp.name,
            initials: getInitials(emp.name),
            role: emp.designation ?? "Employee",
            pct,
          }));
        setPending(incomplete);

      } catch (err) {
        console.error("HomeRow3 fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="home-row-3">

      {/* ─── Upcoming Birthdays (same card as holidays) ─── */}
      <div className="home-holidays-card">
        <div className="home-holidays-card__header">
          <span className="home-holidays-card__title">Upcoming Birthdays</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
        <div className="home-holidays-card__list-wrapper">
          <div className="home-holidays-card__list">
            {loading ? (
              [0,1,2,3].map(i => (
                <React.Fragment key={i}>
                  <div className="home-holidays-card__item animate-pulse">
                    <div className="h-2.5 w-6 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-5 bg-gray-300 rounded" />
                  </div>
                  {i < 3 && <div className="home-holidays-card__divider" />}
                </React.Fragment>
              ))
            ) : birthdays.length === 0 ? (
              <p className="text-[11px] text-gray-400 font-medium px-2">No birthdays in the next 60 days</p>
            ) : (
              birthdays.map((b, i) => (
                <React.Fragment key={i}>
                  <div
                    className="home-holidays-card__item"
                    title={`${b.name} — ${b.daysUntil === 0 ? "Today! 🎂" : `in ${b.daysUntil}d`}`}
                  >
                    <span className="home-holidays-card__month">{b.month}</span>
                    <span
                      className="home-holidays-card__day text-[#007AFF]"
                    >
                      {b.day}
                    </span>
                  </div>
                  {i < birthdays.length - 1 && <div className="home-holidays-card__divider" />}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── Chat now (SAM) ─── */}
      <div className="home-chat-card" onClick={() => setSamOpen(true)}>
        <div className="home-chat-card__header">
          <span className="home-chat-card__title">Chat now</span>
          <ChevronRight size={14} strokeWidth={2.5} className="home-chat-card__chevron" />
        </div>
        <div className="home-chat-card__bot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sam.svg" alt="Chat now" className="home-chat-card__image" />
        </div>
      </div>

      {/* ─── Pending Profile Updates ─── */}
      <div className="home-pending-card">
        <div className="home-pending-card__header">
          <span className="home-pending-card__title">Pending Profile Updates</span>
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
        <div className="home-pending-card__list">
          {loading ? (
            [0,1].map(i => (
              <div key={i} className="home-pending-card__item animate-pulse">
                <div className="home-pending-card__item-top">
                  <div className="home-pending-card__avatar-circle bg-gray-200" />
                  <div className="home-pending-card__info-text gap-1">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="h-2.5 w-16 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="home-pending-card__progress-row">
                  <div className="home-pending-card__bar-wrap">
                    <div className="home-pending-card__bar bg-gray-200" style={{ width: "40%" }} />
                  </div>
                </div>
              </div>
            ))
          ) : pending.length === 0 ? (
            <p className="text-[12px] text-gray-400 font-medium px-1 py-2">All profiles are complete ✓</p>
          ) : (
            pending.map((p, i) => (
              <div key={i} className="home-pending-card__item">
                <div className="home-pending-card__item-top">
                  <div
                    className="home-pending-card__avatar-circle flex items-center justify-center text-[10px] font-bold bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]"
                  >
                    {p.initials}
                  </div>
                  <div className="home-pending-card__info-text">
                    <span className="home-pending-card__name">{p.name}</span>
                    <span className="home-pending-card__role">{p.role}</span>
                  </div>
                </div>
                <div className="home-pending-card__progress-row">
                  <div className="home-pending-card__bar-wrap">
                    <div
                      className="home-pending-card__bar bg-[#007AFF]"
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <span className="home-pending-card__pct text-[#007AFF]">
                    {p.pct}% <span className="home-pending-card__pct-text">Complete</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
