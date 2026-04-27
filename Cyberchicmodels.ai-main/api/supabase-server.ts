/**
 * Server-side Supabase client.
 *
 * Uses the service role key — bypasses Row-Level Security.
 * Only import from /api/* serverless functions, never from client code.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached = null;

export function getSupabaseAdmin() {
  if (cached) return cached;
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not set in Vercel env vars");
  }
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in Vercel env vars");
  }
  cached = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
