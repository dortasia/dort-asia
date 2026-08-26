-- 021_subscription_architecture.sql
-- Add discount, usage, and isolated invoice architecture for subscriptions.

-- 1. Invoice Isolation
ALTER TABLE billing.invoices 
ADD COLUMN subscription_id UUID REFERENCES subscriptions.subscriptions(id) ON DELETE SET NULL;

CREATE INDEX idx_billing_invoices_subscription ON billing.invoices(subscription_id);

-- 2. Discounts Architecture (Stripe is the Source of Truth)
CREATE TABLE marketplace.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_amount NUMERIC(12,2) NOT NULL,
    duration_months INTEGER, -- NULL means forever
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
    
    -- Stripe mapping
    stripe_coupon_id TEXT,
    stripe_promotion_code_id TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eligibility table so a promotion doesn't magically apply to every app
CREATE TABLE marketplace.promotion_eligibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES marketplace.promotions(id) ON DELETE CASCADE,
    app_id UUID REFERENCES platform.apps(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES marketplace.app_plans(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Can either target a specific app or a specific plan. 
    -- If app_id is set and plan_id is null, it applies to all plans in that app.
    CHECK (app_id IS NOT NULL OR plan_id IS NOT NULL)
);

CREATE UNIQUE INDEX idx_promo_elig_app_plan 
ON marketplace.promotion_eligibility(promotion_id, COALESCE(app_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(plan_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX idx_promotion_eligibility_promo ON marketplace.promotion_eligibility(promotion_id);

-- The actual applied discount to a subscription (preserves snapshot pricing)
CREATE TABLE subscriptions.subscription_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions.subscriptions(id) ON DELETE CASCADE,
    promotion_id UUID REFERENCES marketplace.promotions(id) ON DELETE SET NULL,
    
    -- Snapshot fields for historical accuracy (Stripe is SoT, this is for historical display/audit)
    snapshot_base_price NUMERIC(12,2) NOT NULL,
    snapshot_currency CHAR(3) NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_amount NUMERIC(12,2) NOT NULL,
    
    -- Stripe mapping
    stripe_discount_id TEXT,
    
    starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce exactly one active discount per subscription using a static boolean flag
CREATE UNIQUE INDEX idx_one_active_discount_per_sub 
ON subscriptions.subscription_discounts(subscription_id) 
WHERE is_active = TRUE;

CREATE INDEX idx_subscription_discounts_sub ON subscriptions.subscription_discounts(subscription_id);

-- 3. Usage Tracking Architecture
-- Tracks real consumption against access.entitlements
CREATE TABLE subscriptions.usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions.subscriptions(id) ON DELETE CASCADE,
    entitlement_key TEXT NOT NULL,
    
    current_usage NUMERIC(12,2) NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(subscription_id, entitlement_key)
);

CREATE INDEX idx_subscriptions_usage_sub ON subscriptions.usage(subscription_id);
