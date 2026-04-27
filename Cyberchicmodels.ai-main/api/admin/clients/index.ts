/**
 * /api/admin/clients
 * GET  - List all clients (with assigned model name joined)
 * POST - Create a new client
 *
 * Both require admin authentication (Bearer token in Authorization header).
 */

import { requireAdmin, getAdminClient } from "../_auth.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const supabase = getAdminClient();

  // ---- GET: list clients ----
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
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ clients: data });
    return;
  }

  // ---- POST: create client ----
  if (req.method === "POST") {
    const body = req.body;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Missing request body" });
      return;
    }

    const {
      name,
      slug,
      contact_email,
      contact_name,
      logo_url,
      hero_image_url,
      assigned_model_id,
      default_language,
      default_currency,
      notes,
      is_active,
    } = body;

    if (!name || !slug || !contact_email) {
      res.status(400).json({ error: "Required: name, slug, contact_email" });
      return;
    }

    // Basic slug validation: kebab-case only
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      res.status(400).json({ error: "Slug must be kebab-case (lowercase letters, digits, hyphens)" });
      return;
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      res.status(409).json({ error: `Slug "${slug}" already exists` });
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name,
        slug,
        contact_email,
        contact_name: contact_name || null,
        logo_url: logo_url || null,
        hero_image_url: hero_image_url || null,
        assigned_model_id: assigned_model_id || null,
        default_language: default_language || "en",
        default_currency: default_currency || "USD",
        notes: notes || null,
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json({ client: data });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
