CREATE TABLE company.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL UNIQUE
        REFERENCES identity.accounts(id)
        ON DELETE RESTRICT,

    company_name TEXT NOT NULL,

    country_code CHAR(2) NOT NULL DEFAULT 'SG',

    timezone TEXT NOT NULL DEFAULT 'Asia/Singapore',

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'active',
            'suspended',
            'deletion_requested',
            'deletion_scheduled',
            'deleted'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_account
ON company.companies(account_id);