import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10", 10), 1), 50);
    const cursor = searchParams.get("cursor"); // ISO timestamp of the oldest item in current page

    const { createClient: createSupabaseAdmin } = await import("@supabase/supabase-js");
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .schema("identity")
      .from("login_events")
      .select("id, created_at, event_type, device_type, browser, os, city, country_name, ip_address, is_new_device, is_new_location")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // fetch 1 extra item to determine if more items exist

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching security activity:", error);
      return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
    }

    const hasMore = (events?.length || 0) > limit;
    const paginatedEvents = hasMore ? events.slice(0, limit) : (events || []);
    const nextCursor = hasMore && paginatedEvents.length > 0
      ? paginatedEvents[paginatedEvents.length - 1].created_at
      : null;

    return NextResponse.json({
      events: paginatedEvents,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Security activity fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
