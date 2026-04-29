// api/public/client/[slug].ts
// PUBLIC endpoint — no auth required.
// Returns only safe-to-expose fields for the client login page branding.
// NEVER returns: contact_email, internal notes, pricing, assigned model, is_complimentary.

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

  const slug = req.query.slug as string;
  if (!slug) {
    return res.status(400).json({ error: "Missing slug" });
  }

  // Sanity check: prevent slug enumeration via wildcard chars
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: "Invalid slug format" });
  }

  // ─── Look up client by slug ───────────────────────────────────────────
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("slug, name, logo_url, hero_image_url, default_language, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: "DB lookup failed" });
  }

  if (!data || !data.is_active) {
    // Same response for not-found and inactive — don't leak which is which
    return res.status(404).json({ error: "Client not found" });
  }

  // Return ONLY public-safe fields
  return res.status(200).json({
    client: {
      slug: data.slug,
      name: data.name,
      logo_url: data.logo_url,
      hero_image_url: data.hero_image_url,
      default_language: data.default_language,
    },
  });
}
