CREATE TABLE marketplace.app_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    app_id UUID NOT NULL
        REFERENCES platform.apps(id)
        ON DELETE CASCADE,

    plan_code TEXT NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(12,2) NOT NULL DEFAULT 0,

    currency CHAR(3) NOT NULL DEFAULT 'SGD',

    billing_interval TEXT NOT NULL
        CHECK (billing_interval IN (
            'monthly',
            'yearly',
            'one_time'
        )),

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'draft',
            'active',
            'archived'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(app_id, plan_code)
);


CREATE TABLE marketplace.plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    plan_id UUID NOT NULL
        REFERENCES marketplace.app_plans(id)
        ON DELETE CASCADE,

    feature_id UUID NOT NULL
        REFERENCES platform.app_features(id)
        ON DELETE CASCADE,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    limits JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(plan_id, feature_id)
);


CREATE INDEX idx_app_plans_app
ON marketplace.app_plans(app_id);

CREATE INDEX idx_plan_features_plan
ON marketplace.plan_features(plan_id);