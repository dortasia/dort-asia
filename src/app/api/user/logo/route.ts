import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageData } = body;

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Extract base64 payload
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let contentType = 'image/png';

    if (matches && matches.length === 3) {
      contentType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageData, 'base64');
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filePath = `${user.id}/logo.png`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from('company-logos')
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
    }

    // 2. Get Public URL
    const { data: publicUrlData } = adminClient.storage
      .from('company-logos')
      .getPublicUrl(filePath);

    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    // 3. Clean and update user metadata via Admin API (prevents cookie overflow)
    const existingMeta = { ...(user.user_metadata || {}) };
    existingMeta.company_logo = publicUrl;
    existingMeta.companyLogo = publicUrl;

    const { error: metaError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { user_metadata: existingMeta }
    );

    if (metaError) {
      console.warn('Metadata update error:', metaError);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Error in logo upload API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const filePath = `${user.id}/logo.png`;

    // 1. Remove from storage
    await adminClient.storage.from('company-logos').remove([filePath]);

    // 2. Clean metadata
    const existingMeta = { ...(user.user_metadata || {}) };
    delete existingMeta.company_logo;
    delete existingMeta.companyLogo;

    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: existingMeta,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in logo delete API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
