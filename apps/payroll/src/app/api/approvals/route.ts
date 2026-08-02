import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(req: NextRequest) {
  try {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve companyId
    let companyId = user.id;
    const { data: curEmp } = await serverSupabase
      .from("employees")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (curEmp?.company_id) companyId = curEmp.company_id;

    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const approvalId = searchParams.get("approvalId");

    const admin = createAdminClient();

    if (clearAll) {
      const { error } = await admin
        .from("approvals")
        .delete()
        .eq("company_id", companyId)
        .in("type", ["Transfer", "Reportee"])
        .in("status", ["Completed", "Approved", "Rejected"]);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Past records cleared successfully" });
    }

    if (approvalId) {
      // Secure delete: ensure it belongs to the user's company
      const { error } = await admin
        .from("approvals")
        .delete()
        .eq("id", approvalId)
        .eq("company_id", companyId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Request cancelled successfully" });
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (err: any) {
    console.error("API Approvals DELETE Error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute delete operation" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve companyId
    let companyId = user.id;
    const { data: curEmp } = await serverSupabase
      .from("employees")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (curEmp?.company_id) companyId = curEmp.company_id;

    const { approvalId, action, localToday } = await req.json();

    if (!approvalId || !action) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch the approval record using admin client
    const { data: app, error: getErr } = await admin
      .from("approvals")
      .select("*")
      .eq("id", approvalId)
      .eq("company_id", companyId)
      .single();

    if (getErr || !app) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    if (action === "reject") {
      // Reject the request
      const { error: updateErr } = await admin
        .from("approvals")
        .update({ status: "Rejected", updated_at: new Date().toISOString() })
        .eq("id", approvalId);

      if (updateErr) throw updateErr;

      // Notify employee if Transfer
      if (app.type === "Transfer") {
        const p = app.payload || {};
        const empIds: string[] = p.employeeIds || [];
        if (empIds.length > 0) {
          const targetDeptName = p.targetDeptName || "target department";
          await admin.from("notifications").insert(
            empIds.map((empId) => ({
              employee_id: empId,
              title: "Transfer Request Declined",
              message: `Your transfer request to ${targetDeptName} was declined.`,
              type: "info",
              is_read: false,
            }))
          );
        }
      }

      return NextResponse.json({ success: true, message: "Request declined successfully" });
    }

    if (action === "approve") {
      const p = app.payload || {};

      if (app.type === "Reportee") {
        // Decide if immediate or scheduled
        const effectiveDate = p.effectiveDate;
        const d = new Date();
        const serverToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const todayStr = localToday || serverToday;
        const isImmediate = !effectiveDate || effectiveDate <= todayStr;

        if (isImmediate) {
          // 1. Update employee manager
          const { error: updateEmpErr } = await admin
            .from("employees")
            .update({
              manager_id: p.newManagerId,
              reporting_department_id: p.reportingDepartmentId,
            })
            .eq("id", p.employeeId);

          if (updateEmpErr) throw updateEmpErr;

          // 2. Insert notification
          await admin.from("notifications").insert({
            employee_id: p.employeeId,
            title: "Reporting Manager Updated",
            message: `Your reporting line has changed. You now report to ${p.newManagerName}${p.reportingDepartmentName ? ` (${p.reportingDepartmentName})` : ""} for attendance, claims, leave & events.`,
            type: "info",
            is_read: false,
          });

          // 3. Mark approval completed
          const { error: updateAppErr } = await admin
            .from("approvals")
            .update({ status: "Completed", updated_at: new Date().toISOString() })
            .eq("id", approvalId);

          if (updateAppErr) throw updateAppErr;

          return NextResponse.json({ success: true, applied: true, message: "Reporting change approved and applied!" });
        } else {
          // Scheduled
          const { error: updateAppErr } = await admin
            .from("approvals")
            .update({ status: "Approved", updated_at: new Date().toISOString() })
            .eq("id", approvalId);

          if (updateAppErr) throw updateAppErr;

          return NextResponse.json({ success: true, applied: false, message: `Reporting change approved! Scheduled for ${effectiveDate}.` });
        }
      } else if (app.type === "Transfer") {
        const employeeIds: string[] = p.employeeIds || [];
        const targetDeptId = p.targetDeptId;
        const targetDeptName = p.targetDeptName || "";
        const effectiveDate = p.effectiveDate;
        const reason = p.reason || "";

        const d = new Date();
        const serverToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const todayStr = localToday || serverToday;
        const isImmediate = !effectiveDate || effectiveDate <= todayStr;

        if (isImmediate) {
          // 1. Update employee department
          const { error: updateEmpErr } = await admin
            .from("employees")
            .update({ department_id: targetDeptId })
            .in("id", employeeIds);

          if (updateEmpErr) throw updateEmpErr;

          // 2. Insert notifications
          if (employeeIds.length > 0) {
            await admin.from("notifications").insert(
              employeeIds.map((empId) => ({
                employee_id: empId,
                title: "Department Transfer Completed",
                message: `Transferred to ${targetDeptName}. Reason: ${reason || "None"}`,
                type: "info",
                is_read: false,
              }))
            );
          }

          // 3. Mark approval completed
          const { error: updateAppErr } = await admin
            .from("approvals")
            .update({ status: "Completed", updated_at: new Date().toISOString() })
            .eq("id", approvalId);

          if (updateAppErr) throw updateAppErr;

          return NextResponse.json({ success: true, applied: true, message: "Transfer approved and applied!" });
        } else {
          // Scheduled
          const { error: updateAppErr } = await admin
            .from("approvals")
            .update({ status: "Approved", updated_at: new Date().toISOString() })
            .eq("id", approvalId);

          if (updateAppErr) throw updateAppErr;

          return NextResponse.json({ success: true, applied: false, message: `Transfer approved! Scheduled for ${effectiveDate}.` });
        }
      }
    }

    if (action === "execute_scheduled") {
      const p = app.payload || {};
      if (app.status !== "Approved") {
        return NextResponse.json({ error: "Approval request is not in Approved status" }, { status: 400 });
      }

      // Check date
      const effectiveDate = p.effectiveDate;
      const d = new Date();
      const serverToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const todayStr = localToday || serverToday;

      if (!effectiveDate || effectiveDate <= todayStr) {
        // Atomic update of status to Completed to prevent double execution
        const { data: updatedApp, error: updateStatusErr } = await admin
          .from("approvals")
          .update({ status: "Completed", updated_at: new Date().toISOString() })
          .eq("id", approvalId)
          .eq("status", "Approved")
          .select();

        if (updateStatusErr) throw updateStatusErr;

        if (updatedApp && updatedApp.length > 0) {
          if (app.type === "Reportee") {
            const employeeId = p.employeeId;
            const newManagerId = p.newManagerId;
            const newManagerName = p.newManagerName || "New Manager";
            const reason = p.reason || "";

            // 1. Update employee manager
            const { error: updateEmpErr } = await admin
              .from("employees")
              .update({ manager_id: newManagerId })
              .eq("id", employeeId);

            if (updateEmpErr) throw updateEmpErr;

            // 2. Insert notification
            await admin.from("notifications").insert({
              employee_id: employeeId,
              title: "Reporting Manager Updated",
              message: `Your reporting manager has been updated to ${newManagerName}. Effective: ${effectiveDate}. Reason: ${reason || "None"}`,
              type: "info",
              is_read: false
            });
          } else if (app.type === "Transfer") {
            const employeeIds: string[] = p.employeeIds || [];
            const targetDeptId = p.targetDeptId;
            const targetDeptName = p.targetDeptName || "Target Department";
            const reason = p.reason || "";

            // 1. Update employee department
            const { error: updateEmpErr } = await admin
              .from("employees")
              .update({ department_id: targetDeptId })
              .in("id", employeeIds);

            if (updateEmpErr) throw updateEmpErr;

            // 2. Insert notifications
            const insertPayloads = employeeIds.map(empId => ({
              employee_id: empId,
              title: "Department Transfer Completed",
              message: `Transferred to department ${targetDeptName}. Effective: ${effectiveDate || "Immediately"}. Reason: ${reason || "None"}`,
              type: "info",
              is_read: false
            }));

            if (insertPayloads.length > 0) {
              await admin.from("notifications").insert(insertPayloads);
            }
          }
          return NextResponse.json({ success: true, executed: true, message: "Scheduled request executed successfully!" });
        } else {
          return NextResponse.json({ success: true, executed: false, message: "Already executed by another process" });
        }
      } else {
        return NextResponse.json({ error: "Scheduled request is not yet due" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("API Approvals PUT Error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute PUT operation" }, { status: 500 });
  }
}

