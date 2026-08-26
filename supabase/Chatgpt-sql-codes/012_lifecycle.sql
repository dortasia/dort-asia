CREATE TABLE lifecycle.account_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL UNIQUE
        REFERENCES identity.accounts(id)
        ON DELETE RESTRICT,

    company_id UUID NOT NULL UNIQUE
        REFERENCES company.companies(id)
        ON DELETE RESTRICT,

    status TEXT NOT NULL DEFAULT 'requested'
        CHECK (status IN (
            'requested',
            'scheduled',
            'processing',
            'completed',
            'cancelled'
        )),

    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    scheduled_for TIMESTAMPTZ,

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    cancelled_at TIMESTAMPTZ,

    reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);