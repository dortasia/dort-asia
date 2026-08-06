"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAppStore } from "@/store";

interface StatData {
  employeeCount: number;
  employeeLimit: number;
  storageUsedGB: number;
  storageLimitGB: number;
  deptCount: number;
  deptLimit: number;
  alertsCount: number;
  requestsCount: number;
}

export default function XentraStatCardsRow() {
  const cachedSidebar = useAppStore((s) => s.cachedSidebar);
  const isSuperAdmin: boolean | null = cachedSidebar
    ? cachedSidebar.isSuperAdmin ?? false
    : null;

  const [stats, setStats] = useState<StatData>({
    employeeCount: 28,
    employeeLimit: 50,
    storageUsedGB: 98,
    storageLimitGB: 15,
    deptCount: 10,
    deptLimit: 15,
    alertsCount: 23,
    requestsCount: 4,
  });

  useEffect(() => {
    if (isSuperAdmin === null) return;

    const fetchStats = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        let companyId = user.id;
        let departmentId: string | null = null;

        if (!isSuperAdmin) {
          const { data: self } = await supabase
            .from("employees")
            .select("company_id, department_id")
            .eq("email", user.email)
            .maybeSingle();

          if (self && self.company_id) {
            companyId = self.company_id;
            departmentId = self.department_id;
          }
        }

        let empQuery = supabase
          .from("employees")
          .select("id, is_active, passport_expiry_date, work_pass_expiry_date")
          .eq("company_id", companyId);
        
        const deptQuery = supabase
          .from("departments")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId);

        const leaveQuery = supabase
          .from("leave_requests")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "pending");

        const claimsQuery = supabase
          .from("claims")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "pending");

        if (!isSuperAdmin && departmentId) {
          empQuery = empQuery.eq("department_id", departmentId);
          // Assuming leave and claims might not have department_id, we'll keep it simple or filter by employee IDs if needed
          // Let's just use company_id for requests for now, or filter if necessary
        }

        const [empResult, deptResult, compResult, leaveResult, claimsResult] = await Promise.all([
          empQuery,
          deptQuery,
          supabase
            .from("company_settings")
            .select("storage_used_gb, seat_limit")
            .eq("company_id", companyId)
            .maybeSingle(),
          leaveQuery,
          claimsQuery,
        ]);

        const employees = empResult.data || [];
        const realEmpCount = employees.length;
        const realDeptCount = deptResult.count ?? 10;
        const realStorage = compResult.data?.storage_used_gb ?? 98;
        const realSeatLimit = compResult.data?.seat_limit ?? 50;

        let alerts = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const emp of employees) {
          if (emp.is_active === false) continue;
          
          let alertAdded = false;
          if (emp.passport_expiry_date) {
            const end = new Date(emp.passport_expiry_date);
            end.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
            if (daysLeft <= 90) {
              alerts++;
              alertAdded = true;
            }
          }
          if (!alertAdded && emp.work_pass_expiry_date) {
            const end = new Date(emp.work_pass_expiry_date);
            end.setHours(0, 0, 0, 0);
            const daysLeft = Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
            if (daysLeft <= 90) {
              alerts++;
            }
          }
        }

        const realLeaveCount = leaveResult.count ?? 0;
        const realClaimsCount = claimsResult.count ?? 0;

        setStats({
          employeeCount: realEmpCount > 0 ? realEmpCount : 0,
          employeeLimit: realSeatLimit,
          storageUsedGB: Math.round(realStorage),
          storageLimitGB: 15,
          deptCount: realDeptCount > 0 ? realDeptCount : 0,
          deptLimit: 15,
          alertsCount: alerts,
          requestsCount: realLeaveCount + realClaimsCount,
        });
      } catch (err) {
        console.error("Fetch stat cards error:", err);
      }
    };

    fetchStats();
  }, [isSuperAdmin]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 my-4 font-sf">
      {/* Card 1: Total Employees */}
      <div className="relative bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
        <p className="text-[14px] font-medium text-[#111827] dark:text-white tracking-normal font-sf z-10">
          Total Employees
        </p>
        <div className="flex items-baseline gap-0.5 mt-auto z-10">
          <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] dark:text-white font-sf-rounded">
            {stats.employeeCount}
          </span>
          <span className="text-[22px] font-medium text-[#6B7280] dark:text-gray-400 font-sf-rounded">
            /{stats.employeeLimit}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stat-box/total-employee.svg"
          alt="Total Employees"
          className="absolute right-0 bottom-0 w-[130px] h-[117px] object-contain pointer-events-none select-none z-0"
        />
      </div>

      {/* Card 2: Storage Used */}
      <div className="relative bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
        <p className="text-[14px] font-medium text-[#111827] dark:text-white tracking-normal font-sf z-10">
          Storage Used
        </p>
        <div className="flex items-baseline gap-0.5 mt-auto z-10">
          <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] dark:text-white font-sf-rounded">
            {stats.storageUsedGB}
          </span>
          <span className="text-[22px] font-medium text-[#6B7280] dark:text-gray-400 font-sf-rounded">
            /{stats.storageLimitGB} GB
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stat-box/storage.svg"
          alt="Storage Used"
          className="absolute right-0 bottom-0 w-[130px] h-[117px] object-contain pointer-events-none select-none z-0"
        />
      </div>

      {/* Card 3: Total Departments */}
      <div className="relative bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
        <p className="text-[14px] font-medium text-[#111827] dark:text-white tracking-normal font-sf z-10">
          Total Departments
        </p>
        <div className="flex items-baseline gap-0.5 mt-auto z-10">
          <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] dark:text-white font-sf-rounded">
            {stats.deptCount}
          </span>
          <span className="text-[22px] font-medium text-[#6B7280] dark:text-gray-400 font-sf-rounded">
            /{stats.deptLimit}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stat-box/department.svg"
          alt="Total Departments"
          className="absolute right-0 bottom-0 w-[130px] h-[117px] object-contain pointer-events-none select-none z-0"
        />
      </div>

      {/* Card 4: Company Alerts */}
      <div className="relative bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
        <p className="text-[14px] font-medium text-[#111827] dark:text-white tracking-normal font-sf z-10">
          Company Alerts
        </p>
        <div className="flex items-baseline gap-0.5 mt-auto z-10">
          <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] dark:text-white font-sf-rounded">
            {stats.alertsCount}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stat-box/alerts-expiery.svg"
          alt="Company Alerts"
          className="absolute right-0 bottom-0 w-[130px] h-[117px] object-contain pointer-events-none select-none z-0"
        />
      </div>

      {/* Card 5: Requests For You */}
      <div className="relative bg-white dark:bg-[#1C1C22] rounded-[25px] border border-[#E5E7EB] dark:border-white/10 p-5 flex flex-col justify-between w-full h-[160px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] overflow-hidden">
        <p className="text-[14px] font-medium text-[#111827] dark:text-white tracking-normal font-sf z-10">
          Requests For You
        </p>
        <div className="flex items-baseline gap-0.5 mt-auto z-10">
          <span className="text-[38px] font-medium leading-none tracking-tight text-[#111827] dark:text-white font-sf-rounded">
            {stats.requestsCount}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/stat-box/requests.svg"
          alt="Requests For You"
          className="absolute right-0 bottom-0 w-[130px] h-[117px] object-contain pointer-events-none select-none z-0"
        />
      </div>
    </div>
  );
}
