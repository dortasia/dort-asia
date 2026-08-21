import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      fullName,
      workEmail,
      subject,
      message,
    } = body;

    // Validate essential fields
    if (!fullName || !workEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required information (Name, Email, or Message).' },
        { status: 400 }
      );
    }

    // Generate unique inquiry reference ID
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const referenceId = `DORT-MSG-${randomSuffix}`;

    const inquiryRecord = {
      reference_id: referenceId,
      service_track: 'contact_form',
      full_name: fullName.trim(),
      work_email: workEmail.trim().toLowerCase(),
      company_name: 'N/A', // Not required in new minimal form
      project_summary: `Subject: ${subject || 'No Subject'}\n\nMessage:\n${message.trim()}`,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Attempt to store in Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceKey && !supabaseUrl.includes('dummy.supabase.co')) {
      try {
        const supabase = createSupabaseClient(supabaseUrl, serviceKey);
        const { error: dbError } = await supabase
          .from('work_inquiries')
          .insert([inquiryRecord]);

        if (dbError) {
          console.warn('[Contact] Supabase insert note:', dbError.message);
        }
      } catch (dbErr) {
        console.warn('[Contact] Database capture exception:', dbErr);
      }
    } else {
      console.log('[Contact] Received message (Local mode):', {
        referenceId,
        fullName,
        workEmail,
        subject
      });
    }

    return NextResponse.json({
      success: true,
      referenceId,
      message: 'Your message has been successfully received. Our team will reach out shortly.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Contact form submission failed:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again or email contact@dortasia.com directly.' },
      { status: 500 }
    );
  }
}
