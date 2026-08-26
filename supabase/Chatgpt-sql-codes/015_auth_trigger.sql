-- 015_auth_trigger.sql
-- Trigger to handle user signup and provision identity and company records automatically

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_account_id UUID;
    first_name TEXT;
    last_name TEXT;
    company_name TEXT;
    provider TEXT;
    full_name TEXT;
    split_index INT;
    account_status TEXT;
BEGIN
    -- Reliable provider detection:
    -- raw_app_meta_data is NOT reliable in an AFTER INSERT trigger because GoTrue may update it 
    -- *after* the initial INSERT into auth.users.
    -- However, raw_user_meta_data is populated immediately during INSERT. 
    -- Google OAuth payloads always include claims like 'iss' (issuer), 'sub', 'full_name', or 'avatar_url'.
    -- Our Email/Password signup explicitly passes 'firstName', 'lastName', and 'companyName'.
    IF (NEW.raw_user_meta_data->>'iss' LIKE '%google%') OR 
       (NEW.raw_user_meta_data ? 'full_name') OR 
       (NEW.raw_user_meta_data ? 'avatar_url') OR 
       (NOT NEW.raw_user_meta_data ? 'companyName') THEN
        -- Handle Google OAuth
        full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
        split_index := position(' ' in full_name);
        
        IF split_index > 0 THEN
            first_name := substring(full_name from 1 for split_index - 1);
            last_name := substring(full_name from split_index + 1);
        ELSE
            first_name := full_name;
            last_name := '';
        END IF;
        
        company_name := '';
        account_status := 'pending_company_setup';
        
        IF NEW.email IS NULL OR NEW.email = '' THEN
            RAISE EXCEPTION 'Email is required for signup.';
        END IF;
    ELSE
        -- Handle Email/Password
        first_name := COALESCE(NEW.raw_user_meta_data->>'firstName', '');
        last_name := COALESCE(NEW.raw_user_meta_data->>'lastName', '');
        company_name := COALESCE(NEW.raw_user_meta_data->>'companyName', '');
        account_status := 'pending_verification';
        
        IF first_name = '' OR last_name = '' OR company_name = '' OR NEW.email IS NULL OR NEW.email = '' THEN
            RAISE EXCEPTION 'First name, last name, company name, and email are required for signup.';
        END IF;
    END IF;

    -- Insert into identity.accounts and get the generated id
    INSERT INTO identity.accounts (auth_user_id, email, status)
    VALUES (NEW.id, NEW.email, account_status)
    RETURNING id INTO new_account_id;

    -- Insert into identity.account_profiles
    INSERT INTO identity.account_profiles (account_id, first_name, last_name)
    VALUES (new_account_id, first_name, last_name);

    -- Insert into company.companies ONLY if company_name is provided
    IF company_name != '' THEN
        INSERT INTO company.companies (account_id, company_name, status)
        VALUES (new_account_id, company_name, 'active');
    END IF;

    -- Insert into identity.account_security (Constraint 5)
    INSERT INTO identity.account_security (account_id) 
    VALUES (new_account_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if it exists to allow re-running this script safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
