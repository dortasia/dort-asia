import { createClient } from "@/utils/supabase/server";
import AttendanceList, { AttendanceItem } from "./AttendanceList";
import { getAvatarColor, getInitials } from "@/utils/avatarColor";

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const supabase = await createClient();

  // Compute today's date in IST (UTC+5:30) — matches what Vertex stores
  const now = new Date();
  const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const today = istDate.toISOString().split("T")[0];
  // Current IST time as HH:MM for grace period comparison
  const istTimeHHMM = istDate.toISOString().split("T")[1].substring(0, 5);

  // Fetch employees + company settings in parallel
  const [{ data: employees }, { data: settingsRows }, { data: attendance }] = await Promise.all([
    supabase.from("employees").select("id, name, role, emp_id, user_id, company_id"),
    supabase.from("company_settings").select("shift_start, grace_period_mins").limit(1).single(),
    // Order by clock_in_time DESC so the latest record wins when an employee clocks in multiple times
    supabase.from("attendance").select("*").eq("date", today).order("clock_in_time", { ascending: false }),
  ]);

  // Grace deadline: shift_start + grace_period_mins (default 09:15)
  const shiftStart = (settingsRows as { shift_start?: string } | null)?.shift_start ?? "09:00";
  const graceMins = (settingsRows as { grace_period_mins?: number } | null)?.grace_period_mins ?? 15;
  const [shiftH, shiftM] = shiftStart.split(":").map(Number);
  const graceDeadlineMins = shiftH * 60 + shiftM + graceMins;
  const graceH = Math.floor(graceDeadlineMins / 60).toString().padStart(2, "0");
  const graceMin = (graceDeadlineMins % 60).toString().padStart(2, "0");
  const graceDeadline = `${graceH}:${graceMin}`; // e.g. "09:15"

  // Build lookup: employee identifier → LATEST attendance record
  // (DESC order ensures first-seen wins = latest)
  const attByEmployeeId = new Map<string, NonNullable<typeof attendance>[number]>();
  for (const a of attendance ?? []) {
    if (a.employee_id && !attByEmployeeId.has(a.employee_id)) {
      attByEmployeeId.set(a.employee_id, a);
    }
  }

  const formattedData: AttendanceItem[] = (employees ?? []).map((emp) => {
    const fullName = emp.name?.trim() || "Unknown Employee";
    const avatar = getAvatarColor(fullName);
    const initialsStr = getInitials(fullName);

    // Match priority:
    // 1. employees.user_id === attendance.employee_id  (primary — Vertex auth UUID)
    // 2. employees.id     === attendance.employee_id  (legacy fallback)
    const att =
      (emp.user_id ? attByEmployeeId.get(emp.user_id) : undefined) ??
      attByEmployeeId.get(emp.id);

    // Format GPS coordinates into a clickable map link
    let locationDisplay = "Unknown";
    let locationUrl = "#";
    if (att?.location) {
      const isCoords = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(att.location.trim());
      locationDisplay = isCoords ? att.location.trim() : att.location;
      locationUrl = `https://maps.google.com/?q=${isCoords ? att.location.trim() : encodeURIComponent(att.location)}`;
    }

    // Normalise status — Vertex writes lowercase "present"
    let status = "Absent";
    if (att?.status) {
      const s = att.status.toLowerCase();
      status = s === "present" ? "Present" : s.charAt(0).toUpperCase() + s.slice(1);
    }

    // Late Entry = Present but clocked in after shift_start HH:MM
    const isLate = status === "Present" && !!att?.clock_in && att.clock_in > shiftStart;

    return {
      id: emp.id,
      name: fullName,
      role: emp.role || "Employee",
      empId: emp.emp_id || "--",
      location: locationDisplay,
      locationUrl,
      proof: att?.proof_url || "",
      clockIn: att?.clock_in || "--",
      clockOut: att?.clock_out || "--",
      hours: att?.hours || "--",
      status,
      isLate,
      initials: initialsStr,
      color: avatar.color,
      bg: avatar.bg,
      attendanceId: att?.id ?? null,
      clockInTime: att?.clock_in_time ?? null,
    };
  });

  // Sort: Present (latest clock-in first) → Absent
  formattedData.sort((a, b) => {
    if (a.status === "Present" && b.status !== "Present") return -1;
    if (a.status !== "Present" && b.status === "Present") return 1;
    // Both present: sort by clock_in_time descending (latest first)
    if (a.clockInTime && b.clockInTime) return b.clockInTime.localeCompare(a.clockInTime);
    return 0;
  });

  // "Truly absent" = no clock-in AND current IST time is past the grace deadline
  // Only show in the absent strip once grace period has elapsed
  const graceElapsed = istTimeHHMM >= graceDeadline;
  const absentToday = graceElapsed
    ? formattedData.filter((d) => d.status === "Absent")
    : []; // Before grace period ends, don't show anyone as "absent" yet

  return (
    <AttendanceList
      initialData={formattedData}
      absentToday={absentToday}
      todayDate={today}
      graceDeadline={graceDeadline}
      shiftStart={shiftStart}
    />
  );
}
