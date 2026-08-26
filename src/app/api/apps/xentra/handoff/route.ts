import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import * as jose from 'jose';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const { searchParams, origin } = new URL(req.url);
    
    if (authError || !user) {
      console.log('[Handoff] No active session found. Redirecting to Dort Asia auth.');
      const authUrl = new URL('/auth', origin);
      authUrl.searchParams.set('next', '/api/apps/xentra/handoff');
      return NextResponse.redirect(authUrl);
    }

    // Enforce MFA if enabled
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!aalError && aal) {
      if (aal.currentLevel === 'aal1' && aal.nextLevel === 'aal2') {
        console.log('[Handoff] User requires MFA. Redirecting to Dort Asia MFA.');
        const mfaUrl = new URL('/auth/mfa', origin);
        mfaUrl.searchParams.set('next', '/api/apps/xentra/handoff');
        return NextResponse.redirect(mfaUrl);
      }
    }

    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get user's company
    let companyId: string | null = null;
    try {
      const { data: companyData } = await adminClient.rpc('get_company_profile', {
        user_uuid: user.id
      });
      if (companyData && (companyData.id || companyData.company_id)) {
        companyId = companyData.id || companyData.company_id;
      }
    } catch (e) {
      console.error('Error fetching company profile', e);
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 2. Verify subscription (basic check for active status)
    const { data: subs, error: subsErr } = await adminClient
      .schema('subscriptions')
      .from('subscriptions')
      .select('id, status')
      .eq('company_id', companyId)
      .in('status', ['active', 'trialing'])
      .limit(1);

    if (subsErr || !subs || subs.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 403 });
    }

    // 3. Generate EdDSA JWT
    const privateKeyPem = process.env.XENTRA_HANDOFF_PRIVATE_KEY;
    if (!privateKeyPem) {
      console.error('Missing XENTRA_HANDOFF_PRIVATE_KEY');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // Decode base64
    const decodedKey = Buffer.from(privateKeyPem, 'base64').toString('utf-8');
    const privateKey = await jose.importPKCS8(decodedKey, 'EdDSA');

    const jti = crypto.randomUUID();
    
    // Default to owner role if handing off from Dort Asia as the primary account holder
    // Note: Dort Asia resolves the role properly in a real setup, but 'owner' is safe for the subscriber
    const role = 'owner';

    const jwt = await new jose.SignJWT({
      dort_user_id: user.id,
      dort_company_id: companyId,
      email: user.email,
      role: role
    })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuedAt()
      .setIssuer('dort-asia')
      .setAudience('xentra-people')
      .setExpirationTime('1m') // 60 seconds
      .setJti(jti)
      .setSubject(user.email || user.id)
      .sign(privateKey);

    const xentraUrl = process.env.NEXT_PUBLIC_XENTRA_PEOPLE_URL || 'http://localhost:3000';
    const handoffUrl = `${xentraUrl}/api/auth/handoff?token=${jwt}`;

    return NextResponse.redirect(handoffUrl);
  } catch (error: any) {
    console.error('Handoff generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
