import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { provider } = await request.json();

    if (!provider) {
      return NextResponse.json(
        { error: "Provider is required" },
        { status: 400 }
      );
    }

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

    // Delete the connection
    const { error: deleteError } = await supabase
      .schema("platform")
      .from("connected_apps")
      .delete()
      .eq("account_id", account.id)
      .eq("provider", provider);

    if (deleteError) {
      console.error("Error disconnecting app:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect app" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error disconnecting app:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
