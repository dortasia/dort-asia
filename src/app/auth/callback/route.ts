import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getURL } from '@/lib/utils'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { processLoginSecurityEvent } from '@/services/security'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'
    const origin = getURL(request).replace(/\/$/, "");
    const flow = searchParams.get('flow');

    if (code) {
      const cookieStore = await cookies();
      const isReauthFlow = cookieStore.has('dort_reauth_transaction') || flow === 'reauth';

      if (isReauthFlow) {
        console.log('[REAUTH CALLBACK] flow: reauth');

        // 1. Read and Validate Transaction Cookie
        const transactionCookie = cookieStore.get('dort_reauth_transaction')?.value;
        if (!transactionCookie) {
          console.log('[REAUTH CALLBACK] transaction missing');
          const returnUrl = new URL('/dashboard/settings/account', origin);
          returnUrl.searchParams.set('reauth', 'error');
          returnUrl.searchParams.set('reauth_error', 'reauth_session_expired');
          return NextResponse.redirect(returnUrl.toString());
        }

        const [payloadB64, signature] = transactionCookie.split('.');
        if (!payloadB64 || !signature) {
          cookieStore.delete('dort_reauth_transaction');
          const returnUrl = new URL('/dashboard/settings/account', origin);
          returnUrl.searchParams.set('reauth', 'error');
          returnUrl.searchParams.set('reauth_error', 'reauth_session_expired');
          return NextResponse.redirect(returnUrl.toString());
        }

        const payloadString = Buffer.from(payloadB64, 'base64').toString('utf-8');
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
        const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

        if (signature !== expectedSignature) {
          console.log('[REAUTH CALLBACK] transaction signature invalid');
          cookieStore.delete('dort_reauth_transaction');
          const returnUrl = new URL('/dashboard/settings/account', origin);
          returnUrl.searchParams.set('reauth', 'error');
          returnUrl.searchParams.set('reauth_error', 'reauth_session_expired');
          return NextResponse.redirect(returnUrl.toString());
        }

        let transaction: any;
        try {
          transaction = JSON.parse(payloadString);
        } catch {
          cookieStore.delete('dort_reauth_transaction');
          const returnUrl = new URL('/dashboard/settings/account', origin);
          returnUrl.searchParams.set('reauth', 'error');
          returnUrl.searchParams.set('reauth_error', 'reauth_session_expired');
          return NextResponse.redirect(returnUrl.toString());
        }

        const safeNext = (transaction?.next && typeof transaction.next === 'string' && transaction.next.startsWith('/') && !transaction.next.startsWith('//'))
          ? transaction.next
          : '/dashboard/settings/account';

        if (Date.now() > transaction.expiresAt) {
          console.log('[REAUTH CALLBACK] transaction expired');
          cookieStore.delete('dort_reauth_transaction');
          const returnUrl = new URL(safeNext, origin);
          returnUrl.searchParams.set('reauth', 'error');
          returnUrl.searchParams.set('reauth_error', 'reauth_session_expired');
          return NextResponse.redirect(returnUrl.toString());
        }

        console.log(`[REAUTH CALLBACK] transaction exists: true, user: ${transaction.userId}, next: ${safeNext}`);

        // 2. Exchange OAuth Code using standard SSR client to refresh session cookies
        const supabase = await createClient();
        const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error || !sessionData?.session) {
          console.error('[REAUTH CALLBACK] Exchange failed:', error?.message);
          cookieStore.delete('dort_reauth_transaction');
          const returnUrl = new URL(safeNext, origin);
          returnUrl.searchParams.set('reauth', 'error');
          returnUrl.searchParams.set('reauth_error', 'exchange_failed');
          return NextResponse.redirect(returnUrl.toString());
        }

        const newUser = sessionData.session.user;
        console.log(`[REAUTH CALLBACK] new user: ${newUser.id}, email: ${newUser.email}`);

        const sameUser = newUser.id === transaction.userId;
        const sameEmail = newUser.email?.toLowerCase() === transaction.email?.toLowerCase();
        
        console.log(`[REAUTH CALLBACK] identity match: ${sameUser && sameEmail}`);

        // 3. Strict Identity Verification
        if (!sameUser || !sameEmail) {
          console.log('[REAUTH CALLBACK] REAUTH FAILURE: google_account_mismatch');
          cookieStore.delete('dort_reauth_transaction');
          
          const returnUrl = new URL(safeNext, origin);
          returnUrl.searchParams.set('reauth', 'error');
          returnUrl.searchParams.set('reauth_error', 'google_account_mismatch');
          return NextResponse.redirect(returnUrl.toString());
        }

        // 4. Success - Clear reauth transaction and redirect back
        console.log('[REAUTH CALLBACK] REAUTH SUCCESS');
        cookieStore.delete('dort_reauth_transaction');
        
        const returnUrl = new URL(safeNext, origin);
        returnUrl.searchParams.set('reauth', 'success');
        returnUrl.searchParams.set('reauth_success', 'true');
        return NextResponse.redirect(returnUrl.toString());
      }

      // Standard Auth Flow
      const supabase = await createClient()
      const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code)
      if (!error && sessionData?.session) {
        
        // Track login method securely
        // Track login method securely
        let loginMethod = "email_password";
        const provider = sessionData.session.user.app_metadata?.provider;
        const amr = (sessionData.session.user as any).amr;
        
        if (provider === 'google') {
          loginMethod = 'google_oauth';
        } else if (amr && Array.isArray(amr)) {
          const methods = amr.map((m: any) => m.method);
          if (methods.includes('webauthn') || methods.includes('passkey')) {
            loginMethod = 'passkey';
          } else if (methods.includes('totp') || methods.includes('mfa')) {
            loginMethod = 'mfa_totp';
          } else if (methods.includes('otp') || methods.includes('magiclink')) {
            loginMethod = 'otp';
          } else if (methods.includes('sso')) {
            loginMethod = 'sso';
          }
        } else if (provider === 'sso') {
          loginMethod = 'sso';
        }
        
        const cookieStore = await cookies();
        cookieStore.set('dort_login_method', loginMethod, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });

        // Fire login security event asynchronously so it doesn't block routing
        console.log("[DIAG] auth callback invoking processLoginSecurityEvent");
        processLoginSecurityEvent({ authMethod: loginMethod }).then(res => {
          console.log("[DIAG] auth callback processLoginSecurityEvent result:", res);
        }).catch(err => {
          console.error("Failed to process login security event:", err);
        });

        // Use an admin client to safely check the account status via a secure RPC
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: accountStatus, error: accountError } = await adminClient
          .rpc('get_account_status', { user_uuid: sessionData.session.user.id });

        if (accountError) {
          console.error('Error fetching account status:', accountError);
        }

        // Route based on account status
        if (!accountStatus) {
          console.error('Account status not found for user');
          return NextResponse.redirect(`${origin}/?error=invalid_account_status`);
        }

        if (accountStatus === 'pending_company_setup') {
          return NextResponse.redirect(`${origin}/onboarding/company`);
        }
        
        if (accountStatus === 'pending_verification') {
          return NextResponse.redirect(`${origin}/auth?error=Please verify your email to access the dashboard.`);
        }

        if (accountStatus === 'active') {
          // Enforce MFA if required
          const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          const needsMFA = mfaData?.nextLevel === 'aal2';

          let redirectPath = next;
          if (!redirectPath || redirectPath === '/') {
            redirectPath = '/dashboard';
          }

          if (needsMFA) {
            redirectPath = `/auth/mfa?next=${encodeURIComponent(redirectPath)}`;
          }
          
          const isRecovery = searchParams.get('recovery');
          
          if (redirectPath.startsWith('http://') || redirectPath.startsWith('https://')) {
            const url = new URL(redirectPath);
            if (isRecovery) url.searchParams.set('recovery', 'true');
            return NextResponse.redirect(url.toString());
          }
          
          const finalPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
          const redirectUrl = new URL(`${origin}${finalPath}`);
          if (isRecovery) redirectUrl.searchParams.set('recovery', 'true');
          
          return NextResponse.redirect(redirectUrl.toString());
        }

        // Any other account status: Explicitly do not redirect to dashboard without handling
        console.warn('Unhandled account status:', accountStatus);
        return NextResponse.redirect(`${origin}/?error=invalid_account_status`);

      } else {
        console.error('Auth callback error:', error?.message);
      }
    }

    // If there is an OAuth error present in the URL, forward it
    const oauthError = searchParams.get('error');
    const oauthErrorDescription = searchParams.get('error_description');
    if (oauthError) {
      const cookieStore = await cookies();
      const isReauth = cookieStore.has('dort_reauth_transaction') || flow === 'reauth';
      if (isReauth) {
        console.log('[REAUTH CALLBACK] OAuth cancelled/failed');
        cookieStore.delete('dort_reauth_transaction');
        const returnUrl = new URL('/dashboard/settings/account', origin);
        returnUrl.searchParams.set('reauth', 'error');
        returnUrl.searchParams.set('reauth_error', oauthError || 'cancelled');
        return NextResponse.redirect(returnUrl.toString());
      }
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(oauthError)}&error_description=${encodeURIComponent(oauthErrorDescription || '')}`
      );
    }

    // Return the user to an error page or home page if auth fails (e.g. no code)
    return NextResponse.redirect(`${origin}/?error=auth`);
  } catch (error) {
    console.error('Callback route crash:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
