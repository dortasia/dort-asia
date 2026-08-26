-- 019_connected_apps.sql
-- Table for explicit third-party app integrations (Workspace, Slack, etc.)

CREATE TABLE platform.connected_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    account_id UUID NOT NULL
        REFERENCES identity.accounts(id)
        ON DELETE CASCADE,

    provider TEXT NOT NULL,

    provider_account_id TEXT NOT NULL,

    provider_email TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disconnected', 'error')),

    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,

    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(account_id, provider)
);

-- RLS
ALTER TABLE platform.connected_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connected apps"
    ON platform.connected_apps FOR SELECT
    USING (
        account_id IN (
            SELECT id FROM identity.accounts WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own connected apps"
    ON platform.connected_apps FOR ALL
    USING (
        account_id IN (
            SELECT id FROM identity.accounts WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        account_id IN (
            SELECT id FROM identity.accounts WHERE auth_user_id = auth.uid()
        )
    );
