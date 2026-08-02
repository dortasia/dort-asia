import { createClient } from "@supabase/supabase-js";

// Uses fallback values during build if environment variables are not set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bwakqpptkwpcvgerayus.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3YWtxcHB0a3dwY3ZnZXJheXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODIyODIsImV4cCI6MjA5NDI1ODI4Mn0.WUz2ieMcP5BBFuDPotz5wfg1wUV03kBx4Tez-1ooTUc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
