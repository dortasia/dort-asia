import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET() {
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

    // Call the SECURITY DEFINER RPC to resolve identity -> company
    const { data, error: rpcError } = await adminClient.rpc(
      'get_company_profile',
      { user_uuid: user.id }
    );

    if (rpcError) {
      console.error('[API /user/company] RPC execution error:', rpcError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!data) {
      console.log('[API /user/company] RPC returned no company for user:', user.id);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({
      company: data,
    });
  } catch (error) {
    console.error('Error fetching company info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_name, country_code, timezone } = body;

    if (!company_name || company_name.trim() === '') {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call the SECURITY DEFINER RPC to update the company profile
    const { error: rpcError } = await adminClient.rpc('update_company_profile', {
      user_uuid: user.id,
      c_name: company_name.trim(),
      c_code: country_code || 'SG',
      c_timezone: timezone || 'Asia/Singapore',
    });

    if (rpcError) {
      console.error('Error updating company profile via RPC:', rpcError);
      return NextResponse.json({ error: rpcError.message || 'Failed to update company' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating company info:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
