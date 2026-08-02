ALTER TABLE "public"."departments"
ADD COLUMN IF NOT EXISTS "theme_bg" text,
ADD COLUMN IF NOT EXISTS "theme_accent" text;
