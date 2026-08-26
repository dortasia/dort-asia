import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

// PUT /api/admin/features/[id] - Update a feature
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const admin = authCheck.admin;

  const { id } = await params;

  try {
    const body = await req.json();
    const supabase = getServiceSupabase();

    const { data: currentFeature } = await supabase
      .schema('platform')
      .from('app_features')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentFeature) {
      return NextResponse.json({ error: 'Feature not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.value_type !== undefined) updateData.value_type = body.value_type;
    if (body.default_value !== undefined) updateData.default_value = body.default_value;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.status !== undefined) updateData.status = body.status;

    const { data: updatedFeature, error: updateError } = await supabase
      .schema('platform')
      .from('app_features')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    await logAdminAudit({
      adminUser: admin,
      action: 'FEATURE_UPDATED',
      resourceType: 'feature',
      resourceId: id,
      previousValue: currentFeature,
      newValue: updatedFeature,
    });

    return NextResponse.json({ feature: updatedFeature, message: 'Feature updated successfully.' });
  } catch (error: any) {
    console.error('Error updating feature:', error);
    return NextResponse.json({ error: error.message || 'Failed to update feature' }, { status: 500 });
  }
}

// DELETE /api/admin/features/[id] - Delete a feature
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const admin = authCheck.admin;

  const { id } = await params;

  try {
    const supabase = getServiceSupabase();

    const { data: currentFeature } = await supabase
      .schema('platform')
      .from('app_features')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentFeature) {
      return NextResponse.json({ error: 'Feature not found.' }, { status: 404 });
    }

    // Delete attached plan features first
    await supabase
      .schema('marketplace')
      .from('plan_features')
      .delete()
      .eq('feature_id', id);

    const { error: deleteError } = await supabase
      .schema('platform')
      .from('app_features')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await logAdminAudit({
      adminUser: admin,
      action: 'FEATURE_DELETED',
      resourceType: 'feature',
      resourceId: id,
      previousValue: currentFeature,
    });

    return NextResponse.json({ message: 'Feature deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting feature:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete feature' }, { status: 500 });
  }
}
