ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS geofence_sites JSONB DEFAULT '[]'::jsonb;
