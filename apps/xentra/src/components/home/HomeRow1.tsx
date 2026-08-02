"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAppStore } from "@/store";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

/* ── types ──────────────────────────────────────────── */
interface ExpiryAlert {
  name: string;
  initials: string;
  type: "Work Pass" | "Passport";
  daysLeft: number;
  avatarUrl?: string | null;
}

/* ── helpers ─────────────────────────────────────────── */
function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}


function pillColor(days: number): { bg: string; text: string } {
  if (days <= 7)  return { bg: "#FFF1F1", text: "#DC2626" };
  if (days <= 30) return { bg: "#FFF4E5", text: "#C47A00" };
  return { bg: "#EFF6FF", text: "#2563EB" };
}

const ALERT_WINDOW_DAYS = 90;

/* ── component ───────────────────────────────────────── */
interface HomeRow1Props {
  onOpenNotify?: () => void;
  onOpenEvents?: () => void;
}

export default function HomeRow1({ onOpenNotify, onOpenEvents }: HomeRow1Props) {
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  // null = sidebar not yet loaded; don't assume super admin until we know for sure
  const isSuperAdmin: boolean | null = cachedSidebar ? (cachedSidebar.isSuperAdmin ?? false) : null;

  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until sidebar is resolved so we know the correct isSuperAdmin value
    if (isSuperAdmin === null) return;

    const fetchAlerts = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let companyId: string;
        let departmentId: string | null = null;

        if (isSuperAdmin) {
          // Super Admin: their auth user.id IS the company_id (same as company_settings logic in Sidebar)
          companyId = user.id;
        } else {
          // Sub-admin / Employee: look up their employee record to get company_id
          const { data: self } = await supabase
            .from("employees")
            .select("department_id, company_id")
            .eq("email", user.email)
            .maybeSingle();

          if (!self) return;
          companyId = self.company_id;
          departmentId = self.department_id;
        }

        let query = supabase
          .from("employees")
          .select("name, department_id, company_id, work_pass_expiry_date, passport_expiry_date, is_active, avatar_url, custom_fields")
          .eq("company_id", companyId);

        if (!isSuperAdmin && departmentId) {
          // Sub-admin / Employee: filter by their department only
          query = query.eq("department_id", departmentId);
        }

        const { data: employees, error } = await query.order("name");
        if (error || !employees) return;

        const collected: ExpiryAlert[] = [];

        for (const emp of employees) {
          if (emp.is_active === false) continue;

          const avatarUrl = emp.avatar_url || emp.custom_fields?.profilePhotoUrl || null;

          // 1. Passport expiry
          if (emp.passport_expiry_date) {
            const days = daysUntil(emp.passport_expiry_date);
            if (days >= -180 && days <= ALERT_WINDOW_DAYS) {
              collected.push({
                name: emp.name,
                initials: getInitials(emp.name),
                type: "Passport",
                daysLeft: days,
                avatarUrl,
              });
            }
          }

          // 2. Work Pass expiry
          if (emp.work_pass_expiry_date) {
            const days = daysUntil(emp.work_pass_expiry_date);
            if (days >= -180 && days <= ALERT_WINDOW_DAYS) {
              collected.push({
                name: emp.name,
                initials: getInitials(emp.name),
                type: "Work Pass",
                daysLeft: days,
                avatarUrl,
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
  }, [isSuperAdmin]); // re-runs once cachedSidebar is loaded and isSuperAdmin changes from null

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
    </div>
  );
}
