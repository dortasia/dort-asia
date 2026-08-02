-- Migration: Normalize Approval Hierarchy Settings
-- Description: Cleans up duplicated employee profile details in hierarchy JSON settings, storing strictly normalized level + employeeId.

BEGIN;

DO $$
DECLARE
    rec RECORD;
    mod_rec RECORD;
    updated_app_config JSONB;
    hier_key TEXT;
    hier_obj JSONB;
    old_levels JSONB;
    new_levels JSONB;
    level_item JSONB;
    idx INT;
    matched_emp_id UUID;
    search_email TEXT;
    search_id_text TEXT;
    migrated_hierarchies_count INT := 0;
BEGIN
    -- 1. Process legacy company_settings (app_config)
    FOR rec IN SELECT company_id, app_config FROM public.company_settings LOOP
        IF rec.app_config IS NOT NULL AND jsonb_typeof(rec.app_config) = 'object' THEN
            updated_app_config := rec.app_config;

            FOREACH hier_key IN ARRAY ARRAY['leave_hierarchy', 'claim_hierarchy', 'overtime_hierarchy'] LOOP
                IF rec.app_config ? hier_key AND jsonb_typeof(rec.app_config->hier_key) = 'object' THEN
                    hier_obj := rec.app_config->hier_key;
                    old_levels := hier_obj->'approvalLevels';

                    IF old_levels IS NOT NULL AND jsonb_typeof(old_levels) = 'array' AND jsonb_array_length(old_levels) > 0 THEN
                        new_levels := '[]'::jsonb;
                        idx := 1;

                        FOR level_item IN SELECT * FROM jsonb_array_elements(old_levels) LOOP
                            matched_emp_id := NULL;
                            search_id_text := COALESCE(level_item->>'employeeId', level_item->>'id');
                            search_email := COALESCE(level_item->>'email', level_item->>'role');

                            -- Attempt UUID match first
                            IF search_id_text IS NOT NULL AND search_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                                SELECT id INTO matched_emp_id FROM public.employees WHERE id = search_id_text::uuid LIMIT 1;
                            END IF;

                            -- Attempt email match if UUID match failed
                            IF matched_emp_id IS NULL AND search_email IS NOT NULL AND search_email LIKE '%@%' THEN
                                SELECT id INTO matched_emp_id FROM public.employees WHERE LOWER(email) = LOWER(search_email) LIMIT 1;
                            END IF;

                            -- If matched, build normalized object
                            IF matched_emp_id IS NOT NULL THEN
                                new_levels := new_levels || jsonb_build_object('level', idx, 'employeeId', matched_emp_id);
                                idx := idx + 1;
                            END IF;
                        END LOOP;

                        -- Update hierarchy object with normalized levels
                        hier_obj := jsonb_set(hier_obj, '{approvalLevels}', new_levels);
                        updated_app_config := jsonb_set(updated_app_config, ARRAY[hier_key], hier_obj);
                        migrated_hierarchies_count := migrated_hierarchies_count + 1;
                    END IF;
                END IF;
            END LOOP;

            -- Update record in database
            UPDATE public.company_settings
            SET app_config = updated_app_config
            WHERE company_id = rec.company_id;
        END IF;
    END LOOP;

    -- 2. Process company_module_settings if present
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'company_module_settings') THEN
        FOR mod_rec IN SELECT id, company_id, module, settings FROM public.company_module_settings WHERE module IN ('leave', 'claims', 'overtime') LOOP
            IF mod_rec.settings IS NOT NULL AND jsonb_typeof(mod_rec.settings) = 'object' THEN
                updated_app_config := mod_rec.settings;

                FOREACH hier_key IN ARRAY ARRAY['leave_hierarchy', 'claim_hierarchy', 'overtime_hierarchy', 'hierarchy'] LOOP
                    IF mod_rec.settings ? hier_key AND jsonb_typeof(mod_rec.settings->hier_key) = 'object' THEN
                        hier_obj := mod_rec.settings->hier_key;
                        old_levels := hier_obj->'approvalLevels';

                        IF old_levels IS NOT NULL AND jsonb_typeof(old_levels) = 'array' AND jsonb_array_length(old_levels) > 0 THEN
                            new_levels := '[]'::jsonb;
                            idx := 1;

                            FOR level_item IN SELECT * FROM jsonb_array_elements(old_levels) LOOP
                                matched_emp_id := NULL;
                                search_id_text := COALESCE(level_item->>'employeeId', level_item->>'id');
                                search_email := COALESCE(level_item->>'email', level_item->>'role');

                                IF search_id_text IS NOT NULL AND search_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                                    SELECT id INTO matched_emp_id FROM public.employees WHERE id = search_id_text::uuid LIMIT 1;
                                END IF;

                                IF matched_emp_id IS NULL AND search_email IS NOT NULL AND search_email LIKE '%@%' THEN
                                    SELECT id INTO matched_emp_id FROM public.employees WHERE LOWER(email) = LOWER(search_email) LIMIT 1;
                                END IF;

                                IF matched_emp_id IS NOT NULL THEN
                                    new_levels := new_levels || jsonb_build_object('level', idx, 'employeeId', matched_emp_id);
                                    idx := idx + 1;
                                END IF;
                            END LOOP;

                            hier_obj := jsonb_set(hier_obj, '{approvalLevels}', new_levels);
                            updated_app_config := jsonb_set(updated_app_config, ARRAY[hier_key], hier_obj);
                            migrated_hierarchies_count := migrated_hierarchies_count + 1;
                        END IF;
                    END IF;
                END LOOP;

                UPDATE public.company_module_settings
                SET settings = updated_app_config,
                    updated_at = timezone('utc'::text, now())
                WHERE id = mod_rec.id;
            END IF;
        END LOOP;
    END IF;

    RAISE NOTICE 'Hierarchy Normalization Complete: Normalized % approval hierarchy configurations.', migrated_hierarchies_count;
END $$;

COMMIT;
