    -- 018_company_profile_rpc.sql
    -- RPCs to safely fetch and update company profile without exposing private schemas to PostgREST

    CREATE OR REPLACE FUNCTION public.get_company_profile(user_uuid UUID)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        target_account_id UUID;
        company_record RECORD;
    BEGIN
        -- 1. Get the account ID for the user
        SELECT id INTO target_account_id
        FROM identity.accounts
        WHERE auth_user_id = user_uuid;

        IF target_account_id IS NULL THEN
            RAISE EXCEPTION 'Account not found';
        END IF;

        -- 2. Get the company record
        SELECT company_name, country_code, timezone INTO company_record
        FROM company.companies
        WHERE account_id = target_account_id;

        IF NOT FOUND THEN
            RETURN NULL;
        END IF;

        RETURN json_build_object(
            'company_name', company_record.company_name,
            'country_code', company_record.country_code,
            'timezone', company_record.timezone
        );
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.get_company_profile(UUID) TO service_role;


    CREATE OR REPLACE FUNCTION public.update_company_profile(user_uuid UUID, c_name TEXT, c_code TEXT, c_timezone TEXT)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
        target_account_id UUID;
    BEGIN
        -- 1. Get the account ID for the user
        SELECT id INTO target_account_id
        FROM identity.accounts
        WHERE auth_user_id = user_uuid;

        IF target_account_id IS NULL THEN
            RAISE EXCEPTION 'Account not found';
        END IF;

        -- 2. Upsert the company record
        INSERT INTO company.companies (account_id, company_name, country_code, timezone, status, updated_at)
        VALUES (target_account_id, btrim(c_name), COALESCE(c_code, 'SG'), COALESCE(c_timezone, 'Asia/Singapore'), 'active', NOW())
        ON CONFLICT (account_id) DO UPDATE
        SET 
            company_name = EXCLUDED.company_name,
            country_code = EXCLUDED.country_code,
            timezone = EXCLUDED.timezone,
            updated_at = EXCLUDED.updated_at;
    END;
    $$;

    GRANT EXECUTE ON FUNCTION public.update_company_profile(UUID, TEXT, TEXT, TEXT) TO service_role;
