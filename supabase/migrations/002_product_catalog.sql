-- Phase 2: Product Catalog & Feature Mapping (V5)

-- 1. apps
CREATE TABLE public.apps (
  id text PRIMARY KEY, -- e.g., 'xentra_people'
  name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_apps
BEFORE UPDATE ON public.apps
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 2. features
CREATE TABLE public.features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text REFERENCES public.apps(id) ON DELETE RESTRICT NOT NULL,
  name text NOT NULL,
  key text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(app_id, key)
);

CREATE TRIGGER set_timestamp_features
BEFORE UPDATE ON public.features
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 3. plans
CREATE TABLE public.plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text REFERENCES public.apps(id) ON DELETE RESTRICT NOT NULL,
  name text NOT NULL,
  stripe_product_id text UNIQUE NOT NULL,
  active boolean NOT NULL DEFAULT true,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_plans
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. plan_features
CREATE TABLE public.plan_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  feature_id uuid REFERENCES public.features(id) ON DELETE RESTRICT NOT NULL,
  value jsonb NOT NULL,
  UNIQUE(plan_id, feature_id)
);

-- 5. add_ons
CREATE TABLE public.add_ons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id text REFERENCES public.apps(id) ON DELETE RESTRICT NOT NULL,
  name text NOT NULL,
  stripe_product_id text UNIQUE NOT NULL,
  active boolean NOT NULL DEFAULT true,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_add_ons
BEFORE UPDATE ON public.add_ons
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 6. addon_features
CREATE TABLE public.addon_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  add_on_id uuid REFERENCES public.add_ons(id) ON DELETE CASCADE NOT NULL,
  feature_id uuid REFERENCES public.features(id) ON DELETE RESTRICT NOT NULL,
  modifier text NOT NULL,
  value jsonb NOT NULL,
  UNIQUE(add_on_id, feature_id)
);

-- Cross-App Integrity Triggers for Features
CREATE OR REPLACE FUNCTION public.check_plan_feature_app()
RETURNS TRIGGER AS $$
DECLARE
  plan_app_id text;
  feat_app_id text;
BEGIN
  SELECT app_id INTO plan_app_id FROM public.plans WHERE id = NEW.plan_id;
  SELECT app_id INTO feat_app_id FROM public.features WHERE id = NEW.feature_id;
  IF plan_app_id != feat_app_id THEN
    RAISE EXCEPTION 'Feature and Plan must belong to the same app.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_plan_feature_app
BEFORE INSERT OR UPDATE ON public.plan_features
FOR EACH ROW EXECUTE FUNCTION public.check_plan_feature_app();

CREATE OR REPLACE FUNCTION public.check_addon_feature_app()
RETURNS TRIGGER AS $$
DECLARE
  addon_app_id text;
  feat_app_id text;
BEGIN
  SELECT app_id INTO addon_app_id FROM public.add_ons WHERE id = NEW.add_on_id;
  SELECT app_id INTO feat_app_id FROM public.features WHERE id = NEW.feature_id;
  IF addon_app_id != feat_app_id THEN
    RAISE EXCEPTION 'Feature and Add-on must belong to the same app.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_addon_feature_app
BEFORE INSERT OR UPDATE ON public.addon_features
FOR EACH ROW EXECUTE FUNCTION public.check_addon_feature_app();

-- 7. plan_prices
CREATE TABLE public.plan_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.plans(id) ON DELETE RESTRICT NOT NULL,
  stripe_price_id text UNIQUE NOT NULL,
  currency text NOT NULL DEFAULT 'sgd',
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  unit_amount bigint NOT NULL CHECK (unit_amount >= 0),
  active boolean NOT NULL DEFAULT true,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (plan_id, currency, interval),
  UNIQUE (plan_id, id) -- For composite foreign keys
);

CREATE TRIGGER set_timestamp_plan_prices
BEFORE UPDATE ON public.plan_prices
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 8. addon_prices
CREATE TABLE public.addon_prices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  add_on_id uuid REFERENCES public.add_ons(id) ON DELETE RESTRICT NOT NULL,
  stripe_price_id text UNIQUE NOT NULL,
  currency text NOT NULL DEFAULT 'sgd',
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  unit_amount bigint NOT NULL CHECK (unit_amount >= 0),
  active boolean NOT NULL DEFAULT true,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (add_on_id, currency, interval),
  UNIQUE (add_on_id, id) -- For composite foreign keys
);

CREATE TRIGGER set_timestamp_addon_prices
BEFORE UPDATE ON public.addon_prices
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Immutability Triggers for Prices
CREATE OR REPLACE FUNCTION public.check_price_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.unit_amount != NEW.unit_amount OR OLD.currency != NEW.currency OR OLD.stripe_price_id != NEW.stripe_price_id THEN
    RAISE EXCEPTION 'Cannot update amount, currency, or Stripe ID of an existing price. Archive it and create a new one.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_plan_price_immutability
BEFORE UPDATE ON public.plan_prices
FOR EACH ROW EXECUTE FUNCTION public.check_price_immutability();

CREATE TRIGGER enforce_addon_price_immutability
BEFORE UPDATE ON public.addon_prices
FOR EACH ROW EXECUTE FUNCTION public.check_price_immutability();

-- 9. Strict Grant Model & RLS
REVOKE ALL ON public.apps FROM public, anon, authenticated;
REVOKE ALL ON public.features FROM public, anon, authenticated;
REVOKE ALL ON public.plans FROM public, anon, authenticated;
REVOKE ALL ON public.plan_features FROM public, anon, authenticated;
REVOKE ALL ON public.add_ons FROM public, anon, authenticated;
REVOKE ALL ON public.addon_features FROM public, anon, authenticated;
REVOKE ALL ON public.plan_prices FROM public, anon, authenticated;
REVOKE ALL ON public.addon_prices FROM public, anon, authenticated;

-- Grant Read Access
GRANT SELECT ON public.apps TO authenticated;
GRANT SELECT ON public.features TO authenticated;
GRANT SELECT ON public.plans TO authenticated;
GRANT SELECT ON public.plan_features TO authenticated;
GRANT SELECT ON public.add_ons TO authenticated;
GRANT SELECT ON public.addon_features TO authenticated;
GRANT SELECT ON public.plan_prices TO authenticated;
GRANT SELECT ON public.addon_prices TO authenticated;

-- Enable RLS
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_prices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view active apps" ON public.apps FOR SELECT USING (active = true);
CREATE POLICY "Users can view active features" ON public.features FOR SELECT USING (active = true);
CREATE POLICY "Users can view active plans" ON public.plans FOR SELECT USING (active = true);
CREATE POLICY "Users can view plan features" ON public.plan_features FOR SELECT USING (true);
CREATE POLICY "Users can view active add_ons" ON public.add_ons FOR SELECT USING (active = true);
CREATE POLICY "Users can view addon features" ON public.addon_features FOR SELECT USING (true);
CREATE POLICY "Users can view active plan_prices" ON public.plan_prices FOR SELECT USING (active = true);
CREATE POLICY "Users can view active addon_prices" ON public.addon_prices FOR SELECT USING (active = true);
