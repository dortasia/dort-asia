import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { provider } = await request.json();

    if (provider !== "email") {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("dort_login_method", provider, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Login method API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const loginMethod = cookieStore.get("dort_login_method")?.value || null;

    return NextResponse.json({ provider: loginMethod });
  } catch (err) {
    console.error("Login method GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("dort_login_method");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Login method DELETE error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
