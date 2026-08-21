-- Phase 4: Platform State & Entitlement Engine (V5)

-- 1. stripe_webhook_events
CREATE TABLE public.stripe_webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text UNIQUE NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'received', -- 'received', 'processing', 'processed', 'failed'
  payload jsonb,
  error_text text,
  attempts integer NOT NULL DEFAULT 0,
  claimed_at timestamp with time zone,
  next_retry_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_stripe_webhook_events
BEFORE UPDATE ON public.stripe_webhook_events
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 2. entitlement_overrides
CREATE TABLE public.entitlement_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  app_id text REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  feature_id uuid REFERENCES public.features(id) ON DELETE CASCADE NOT NULL,
  value jsonb NOT NULL,
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_entitlement_overrides
BEFORE UPDATE ON public.entitlement_overrides
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 3. entitlements
CREATE TABLE public.entitlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  app_id text REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  feature_id uuid REFERENCES public.features(id) ON DELETE CASCADE NOT NULL,
  value jsonb NOT NULL,
  is_enabled boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, app_id, feature_id)
);

-- 4. usage_records
CREATE TABLE public.usage_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  app_id text REFERENCES public.apps(id) ON DELETE CASCADE NOT NULL,
  feature_id uuid REFERENCES public.features(id) ON DELETE CASCADE NOT NULL,
  current_usage bigint NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, app_id, feature_id)
);

-- 5. usage_events (append-only auditable history)
CREATE TABLE public.usage_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT NOT NULL,
  app_id text REFERENCES public.apps(id) ON DELETE RESTRICT NOT NULL,
  feature_id uuid REFERENCES public.features(id) ON DELETE RESTRICT NOT NULL,
  delta bigint NOT NULL,
  new_total bigint NOT NULL,
  reference_type text,
  reference_id text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. audit_logs
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  source text,
  request_context jsonb,
  event_details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Append-only trigger for audit_logs
CREATE OR REPLACE FUNCTION public.reject_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Updates and deletions are not permitted on this table.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_audit_append_only
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.reject_update_delete();

CREATE TRIGGER enforce_usage_events_append_only
BEFORE UPDATE OR DELETE ON public.usage_events
FOR EACH ROW EXECUTE FUNCTION public.reject_update_delete();

-- 7. Strict Grant Model & RLS
REVOKE ALL ON public.stripe_webhook_events FROM public, anon, authenticated;
REVOKE ALL ON public.entitlement_overrides FROM public, anon, authenticated;
REVOKE ALL ON public.entitlements FROM public, anon, authenticated;
REVOKE ALL ON public.usage_records FROM public, anon, authenticated;
REVOKE ALL ON public.usage_events FROM public, anon, authenticated;
REVOKE ALL ON public.audit_logs FROM public, anon, authenticated;

-- Grant Read Access
GRANT SELECT ON public.entitlements TO authenticated;
GRANT SELECT ON public.usage_records TO authenticated;
GRANT SELECT ON public.usage_events TO authenticated;

-- Enable RLS
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlement_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization entitlements" ON public.entitlements FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Users can view their organization usage" ON public.usage_records FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Users can view their organization usage events" ON public.usage_events FOR SELECT USING (public.is_org_member(organization_id));
