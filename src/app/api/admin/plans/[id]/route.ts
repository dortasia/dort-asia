import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

// PUT /api/admin/plans/[id] - Update plan & feature bindings
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

    const { data: currentPlan } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    }

    const updatePlanData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePlanData.name = body.name.trim();
    if (body.description !== undefined) updatePlanData.description = body.description;
    if (body.price !== undefined) updatePlanData.price = Number(body.price);
    if (body.yearly_price !== undefined) updatePlanData.yearly_price = body.yearly_price === null ? null : Number(body.yearly_price);
    if (body.currency !== undefined) updatePlanData.currency = body.currency.toUpperCase();
    if (body.billing_interval !== undefined) updatePlanData.billing_interval = body.billing_interval;
    if (body.trial_days !== undefined) updatePlanData.trial_days = Number(body.trial_days);
    if (body.status !== undefined) updatePlanData.status = body.status;
    if (body.popular !== undefined) updatePlanData.popular = Boolean(body.popular);
    if (body.cta_text !== undefined) updatePlanData.cta_text = body.cta_text;

    const { data: updatedPlan, error: updateError } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .update(updatePlanData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Synchronize features if provided
    if (body.features && Array.isArray(body.features)) {
      // Remove previous plan features
      await supabase
        .schema('marketplace')
        .from('plan_features')
        .delete()
        .eq('plan_id', id);

      if (body.features.length > 0) {
        const featureRows = body.features.map((f: any) => ({
          plan_id: id,
          feature_id: f.feature_id,
          enabled: f.enabled !== false,
          limits: f.limits || {},
          created_at: new Date().toISOString(),
        }));

        await supabase
          .schema('marketplace')
          .from('plan_features')
          .insert(featureRows);
      }
    }

    // Determine audit action
    const isPriceChange = body.price !== undefined && Number(body.price) !== Number(currentPlan.price);
    const action = isPriceChange ? 'PLAN_PRICE_CHANGED' : 'PLAN_UPDATED';

    await logAdminAudit({
      adminUser: admin,
      action,
      resourceType: 'plan',
      resourceId: id,
      previousValue: currentPlan,
      newValue: updatedPlan,
    });

    return NextResponse.json({ plan: updatedPlan, message: 'Plan updated successfully.' });
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE /api/admin/plans/[id] - Delete a subscription plan
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

    const { data: currentPlan } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentPlan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404 });
    }

    // Check active subscriptions
    const { count: activeSubs } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', id)
      .in('status', ['active', 'trialing']);

    if (activeSubs && activeSubs > 0) {
      // Archive rather than delete
      const { data: archivedPlan, error: archiveErr } = await supabase
        .schema('marketplace')
        .from('app_plans')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (archiveErr) throw archiveErr;

      await logAdminAudit({
        adminUser: admin,
        action: 'PLAN_ARCHIVED',
        resourceType: 'plan',
        resourceId: id,
        previousValue: currentPlan,
        newValue: archivedPlan,
      });

      return NextResponse.json({
        message: 'Plan has active subscriptions, status changed to archived.',
        plan: archivedPlan,
      });
    }

    // Delete attached plan_features then delete plan
    await supabase.schema('marketplace').from('plan_features').delete().eq('plan_id', id);
    const { error: deleteError } = await supabase.schema('marketplace').from('app_plans').delete().eq('id', id);
    if (deleteError) throw deleteError;

    await logAdminAudit({
      adminUser: admin,
      action: 'PLAN_DELETED',
      resourceType: 'plan',
      resourceId: id,
      previousValue: currentPlan,
    });

    return NextResponse.json({ message: 'Plan deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete plan' }, { status: 500 });
  }
}
