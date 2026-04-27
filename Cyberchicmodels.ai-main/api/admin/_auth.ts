/**
 * Admin auth helper.
 * Used by /api/admin/* routes to verify the caller has a valid Supabase session.
 *
 * Phase 1: any authenticated Supabase user counts as admin.
 * Future: add an `admins` table or check user metadata for role='admin'.
 *
 * Usage in endpoint:
 *   const auth = await requireAdmin(req, res);
 *   if (!auth) return;  // requireAdmin already sent 401
 *   // ... proceed with auth.user available
 */

import { createClient } from "@supabase/supabase-js";

export async function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return null;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "Supabase env vars not configured" });
    return null;
  }

  // Use anon-key client to verify the user's JWT
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    res.status(401).json({ error: "Invalid or expired session token" });
    return null;
  }

  return { user: data.user };
}

/**
 * Returns a service-role Supabase client.
 * Bypasses RLS. Only call this AFTER requireAdmin succeeds.
 */
export function getAdminClient() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Service role env vars not configured");
  }
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
