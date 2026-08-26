import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

// PATCH /api/admin/subscriptions/[id] - Update subscription lifecycle status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin('SUPER_ADMIN');
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const admin = authCheck.admin;

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, cancel_at_period_end } = body;

    const supabase = getServiceSupabase();

    const { data: currentSub } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentSub) {
      return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }
    }
    if (cancel_at_period_end !== undefined) {
      updateData.cancel_at_period_end = Boolean(cancel_at_period_end);
    }

    const { data: updatedSub, error: updateError } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    await logAdminAudit({
      adminUser: admin,
      action: 'SUBSCRIPTION_STATUS_UPDATED',
      resourceType: 'subscription',
      resourceId: id,
      previousValue: currentSub,
      newValue: updatedSub,
    });

    return NextResponse.json({ subscription: updatedSub, message: 'Subscription updated.' });
  } catch (error: any) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: error.message || 'Failed to update subscription' }, { status: 500 });
  }
}
