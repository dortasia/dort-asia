import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

// GET /api/employee-credentials?email=xxx
// Returns whether a Supabase auth account exists for the given email
export async function GET(req: NextRequest) {
  try {
    // Verify the requester is a logged-in super admin
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: cs } = await serverSupabase
      .from("company_settings")
      .select("company_id")
      .eq("company_id", user.id)
      .maybeSingle();
    if (!cs) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const email = req.nextUrl.searchParams.get("email");
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

    const admin = createAdminClient();
    // List users filtered by email
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;

    const found = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    return NextResponse.json({
      exists: !!found,
      confirmed: found ? !!found.email_confirmed_at : false,
      lastSignIn: found?.last_sign_in_at ?? null,
      userId: found?.id ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/employee-credentials
// Body: { action: "create" | "reset_password", email, password, employeeId }
export async function POST(req: NextRequest) {
  try {
    // Verify the requester is a logged-in super admin
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: cs } = await serverSupabase
      .from("company_settings")
      .select("company_id")
      .eq("company_id", user.id)
      .maybeSingle();
    if (!cs) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { action, email, password, employeeId } = body;

    if (!email || !action) {
      return NextResponse.json({ error: "email and action are required" }, { status: 400 });
    }

    const admin = createAdminClient();

    if (action === "create") {
      // Create a new Supabase auth user with email + password
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Mark as confirmed so they can log in immediately
      });
      if (createErr) throw createErr;

      // Store user_id and lastPassword back on the employees row
      if (employeeId) {
        const { data: empData } = await serverSupabase
          .from("employees")
          .select("custom_fields")
          .eq("id", employeeId)
          .single();
        
        let cf = {};
        if (empData && empData.custom_fields) {
          cf = typeof empData.custom_fields === 'string' 
            ? JSON.parse(empData.custom_fields) 
            : empData.custom_fields;
        }
        
        const updatedCF = {
          ...cf,
          lastPassword: password
        };

        const updatePayload: any = { custom_fields: updatedCF };
        if (newUser.user) {
          updatePayload.user_id = newUser.user.id;
        }

        await serverSupabase
          .from("employees")
          .update(updatePayload)
          .eq("id", employeeId);
      }

      return NextResponse.json({ success: true, userId: newUser.user?.id });
    }

    if (action === "reset_password") {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }

      // Find the user by email first
      const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) throw listErr;

      const found = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!found) {
        return NextResponse.json({ error: "No auth account found for this email." }, { status: 404 });
      }

      const { error: updateErr } = await admin.auth.admin.updateUserById(found.id, { password });
      if (updateErr) throw updateErr;

      // Update lastPassword back on the employees row
      if (employeeId) {
        const { data: empData } = await serverSupabase
          .from("employees")
          .select("custom_fields")
          .eq("id", employeeId)
          .single();
        
        let cf = {};
        if (empData && empData.custom_fields) {
          cf = typeof empData.custom_fields === 'string' 
            ? JSON.parse(empData.custom_fields) 
            : empData.custom_fields;
        }
        
        const updatedCF = {
          ...cf,
          lastPassword: password
        };

        await serverSupabase
          .from("employees")
          .update({ custom_fields: updatedCF })
          .eq("id", employeeId);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "invite") {
      // Invite a user to Supabase auth via email
      const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${req.nextUrl.origin}/auth/callback`,
      });
      if (inviteErr) throw inviteErr;

      // Store user_id back on the employees row if possible
      if (employeeId && inviteData.user) {
        await serverSupabase
          .from("employees")
          .update({ user_id: inviteData.user.id })
          .eq("id", employeeId);
      }

      return NextResponse.json({ success: true, userId: inviteData.user?.id });
    }

    if (action === "delete") {
      // Find user by email and delete
      const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) throw listErr;

      const found = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!found) {
        return NextResponse.json({ error: "No auth account found." }, { status: 404 });
      }

      const { error: deleteErr } = await admin.auth.admin.deleteUser(found.id);
      if (deleteErr) throw deleteErr;

      // Clear user_id and lastPassword from employees row
      if (employeeId) {
        const { data: empData } = await serverSupabase
          .from("employees")
          .select("custom_fields")
          .eq("id", employeeId)
          .single();
        
        let cf: any = {};
        if (empData && empData.custom_fields) {
          cf = typeof empData.custom_fields === 'string' 
            ? JSON.parse(empData.custom_fields) 
            : empData.custom_fields;
        }
        
        const { lastPassword, ...restCF } = cf;

        await serverSupabase
          .from("employees")
          .update({ user_id: null, custom_fields: restCF })
          .eq("id", employeeId);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
