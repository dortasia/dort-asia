CREATE TABLE identity.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    auth_user_id UUID NOT NULL UNIQUE
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    email TEXT NOT NULL UNIQUE,

    status TEXT NOT NULL DEFAULT 'pending_verification'
        CHECK (status IN (
            'pending_verification',
            'pending_company_setup',
            'active',
            'suspended',
            'deletion_requested',
            'deletion_scheduled',
            'deleted'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE identity.account_profiles (
    account_id UUID PRIMARY KEY
        REFERENCES identity.accounts(id)
        ON DELETE CASCADE,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,

    profile_photo_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE identity.account_security (
    account_id UUID PRIMARY KEY
        REFERENCES identity.accounts(id)
        ON DELETE CASCADE,

    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    last_password_change_at TIMESTAMPTZ,

    last_login_at TIMESTAMPTZ,

    failed_login_attempts INTEGER NOT NULL DEFAULT 0,

    locked_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE identity.account_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES identity.accounts(id)
        ON DELETE CASCADE,

    session_reference TEXT NOT NULL,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ,

    revoked_at TIMESTAMPTZ
);


CREATE INDEX idx_account_sessions_account
ON identity.account_sessions(account_id);

CREATE INDEX idx_accounts_auth_user
ON identity.accounts(auth_user_id);