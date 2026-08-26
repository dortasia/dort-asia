CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID
        REFERENCES identity.accounts(id)
        ON DELETE SET NULL,

    company_id UUID
        REFERENCES company.companies(id)
        ON DELETE SET NULL,

    app_id UUID
        REFERENCES platform.apps(id)
        ON DELETE SET NULL,

    action TEXT NOT NULL,

    resource_type TEXT,

    resource_id TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    ip_address INET,

    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE audit.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID
        REFERENCES identity.accounts(id)
        ON DELETE SET NULL,

    event_type TEXT NOT NULL,

    severity TEXT NOT NULL DEFAULT 'info'
        CHECK (severity IN (
            'info',
            'warning',
            'critical'
        )),

    ip_address INET,

    user_agent TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX idx_audit_logs_account
ON audit.audit_logs(account_id);

CREATE INDEX idx_audit_logs_company
ON audit.audit_logs(company_id);

CREATE INDEX idx_audit_logs_created
ON audit.audit_logs(created_at DESC);

CREATE INDEX idx_security_events_account
ON audit.security_events(account_id);

CREATE INDEX idx_security_events_created
ON audit.security_events(created_at DESC);