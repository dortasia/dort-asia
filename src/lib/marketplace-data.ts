import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { MarketplaceApp } from '@/data/marketplace';

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export function transformDbAppToMarketplaceApp(
  app: any,
  plans: any[] = [],
  features: any[] = [],
  planFeatures: any[] = []
): MarketplaceApp {
  const transformedPlans = (plans || []).map((p) => {
    const pfList = (planFeatures || []).filter((pf) => pf.plan_id === p.id && pf.enabled);
    const featureLabels = pfList.map((pf) => {
      const feat = (features || []).find((f) => f.id === pf.feature_id);
      if (!feat) return 'Feature';

      // pf.limits typically contains { "max": <value> } or { "value": <value> }
      const limitVal = pf.limits?.max ?? pf.limits?.value;
      const isUnlimited = pf.limits?.is_unlimited === true;

      if (feat.feature_key === 'employees.max') {
        if (isUnlimited) return 'Unlimited employees';
        return limitVal ? `${limitVal} employees` : 'Employee Limit';
      }

      if (feat.feature_key === 'storage.bytes') {
        if (isUnlimited) return 'Unlimited storage';
        if (limitVal) {
          const gb = Math.round(limitVal / (1024 * 1024 * 1024));
          return `${gb} GB storage`;
        }
        return 'Storage Limit';
      }

      const name = feat.name || feat.feature_key;
      if (isUnlimited) return `${name}: Unlimited`;
      if (limitVal !== undefined && limitVal !== null) return `${name}: ${limitVal}`;
      return name;
    });

    return {
      id: p.id,
      planCode: p.plan_code,
      name: p.name,
      description: p.description || '',
      price: Number(p.price) || 0,
      billingInterval: p.billing_interval || 'monthly',
      currency: p.currency || 'SGD',
      popular: Boolean(p.popular),
      features: featureLabels.length > 0 ? featureLabels : (p.features || []),
      ctaText: p.cta_text || 'Select Plan',
      ctaRoute: `/dashboard/subscriptions/${app.slug}`,
    };
  });

  // Build matrixData
  const activePlans = [...(plans || [])].sort((a: any, b: any) => a.price - b.price);
  const catsMap = new Map<string, any[]>();
  
  (features || []).forEach((feat: any) => {
    const catName = feat.category || "General";
    if (!catsMap.has(catName)) catsMap.set(catName, []);
    
    const row: any = { name: feat.name || feat.feature_key };
    
    activePlans.forEach((plan: any) => {
      const pf = (planFeatures || []).find((p: any) => p.plan_id === plan.id && p.feature_id === feat.id);
      if (!pf || !pf.enabled) {
        row[plan.id] = false;
      } else if (pf.limits?.is_unlimited) {
        row[plan.id] = "Unlimited";
      } else if (pf.limits?.value !== undefined || pf.limits?.max !== undefined) {
        const limitVal = pf.limits?.value ?? pf.limits?.max;
        
        if (feat.feature_key === 'employees.max') {
          row[plan.id] = `${limitVal} Employees`;
        } else if (feat.feature_key === 'storage.bytes') {
          const gb = Math.round(limitVal / (1024 * 1024 * 1024));
          row[plan.id] = `${gb} GB`;
        } else {
          row[plan.id] = limitVal.toString();
        }
      } else {
        row[plan.id] = true;
      }
    });
    
    catsMap.get(catName)!.push(row);
  });
  
  const matrixData = {
    plans: activePlans,
    categories: Array.from(catsMap.entries()).map(([cat, feats]) => ({
      category: cat.toUpperCase(),
      features: feats
    }))
  };

  return {
    id: app.id || app.slug,
    slug: app.slug,
    name: app.name,
    tagline: app.tagline || app.description || '',
    description: app.description || '',
    longDescription: app.long_description || app.description || '',
    icon: app.logo_url || '/apps-logo/xentra-bluelogo.svg',
    iconBackground: app.icon_background || 'bg-white',
    heroImage: app.hero_image || '/Xentra_people/banner/app-banenr.avif',
    category: app.category || 'HR & Workforce',
    platform: app.platform || 'Web + Mobile',
    rating: {
      score: 4.9,
      count: 128,
    },
    status: app.status === 'active' || app.status === 'published' ? 'available' : 'coming_soon',
    badge: app.badge || undefined,
    version: app.version || '1.0.0',
    developer: app.developer || 'Dort Asia Technologies',
    lastUpdated: 'August 2026',
    route: app.route || `/dashboard/marketplace/${app.slug}`,
    sortOrder: Number(app.sort_order) || 0,
    highlights: Array.isArray(app.highlights) && app.highlights.length > 0
      ? app.highlights
      : [
          { label: 'Category', value: app.category || 'HR & Workforce' },
          { label: 'Platform', value: app.platform || 'Web & Mobile App' },
          { label: 'Deployment', value: 'Cloud Hosted (Singapore)' },
        ],
    features: Array.isArray(app.core_features) ? app.core_features : (app.features || []),
    modules: Array.isArray(app.modules) ? app.modules : [],
    screenshots: Array.isArray(app.screenshots) ? app.screenshots : [],
    benefits: Array.isArray(app.benefits) ? app.benefits : [],
    pricingPlans: transformedPlans,
    matrixData,
  };
}

/**
 * Fetches all publicly published marketplace apps directly from the database.
 */
export async function getPublishedMarketplaceApps(): Promise<MarketplaceApp[]> {
  try {
    const supabase = getAdminClient();

    // 1. Query published apps
    const { data: apps, error: appsErr } = await supabase
      .schema('platform')
      .from('apps')
      .select('*')
      .in('status', ['active', 'published'])
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (appsErr || !apps || apps.length === 0) {
      return [];
    }

    const appIds = apps.map((a) => a.id);

    // 2. Fetch plans via Secure RPC
    const { data: plans, error: plansErr } = await supabase.rpc('get_marketplace_plans', {
      p_app_ids: appIds
    });
    if (plansErr) console.warn('Error fetching plans via RPC:', plansErr);

    // 3. Fetch features (Platform schema is exposed)
    const { data: features } = await supabase
      .schema('platform')
      .from('app_features')
      .select('*')
      .in('app_id', appIds)
      .eq('status', 'active');

    // 4. Fetch plan features via Secure RPC
    const planIds = (plans || []).map((p: any) => p.id);
    let planFeatures: any[] = [];
    if (planIds.length > 0) {
      const { data: pfData, error: pfErr } = await supabase.rpc('get_marketplace_plan_features', {
        p_plan_ids: planIds
      });
      if (pfErr) console.warn('Error fetching plan features via RPC:', pfErr);
      planFeatures = pfData || [];
    }

    return apps.map((app) => {
      const appPlans = (plans || []).filter((p: any) => p.app_id === app.id);
      const appFeatures = (features || []).filter((f: any) => f.app_id === app.id);
      return transformDbAppToMarketplaceApp(app, appPlans, appFeatures, planFeatures);
    });
  } catch (err) {
    console.error('Error fetching published marketplace apps:', err);
    return [];
  }
}

/**
 * Fetches a single published application by slug directly from the database.
 * If allowDraft = true (admin preview only), returns draft applications.
 */
export async function getPublishedMarketplaceAppBySlug(
  slug: string,
  options?: { allowDraft?: boolean }
): Promise<MarketplaceApp | null> {
  try {
    const supabase = getAdminClient();
    const cleanSlug = slug.toLowerCase().trim();

    // Query app
    let query = supabase
      .schema('platform')
      .from('apps')
      .select('*')
      .eq('slug', cleanSlug);

    if (!options?.allowDraft) {
      query = query.in('status', ['active', 'published']);
    }

    const { data: app, error: appErr } = await query.maybeSingle();

    if (appErr || !app) {
      return null;
    }

    // Fetch plans via Secure RPC
    const { data: plans, error: plansErr } = await supabase.rpc('get_marketplace_plans', {
      p_app_ids: [app.id]
    });
    if (plansErr) console.warn('Error fetching plans for slug via RPC:', plansErr);

    // Fetch features
    const { data: features } = await supabase
      .schema('platform')
      .from('app_features')
      .select('*')
      .eq('app_id', app.id);

    // Fetch plan feature limits via Secure RPC
    const planIds = (plans || []).map((p: any) => p.id);
    let planFeatures: any[] = [];
    if (planIds.length > 0) {
      const { data: pfData, error: pfErr } = await supabase.rpc('get_marketplace_plan_features', {
        p_plan_ids: planIds
      });
      if (pfErr) console.warn('Error fetching plan features for slug via RPC:', pfErr);
      planFeatures = pfData || [];
    }

    return transformDbAppToMarketplaceApp(app, plans || [], features || [], planFeatures);
  } catch (err) {
    console.error(`Error fetching app with slug ${slug}:`, err);
    return null;
  }
}
