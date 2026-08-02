import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// In-memory store for OTPs (for dev/demo purposes)
// In production, use a database table like `verification_otps`
declare global {
  var _otpStore: Map<string, { code: string; method: string; expiresAt: number }>;
}

const getOtpStore = () => {
  if (!globalThis._otpStore) {
    globalThis._otpStore = new Map();
  }
  return globalThis._otpStore;
};

export async function POST(req: Request) {
  try {
    const { userId, method, email } = await req.json();

    if (!userId || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    const store = getOtpStore();
    store.set(userId, { code, method, expiresAt });
    console.log(`[OTP Generated] User: ${userId}, Code: ${code}, Method: ${method}`);

    if (method === "mobile") {
      // Send Realtime Broadcast
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase environment variables");
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const channel = supabase.channel(`user_notifications_${userId}`);
      
      await new Promise((resolve, reject) => {
        channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: "broadcast",
              event: "verify_request",
              payload: { message: "Verification required on HRMS website" },
            });
            console.log(`[OTP Broadcasted] Channel: user_notifications_${userId} (verify_request, no code sent)`);
            // Wait 1.5s before cleaning up to give the mobile client time to receive
            setTimeout(() => {
              supabase.removeChannel(channel);
              resolve(true);
            }, 1500);
          } else if (status === 'CHANNEL_ERROR') {
             reject(new Error("Failed to subscribe to channel"));
          }
        });
      });
    } else if (method === "email") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase environment variables");
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('send-otp-email', {
        body: { email, code },
      });

      if (error) {
        console.error("Edge Function Error:", error);
        throw new Error("Failed to send email via Edge Function");
      }
      
      console.log(`[Email Mock] Edge function called for ${email}`);
    }

    // Returning devCode so the user can test the flow even if email fails in dev
    return NextResponse.json({ success: true, message: "OTP sent successfully", devCode: code });
  } catch (error: any) {
    console.error("Error generating OTP:", error);
    return NextResponse.json({ error: error.message || "Failed to generate OTP" }, { status: 500 });
  }
}
