import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

function toBucketSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { companyName, firstName, userId } = await req.json();

    if (!companyName || !firstName) {
      return NextResponse.json({ error: "Missing companyName or firstName." }, { status: 400 });
    }

    const companySlug = toBucketSlug(companyName);
    const publicBucket = "public_assets";
    const extensions = ["jpg", "jpeg", "png", "webp"];

    // 1. Try public_assets -> User_Avatar/{companySlug}/{userId}.{ext}
    if (userId) {
      for (const ext of extensions) {
        const filePath = `User_Avatar/${companySlug}/${userId}.${ext}`;
        const { data, error } = await supabaseAdmin.storage
          .from(publicBucket)
          .createSignedUrl(filePath, 60 * 60);

        if (!error && data?.signedUrl) {
          return NextResponse.json({ signedUrl: data.signedUrl });
        }
      }

      // Also try lowercase userId just in case
      const lowercaseUserId = userId.toLowerCase();
      for (const ext of extensions) {
        const filePath = `User_Avatar/${companySlug}/${lowercaseUserId}.${ext}`;
        const { data, error } = await supabaseAdmin.storage
          .from(publicBucket)
          .createSignedUrl(filePath, 60 * 60);

        if (!error && data?.signedUrl) {
          return NextResponse.json({ signedUrl: data.signedUrl });
        }
      }
    }

    // 2. Try: public_assets -> User_Avatar/{companySlug}/{firstName}.{ext}
    for (const ext of extensions) {
      const filePath = `User_Avatar/${companySlug}/${firstName.toLowerCase()}.${ext}`;
      const { data, error } = await supabaseAdmin.storage
        .from(publicBucket)
        .createSignedUrl(filePath, 60 * 60);

      if (!error && data?.signedUrl) {
        return NextResponse.json({ signedUrl: data.signedUrl });
      }
    }

    // 3. Legacy compatibility: companySlug bucket -> super-admin/{firstName}.{ext}
    const legacyBucket = companySlug;
    for (const ext of extensions) {
      const filePath = `super-admin/${firstName}.${ext}`;
      const { data, error } = await supabaseAdmin.storage
        .from(legacyBucket)
        .createSignedUrl(filePath, 60 * 60);

      if (!error && data?.signedUrl) {
        return NextResponse.json({ signedUrl: data.signedUrl });
      }
    }

    // No avatar found — return null gracefully (fallback to initials)
    return NextResponse.json({ signedUrl: null });
  } catch (err: any) {
    console.error("Error generating avatar URL:", err);
    return NextResponse.json({ signedUrl: null });
  }
}
