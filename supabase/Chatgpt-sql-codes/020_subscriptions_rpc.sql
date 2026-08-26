-- 020_subscriptions_rpc.sql
-- Secure RPCs for fetching subscription data across schemas.

CREATE OR REPLACE FUNCTION subscriptions.get_company_subscriptions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_company_id UUID;
    result JSON;
BEGIN
    -- Securely resolve the user's company via strict relationship
    SELECT c.id INTO target_company_id
    FROM company.companies c
    JOIN identity.accounts a ON a.id = c.account_id
    WHERE a.auth_user_id = auth.uid();

    IF target_company_id IS NULL THEN 
        RETURN '[]'::JSON; 
    END IF;

    -- Aggregate active/trialing subscriptions for the company
    SELECT COALESCE(json_agg(
        json_build_object(
            'app_slug', a.slug,
            'app_name', a.name,
            'app_logo', a.logo_url,
            'plan_name', p.name,
            'status', s.status,
            'billing_interval', p.billing_interval,
            'price', p.price,
            'currency', p.currency
        )
    ), '[]'::JSON)
    INTO result
    FROM subscriptions.subscriptions s
    JOIN platform.apps a ON s.app_id = a.id
    JOIN marketplace.app_plans p ON s.plan_id = p.id
    WHERE s.company_id = target_company_id
      AND s.status IN ('active', 'trialing');

    RETURN result;
END;
$$;


CREATE OR REPLACE FUNCTION subscriptions.get_app_subscription_details(target_app_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_company_id UUID;
    result JSON;
BEGIN
    -- Securely resolve the user's company
    SELECT c.id INTO target_company_id
    FROM company.companies c
    JOIN identity.accounts a ON a.id = c.account_id
    WHERE a.auth_user_id = auth.uid();

    IF target_company_id IS NULL THEN 
        RETURN NULL; 
    END IF;

    -- Fetch detailed subscription data
    SELECT json_build_object(
        'app', json_build_object(
            'slug', a.slug,
            'name', a.name,
            'logo_url', a.logo_url,
            'description', a.description
        ),
        'subscription', json_build_object(
            'id', s.id,
            'status', s.status,
            'starts_at', s.starts_at,
            'current_period_start', s.current_period_start,
            'current_period_end', s.current_period_end,
            'cancel_at_period_end', s.cancel_at_period_end
        ),
        'plan', json_build_object(
            'name', p.name,
            'description', p.description,
            'billing_interval', p.billing_interval
        ),
        'pricing', json_build_object(
            'base_price', COALESCE((
                SELECT sd.snapshot_base_price 
                FROM subscriptions.subscription_discounts sd
                WHERE sd.subscription_id = s.id
                  AND sd.is_active = TRUE
                  AND sd.starts_at <= NOW()
                  AND (sd.expires_at IS NULL OR sd.expires_at > NOW())
                ORDER BY sd.created_at DESC LIMIT 1
            ), p.price),
            'currency', COALESCE((
                SELECT sd.snapshot_currency
                FROM subscriptions.subscription_discounts sd
                WHERE sd.subscription_id = s.id
                  AND sd.is_active = TRUE
                  AND sd.starts_at <= NOW()
                  AND (sd.expires_at IS NULL OR sd.expires_at > NOW())
                ORDER BY sd.created_at DESC LIMIT 1
            ), p.currency),
            'discount', (
                SELECT json_build_object(
                    'type', sd.discount_type,
                    'amount', sd.discount_amount,
                    'starts_at', sd.starts_at,
                    'expires_at', sd.expires_at,
                    'promotion_name', promo.name
                )
                FROM subscriptions.subscription_discounts sd
                LEFT JOIN marketplace.promotions promo ON sd.promotion_id = promo.id
                WHERE sd.subscription_id = s.id
                  AND sd.is_active = TRUE
                  AND sd.starts_at <= NOW()
                  AND (sd.expires_at IS NULL OR sd.expires_at > NOW())
                ORDER BY sd.created_at DESC
                LIMIT 1
            ),
            'final_price', (
                SELECT 
                    CASE 
                        WHEN sd.discount_type = 'fixed' THEN GREATEST(sd.snapshot_base_price - sd.discount_amount, 0)
                        WHEN sd.discount_type = 'percentage' THEN GREATEST(sd.snapshot_base_price * (1 - (sd.discount_amount / 100.0)), 0)
                        ELSE sd.snapshot_base_price
                    END
                FROM subscriptions.subscription_discounts sd
                WHERE sd.subscription_id = s.id
                  AND sd.is_active = TRUE
                  AND sd.starts_at <= NOW()
                  AND (sd.expires_at IS NULL OR sd.expires_at > NOW())
                ORDER BY sd.created_at DESC
                LIMIT 1
            ),
            'savings', (
                SELECT 
                    CASE 
                        WHEN sd.discount_type = 'fixed' THEN LEAST(sd.discount_amount, sd.snapshot_base_price)
                        WHEN sd.discount_type = 'percentage' THEN sd.snapshot_base_price * (sd.discount_amount / 100.0)
                        ELSE 0
                    END
                FROM subscriptions.subscription_discounts sd
                WHERE sd.subscription_id = s.id
                  AND sd.is_active = TRUE
                  AND sd.starts_at <= NOW()
                  AND (sd.expires_at IS NULL OR sd.expires_at > NOW())
                ORDER BY sd.created_at DESC
                LIMIT 1
            )
        ),
        'features', (
            SELECT COALESCE(json_agg(
                json_build_object(
                    'feature_key', f.feature_key,
                    'name', f.name,
                    'description', f.description,
                    'enabled', pf.enabled
                )
            ), '[]'::JSON)
            FROM marketplace.plan_features pf
            JOIN platform.app_features f ON pf.feature_id = f.id
            WHERE pf.plan_id = p.id
        ),
        'entitlements', (
            SELECT COALESCE(json_object_agg(
                acc_ent.entitlement_key, json_build_object(
                    'limit', acc_ent.limits->>'max', -- Uses structured metadata limits instead of arbitrary JSON keys
                    'usage', COALESCE(u.current_usage, 0)
                )
            ), '{}'::JSON)
            FROM access.entitlements acc_ent
            LEFT JOIN subscriptions.usage u 
                ON u.subscription_id = s.id 
               AND u.entitlement_key = acc_ent.entitlement_key
            WHERE acc_ent.subscription_id = s.id
        ),
        'billing', json_build_object(
            'invoices', (
                SELECT COALESCE(json_agg(
                    json_build_object(
                        'invoice_id', i.id,
                        'status', i.status,
                        'amount_due', i.amount_due,
                        'amount_paid', i.amount_paid,
                        'currency', i.currency,
                        'invoice_url', i.invoice_url,
                        'due_at', i.due_at,
                        'paid_at', i.paid_at
                    )
                ), '[]'::JSON)
                FROM (
                    SELECT * FROM billing.invoices inv
                    WHERE inv.subscription_id = s.id
                    ORDER BY inv.created_at DESC
                    LIMIT 5
                ) i
            )
        )
    )
    INTO result
    FROM subscriptions.subscriptions s
    JOIN platform.apps a ON s.app_id = a.id
    JOIN marketplace.app_plans p ON s.plan_id = p.id
    WHERE s.company_id = target_company_id
      AND a.slug = target_app_slug
      AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- Fill in fallback pricing if no discount exists (to avoid nulls)
    IF result IS NOT NULL THEN
        -- If final_price is null (no discount found), set it to base_price and savings to 0
        IF (result->'pricing'->>'final_price') IS NULL THEN
            result := jsonb_set(
                result::jsonb, 
                '{pricing,final_price}', 
                (result->'pricing'->'base_price')::jsonb
            );
            result := jsonb_set(
                result::jsonb, 
                '{pricing,savings}', 
                '0'::jsonb
            );
        END IF;
    END IF;

    RETURN result;
END;
$$;

-- Grant EXECUTE to authenticated users and service_role
GRANT USAGE ON SCHEMA subscriptions TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION subscriptions.get_company_subscriptions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION subscriptions.get_company_subscriptions() FROM anon;
GRANT EXECUTE ON FUNCTION subscriptions.get_company_subscriptions() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION subscriptions.get_app_subscription_details(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION subscriptions.get_app_subscription_details(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION subscriptions.get_app_subscription_details(TEXT) TO authenticated, service_role;
