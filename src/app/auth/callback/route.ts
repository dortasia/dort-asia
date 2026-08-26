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
      if (flow === 'reauth') {
        console.log('[REAUTH CALLBACK] flow: reauth');

        const cookieStore = await cookies();
        
        // 1. Capture Original User BEFORE code exchange
        const supabase = await createClient(); // Interacts with real cookies
        const { data: { user: originalUser } } = await supabase.auth.getUser();

        if (!originalUser) {
          // No original session
          const html = `
            <script>
              window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "original_session_missing" }, "${origin}");
              window.close();
            </script>
          `;
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        console.log(`[REAUTH CALLBACK] original session user: ${originalUser.id}`);
        console.log(`[REAUTH CALLBACK] original email: ${originalUser.email}`);

        // 2. Read and Validate Transaction Cookie
        const transactionCookie = cookieStore.get('dort_reauth_transaction')?.value;
        if (!transactionCookie) {
          console.log('[REAUTH CALLBACK] transaction missing');
          const html = `
            <script>
              window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "reauth_session_expired" }, "${origin}");
              window.close();
            </script>
          `;
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        const [payloadB64, signature] = transactionCookie.split('.');
        const payloadString = Buffer.from(payloadB64, 'base64').toString('utf-8');
        
        const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret';
        const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

        if (signature !== expectedSignature) {
          console.log('[REAUTH CALLBACK] transaction signature invalid');
          cookieStore.delete('dort_reauth_transaction');
          const html = `
            <script>
              window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "reauth_session_expired" }, "${origin}");
              window.close();
            </script>
          `;
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        const transaction = JSON.parse(payloadString);

        if (Date.now() > transaction.expiresAt) {
          console.log('[REAUTH CALLBACK] transaction expired');
          cookieStore.delete('dort_reauth_transaction');
          const html = `
            <script>
              window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "reauth_session_expired" }, "${origin}");
              window.close();
            </script>
          `;
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        if (transaction.userId !== originalUser.id) {
          console.log('[REAUTH CALLBACK] transaction userId mismatch');
          cookieStore.delete('dort_reauth_transaction');
          const html = `
            <script>
              window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "reauth_session_expired" }, "${origin}");
              window.close();
            </script>
          `;
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        console.log(`[REAUTH CALLBACK] transaction exists: true`);
        console.log(`[REAUTH CALLBACK] transaction user: ${transaction.userId}`);
        console.log(`[REAUTH CALLBACK] transaction next: ${transaction.next}`);

        // 3. Exchange OAuth Code Safely
        const { createServerClient } = await import('@supabase/ssr');
        const tempSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) { return cookieStore.get(name)?.value; }, // Need to read PKCE verifier
              set(name: string, value: string, options: any) {}, // DO NOT overwrite real cookies
              remove(name: string, options: any) {} // DO NOT remove real cookies
            }
          }
        );

        const { data: sessionData, error } = await tempSupabase.auth.exchangeCodeForSession(code);
        
        if (error || !sessionData?.session) {
          cookieStore.delete('dort_reauth_transaction');
          const html = `
            <script>
              window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "exchange_failed" }, "${origin}");
              window.close();
            </script>
          `;
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        const newUser = sessionData.session.user;
        console.log(`[REAUTH CALLBACK] new user: ${newUser.id}`);
        console.log(`[REAUTH CALLBACK] new email: ${newUser.email}`);

        const sameUser = newUser.id === transaction.userId;
        const sameEmail = newUser.email?.toLowerCase() === originalUser.email?.toLowerCase();
        
        console.log(`[REAUTH CALLBACK] same user: ${sameUser}`);
        console.log(`[REAUTH CALLBACK] same email: ${sameEmail}`);
        console.log(`[REAUTH CALLBACK] identity match: ${sameUser && sameEmail}`);

        // 4. Strict Identity Verification
        if (!sameUser || !sameEmail) {
          // Reject re-authentication safely
          console.log('[REAUTH CALLBACK] REAUTH FAILURE');
          console.log('[REAUTH CALLBACK] reason: google_account_mismatch');
          cookieStore.delete('dort_reauth_transaction');
          
          const html = `
            <script>
              window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "google_account_mismatch" }, "${origin}");
              window.close();
            </script>
          `;
          return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
        }

        // 5. Success
        console.log('[REAUTH CALLBACK] REAUTH SUCCESS');
        cookieStore.delete('dort_reauth_transaction');
        
        // DO NOT overwrite the primary session. The popup is merely for verification.
        const html = `
          <script>
            window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: true }, "${origin}");
            window.close();
          </script>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
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
      if (flow === 'reauth') {
        console.log('[REAUTH CALLBACK] OAuth cancelled/failed');
        const cookieStore = await cookies();
        cookieStore.delete('dort_reauth_transaction');
        
        const html = `
          <script>
            window.opener.postMessage({ type: "DORT_REAUTH_RESULT", success: false, reason: "cancelled" }, "${origin}");
            window.close();
          </script>
        `;
        return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
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
