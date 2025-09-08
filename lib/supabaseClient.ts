import { createClient } from "@supabase/supabase-js";

// Everytime replace wiht actual Supabase URL and anon key
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xigmgcgpradcjrdryspp.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZ21nY2dwcmFkY2pyZHJ5c3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODg1MTIsImV4cCI6MjA3Mjc2NDUxMn0.FmLK1ZFhptFKzUWFdkQn5LYraxhRlIpDAm4x821_8Q8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
