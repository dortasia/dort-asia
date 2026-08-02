import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabase/admin";

/**
 * Converts a company name into a valid folder slug.
 * Rules: lowercase, alphanumeric + hyphens only, no leading/trailing hyphens.
 */
function toCompanySlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")  // remove special chars
    .replace(/\s+/g, "-")           // spaces → hyphens
    .replace(/-+/g, "-")            // collapse multiple hyphens
    .replace(/^-|-$/g, "");         // strip leading/trailing hyphens
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { 
      companyName, firstName, lastName, email, mobile, userId, 
      avatarBase64, avatarExt, companyLogoBase64, companyLogoExt,
      ssoAvatarUrl, ssoAvatarAsProfile, ssoAvatarAsLogo,
      provider, userMetadata
    } = await req.json();

    if (!companyName || !userId) {
      return NextResponse.json({ error: "Company name and User ID are required." }, { status: 400 });
    }

    const companySlug = toCompanySlug(companyName);
    const bucketName = "public_assets";

    const uploadedPaths: Record<string, string | null> = {
      avatar: null,
      logo: null,
    };

    const uploadedUrls: Record<string, string | null> = {
      avatar: null,
      logo: null,
    };

    // 1. Upload super admin avatar → User_Avatar/{companySlug}/{userId}.png
    if (avatarBase64) {
      const avatarBuffer = Buffer.from(avatarBase64.split(",")[1] ?? avatarBase64, "base64");
      const avatarName = userId || firstName || "avatar";
      const avatarPath = `User_Avatar/${companySlug}/${avatarName}.png`;
      const { error: avatarError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(avatarPath, avatarBuffer, {
          contentType: "image/png",
          upsert: true,
        });
      
      if (avatarError) {
        console.warn("Avatar upload warning:", avatarError.message);
      } else {
        uploadedPaths.avatar = `${bucketName}/${avatarPath}`;
        const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(avatarPath);
        uploadedUrls.avatar = urlData.publicUrl;
      }
    }

    // 2. Upload company logo → Company_Logo/{companySlug}/{userId}.png
    if (companyLogoBase64) {
      const logoBuffer = Buffer.from(companyLogoBase64.split(",")[1] ?? companyLogoBase64, "base64");
      const logoName = userId || "logo";
      const logoPath = `Company_Logo/${companySlug}/${logoName}.png`;
      const { error: logoError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(logoPath, logoBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (logoError) {
        console.warn("Logo upload warning:", logoError.message);
      } else {
        uploadedPaths.logo = `${bucketName}/${logoPath}`;
        const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(logoPath);
        uploadedUrls.logo = urlData.publicUrl;
      }
    }

    // 3. Create a placeholder file in private_data under Company_Storage/{companySlug}/ to initialize the folder structure
    const placeholderPath = `Company_Storage/${companySlug}/.gitkeep`;
    const { error: placeholderError } = await supabaseAdmin.storage
      .from("private_data")
      .upload(placeholderPath, new Uint8Array(0), { upsert: true });

    if (placeholderError) {
      console.warn("Placeholder creation warning:", placeholderError.message);
    }

    // 4. Insert Company Profile into database
    const finalAvatarUrl = uploadedUrls.avatar || (ssoAvatarAsProfile ? ssoAvatarUrl : null) || userMetadata?.avatar_url || userMetadata?.picture || null;
    const finalLogoUrl = uploadedUrls.logo || (ssoAvatarAsLogo ? ssoAvatarUrl : null);
    
    const { data: comp, error: compError } = await supabaseAdmin.from("companies").insert({
      super_admin_id: userId,
      company_name: companyName,
      login_email: email,
      phone_number: mobile,
      super_admin_name: `${firstName} ${lastName || ""}`.trim(),
      super_admin_avatar_url: finalAvatarUrl,
      logo_url: finalLogoUrl,
      sign_in_method: provider || "email"
    }).select("id").single();

    if (compError) {
      console.error("Database company insert error:", compError);
      return NextResponse.json({ error: "Failed to create company profile in database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bucketName,
      paths: uploadedPaths,
      urls: uploadedUrls,
      companyId: comp.id
    });

  } catch (err: any) {
    console.error("Server error in create-company-bucket:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}

