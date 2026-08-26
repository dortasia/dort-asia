import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1 & 2. Use getUser() for secure server-side verification of the token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3 & 4. Only accept companyName from the client body
    const body = await request.json();
    const { companyName } = body;

    // 5. Validate and normalize companyName
    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }
    
    const normalizedCompanyName = companyName.trim();
    const userId = user.id;

    // 10 & 11. Use admin client server-side only
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 6, 7, 8, 9. Call the secure RPC function to perform atomic verification, insertion, and activation
    const { error: rpcError } = await adminClient.rpc('complete_company_setup', {
      user_uuid: userId,
      new_company_name: normalizedCompanyName
    });

    if (rpcError) {
      console.error('Company creation RPC error:', rpcError);
      
      // Handle known RPC exceptions cleanly
      if (rpcError.message.includes('Account not found')) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }
      if (rpcError.message.includes('not in pending_company_setup state')) {
        return NextResponse.json({ error: 'Account is not in pending setup state' }, { status: 400 });
      }
      // Handle duplicate company creation from race conditions via PostgreSQL unique constraint violation
      if (rpcError.code === '23505') {
        return NextResponse.json({ error: 'Company already exists for this account' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Failed to complete company setup' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Complete company error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
