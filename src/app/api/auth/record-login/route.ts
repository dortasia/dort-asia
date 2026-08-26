import { NextRequest, NextResponse } from "next/server";
import { processLoginSecurityEvent } from "@/services/security";

export async function POST(req: NextRequest) {
  try {
    let authMethod = "email_password";
    try {
      const body = await req.json();
      if (body?.authMethod) {
        authMethod = body.authMethod;
      }
    } catch (e) {
      // Body might be empty
    }

    console.log("[DIAG] POST /api/auth/record-login called with authMethod:", authMethod);
    const result = await processLoginSecurityEvent({ authMethod });
    console.log("[DIAG] processLoginSecurityEvent returned:", result);

    if (!result) {
      return NextResponse.json(
        { error: "Could not process security event" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, eventType: result.eventType });
  } catch (error) {
    console.error("Error in /api/auth/record-login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
