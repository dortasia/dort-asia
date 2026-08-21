-- Phase 1: Identity & Organization Core (V5)

-- 1. Rename Legacy Tables (to preserve applied schema history and free up names)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'companies') THEN
    ALTER TABLE public.companies RENAME TO legacy_companies;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_users') THEN
    ALTER TABLE public.company_users RENAME TO legacy_company_users;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    ALTER TABLE public.subscriptions RENAME TO legacy_subscriptions;
  END IF;
END $$;

-- 2. Shared Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. user_profiles
CREATE TABLE public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name text,
  last_name text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  communication_preferences jsonb DEFAULT '{"email": true, "sms": false}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_user_profiles
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. organizations
CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  legal_name text,
  uen text,
  industry text,
  country text,
  billing_address jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TRIGGER set_timestamp_organizations
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 5. organization_roles
CREATE TABLE public.organization_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  permissions jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT check_role_system CHECK (
    (is_system = true AND organization_id IS NULL) OR 
    (is_system = false AND organization_id IS NOT NULL)
  ),
  UNIQUE (organization_id, name)
);

CREATE UNIQUE INDEX sys_role_idx ON public.organization_roles (name) WHERE is_system = true;

CREATE TRIGGER set_timestamp_organization_roles
BEFORE UPDATE ON public.organization_roles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Insert Default System Roles
INSERT INTO public.organization_roles (name, is_system, permissions) VALUES 
('owner', true, '{"all": true}'),
('admin', true, '{"manage_users": true, "manage_billing": true}'),
('member', true, '{"read_only": true}');

-- 6. organization_memberships
CREATE TABLE public.organization_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES public.organization_roles(id) ON DELETE RESTRICT NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TRIGGER set_timestamp_organization_memberships
BEFORE UPDATE ON public.organization_memberships
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 7. Role-to-Organization Integrity Trigger
CREATE OR REPLACE FUNCTION public.check_membership_role_org()
RETURNS TRIGGER AS $$
DECLARE
  role_org_id uuid;
  role_is_system boolean;
BEGIN
  SELECT organization_id, is_system INTO role_org_id, role_is_system
  FROM public.organization_roles
  WHERE id = NEW.role_id;

  IF role_is_system = false AND role_org_id != NEW.organization_id THEN
    RAISE EXCEPTION 'Custom role does not belong to the same organization as the membership.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_membership_role_org
BEFORE INSERT OR UPDATE ON public.organization_memberships
FOR EACH ROW EXECUTE FUNCTION public.check_membership_role_org();

-- 8. Secure Membership Helper
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
STABLE 
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_memberships 
    WHERE organization_id = org_id 
    AND user_id = auth.uid()
  );
$$;

-- Restrict execution of helper
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated, service_role;

-- 9. Strict Grant Model & RLS
REVOKE ALL ON public.user_profiles FROM public, anon, authenticated;
REVOKE ALL ON public.organizations FROM public, anon, authenticated;
REVOKE ALL ON public.organization_roles FROM public, anon, authenticated;
REVOKE ALL ON public.organization_memberships FROM public, anon, authenticated;

GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;
GRANT SELECT ON public.organization_roles TO authenticated;
GRANT SELECT ON public.organization_memberships TO authenticated;

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view their organizations" ON public.organizations FOR SELECT
USING (public.is_org_member(id));

CREATE POLICY "Users can view roles for their organizations" ON public.organization_roles FOR SELECT
USING (is_system = true OR public.is_org_member(organization_id));

CREATE POLICY "Users can view memberships for their organizations" ON public.organization_memberships FOR SELECT
USING (public.is_org_member(organization_id));
