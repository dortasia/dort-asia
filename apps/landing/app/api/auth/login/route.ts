import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const validEmail = process.env.AUTH_EMAIL;
    const validPassword = process.env.AUTH_PASSWORD;

    if (!validEmail || !validPassword) {
      return NextResponse.json(
        { error: "Server configuration error: Authentication variables missing from .env.local" },
        { status: 500 }
      );
    }

    if (email === validEmail && password === validPassword) {
      // In a real production snippet here, you would typically issue a cryptographically 
      // signed secure JWT via cookies utilizing NextResponse.cookies().set()
      // For this implementation, we simply return a verifiable success response 
      return NextResponse.json({ success: true, message: "Authentication successful." }, { status: 200 });
    }

    // Explicitly reject failure cases securely with a generic error
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Bad Request" },
      { status: 400 }
    );
  }
}
