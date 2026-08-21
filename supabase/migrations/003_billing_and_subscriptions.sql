-- Phase 3: Billing & Subscriptions (V5)

-- 1. billing_customers
CREATE TABLE public.billing_customers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT NOT NULL,
  stripe_customer_id text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id)
);

CREATE TRIGGER set_timestamp_billing_customers
BEFORE UPDATE ON public.billing_customers
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 2. checkout_sessions (with snapshot)
CREATE TABLE public.checkout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  stripe_session_id text UNIQUE NOT NULL,
  app_id text REFERENCES public.apps(id) ON DELETE RESTRICT,
  status text NOT NULL,
  idempotency_key text,
  snapshot jsonb NOT NULL, -- Array of items with internal IDs, stripe IDs, quantity, amount
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_checkout_sessions
BEFORE UPDATE ON public.checkout_sessions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 3. subscriptions
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT NOT NULL,
  app_id text REFERENCES public.apps(id) ON DELETE RESTRICT NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  status text NOT NULL,
  current_period_end timestamp with time zone NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_subscriptions
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. subscription_items (with composite FKs)
CREATE TABLE public.subscription_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  
  plan_id uuid,
  plan_price_id uuid,
  
  add_on_id uuid,
  addon_price_id uuid,
  
  stripe_subscription_item_id text UNIQUE NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  FOREIGN KEY (plan_id, plan_price_id) REFERENCES public.plan_prices (plan_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (add_on_id, addon_price_id) REFERENCES public.addon_prices (add_on_id, id) ON DELETE RESTRICT,
  
  CHECK (
    (plan_id IS NOT NULL AND add_on_id IS NULL) OR 
    (plan_id IS NULL AND add_on_id IS NOT NULL)
  )
);

CREATE TRIGGER set_timestamp_subscription_items
BEFORE UPDATE ON public.subscription_items
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Cross-App Integrity for Subscription Items
CREATE OR REPLACE FUNCTION public.check_subscription_item_app()
RETURNS TRIGGER AS $$
DECLARE
  sub_app_id text;
  item_app_id text;
BEGIN
  SELECT app_id INTO sub_app_id FROM public.subscriptions WHERE id = NEW.subscription_id;
  
  IF NEW.plan_id IS NOT NULL THEN
    SELECT app_id INTO item_app_id FROM public.plans WHERE id = NEW.plan_id;
  ELSIF NEW.add_on_id IS NOT NULL THEN
    SELECT app_id INTO item_app_id FROM public.add_ons WHERE id = NEW.add_on_id;
  END IF;

  IF sub_app_id != item_app_id THEN
    RAISE EXCEPTION 'Subscription and its items must belong to the same app.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER enforce_subscription_item_app
AFTER INSERT OR UPDATE ON public.subscription_items
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.check_subscription_item_app();

-- 5. subscription_events
CREATE TABLE public.subscription_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE RESTRICT NOT NULL,
  type text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. subscription_changes
CREATE TABLE public.subscription_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE RESTRICT NOT NULL,
  change_type text NOT NULL,
  effective_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 7. invoices
CREATE TABLE public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
  stripe_invoice_id text UNIQUE NOT NULL,
  status text NOT NULL,
  currency text NOT NULL,
  amount_due bigint NOT NULL,
  amount_paid bigint NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_invoices
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 8. invoice_items
CREATE TABLE public.invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  stripe_line_item_id text UNIQUE,
  description text,
  quantity integer NOT NULL DEFAULT 1,
  unit_amount bigint NOT NULL,
  currency text NOT NULL,
  tax_snapshot jsonb,
  discount_snapshot jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_invoice_items
BEFORE UPDATE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 9. payments
CREATE TABLE public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE RESTRICT,
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text UNIQUE,
  amount bigint NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 10. refunds
CREATE TABLE public.refunds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid REFERENCES public.payments(id) ON DELETE RESTRICT NOT NULL,
  stripe_refund_id text UNIQUE NOT NULL,
  amount bigint NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 11. Strict Grant Model & RLS
REVOKE ALL ON public.billing_customers FROM public, anon, authenticated;
REVOKE ALL ON public.checkout_sessions FROM public, anon, authenticated;
REVOKE ALL ON public.subscriptions FROM public, anon, authenticated;
REVOKE ALL ON public.subscription_items FROM public, anon, authenticated;
REVOKE ALL ON public.subscription_events FROM public, anon, authenticated;
REVOKE ALL ON public.subscription_changes FROM public, anon, authenticated;
REVOKE ALL ON public.invoices FROM public, anon, authenticated;
REVOKE ALL ON public.invoice_items FROM public, anon, authenticated;
REVOKE ALL ON public.payments FROM public, anon, authenticated;
REVOKE ALL ON public.refunds FROM public, anon, authenticated;

-- Grant Read Access
GRANT SELECT ON public.checkout_sessions TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.subscription_items TO authenticated;
GRANT SELECT ON public.invoices TO authenticated;
GRANT SELECT ON public.invoice_items TO authenticated;

-- Enable RLS
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their checkouts" ON public.checkout_sessions FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Users can view their subscriptions" ON public.subscriptions FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Users can view subscription items" ON public.subscription_items FOR SELECT USING (subscription_id IN (SELECT id FROM public.subscriptions WHERE public.is_org_member(organization_id)));
CREATE POLICY "Users can view their invoices" ON public.invoices FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Users can view invoice items" ON public.invoice_items FOR SELECT USING (invoice_id IN (SELECT id FROM public.invoices WHERE public.is_org_member(organization_id)));
