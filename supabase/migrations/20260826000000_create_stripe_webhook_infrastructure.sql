-- 20260826000000_create_stripe_webhook_infrastructure.sql

-- 1. Create stripe_webhook_events for idempotency and leasing
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'completed', 'failed')),
    payload JSONB NOT NULL,
    claimed_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    error_text TEXT,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying processing/failed events quickly
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status 
ON public.stripe_webhook_events(status, claimed_at, next_retry_at);

-- 2. Create checkout_sessions for tracking user checkout attempts
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES company.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_session_id TEXT NOT NULL UNIQUE,
    app_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'complete', 'expired', 'canceled')),
    idempotency_key TEXT,
    snapshot JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Security (RLS and Privileges)
-- Webhook events should only be accessible by the service_role (the backend API)
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Grant least privilege access to service_role (The webhook uses service_role key)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stripe_webhook_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.checkout_sessions TO service_role;

-- No policies for anon or authenticated. They cannot read or write webhook events.
-- (By enabling RLS and defining no policies, all access by anon/authenticated is denied).
