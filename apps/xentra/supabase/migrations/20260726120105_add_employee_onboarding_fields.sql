-- Add onboarding and personal detail fields to employees table

ALTER TABLE "public"."employees"
ADD COLUMN IF NOT EXISTS "first_name" text,
ADD COLUMN IF NOT EXISTS "last_name" text,
ADD COLUMN IF NOT EXISTS "date_of_birth" date,
ADD COLUMN IF NOT EXISTS "gender" text,
ADD COLUMN IF NOT EXISTS "marital_status" text,
ADD COLUMN IF NOT EXISTS "nationality" text,
ADD COLUMN IF NOT EXISTS "race" text,
ADD COLUMN IF NOT EXISTS "religion" text,
ADD COLUMN IF NOT EXISTS "pass_type" text,
ADD COLUMN IF NOT EXISTS "skill_status" text,
ADD COLUMN IF NOT EXISTS "linkedin_url" text,
ADD COLUMN IF NOT EXISTS "instagram_url" text;
