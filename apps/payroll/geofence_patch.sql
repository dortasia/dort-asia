-- Geofence settings columns for company_settings
-- Run this in your Supabase SQL editor

ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS geofencing_enabled  boolean          DEFAULT true,
  ADD COLUMN IF NOT EXISTS office_lat          double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS office_lng          double precision DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS office_radius       integer          DEFAULT 200,
  ADD COLUMN IF NOT EXISTS office_address      text             DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS shift_start         text             DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS shift_end           text             DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS working_days        text[]           DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  ADD COLUMN IF NOT EXISTS grace_period_mins   integer          DEFAULT 15,
  ADD COLUMN IF NOT EXISTS ip_lock_enabled     boolean          DEFAULT false,
  ADD COLUMN IF NOT EXISTS ip_lock_address     text             DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS selfie_verification boolean          DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_overtime       boolean          DEFAULT true;
