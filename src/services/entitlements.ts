import { SupabaseClient } from '@supabase/supabase-js';

export async function recalculateEntitlements(supabase: SupabaseClient, organizationId: string, appId: string) {
    const featureMap = new Map<string, { value: any, type: string }>();

    // 1. Fetch active subscription for the organization and app
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('app_id', appId)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

    if (subscription) {
        // 2. Fetch subscription items (base plan + add-ons)
        const { data: items } = await supabase
            .from('subscription_items')
            .select(`
                quantity,
                plan_id,
                add_on_id
            `)
            .eq('subscription_id', subscription.id);

        if (items && items.length > 0) {
            // 3a. Apply Base Plan Features First
            for (const item of items.filter(i => i.plan_id)) {
                const { data: planFeatures } = await supabase
                    .from('plan_features')
                    .select('feature_id, value')
                    .eq('plan_id', item.plan_id);

                if (planFeatures) {
                    for (const pf of planFeatures) {
                        featureMap.set(pf.feature_id, {
                            value: pf.value,
                            type: typeof pf.value
                        });
                    }
                }
            }

            // 3b. Apply Add-On Features (Modifiers)
            for (const item of items.filter(i => i.add_on_id)) {
                const { data: addonFeatures } = await supabase
                    .from('addon_features')
                    .select('feature_id, modifier, value')
                    .eq('add_on_id', item.add_on_id);

                if (addonFeatures) {
                    for (const af of addonFeatures) {
                        const existing = featureMap.get(af.feature_id);
                        
                        if (existing && af.modifier === 'ADD' && existing.type === 'number') {
                            // Multiply addon value by quantity (e.g., 3 x "10 Employee Pack" = +30)
                            existing.value = Number(existing.value) + (Number(af.value) * item.quantity);
                        } else if (af.modifier === 'SET') {
                            // SET overrides the existing value
                            featureMap.set(af.feature_id, {
                                value: af.value,
                                type: typeof af.value
                            });
                        }
                    }
                }
            }
        }
    }

    // 3c. Apply Entitlement Overrides (Highest priority, ignores subscription state)
    const { data: overrides } = await supabase
        .from('entitlement_overrides')
        .select('feature_id, value, starts_at, ends_at, priority')
        .eq('organization_id', organizationId)
        .eq('app_id', appId);

    if (overrides) {
        const now = new Date();
        const activeOverrides = overrides.filter(o => {
            const startsAt = new Date(o.starts_at);
            const endsAt = o.ends_at ? new Date(o.ends_at) : null;
            return startsAt <= now && (!endsAt || endsAt >= now);
        });

        // Sort by priority ascending, so higher priority overrides get applied last
        activeOverrides.sort((a, b) => a.priority - b.priority);

        for (const o of activeOverrides) {
             featureMap.set(o.feature_id, {
                 value: o.value,
                 type: typeof o.value
             });
        }
    }

    if (featureMap.size === 0) {
        // If absolutely no features from plan, addons, or overrides, disable everything
        await supabase
            .from('entitlements')
            .update({ is_enabled: false, value: 0, updated_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
            .eq('app_id', appId);
        return;
    }

    // 4. Update the Entitlements table
    for (const [featureId, data] of featureMap.entries()) {
        await supabase.from('entitlements').upsert({
            organization_id: organizationId,
            app_id: appId,
            feature_id: featureId,
            value: data.value,
            is_enabled: true,
            updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id,app_id,feature_id' });
    }
    
    // 5. Disable entitlements that are no longer active
    const activeFeatureIds = Array.from(featureMap.keys());
    if (activeFeatureIds.length > 0) {
        await supabase
            .from('entitlements')
            .update({ is_enabled: false, updated_at: new Date().toISOString() })
            .eq('organization_id', organizationId)
            .eq('app_id', appId)
            .not('feature_id', 'in', `(${activeFeatureIds.join(',')})`);
    }
}
