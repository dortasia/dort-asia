CREATE TABLE access.entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company.companies(id)
        ON DELETE CASCADE,

    app_id UUID NOT NULL
        REFERENCES platform.apps(id)
        ON DELETE CASCADE,

    feature_id UUID
        REFERENCES platform.app_features(id)
        ON DELETE CASCADE,

    subscription_id UUID
        REFERENCES subscriptions.subscriptions(id)
        ON DELETE CASCADE,

    entitlement_key TEXT NOT NULL,

    enabled BOOLEAN NOT NULL DEFAULT TRUE,

    limits JSONB NOT NULL DEFAULT '{}'::jsonb,

    starts_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(
        company_id,
        app_id,
        entitlement_key
    )
);


CREATE INDEX idx_entitlements_company
ON access.entitlements(company_id);

CREATE INDEX idx_entitlements_app
ON access.entitlements(app_id);