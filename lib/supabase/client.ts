import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time (SSR/SSG), provide placeholder values to allow build to complete
// Runtime validation will happen when the client is actually used
const buildTimeUrl = supabaseUrl || "https://placeholder.supabase.co";
const buildTimeKey = supabaseAnonKey || "placeholder-anon-key";

// Create a single supabase client for interacting with your database
// This will use placeholder values during build if env vars are missing
export const supabase = createClient(buildTimeUrl, buildTimeKey);

// Runtime validation helper (optional - can be used in components)
export function validateSupabaseConfig() {
  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please configure it in Netlify environment variables."
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please configure it in Netlify environment variables."
    );
  }
}

