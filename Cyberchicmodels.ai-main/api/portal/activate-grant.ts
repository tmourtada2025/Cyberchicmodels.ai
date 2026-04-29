// api/portal/activate-grant.ts
// POST: marks the client's complimentary grant as activated.
// Records timestamp. Idempotent — calling twice doesn't change the timestamp.

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ─── Auth ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // ─── Resolve client ────────────────────────────────────────────────────
  const { data: clientUserRow, error: cuErr } = await supabaseAdmin
    .from("client_users")
    .select("client_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (cuErr || !clientUserRow) {
    return res.status(403).json({ error: "Account not linked to a client" });
  }

  const { data: client, error: cErr } = await supabaseAdmin
    .from("clients")
    .select("id, is_active, is_complimentary, complimentary_activated_at")
    .eq("id", clientUserRow.client_id)
    .maybeSingle();

  if (cErr || !client) {
    return res.status(404).json({ error: "Client not found" });
  }

  if (!client.is_active) {
    return res.status(403).json({ error: "Client account inactive" });
  }

  if (!client.is_complimentary) {
    return res.status(400).json({
      error: "This client is not on a complimentary plan.",
    });
  }

  // Idempotent: if already activated, return existing timestamp
  if (client.complimentary_activated_at) {
    return res.status(200).json({
      ok: true,
      already_activated: true,
      complimentary_activated_at: client.complimentary_activated_at,
    });
  }

  // ─── Activate ──────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const { error: updErr } = await supabaseAdmin
    .from("clients")
    .update({ complimentary_activated_at: now })
    .eq("id", client.id);

  if (updErr) {
    return res.status(500).json({ error: "Failed to activate grant: " + updErr.message });
  }

  return res.status(200).json({
    ok: true,
    already_activated: false,
    complimentary_activated_at: now,
  });
}
