import { SupabaseClient } from '@supabase/supabase-js';

export async function recalculateEntitlements(supabase: SupabaseClient, companyId: string, appId: string) {
    // Due to Supabase REST schema exposure restrictions, the marketplace and access 
    // schemas are blocked from direct JS client access (even with the service_role key).
    // The provisioning logic has been safely moved to an RPC function that executes securely inside Postgres.
    
    const { error } = await supabase.rpc('provision_entitlements', {
        p_company_id: companyId,
        p_app_id: appId
    });

    if (error) {
        console.error(`[Entitlements] Failed to execute provision_entitlements RPC for company ${companyId}:`, error);
        throw new Error(`Entitlement provisioning failed: ${error.message}`);
    }
}
