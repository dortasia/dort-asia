import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify user is logged in
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();

    const admin = createAdminClient();

    // 2. Check if the email exists in auth.users (entire Supabase Auth)
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) throw listErr;

    const authUserFound = listData.users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (authUserFound) {
      return NextResponse.json({
        exists: true,
        source: "auth",
        message: "This email is already registered in the system (Supabase Auth)."
      });
    }

    // 3. Check if the email exists in public.employees (entire Supabase employees table across all companies)
    const { data: empData, error: empErr } = await admin
      .from("employees")
      .select("id, name")
      .eq("email", cleanEmail)
      .limit(1);

    if (empErr) throw empErr;

    if (empData && empData.length > 0) {
      return NextResponse.json({
        exists: true,
        source: "employees",
        message: "This email is already registered to an employee in the system."
      });
    }

    // 4. Check if the email is registered as a Super Admin in company_settings
    const { data: csData, error: csErr } = await admin
      .from("company_settings")
      .select("company_id")
      .or(`company_email.eq.${cleanEmail},super_admin_personal_email.eq.${cleanEmail}`)
      .limit(1);

    if (csErr) throw csErr;

    if (csData && csData.length > 0) {
      return NextResponse.json({
        exists: true,
        source: "company_settings",
        message: "This email is already registered as a Super Admin / Company email."
      });
    }

    return NextResponse.json({ exists: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
