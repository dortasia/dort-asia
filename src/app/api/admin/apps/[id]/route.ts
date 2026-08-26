import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

function validateAppForPublish(body: any): { canPublish: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!body.name?.trim()) errors.push('App name is required');
  if (!body.slug?.trim()) errors.push('App slug identifier is required');
  if (!body.description?.trim()) errors.push('Short overview description is required');
  if (!body.category?.trim()) errors.push('Category is required');
  if (!body.platform?.trim()) errors.push('Platform is required');
  if (!body.logo_url?.trim()) errors.push('App icon is required');
  if (!body.hero_image?.trim()) errors.push('Hero/cover banner image is required');
  
  const plans = body.plans || [];
  if (!plans || plans.length === 0) {
    errors.push('At least one subscription plan is required before publishing');
  } else {
    for (const p of plans) {
      if (!p.name?.trim()) errors.push('Every plan must have a name');
      if (!p.plan_code?.trim()) errors.push('Every plan must have a plan code identifier');
      if (p.price === undefined || p.price === null || isNaN(Number(p.price)) || Number(p.price) < 0) {
        errors.push(`Plan "${p.name || p.plan_code}" has an invalid price.`);
      }
    }
  }

  return {
    canPublish: errors.length === 0,
    errors,
  };
}

// GET /api/admin/apps/[id] - Get single app with plans and features
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  const { id } = await params;

  try {
    const supabase = getServiceSupabase();

    // Query by id OR slug
    let query = supabase.schema('platform').from('apps').select('*');
    if (id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', id);
    }

    const { data: app, error } = await query.maybeSingle();

    if (error || !app) {
      return NextResponse.json({ error: 'App not found.' }, { status: 404 });
    }

    // Fetch attached plans
    const { data: plans } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .select('*')
      .eq('app_id', app.id)
      .order('sort_order', { ascending: true })
      .order('price', { ascending: true });

    // Fetch attached entitlement features
    const { data: features } = await supabase
      .schema('platform')
      .from('app_features')
      .select('*')
      .eq('app_id', app.id)
      .order('feature_key', { ascending: true });

    // Fetch plan feature bindings
    const planIds = (plans || []).map(p => p.id);
    let planFeatures: any[] = [];
    if (planIds.length > 0) {
      const { data: pfData } = await supabase
        .schema('marketplace')
        .from('plan_features')
        .select('*')
        .in('plan_id', planIds);
      planFeatures = pfData || [];
    }

    // Combine plans with their feature limit bindings
    const enrichedPlans = (plans || []).map(p => {
      const pFeatures = planFeatures
        .filter(pf => pf.plan_id === p.id)
        .map(pf => {
          const feat = (features || []).find(f => f.id === pf.feature_id);
          return {
            feature_id: pf.feature_id,
            feature_key: feat?.feature_key || '',
            name: feat?.name || '',
            value_type: feat?.value_type || 'BOOLEAN',
            enabled: pf.enabled,
            limits: pf.limits || { is_unlimited: false, value: null },
          };
        });

      return {
        ...p,
        features: pFeatures,
      };
    });

    return NextResponse.json({
      app,
      plans: enrichedPlans,
      features: features || [],
    });
  } catch (error: any) {
    console.error('Error fetching app details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch app' }, { status: 500 });
  }
}

// PUT /api/admin/apps/[id] - Atomic update of an application and related catalog
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

    // Fetch current app
    const { data: currentApp } = await supabase
      .schema('platform')
      .from('apps')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentApp) {
      return NextResponse.json({ error: 'Application does not exist.' }, { status: 404 });
    }

    const targetStatus = body.status !== undefined
      ? (body.status.toLowerCase() === 'published' ? 'active' : body.status.toLowerCase())
      : currentApp.status;

    // Enforce SUPER_ADMIN role for publishing or archiving
    if (
      (targetStatus === 'active' || targetStatus === 'deprecated' || targetStatus === 'disabled') &&
      targetStatus !== currentApp.status &&
      admin.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json({
        error: 'Forbidden: Only SUPER_ADMIN is authorized to publish or archive applications.',
      }, { status: 403 });
    }

    // If publishing, perform strict validation
    if (targetStatus === 'active') {
      const validation = validateAppForPublish({ ...currentApp, ...body });
      if (!validation.canPublish) {
        return NextResponse.json({
          error: 'Validation failed before publication.',
          validationErrors: validation.errors,
        }, { status: 422 });
      }
    }

    // Determine audit action
    let action = 'APP_UPDATED';
    if (body.status && body.status !== currentApp.status) {
      if (targetStatus === 'active') action = 'APP_PUBLISHED';
      else if (targetStatus === 'draft') action = 'APP_UNPUBLISHED';
      else if (targetStatus === 'deprecated' || targetStatus === 'archived') action = 'APP_ARCHIVED';
    }

    // Update app record
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.slug !== undefined) updateData.slug = body.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (body.tagline !== undefined) updateData.tagline = body.tagline;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.long_description !== undefined) updateData.long_description = body.long_description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.platform !== undefined) updateData.platform = body.platform;
    if (body.logo_url !== undefined) updateData.logo_url = body.logo_url;
    if (body.hero_image !== undefined) updateData.hero_image = body.hero_image;
    if (body.icon_background !== undefined) updateData.icon_background = body.icon_background;
    if (body.badge !== undefined) updateData.badge = body.badge;
    if (body.version !== undefined) updateData.version = body.version;
    if (body.developer !== undefined) updateData.developer = body.developer;
    if (body.route !== undefined) updateData.route = body.route;
    if (body.sort_order !== undefined) updateData.sort_order = Number(body.sort_order);
    if (body.status !== undefined) updateData.status = targetStatus;
    if (body.screenshots !== undefined) updateData.screenshots = body.screenshots;
    if (body.highlights !== undefined) updateData.highlights = body.highlights;
    if (body.modules !== undefined) updateData.modules = body.modules;
    if (body.benefits !== undefined) updateData.benefits = body.benefits;
    if (body.core_features !== undefined) updateData.core_features = body.core_features;

    const { data: updatedApp, error: updateError } = await supabase
      .schema('platform')
      .from('apps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Process Entitlement Features if provided
    const featureIdMap = new Map<string, string>();
    if (body.entitlement_features !== undefined && Array.isArray(body.entitlement_features)) {
      for (const feat of body.entitlement_features) {
        const key = feat.feature_key?.toLowerCase().trim();
        if (!key) continue;

        const { data: upsertedFeat } = await supabase
          .schema('platform')
          .from('app_features')
          .upsert({
            app_id: id,
            feature_key: key,
            name: feat.name || key,
            description: feat.description || '',
            value_type: feat.value_type || 'BOOLEAN',
            default_value: feat.default_value ?? true,
            category: feat.category || 'Core',
            status: feat.status || 'active',
          }, { onConflict: 'app_id,feature_key' })
          .select('id, feature_key')
          .single();

        if (upsertedFeat) {
          featureIdMap.set(upsertedFeat.feature_key, upsertedFeat.id);
        }
      }
    }

    // Process Plans and feature bindings if provided
    if (body.plans !== undefined && Array.isArray(body.plans)) {
      for (let i = 0; i < body.plans.length; i++) {
        const p = body.plans[i];
        const planCode = (p.plan_code || p.name || `plan-${i}`).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

        const { data: upsertedPlan, error: planErr } = await supabase
          .schema('marketplace')
          .from('app_plans')
          .upsert({
            app_id: id,
            plan_code: planCode,
            name: p.name || 'Plan',
            description: p.description || '',
            price: Number(p.price) || 0,
            yearly_price: p.yearly_price ? Number(p.yearly_price) : null,
            currency: p.currency || 'SGD',
            billing_interval: p.billing_interval || 'monthly',
            trial_days: Number(p.trial_days) || 0,
            popular: Boolean(p.popular),
            cta_text: p.cta_text || 'Select Plan',
            status: p.status || 'active',
            sort_order: i,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'app_id,plan_code' })
          .select('id')
          .single();

        if (upsertedPlan && p.features && Array.isArray(p.features)) {
          for (const pf of p.features) {
            let featId = pf.feature_id;
            if (!featId && pf.feature_key) {
              featId = featureIdMap.get(pf.feature_key);
            }

            if (featId) {
              // Cross-app safety check
              const { data: ownerCheck } = await supabase
                .schema('platform')
                .from('app_features')
                .select('app_id')
                .eq('id', featId)
                .single();

              if (ownerCheck && ownerCheck.app_id === id) {
                await supabase
                  .schema('marketplace')
                  .from('plan_features')
                  .upsert({
                    plan_id: upsertedPlan.id,
                    feature_id: featId,
                    enabled: pf.enabled !== undefined ? Boolean(pf.enabled) : true,
                    limits: pf.limits || { is_unlimited: Boolean(pf.is_unlimited), value: pf.value ?? null },
                  }, { onConflict: 'plan_id,feature_id' });
              }
            }
          }
        }
      }
    }

    // Log admin audit
    await logAdminAudit({
      adminUser: admin,
      action,
      resourceType: 'app',
      resourceId: id,
      previousValue: currentApp,
      newValue: updatedApp,
    });

    return NextResponse.json({
      success: true,
      app: updatedApp,
      message: 'Application updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating app:', error);
    return NextResponse.json({ error: error.message || 'Failed to update application' }, { status: 500 });
  }
}

// DELETE /api/admin/apps/[id] - Archive or Delete an application (SUPER_ADMIN only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin('SUPER_ADMIN');
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const admin = authCheck.admin;

  const { id } = await params;

  try {
    const supabase = getServiceSupabase();

    const { data: currentApp } = await supabase
      .schema('platform')
      .from('apps')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentApp) {
      return NextResponse.json({ error: 'Application does not exist.' }, { status: 404 });
    }

    // Check if there are active subscriptions
    const { count: activeSubCount } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('app_id', id)
      .in('status', ['active', 'trialing']);

    if (activeSubCount && activeSubCount > 0) {
      const { data: archivedApp, error: archiveError } = await supabase
        .schema('platform')
        .from('apps')
        .update({ status: 'deprecated', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (archiveError) throw archiveError;

      await logAdminAudit({
        adminUser: admin,
        action: 'APP_ARCHIVED',
        resourceType: 'app',
        resourceId: id,
        previousValue: currentApp,
        newValue: archivedApp,
      });

      return NextResponse.json({
        message: 'App has active subscriptions; status set to archived/deprecated.',
        app: archivedApp,
      });
    }

    // Safe delete
    const { error: deleteError } = await supabase
      .schema('platform')
      .from('apps')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await logAdminAudit({
      adminUser: admin,
      action: 'APP_DELETED',
      resourceType: 'app',
      resourceId: id,
      previousValue: currentApp,
    });

    return NextResponse.json({ message: 'App deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting app:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete app' }, { status: 500 });
  }
}
