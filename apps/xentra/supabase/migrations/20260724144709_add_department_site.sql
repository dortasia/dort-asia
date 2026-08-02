-- Add department site and explicitly named created_date (if needed alongside created_at)
ALTER TABLE "public"."departments"
ADD COLUMN IF NOT EXISTS "department_site" text,
ADD COLUMN IF NOT EXISTS "created_date" date;
