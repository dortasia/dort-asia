import { SupabaseClient } from "@supabase/supabase-js";

export async function handleDepartmentHeadChange(
  supabase: SupabaseClient,
  departmentId: string,
  newHeadId: string,
  newHeadName: string,
  departmentName: string
) {
  try {
    // 1. Fetch incoming employees
    const { data: incomingEmps, error: fetchErr } = await supabase
      .from("employees")
      .select("id, name, department_id")
      .eq("reporting_department_id", departmentId);

    if (fetchErr) throw fetchErr;

    if (incomingEmps && incomingEmps.length > 0) {
      for (const emp of incomingEmps) {
        // Update manager_id to new head
        const { error: updateErr } = await supabase
          .from("employees")
          .update({ manager_id: newHeadId })
          .eq("id", emp.id);

        if (updateErr) throw updateErr;

        // Send a notification to the home department head of the employee
        if (emp.department_id && emp.department_id !== departmentId) {
          const { data: homeDept, error: deptErr } = await supabase
            .from("departments")
            .select("head_id, name")
            .eq("id", emp.department_id)
            .maybeSingle();

          if (deptErr) {
            console.error("Error fetching home department:", deptErr);
            continue;
          }

          if (homeDept?.head_id) {
            await supabase
              .from("notifications")
              .insert({
                employee_id: homeDept.head_id,
                title: "Reportee Manager Updated",
                message: `Employee ${emp.name} from your department (${homeDept.name}) is reporting to the ${departmentName || "updated"} department. Their reporting manager has been automatically updated to the new Department Head ${newHeadName}.`,
                type: "info",
                is_read: false
              });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in handleDepartmentHeadChange:", error);
  }
}
