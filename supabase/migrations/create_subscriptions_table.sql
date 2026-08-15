-- 1. Create Companies Table
CREATE TABLE public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Company Users Table (Junction)
CREATE TABLE public.company_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'employee')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- 3. Create Subscriptions Table (Linked to Company)
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan text, -- 'starter', 'business', 'enterprise'
  status text, -- 'active', 'canceled', 'past_due', etc.
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Companies Policy: Users can view companies they belong to
CREATE POLICY "Users can view their companies" 
ON public.companies FOR SELECT 
USING (
  id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
);

-- Company Users Policy: Users can view members of their companies
CREATE POLICY "Users can view members of their company"
ON public.company_users FOR SELECT
USING (
  company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
);

-- Subscriptions Policy: Users can view subscriptions for their companies
CREATE POLICY "Users can view their company subscriptions"
ON public.subscriptions FOR SELECT
USING (
  company_id IN (SELECT company_id FROM public.company_users WHERE user_id = auth.uid())
);

-- Note: Inserting/Updating these tables during checkout and webhooks
-- is done via the service_role key on the backend, which bypasses RLS.
