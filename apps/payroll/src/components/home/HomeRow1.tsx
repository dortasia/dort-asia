"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAppStore } from "@/store";

/* ── types ──────────────────────────────────────────── */
interface ExpiryAlert {
  name: string;
  initials: string;
  type: "Work Contract" | "Insurance Policy";
  daysLeft: number;
}

/* ── helpers ─────────────────────────────────────────── */
function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

const ALERT_WINDOW_DAYS = 90;

/* ── component ───────────────────────────────────────── */
interface HomeRow1Props {
  onOpenNotify?: () => void;
  onOpenEvents?: () => void;
}

export default function HomeRow1({ onOpenNotify, onOpenEvents }: HomeRow1Props) {
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const isSuperAdmin = cachedSidebar?.isSuperAdmin ?? true;

  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
          .from("employees")
          .select("name, policy_end_date, custom_fields, department_id, company_id");

        if (isSuperAdmin) {
          // Super admin: see ALL employees in the company
          query = query.eq("company_id", user.id);
        } else {
          // Dept admin / sub-admin: find their employee record first, then filter by dept
          const { data: self } = await supabase
            .from("employees")
            .select("department_id, company_id")
            .eq("email", user.email)
            .maybeSingle();

          if (!self) return;
          query = query
            .eq("company_id", self.company_id)
            .eq("department_id", self.department_id);
        }

        const { data: employees, error } = await query.order("name");
        if (error || !employees) return;

        const collected: ExpiryAlert[] = [];

        for (const emp of employees) {
          // 1. Work Contract expiry
          const contractEnd: string | undefined = emp.custom_fields?.contract_end_date;
          if (contractEnd) {
            const days = daysUntil(contractEnd);
            if (days >= 0 && days <= ALERT_WINDOW_DAYS) {
              collected.push({
                name: emp.name,
                initials: getInitials(emp.name),
                type: "Work Contract",
                daysLeft: days,
              });
            }
          }

          // 2. Insurance Policy expiry
          const policyEnd: string | undefined = emp.policy_end_date;
          if (policyEnd) {
            const days = daysUntil(policyEnd);
            if (days >= 0 && days <= ALERT_WINDOW_DAYS) {
              collected.push({
                name: emp.name,
                initials: getInitials(emp.name),
                type: "Insurance Policy",
                daysLeft: days,
              });
            }
          }
        }

        // Sort soonest first
        collected.sort((a, b) => a.daysLeft - b.daysLeft);
        setAlerts(collected);
      } catch (err) {
        console.error("Expiry alert fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [isSuperAdmin]);

  return (
    <div className="home-row-1">
      {/* ─── Notify card ─── */}
      <div className="home-mini-card cursor-pointer" onClick={onOpenNotify}>
        <div className="home-mini-card__header">
          <span className="home-mini-card__title">Notify</span>
          <ChevronRight size={14} strokeWidth={2.5} className="home-mini-card__chevron" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Notify.svg" alt="Notify" className="home-mini-card__icon" />
      </div>

      {/* ─── Events card ─── */}
      <div className="home-mini-card cursor-pointer" onClick={onOpenEvents}>
        <div className="home-mini-card__header">
          <span className="home-mini-card__title">Events</span>
          <ChevronRight size={14} strokeWidth={2.5} className="home-mini-card__chevron" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Events 2.svg" alt="Events" className="home-mini-card__icon" />
      </div>

      {/* ─── Expiry Alert cards container ─── */}
      <div className="home-expiry-container">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="home-expiry-card animate-pulse">
              <div className="home-expiry-card__top">
                <div className="home-expiry-card__avatar bg-gray-200" />
                <div className="home-expiry-card__info gap-1">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-2.5 w-16 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="home-expiry-card__pill bg-gray-100">
                <div className="h-2.5 w-28 bg-gray-200 rounded" />
              </div>
            </div>
          ))
        ) : alerts.length === 0 ? (
          <div className="home-expiry-card flex flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="h-5 w-5 text-green-500" />
            <p className="text-[11px] font-semibold text-gray-400 leading-snug">
              No expiry alerts<br />in the next 90 days
            </p>
          </div>
        ) : (
          alerts.slice(0, 3).map((alert, i) => {
            return (
              <div key={i} className="home-expiry-card">
                {/* Top row: avatar + text */}
                <div className="home-expiry-card__top">
                  <div
                    className="home-expiry-card__avatar flex items-center justify-center text-[11px] font-bold bg-[#E5F1FF] dark:bg-[#007AFF]/15 text-[#007AFF]"
                  >
                    {alert.initials}
                  </div>
                  <div className="home-expiry-card__info">
                    <span className="home-expiry-card__name">{alert.name}</span>
                    <span className="home-expiry-card__type">{alert.type}</span>
                  </div>
                </div>

                {/* Bottom: days-left pill */}
                <div
                  className="home-expiry-card__pill py-1 mt-0.5 bg-[#E5F1FF] dark:bg-[#007AFF]/10 text-[#007AFF]"
                >
                  <span
                    className="home-expiry-card__pill-number text-[11px] text-[#007AFF]"
                  >
                    {alert.daysLeft}
                  </span>
                  <span
                    className="home-expiry-card__pill-text text-[10px] text-[#007AFF]"
                  >
                    {" "}Days Left For Expiry
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
