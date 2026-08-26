import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

// PATCH /api/admin/users/[id] - Toggle active state or change role (SUPER_ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin('SUPER_ADMIN');
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const currentAdmin = authCheck.admin;

  const { id } = await params;

  try {
    const body = await req.json();
    const { is_active, role } = body;

    const supabase = getServiceSupabase();

    const { data: targetAdmin } = await supabase
      .schema('identity')
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin record not found.' }, { status: 404 });
    }

    // Prevent removing own super admin status if sole super admin
    if (targetAdmin.user_id === currentAdmin.userId && is_active === false) {
      return NextResponse.json({ error: 'You cannot deactivate your own administrator account.' }, { status: 400 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    if (role !== undefined) updateData.role = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    const { data: updatedAdmin, error: updateErr } = await supabase
      .schema('identity')
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    await logAdminAudit({
      adminUser: currentAdmin,
      action: 'ADMIN_USER_UPDATED',
      resourceType: 'admin_user',
      resourceId: id,
      previousValue: targetAdmin,
      newValue: updatedAdmin,
    });

    return NextResponse.json({ admin: updatedAdmin, message: 'Admin user updated successfully.' });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: error.message || 'Failed to update admin user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Remove an administrator (SUPER_ADMIN only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin('SUPER_ADMIN');
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const currentAdmin = authCheck.admin;

  const { id } = await params;

  try {
    const supabase = getServiceSupabase();

    const { data: targetAdmin } = await supabase
      .schema('identity')
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single();

    if (!targetAdmin) {
      return NextResponse.json({ error: 'Admin record not found.' }, { status: 404 });
    }

    if (targetAdmin.user_id === currentAdmin.userId) {
      return NextResponse.json({ error: 'You cannot delete your own administrator account.' }, { status: 400 });
    }

    const { error: deleteErr } = await supabase
      .schema('identity')
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    await logAdminAudit({
      adminUser: currentAdmin,
      action: 'ADMIN_USER_REMOVED',
      resourceType: 'admin_user',
      resourceId: id,
      previousValue: targetAdmin,
    });

    return NextResponse.json({ message: 'Admin user removed successfully.' });
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete admin user' }, { status: 500 });
  }
}
