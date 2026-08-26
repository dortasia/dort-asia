import { NextResponse } from 'next/server';
import { createClient as createServerSupabaseClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export interface AdminUserSession {
  id: string;
  userId: string;
  accountId: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN';
  email: string;
}

export interface AdminAuditParams {
  adminUser: AdminUserSession;
  action: string;
  resourceType: 'app' | 'plan' | 'feature' | 'subscription' | 'customer' | 'payment' | 'admin_user' | 'system';
  resourceId?: string | null;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Returns a privileged Supabase client with the service role key.
 * This MUST ONLY be called in server environments (API routes, server actions).
 */
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service credentials not configured.');
  }

  return createAdminClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verifies that the current request has an authenticated session AND that the user
 * exists in `identity.admin_users` with `is_active = true`.
 */
export async function verifyAdminSession(): Promise<AdminUserSession | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const adminClient = getServiceSupabase();

    // 1. Check via SECURITY DEFINER function in identity schema
    const { data: rpcRole, error: rpcError } = await adminClient
      .schema('identity')
      .rpc('get_admin_role', { user_uuid: user.id });

    if (!rpcError && rpcRole && (rpcRole === 'SUPER_ADMIN' || rpcRole === 'ADMIN')) {
      return {
        id: user.id,
        userId: user.id,
        accountId: null,
        role: rpcRole as 'SUPER_ADMIN' | 'ADMIN',
        email: user.email || '',
      };
    }

    // Fallback: check RPC on default schema
    const { data: fallbackRole, error: fallbackError } = await adminClient
      .rpc('get_admin_role', { user_uuid: user.id });

    if (!fallbackError && fallbackRole && (fallbackRole === 'SUPER_ADMIN' || fallbackRole === 'ADMIN')) {
      return {
        id: user.id,
        userId: user.id,
        accountId: null,
        role: fallbackRole as 'SUPER_ADMIN' | 'ADMIN',
        email: user.email || '',
      };
    }

    // 2. Direct table query fallback
    const { data: adminRecord } = await adminClient
      .schema('identity')
      .from('admin_users')
      .select('id, user_id, account_id, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (adminRecord && (adminRecord.role === 'SUPER_ADMIN' || adminRecord.role === 'ADMIN')) {
      return {
        id: adminRecord.id,
        userId: user.id,
        accountId: adminRecord.account_id || null,
        role: adminRecord.role as 'SUPER_ADMIN' | 'ADMIN',
        email: user.email || '',
      };
    }

    return null;
  } catch (err) {
    console.error('Error verifying admin session:', err);
    return null;
  }
}

/**
 * Enforces admin authorization for API route handlers.
 * Returns the admin session if valid, or a 401/403 NextResponse if unauthorized.
 */
export async function requireAdmin(
  requiredRole?: 'SUPER_ADMIN' | 'ADMIN'
): Promise<{ admin: AdminUserSession; errorResponse?: never } | { admin?: never; errorResponse: NextResponse }> {
  const admin = await verifyAdminSession();

  if (!admin) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Access Denied: You do not have administrator permissions.' },
        { status: 403 }
      ),
    };
  }

  if (requiredRole === 'SUPER_ADMIN' && admin.role !== 'SUPER_ADMIN') {
    return {
      errorResponse: NextResponse.json(
        { error: 'Access Denied: This operation requires SUPER_ADMIN privileges.' },
        { status: 403 }
      ),
    };
  }

  return { admin };
}

/**
 * Records an immutable administrative action to `audit.admin_audit_logs`.
 */
export async function logAdminAudit(params: AdminAuditParams): Promise<void> {
  try {
    const adminClient = getServiceSupabase();

    const record = {
      admin_user_id: params.adminUser.id,
      auth_user_id: params.adminUser.userId,
      actor_email: params.adminUser.email,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      previous_value: params.previousValue ?? {},
      new_value: params.newValue ?? {},
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    };

    // Attempt insert into audit schema
    const { error } = await adminClient
      .schema('audit')
      .from('admin_audit_logs')
      .insert(record);

    if (error) {
      // Fallback if schema alias is default
      try {
        await adminClient
          .from('admin_audit_logs')
          .insert(record);
      } catch {
        // Ignore fallback error
      }
    }
  } catch (err) {
    console.error('Failed to write admin audit log:', err);
  }
}
