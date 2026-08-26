CREATE TABLE subscriptions.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL
        REFERENCES company.companies(id)
        ON DELETE RESTRICT,

    app_id UUID NOT NULL
        REFERENCES platform.apps(id)
        ON DELETE RESTRICT,

    plan_id UUID NOT NULL
        REFERENCES marketplace.app_plans(id)
        ON DELETE RESTRICT,

    stripe_subscription_id TEXT UNIQUE,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending',
            'trialing',
            'active',
            'past_due',
            'paused',
            'cancelled',
            'expired'
        )),

    starts_at TIMESTAMPTZ,

    current_period_start TIMESTAMPTZ,

    current_period_end TIMESTAMPTZ,

    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,

    cancelled_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_subscriptions_company
ON subscriptions.subscriptions(company_id);

CREATE INDEX idx_subscriptions_app
ON subscriptions.subscriptions(app_id);

CREATE INDEX idx_subscriptions_status
ON subscriptions.subscriptions(status);