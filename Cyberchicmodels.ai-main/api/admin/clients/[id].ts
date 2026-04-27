/**
 * /api/admin/clients/:id
 * GET    - Fetch single client
 * PATCH  - Update fields on existing client
 * DELETE - Remove client (cascade deletes pricing, subs, purchases via FK)
 *
 * All require admin authentication.
 */

import { requireAdmin, getAdminClient } from "../_auth.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = req.query?.id;
  if (!id || typeof id !== "string") {
    res.status(400).json({ error: "Missing client id in path" });
    return;
  }

  const supabase = getAdminClient();

  // ---- GET ----
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        id, slug, name, contact_email, contact_name,
        logo_url, hero_image_url, assigned_model_id,
        default_language, default_currency,
        is_active, notes, created_at, updated_at,
        models:assigned_model_id ( id, name, slug )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (!data) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    res.status(200).json({ client: data });
    return;
  }

  // ---- PATCH ----
  if (req.method === "PATCH") {
    const body = req.body;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Missing request body" });
      return;
    }

    // Allowlist of fields the client can patch
    const allowed = [
      "name",
      "slug",
      "contact_email",
      "contact_name",
      "logo_url",
      "hero_image_url",
      "assigned_model_id",
      "default_language",
      "default_currency",
      "notes",
      "is_active",
    ];

    const updates = {};
    for (const k of allowed) {
      if (k in body) updates[k] = body[k];
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    // If slug is being changed, validate format and uniqueness
    if (updates.slug !== undefined) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(updates.slug)) {
        res.status(400).json({ error: "Slug must be kebab-case" });
        return;
      }
      const { data: conflict } = await supabase
        .from("clients")
        .select("id")
        .eq("slug", updates.slug)
        .neq("id", id)
        .maybeSingle();
      if (conflict) {
        res.status(409).json({ error: `Slug "${updates.slug}" already in use` });
        return;
      }
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ client: data });
    return;
  }

  // ---- DELETE ----
  if (req.method === "DELETE") {
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
