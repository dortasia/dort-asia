import { NextResponse } from 'next/server';
import { requireAdmin, getServiceSupabase, logAdminAudit } from '@/lib/admin-auth';

// GET /api/admin/features - List all centralized features
export async function GET(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  const url = new URL(req.url);
  const appId = url.searchParams.get('app_id');

  try {
    const supabase = getServiceSupabase();

    let query = supabase
      .schema('platform')
      .from('app_features')
      .select('*')
      .order('feature_key', { ascending: true });

    if (appId) {
      query = query.eq('app_id', appId);
    }

    const { data: features, error: featError } = await query;
    if (featError) throw featError;

    // Fetch related apps
    const { data: apps } = await supabase
      .schema('platform')
      .from('apps')
      .select('id, name, slug');

    const appMap = new Map((apps || []).map(a => [a.id, a]));

    const enrichedFeatures = (features || []).map(f => ({
      ...f,
      appName: appMap.get(f.app_id)?.name || 'Generic App',
      appSlug: appMap.get(f.app_id)?.slug || '',
    }));

    return NextResponse.json({ features: enrichedFeatures });
  } catch (error: any) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch features' }, { status: 500 });
  }
}

// POST /api/admin/features - Create a new feature in the catalog
export async function POST(req: Request) {
  const authCheck = await requireAdmin();
  if (authCheck.errorResponse) return authCheck.errorResponse;
  const admin = authCheck.admin;

  try {
    const body = await req.json();
    const {
      app_id,
      feature_key,
      name,
      description,
      value_type = 'BOOLEAN',
      default_value = true,
      category = 'Core',
      status = 'active',
    } = body;

    if (!app_id || !feature_key || !name) {
      return NextResponse.json({ error: 'App ID, feature key, and name are required.' }, { status: 400 });
    }

    const cleanKey = feature_key.toLowerCase().trim().replace(/\s+/g, '.');

    const supabase = getServiceSupabase();

    // Check duplicate key for same app
    const { data: existing } = await supabase
      .schema('platform')
      .from('app_features')
      .select('id')
      .eq('app_id', app_id)
      .eq('feature_key', cleanKey)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Feature key "${cleanKey}" already exists for this app.` }, { status: 409 });
    }

    const insertFeature = {
      app_id,
      feature_key: cleanKey,
      name: name.trim(),
      description: description || '',
      value_type: ['BOOLEAN', 'NUMBER', 'STRING', 'JSON'].includes(value_type) ? value_type : 'BOOLEAN',
      default_value: default_value ?? true,
      category: category || 'Core',
      status: status.toLowerCase(),
      created_at: new Date().toISOString(),
    };

    const { data: newFeature, error: insertError } = await supabase
      .schema('platform')
      .from('app_features')
      .insert(insertFeature)
      .select()
      .single();

    if (insertError) throw insertError;

    await logAdminAudit({
      adminUser: admin,
      action: 'FEATURE_CREATED',
      resourceType: 'feature',
      resourceId: newFeature.id,
      newValue: newFeature,
    });

    return NextResponse.json({ feature: newFeature, message: 'Feature created successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating feature:', error);
    return NextResponse.json({ error: error.message || 'Failed to create feature' }, { status: 500 });
  }
}
