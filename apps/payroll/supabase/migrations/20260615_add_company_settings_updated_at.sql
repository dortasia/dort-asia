-- 1. Add the updated_at column if it doesn't exist
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc', now());

-- 2. Create the trigger function to automatically update the timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to company_settings
DROP TRIGGER IF EXISTS set_company_settings_updated_at ON public.company_settings;
CREATE TRIGGER set_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
