import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase } from '@/lib/admin-auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/gif'
];

export async function POST(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const contentType = req.headers.get('content-type') || '';
    let buffer: Buffer;
    let mimeType: string = 'image/png';
    let originalName: string = 'uploaded-media';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided in form-data' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
      }

      mimeType = file.type;
      originalName = file.name;

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json({ error: `Unsupported image format: ${mimeType}. Allowed: PNG, JPG, WebP, SVG, AVIF.` }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json();
      const { imageData, fileName } = body;

      if (!imageData) {
        return NextResponse.json({ error: 'imageData is required' }, { status: 400 });
      }

      if (fileName) originalName = fileName;

      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(imageData, 'base64');
      }

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json({ error: `Unsupported image format: ${mimeType}.` }, { status: 400 });
      }
    }

    const adminClient = getServiceSupabase();
    const ext = mimeType.split('/')[1]?.replace('+xml', '') || 'png';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `marketplace/${cleanFileName}`;

    // Upload to marketplace-media or fallback bucket
    let uploadSuccess = false;
    let publicUrl = '';

    try {
      const { error: uploadError } = await adminClient.storage
        .from('marketplace-media')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadError) {
        uploadSuccess = true;
        const { data } = adminClient.storage.from('marketplace-media').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }
    } catch {
      // Bucket might not exist, try fallback
    }

    if (!uploadSuccess) {
      try {
        const { error: fallbackError } = await adminClient.storage
          .from('company-logos')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!fallbackError) {
          uploadSuccess = true;
          const { data } = adminClient.storage.from('company-logos').getPublicUrl(filePath);
          publicUrl = data.publicUrl;
        }
      } catch {
        // Fallback failed
      }
    }

    // If storage buckets are not configured, encode as web data url for local development
    if (!uploadSuccess || !publicUrl) {
      publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: originalName,
      size: buffer.length,
      mimeType,
    });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload media file' },
      { status: 500 }
    );
  }
}
