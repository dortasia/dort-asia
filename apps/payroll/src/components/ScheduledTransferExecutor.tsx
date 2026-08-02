"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ScheduledTransferExecutor() {
  const supabase = createClient();

  useEffect(() => {
    async function executeScheduledTransfers() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let companyId = user.id;
        const { data: curEmp } = await supabase
          .from('employees')
          .select('company_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (curEmp?.company_id) {
          companyId = curEmp.company_id;
        }

        // Fetch all approved transfers and reportees
        const { data: approvedApps, error: fetchErr } = await supabase
          .from("approvals")
          .select("*")
          .eq("company_id", companyId)
          .in("type", ["Transfer", "Reportee"])
          .eq("status", "Approved");

        if (fetchErr || !approvedApps || approvedApps.length === 0) return;

        const d = new Date();
        const localTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        for (const app of approvedApps) {
          const p = app.payload || {};
          const effectiveDate = p.effectiveDate;
          const employeeIds: string[] = p.employeeIds || [];
          const targetDeptId = p.targetDeptId;
          const targetDeptName = p.targetDeptName || "Target Department";
          const reason = p.reason || "";

          // Check if due
          if (!effectiveDate || effectiveDate <= localTodayStr) {
            console.log(`Triggering execution of scheduled approval ${app.id} (${app.type})`);
            const res = await fetch("/api/approvals", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                approvalId: app.id,
                action: "execute_scheduled",
                localToday: localTodayStr,
              }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
              console.error(`Failed to execute scheduled approval ${app.id}:`, data.error);
            } else {
              console.log(`Successfully executed scheduled approval ${app.id}`);
            }
          }
        }
      } catch (err) {
        console.error("Error running scheduled transfers executor:", err);
      }
    }

    // Run on mount
    executeScheduledTransfers();
  }, [supabase]);

  return null;
}
