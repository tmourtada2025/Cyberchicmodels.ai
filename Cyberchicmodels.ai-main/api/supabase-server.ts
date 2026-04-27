/**
 * Server-side Supabase client.
 *
 * Uses the service role key, which BYPASSES Row-Level Security.
 * NEVER import this from client-side code (anything in /src/components, /src/pages, etc.).
 * ONLY import from /api/* serverless functions.
 *
 * If you accidentally import this client-side, the build will succeed but the
 * service role key will be exposed in the browser bundle — major security hole.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "VITE_SUPABASE_URL is not set. Add it to Vercel environment variables.",
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to Vercel environment variables (server-side only, never VITE_ prefixed).",
  );
}

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cached;
}
