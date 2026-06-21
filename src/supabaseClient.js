import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to a .env.local file, then restart the dev server."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // keep the session in localStorage between visits
    autoRefreshToken: true, // refresh it silently before it expires
  },
});