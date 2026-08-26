import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

// GET /api/admin/plans - List all subscription plans
export async function GET(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  const url = new URL(req.url);
  const appId = url.searchParams.get('app_id');

  try {
    const supabase = getServiceSupabase();

    let query = supabase
      .schema('marketplace')
      .from('app_plans')
      .select('*')
      .order('price', { ascending: true });

    if (appId) {
      query = query.eq('app_id', appId);
    }

    const { data: plans, error: plansError } = await query;
    if (plansError) throw plansError;

    // Fetch related apps
    const { data: apps } = await supabase
      .schema('platform')
      .from('apps')
      .select('id, name, slug, logo_url');

    const appMap = new Map((apps || []).map(a => [a.id, a]));

    // Fetch attached plan features
    const { data: planFeatures } = await supabase
      .schema('marketplace')
      .from('plan_features')
      .select(`
        id,
        plan_id,
        feature_id,
        enabled,
        limits
      `);

    // Fetch feature catalog definitions
    const { data: featureCatalog } = await supabase
      .schema('platform')
      .from('app_features')
      .select('id, feature_key, name, description, value_type');

    const featMap = new Map((featureCatalog || []).map(f => [f.id, f]));

    const featuresByPlan = new Map<string, any[]>();
    for (const pf of planFeatures || []) {
      const featDef = featMap.get(pf.feature_id);
      const list = featuresByPlan.get(pf.plan_id) || [];
      list.push({
        id: pf.id,
        featureId: pf.feature_id,
        featureKey: featDef?.feature_key || '',
        name: featDef?.name || '',
        description: featDef?.description || '',
        valueType: featDef?.value_type || 'BOOLEAN',
        enabled: pf.enabled,
        limits: pf.limits,
      });
      featuresByPlan.set(pf.plan_id, list);
    }

    const enrichedPlans = (plans || []).map(p => ({
      ...p,
      appName: appMap.get(p.app_id)?.name || 'Unknown App',
      appSlug: appMap.get(p.app_id)?.slug || '',
      appLogo: appMap.get(p.app_id)?.logo_url || null,
      features: featuresByPlan.get(p.id) || [],
    }));

    return NextResponse.json({ plans: enrichedPlans });
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch plans' }, { status: 500 });
  }
}

// POST /api/admin/plans - Create a new subscription plan
export async function POST(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const admin = authCheck.admin;

  try {
    const body = await req.json();
    const {
      app_id,
      plan_code,
      name,
      description,
      price = 0,
      yearly_price,
      currency = 'SGD',
      billing_interval = 'monthly',
      trial_days = 0,
      status = 'active',
      popular = false,
      cta_text = 'Select Plan',
      features = [], // Array of { feature_id, enabled, limits }
    } = body;

    if (!app_id || !plan_code || !name) {
      return NextResponse.json({ error: 'App ID, plan code, and plan name are required.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const insertPlan = {
      app_id,
      plan_code: plan_code.toLowerCase().trim(),
      name: name.trim(),
      description: description || '',
      price: Number(price) || 0,
      yearly_price: yearly_price !== undefined && yearly_price !== null ? Number(yearly_price) : null,
      currency: currency.toUpperCase(),
      billing_interval,
      trial_days: Number(trial_days) || 0,
      status: status.toLowerCase(),
      popular: Boolean(popular),
      cta_text,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newPlan, error: planError } = await supabase
      .schema('marketplace')
      .from('app_plans')
      .insert(insertPlan)
      .select()
      .single();

    if (planError) throw planError;

    // Attach features if provided
    if (features && Array.isArray(features) && features.length > 0) {
      const planFeatureRows = features.map((f: any) => ({
        plan_id: newPlan.id,
        feature_id: f.feature_id,
        enabled: f.enabled !== false,
        limits: f.limits || {},
        created_at: new Date().toISOString(),
      }));

      await supabase
        .schema('marketplace')
        .from('plan_features')
        .insert(planFeatureRows);
    }

    await logAdminAudit({
      adminUser: admin,
      action: 'PLAN_CREATED',
      resourceType: 'plan',
      resourceId: newPlan.id,
      newValue: newPlan,
    });

    return NextResponse.json({ plan: newPlan, message: 'Subscription plan created.' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating plan:', error);
    return NextResponse.json({ error: error.message || 'Failed to create plan' }, { status: 500 });
  }
}
