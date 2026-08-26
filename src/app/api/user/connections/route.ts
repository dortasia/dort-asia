import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: account, error: accountError } = await supabase
      .schema("identity")
      .from("accounts")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }

    const { data: connections, error: connError } = await supabase
      .schema("platform")
      .from("connected_apps")
      .select("*")
      .eq("account_id", account.id);

    if (connError) {
      console.error("Error fetching connections:", connError);
      return NextResponse.json(
        { error: "Failed to fetch connections" },
        { status: 500 }
      );
    }

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Unexpected error fetching connections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
