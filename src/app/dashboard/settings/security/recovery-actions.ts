'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notifications';

// Ensure we have a secret for signing recovery JWTs
const getJwtSecret = () => {
  const secret = process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!secret) throw new Error("Missing JWT secret configuration");
  return new TextEncoder().encode(secret);
};

// Generates a secure recovery code (e.g., A1B2-C3D4)
function generateSingleCode(): string {
  const buffer = crypto.randomBytes(4);
  const hex = buffer.toString('hex').toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4)}`;
}

// Hashes a code using scrypt (standard password hashing in Node)
function hashCode(code: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(code.replace(/-/g, ''), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Verifies a code against a stored hash
function verifyHash(code: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.scryptSync(code.replace(/-/g, ''), salt, 64).toString('hex');
    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(verifyHash), Buffer.from(hash));
  } catch (e) {
    return false;
  }
}

export async function generateRecoveryCodes() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Use admin client for database writes to bypass RLS since we enforce auth manually here
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get account ID
  const { data: account, error: accountError } = await supabaseAdmin
    .schema('identity')
    .from('accounts')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (accountError || !account) {
    throw new Error('Account not found');
  }

  // Delete any existing unused codes
  await supabaseAdmin
    .schema('identity')
    .from('mfa_recovery_codes')
    .delete()
    .eq('account_id', account.id);

  // Generate 10 new codes
  const plainCodes: string[] = [];
  const hashedCodes: any[] = [];

  for (let i = 0; i < 10; i++) {
    const code = generateSingleCode();
    plainCodes.push(code);
    hashedCodes.push({
      account_id: account.id,
      code_hash: hashCode(code),
    });
  }

  // Insert hashes
  const { error: insertError } = await supabaseAdmin
    .schema('identity')
    .from('mfa_recovery_codes')
    .insert(hashedCodes);

  if (insertError) {
    console.error('[RECOVERY_DIAG] recovery code INSERT failed', {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    throw new Error('Failed to save recovery codes');
  }

  return { success: true, codes: plainCodes };
}

export async function getRecoveryCodesCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: account } = await supabaseAdmin
    .schema('identity')
    .from('accounts')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!account) return 0;

  const { count } = await supabaseAdmin
    .schema('identity')
    .from('mfa_recovery_codes')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', account.id)
    .is('used_at', null);

  return count || 0;
}

export async function verifyRecoveryCode(code: string) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Unauthorized' };
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: account } = await supabaseAdmin
    .schema('identity')
    .from('accounts')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!account) return { success: false, error: 'Account not found' };

  // Fetch all unused codes for this account
  const { data: codes, error: codesError } = await supabaseAdmin
    .schema('identity')
    .from('mfa_recovery_codes')
    .select('id, code_hash')
    .eq('account_id', account.id)
    .is('used_at', null);

  if (codesError || !codes || codes.length === 0) {
    return { success: false, error: 'Invalid or expired recovery code.' };
  }

  // Check which code matches
  let matchedCodeId = null;
  for (const storedCode of codes) {
    if (verifyHash(code, storedCode.code_hash)) {
      matchedCodeId = storedCode.id;
      break;
    }
  }

  if (!matchedCodeId) {
    return { success: false, error: 'Invalid or expired recovery code.' };
  }

  // Atomically mark it as used
  const { error: updateError } = await supabaseAdmin
    .schema('identity')
    .from('mfa_recovery_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', matchedCodeId)
    .is('used_at', null);

  if (updateError) {
    return { success: false, error: 'Failed to consume recovery code.' };
  }

  // Create scoped recovery token (JWT)
  const jti = crypto.randomUUID();
  const jwt = await new SignJWT({ sub: user.id, account_id: account.id, type: 'mfa_recovery' })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set('mfa_recovery_token', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/', // Scoped to / so it can be checked during re-auth routing
    maxAge: 15 * 60 // 15 mins
  });

  // Delete all verified TOTP factors using Admin API to clear the path for the new enrollment
  // This will invalidate the user's active sessions, requiring them to re-authenticate
  const { data: factorsData, error: factorsError } = await supabaseAdmin.auth.admin.mfa.listFactors({
    userId: user.id
  });

  if (!factorsError && factorsData?.factors) {
    for (const factor of factorsData.factors) {
      if (factor.factor_type === 'totp' && factor.status === 'verified') {
        await supabaseAdmin.auth.admin.mfa.deleteFactor({
          id: factor.id,
          userId: user.id
        });
      }
    }
  }

  return { success: true, action: 'reauthenticate' };
}

export async function completeRecoveryEnrollment(factorId: string, challengeId: string, code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Validate the scoped recovery token
  const cookieStore = await cookies();
  const recoveryToken = cookieStore.get('mfa_recovery_token')?.value;

  if (!recoveryToken) {
    return { success: false, error: 'Recovery session expired or invalid.' };
  }

  try {
    const { payload } = await jwtVerify(recoveryToken, getJwtSecret());
    if (payload.sub !== user.id || payload.type !== 'mfa_recovery') {
      throw new Error('Invalid token claims');
    }
  } catch (e) {
    return { success: false, error: 'Recovery session expired or invalid.' };
  }

  // Verify the newly enrolled TOTP factor
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (verifyError) {
    return { success: false, error: verifyError.message };
  }

  // The old lost TOTP factors were already successfully deleted during verifyRecoveryCode
  // So no unenrollment is necessary here.

  // Generate 10 fresh recovery codes
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: account } = await supabaseAdmin
    .schema('identity')
    .from('accounts')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  let plainCodes: string[] = [];
  
  if (account) {
    // Delete any existing unused codes
    await supabaseAdmin
      .schema('identity')
      .from('mfa_recovery_codes')
      .delete()
      .eq('account_id', account.id);

    // Generate 10 new codes
    const hashedCodes: any[] = [];
    for (let i = 0; i < 10; i++) {
      const newCode = generateSingleCode();
      plainCodes.push(newCode);
      hashedCodes.push({
        account_id: account.id,
        code_hash: hashCode(newCode),
      });
    }

    await supabaseAdmin
      .schema('identity')
      .from('mfa_recovery_codes')
      .insert(hashedCodes);
  }

  // Clear the recovery token
  cookieStore.delete('mfa_recovery_token');

  return { success: true, codes: plainCodes };
}

export async function checkRecoveryRouting(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const recoveryToken = cookieStore.get('mfa_recovery_token')?.value;
  if (!recoveryToken) return null;

  try {
    const { payload } = await jwtVerify(recoveryToken, getJwtSecret());
    if (payload.sub === user.id && payload.type === 'mfa_recovery') {
      return '/auth/mfa/recover';
    }
  } catch (e) {
    return null;
  }
  return null;
}
