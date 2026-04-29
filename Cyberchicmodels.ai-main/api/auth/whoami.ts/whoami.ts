// api/auth/whoami.ts
// PATCHED — Step 5 fix.
// GET: returns the current user's role + routing info.
// Used by AuthCallback to determine where to redirect after magic link.
//
// Fix vs previous version: fetches client_users and clients in separate queries
// instead of using nested join (which returned inconsistent shape — sometimes
// object, sometimes array, depending on Supabase JS client version).

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(200).json({ role: "none", reason: "no_token" });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user) {
    return res.status(200).json({
      role: "none",
      reason: "invalid_token",
      detail: userErr?.message || null,
    });
  }

  const userId = userData.user.id;
  const email = userData.user.email;

  // ─── Check admin first (admins take priority if somehow both) ──────────
  const { data: adminRow, error: adminErr } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminErr) {
    return res.status(500).json({
      role: "none",
      reason: "admin_lookup_failed",
      detail: adminErr.message,
    });
  }

  if (adminRow) {
    return res.status(200).json({
      role: "admin",
      email,
    });
  }

  // ─── Check client_users (separate query, no nested join) ───────────────
  const { data: clientUserRow, error: cuErr } = await supabaseAdmin
    .from("client_users")
    .select("id, client_id, role")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (cuErr) {
    return res.status(500).json({
      role: "none",
      reason: "client_user_lookup_failed",
      detail: cuErr.message,
    });
  }

  if (!clientUserRow) {
    // Authenticated but no role
    return res.status(200).json({
      role: "orphan",
      email,
      reason: "no_client_user_row",
    });
  }

  // ─── Fetch the client record separately ────────────────────────────────
  const { data: clientRow, error: cErr } = await supabaseAdmin
    .from("clients")
    .select("slug, name, is_active")
    .eq("id", clientUserRow.client_id)
    .maybeSingle();

  if (cErr) {
    return res.status(500).json({
      role: "none",
      reason: "client_lookup_failed",
      detail: cErr.message,
    });
  }

  if (!clientRow) {
    // client_users row points to a non-existent client (foreign key violation, shouldn't happen)
    return res.status(500).json({
      role: "none",
      reason: "orphan_client_users_row",
      detail: `client_users row ${clientUserRow.id} points to deleted client ${clientUserRow.client_id}`,
    });
  }

  if (!clientRow.is_active) {
    return res.status(200).json({
      role: "client_inactive",
      email,
      client_slug: clientRow.slug,
      client_name: clientRow.name,
    });
  }

  // ─── Update last_login_at (best-effort, don't fail if it errors) ───────
  await supabaseAdmin
    .from("client_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", clientUserRow.id);

  return res.status(200).json({
    role: "client",
    email,
    client_slug: clientRow.slug,
    client_name: clientRow.name,
    client_role: clientUserRow.role,
  });
}
