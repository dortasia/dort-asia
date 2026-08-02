import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase config" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let userId: string | null = null;
    let page = 1;
    let hasMore = true;
    const targetEmail = email.trim().toLowerCase();

    while (hasMore) {
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: 1000
      });
      if (usersError) throw usersError;

      if (users.length === 0) {
        hasMore = false;
        break;
      }

      const user = users.find(u => u.email?.toLowerCase() === targetEmail);
      if (user) {
        userId = user.id;
        break;
      }
      page++;
    }

    if (!userId) {
      // Return success anyway to prevent email enumeration, or throw error depending on requirements
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a 2-digit random code
    const code = Math.floor(10 + Math.random() * 90).toString();

    // Insert into device_auth_requests
    const { data: requestData, error: insertError } = await supabase
      .from("device_auth_requests")
      .insert({
        user_id: userId,
        device_code: code,
        status: "pending"
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      request_id: requestData.id,
      device_code: code 
    });

  } catch (error: any) {
    console.error("Device Auth Initiate Error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate device auth" }, { status: 500 });
  }
}
