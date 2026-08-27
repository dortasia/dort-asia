-- Create MFA Recovery Codes table
CREATE TABLE IF NOT EXISTS identity.mfa_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL
        REFERENCES identity.accounts(id)
        ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_account 
ON identity.mfa_recovery_codes(account_id);

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_hash 
ON identity.mfa_recovery_codes(code_hash) 
WHERE used_at IS NULL;

-- Enable RLS
ALTER TABLE identity.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- Note: We do not add public RLS policies because this table is only accessed
-- securely via service-role key in backend Server Actions to prevent brute-forcing.
