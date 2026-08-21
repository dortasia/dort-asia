import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { user: null },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
          },
        }
      );
    }

    // Return only non-sensitive public profile info
    const profile = {
      email: user.email || null,
      avatar_url:
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        user.identities?.[0]?.identity_data?.avatar_url ||
        user.identities?.[0]?.identity_data?.picture ||
        null,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.identities?.[0]?.identity_data?.full_name ||
        user.identities?.[0]?.identity_data?.name ||
        null,
    };

    return NextResponse.json(
      { user: profile },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { user: null },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  });
}
