import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

// GET /api/admin/users - List all admin accounts (Requires active admin)
export async function GET() {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const supabase = getServiceSupabase();

    const { data: adminUsers, error: adminError } = await supabase
      .schema('identity')
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (adminError) throw adminError;

    // Fetch user emails from auth.users or identity.accounts
    const userIds = (adminUsers || []).map(a => a.user_id).filter(Boolean);
    const { data: accounts } = await supabase
      .schema('identity')
      .from('accounts')
      .select('id, auth_user_id, email')
      .in('auth_user_id', userIds);

    const emailMap = new Map((accounts || []).map(a => [a.auth_user_id, a.email]));

    const enrichedAdmins = (adminUsers || []).map(a => ({
      ...a,
      email: emailMap.get(a.user_id) || 'Administrator',
    }));

    return NextResponse.json({ admins: enrichedAdmins });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin users' }, { status: 500 });
  }
}

// POST /api/admin/users - Add a new admin user (Requires SUPER_ADMIN)
export async function POST(req: Request) {
  const authCheck = await requireAdmin('SUPER_ADMIN');
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const currentAdmin = authCheck.admin;

  try {
    const body = await req.json();
    const { email, role = 'ADMIN' } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'User email is required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const supabase = getServiceSupabase();

    // 1. Look up user in identity.accounts or auth.users
    const { data: account } = await supabase
      .schema('identity')
      .from('accounts')
      .select('id, auth_user_id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    let targetUserId = account?.auth_user_id;
    let targetAccountId = account?.id;

    if (!targetUserId) {
      // Fallback lookup via admin auth API
      const { data: authUserList } = await supabase.auth.admin.listUsers();
      const matched = authUserList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (matched) {
        targetUserId = matched.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: `No registered account found with email "${cleanEmail}". User must sign up first.` },
        { status: 404 }
      );
    }

    // 2. Check if already an admin
    const { data: existingAdmin } = await supabase
      .schema('identity')
      .from('admin_users')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingAdmin) {
      if (existingAdmin.is_active) {
        return NextResponse.json({ error: 'This user is already an active administrator.' }, { status: 409 });
      }

      // Reactivate
      const { data: reactivated, error: reactivateErr } = await supabase
        .schema('identity')
        .from('admin_users')
        .update({ is_active: true, role, updated_at: new Date().toISOString() })
        .eq('id', existingAdmin.id)
        .select()
        .single();

      if (reactivateErr) throw reactivateErr;

      await logAdminAudit({
        adminUser: currentAdmin,
        action: 'ADMIN_USER_UPDATED',
        resourceType: 'admin_user',
        resourceId: existingAdmin.id,
        previousValue: existingAdmin,
        newValue: reactivated,
      });

      return NextResponse.json({ admin: reactivated, message: 'Admin reactivated successfully.' });
    }

    // 3. Create new admin record
    const insertData = {
      user_id: targetUserId,
      account_id: targetAccountId || null,
      role: role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newAdmin, error: insertErr } = await supabase
      .schema('identity')
      .from('admin_users')
      .insert(insertData)
      .select()
      .single();

    if (insertErr) throw insertErr;

    await logAdminAudit({
      adminUser: currentAdmin,
      action: 'ADMIN_USER_ADDED',
      resourceType: 'admin_user',
      resourceId: newAdmin.id,
      newValue: { ...newAdmin, email: cleanEmail },
    });

    return NextResponse.json({ admin: { ...newAdmin, email: cleanEmail }, message: 'Admin user added successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding admin user:', error);
    return NextResponse.json({ error: error.message || 'Failed to add admin user' }, { status: 500 });
  }
}
