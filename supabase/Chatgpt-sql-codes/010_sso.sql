CREATE TABLE sso.registered_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    app_id UUID NOT NULL UNIQUE
        REFERENCES platform.apps(id)
        ON DELETE CASCADE,

    client_id TEXT NOT NULL UNIQUE,

    client_secret_hash TEXT,

    redirect_uris JSONB NOT NULL DEFAULT '[]'::jsonb,

    allowed_scopes JSONB NOT NULL DEFAULT '[]'::jsonb,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'active',
            'disabled'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE sso.authorization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code_hash TEXT NOT NULL UNIQUE,

    client_id TEXT NOT NULL,

    account_id UUID NOT NULL
        REFERENCES identity.accounts(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company.companies(id)
        ON DELETE CASCADE,

    redirect_uri TEXT NOT NULL,

    scope TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    consumed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE sso.app_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    app_id UUID NOT NULL
        REFERENCES platform.apps(id)
        ON DELETE CASCADE,

    account_id UUID NOT NULL
        REFERENCES identity.accounts(id)
        ON DELETE CASCADE,

    company_id UUID NOT NULL
        REFERENCES company.companies(id)
        ON DELETE CASCADE,

    session_reference TEXT NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    revoked_at TIMESTAMPTZ
);


CREATE INDEX idx_sso_codes_account
ON sso.authorization_codes(account_id);

CREATE INDEX idx_sso_sessions_account
ON sso.app_sessions(account_id);

CREATE INDEX idx_sso_sessions_app
ON sso.app_sessions(app_id);