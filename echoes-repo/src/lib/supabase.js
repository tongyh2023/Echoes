// Echoes · 余音 — the one place the app connects to Supabase.
//
// Every page that needs the database imports `supabase` from here.
// The two values below come from Vercel → Settings → Environment Variables.
// Vite only exposes variables whose names start with VITE_, which is why
// these two are allowed into the browser while DASHSCOPE_API_KEY is not.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// True when both variables are present. Lets the app fall back to the
// local demo mode (no database) instead of crashing if they are missing.
export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,     // stay signed in after a refresh
        autoRefreshToken: true,   // renew the session quietly in the background
        detectSessionInUrl: true, // needed for the password-reset email link
      },
    })
  : null;

if (!hasSupabase && typeof console !== 'undefined') {
  console.warn('[echoes] Supabase is not configured — running without a database.');
}
