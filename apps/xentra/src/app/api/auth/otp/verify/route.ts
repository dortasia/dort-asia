import { NextResponse } from "next/server";

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
    const { userId, code } = await req.json();

    if (!userId || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const store = getOtpStore();

    const otpData = store.get(userId);

    if (!otpData) {
      return NextResponse.json({ error: "No OTP found for this user" }, { status: 400 });
    }

    if (Date.now() > otpData.expiresAt) {
      store.delete(userId);
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    }

    if (otpData.code !== code) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // OTP is valid
    store.delete(userId);
    return NextResponse.json({ success: true, message: "OTP verified successfully" });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ error: error.message || "Failed to verify OTP" }, { status: 500 });
  }
}
