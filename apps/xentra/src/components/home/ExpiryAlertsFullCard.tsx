"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAppStore } from "@/store";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

interface ExpiryAlert {
  name: string;
  initials: string;
  type: "Work Pass" | "Passport";
  daysLeft: number;
  avatarUrl?: string | null;
}

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}

function pillColor(days: number): { bg: string; text: string } {
  if (days <= 7) return { bg: "#FFF1F1", text: "#DC2626" };
  if (days <= 30) return { bg: "#FFF4E5", text: "#C47A00" };
  return { bg: "#EFF6FF", text: "#2563EB" };
}

const MOCK_ALERTS: ExpiryAlert[] = [
  {
    name: "Sarah Jenkins",
    initials: "SJ",
    type: "Work Pass",
    daysLeft: 5,
    avatarUrl: null,
  },
  {
    name: "Alex Tan",
    initials: "AT",
    type: "Passport",
    daysLeft: 14,
    avatarUrl: null,
  },
  {
    name: "Michael Chen",
    initials: "MC",
    type: "Work Pass",
    daysLeft: 28,
    avatarUrl: null,
  },
  {
    name: "Emily Wong",
    initials: "EW",
    type: "Passport",
    daysLeft: 45,
    avatarUrl: null,
  },
  {
    name: "David Miller",
    initials: "DM",
    type: "Work Pass",
    daysLeft: 60,
    avatarUrl: null,
  },
];

export default function ExpiryAlertsFullCard() {
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const isSuperAdmin: boolean | null = cachedSidebar
    ? cachedSidebar.isSuperAdmin ?? false
    : null;

  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin === null) return;

    const fetchAlerts = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setAlerts(MOCK_ALERTS);
          return;
        }

        let companyId: string;
        let departmentId: string | null = null;

        if (isSuperAdmin) {
          companyId = user.id;
        } else {
          const { data: self } = await supabase
            .from("employees")
            .select("department_id, company_id")
            .eq("email", user.email)
            .maybeSingle();

          if (!self) {
            setAlerts(MOCK_ALERTS);
            return;
          }
          companyId = self.company_id;
          departmentId = self.department_id;
        }

        let query = supabase
          .from("employees")
          .select(
            "name, department_id, company_id, work_pass_expiry_date, passport_expiry_date, is_active, avatar_url, custom_fields"
          )
          .eq("company_id", companyId);

        if (!isSuperAdmin && departmentId) {
          query = query.eq("department_id", departmentId);
        }

        const { data: employees, error } = await query.order("name");
        if (error || !employees) {
          setAlerts(MOCK_ALERTS);
          return;
        }

        const collected: ExpiryAlert[] = [];

        for (const emp of employees) {
          if (emp.is_active === false) continue;

          const avatarUrl =
            emp.avatar_url || emp.custom_fields?.profilePhotoUrl || null;

          if (emp.passport_expiry_date) {
            const daysLeft = daysUntil(emp.passport_expiry_date);
            if (daysLeft <= 90) {
              collected.push({
                name: emp.name,
                initials: getInitials(emp.name),
                type: "Passport",
                daysLeft,
                avatarUrl,
              });
            }
          }

          if (emp.work_pass_expiry_date) {
            const daysLeft = daysUntil(emp.work_pass_expiry_date);
            if (daysLeft <= 90) {
              collected.push({
                name: emp.name,
                initials: getInitials(emp.name),
                type: "Work Pass",
                daysLeft,
                avatarUrl,
              });
            }
          }
        }

        collected.sort((a, b) => a.daysLeft - b.daysLeft);
        setAlerts(collected.length > 0 ? collected : MOCK_ALERTS);
      } catch (err) {
        console.error("Fetch expiry alerts error:", err);
        setAlerts(MOCK_ALERTS);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [isSuperAdmin]);

  const displayAlerts = alerts.length > 0 ? alerts : MOCK_ALERTS;

  return (
    <div className="w-full bg-[#F8F9FA] dark:bg-[#18181F] rounded-[24px] border border-[#E5E7EB] dark:border-white/10 p-5 mb-4 font-sf">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-semibold text-[#111827] dark:text-white leading-[26px]">
            Expiry Alerts
          </h2>
        </div>
        {displayAlerts.length > 0 && (
          <span className="text-[12px] font-semibold bg-[#F3F4F6] dark:bg-white/10 text-[#374151] dark:text-gray-300 px-2.5 py-1 rounded-full font-sf-rounded">
            {displayAlerts.length} {displayAlerts.length === 1 ? "Alert" : "Alerts"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3.5 overflow-x-auto pb-1 page-scrollbar">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#1C1C22] border border-[#E5E7EB] dark:border-white/10 rounded-[18px] p-3.5 w-[250px] min-w-[250px] flex-shrink-0 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              </div>
              <div className="mt-3.5 h-6 bg-gray-100 dark:bg-gray-800 rounded-full" />
            </div>
          ))
        ) : (
          displayAlerts.map((alert, i) => {
            return (
              <div
                key={i}
                className="bg-white dark:bg-[#1C1C22] border border-[#E5E7EB] dark:border-white/10 rounded-[18px] p-3.5 flex flex-col justify-between gap-3 w-[250px] min-w-[250px] flex-shrink-0"
              >
                {/* Top row: avatar + text */}
                <div className="flex items-center gap-3">
                  {alert.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={alert.avatarUrl}
                      alt={alert.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#EFEFEF] dark:bg-white/10 overflow-hidden shrink-0 border border-gray-200/60 dark:border-white/10 flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        fill="#C7C7C7"
                        className="w-full h-full scale-125 translate-y-[2px]"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-semibold text-[#111827] dark:text-white truncate leading-tight">
                      {alert.name}
                    </span>
                    <span className="text-[12px] font-medium text-[#6B7280] dark:text-gray-400 mt-0.5">
                      {alert.type}
                    </span>
                  </div>
                </div>

                {/* Bottom: Minimal status badge */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5 font-sf-rounded">
                  <span className="text-[12px] font-medium text-[#6B7280] dark:text-gray-400">
                    Expires In
                  </span>
                  <span className="text-[12px] font-semibold text-[#111827] dark:text-white">
                    {alert.daysLeft < 0
                      ? `${Math.abs(alert.daysLeft)}d ago`
                      : `${alert.daysLeft} days`}
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
