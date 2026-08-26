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

// GET /api/admin/apps - List all applications
export async function GET() {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const supabase = getServiceSupabase();

    // 1. Fetch apps
    const { data: apps, error: appsError } = await supabase
      .schema('platform')
      .from('apps')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (appsError) throw appsError;

    // 2. Fetch plan counts & subscriber counts
    const { data: plans } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .select('id, app_id');

    const { data: subscriptions } = await supabase
      .schema('subscriptions')
      .from('subscriptions')
      .select('id, app_id, status')
      .in('status', ['active', 'trialing']);

    const planCountMap = new Map<string, number>();
    for (const p of plans || []) {
      planCountMap.set(p.app_id, (planCountMap.get(p.app_id) || 0) + 1);
    }

    const subCountMap = new Map<string, number>();
    for (const s of subscriptions || []) {
      subCountMap.set(s.app_id, (subCountMap.get(s.app_id) || 0) + 1);
    }

    const enrichedApps = (apps || []).map(app => ({
      ...app,
      planCount: planCountMap.get(app.id) || 0,
      activeSubscribers: subCountMap.get(app.id) || 0,
    }));

    return NextResponse.json({ apps: enrichedApps });
  } catch (error: any) {
    console.error('Error fetching admin apps:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch apps' }, { status: 500 });
  }
}

// POST /api/admin/apps - Atomic Create a new application with features, modules, benefits, plans
export async function POST(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const admin = authCheck.admin;

  try {
    const body = await req.json();
    const {
      name,
      slug,
      tagline = '',
      description = '',
      long_description = '',
      category = 'HR & Workforce',
      platform = 'Web + Mobile',
      logo_url = null,
      hero_image = null,
      icon_background = 'bg-white',
      badge = null,
      version = '1.0.0',
      developer = 'Dort Asia Technologies',
      status = 'draft',
      route = null,
      sort_order = 0,
      screenshots = [],
      highlights = [],
      modules = [],
      benefits = [],
      core_features = [],
      entitlement_features = [],
      plans = [],
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'App name and slug identifier are required.' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const requestedStatus = status.toLowerCase() === 'published' ? 'active' : status.toLowerCase();

    // SUPER_ADMIN check for publishing
    if (requestedStatus === 'active' && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: 'Forbidden: Only SUPER_ADMIN is authorized to publish marketplace applications.',
      }, { status: 403 });
    }

    // If publishing, perform strict validation
    if (requestedStatus === 'active') {
      const validation = validateAppForPublish({ ...body, slug: cleanSlug });
      if (!validation.canPublish) {
        return NextResponse.json({
          error: 'Validation failed before publication.',
          validationErrors: validation.errors,
        }, { status: 422 });
      }
    }

    const supabase = getServiceSupabase();

    // Check slug uniqueness
    const { data: existingApp } = await supabase
      .schema('platform')
      .from('apps')
      .select('id')
      .eq('slug', cleanSlug)
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json({ error: `An app with slug "${cleanSlug}" already exists.` }, { status: 409 });
    }

    // 1. Insert into platform.apps
    const appInsertData = {
      name: name.trim(),
      slug: cleanSlug,
      tagline,
      description,
      long_description,
      category,
      platform,
      logo_url,
      hero_image,
      icon_background,
      badge,
      version,
      developer,
      route: route || `/dashboard/marketplace/${cleanSlug}`,
      status: requestedStatus,
      sort_order: Number(sort_order) || 0,
      screenshots: screenshots || [],
      highlights: highlights || [],
      modules: modules || [],
      benefits: benefits || [],
      core_features: core_features || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newApp, error: appError } = await supabase
      .schema('platform')
      .from('apps')
      .insert(appInsertData)
      .select()
      .single();

    if (appError) throw appError;
    const appId = newApp.id;

    // 2. Insert Entitlement Features
    const featureIdMap = new Map<string, string>();
    if (entitlement_features && entitlement_features.length > 0) {
      for (const feat of entitlement_features) {
        const key = feat.feature_key?.toLowerCase().trim();
        if (!key) continue;

        const { data: createdFeat } = await supabase
          .schema('platform')
          .from('app_features')
          .insert({
            app_id: appId,
            feature_key: key,
            name: feat.name || key,
            description: feat.description || '',
            value_type: feat.value_type || 'BOOLEAN',
            default_value: feat.default_value ?? true,
            category: feat.category || 'Core',
            status: feat.status || 'active',
          })
          .select('id, feature_key')
          .single();

        if (createdFeat) {
          featureIdMap.set(createdFeat.feature_key, createdFeat.id);
        }
      }
    }

    // 3. Insert Subscription Plans & Plan Feature Matrix
    if (plans && plans.length > 0) {
      for (let i = 0; i < plans.length; i++) {
        const p = plans[i];
        const planCode = (p.plan_code || p.name || `plan-${i}`).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

        const { data: createdPlan, error: planError } = await supabase
          .schema('marketplace')
          .from('app_plans')
          .insert({
            app_id: appId,
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
          })
          .select('id')
          .single();

        if (planError) throw planError;

        // Insert plan feature limits with cross-app safety
        if (createdPlan && p.features && p.features.length > 0) {
          for (const pf of p.features) {
            let featId = pf.feature_id;
            if (!featId && pf.feature_key) {
              featId = featureIdMap.get(pf.feature_key);
            }

            if (featId) {
              await supabase
                .schema('marketplace')
                .from('plan_features')
                .insert({
                  plan_id: createdPlan.id,
                  feature_id: featId,
                  enabled: pf.enabled !== undefined ? Boolean(pf.enabled) : true,
                  limits: pf.limits || { is_unlimited: Boolean(pf.is_unlimited), value: pf.value ?? null },
                });
            }
          }
        }
      }
    }

    // 4. Log Audit Trail
    await logAdminAudit({
      adminUser: admin,
      action: requestedStatus === 'active' ? 'APP_PUBLISHED' : 'APP_CREATED',
      resourceType: 'app',
      resourceId: appId,
      newValue: { ...newApp, plans_count: plans.length, features_count: entitlement_features.length },
    });

    return NextResponse.json({
      success: true,
      app: newApp,
      message: requestedStatus === 'active' ? 'Application published successfully.' : 'Draft application created.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating app:', error);
    return NextResponse.json({ error: error.message || 'Failed to create application' }, { status: 500 });
  }
}
