// api/admin/clients/[id]/pricing.ts
// GET: returns client + 6 pricing rows (creates defaults if missing)
// PUT: saves to DB only. Stripe publishing is a separate endpoint.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type PackageType =
  | "basic"
  | "standard"
  | "exclusive"
  | "campaign"
  | "single_image"
  | "single_video";

const PACKAGE_DEFS = [
  { type: "basic",        kind: "subscription", display_order: 1, default_monthly: 15000, default_annual: 144000, default_one_time: null },
  { type: "standard",     kind: "subscription", display_order: 2, default_monthly: 35000, default_annual: 336000, default_one_time: null },
  { type: "exclusive",    kind: "subscription", display_order: 3, default_monthly: 90000, default_annual: 864000, default_one_time: null },
  { type: "campaign",     kind: "one_time",     display_order: 4, default_monthly: null,  default_annual: null,   default_one_time: 55000 },
  { type: "single_image", kind: "one_time",     display_order: 5, default_monthly: null,  default_annual: null,   default_one_time: 2500 },
  { type: "single_video", kind: "one_time",     display_order: 6, default_monthly: null,  default_annual: null,   default_one_time: 7500 },
] as const;

async function requireAdmin(req: any, res: any): Promise<{ userId: string } | null> {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing auth token" });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  return { userId: data.user.id };
}

export default async function handler(req: any, res: any) {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const clientId = req.query.id as string;
  if (!clientId) {
    return res.status(400).json({ error: "Missing client id" });
  }

  const { data: client, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("id, name, is_complimentary")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) {
    return res.status(404).json({ error: "Client not found" });
  }

  // ─── GET ──────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    const { data: existing, error: readErr } = await supabaseAdmin
      .from("client_pricing")
      .select("*")
      .eq("client_id", clientId)
      .order("display_order");

    if (readErr) {
      return res.status(500).json({ error: "DB read failed: " + readErr.message });
    }

    const existingTypes = new Set((existing || []).map(r => r.package_type));
    const missing = PACKAGE_DEFS.filter(p => !existingTypes.has(p.type));

    if (missing.length > 0) {
      const rowsToInsert = missing.map(p => ({
        client_id: clientId,
        package_type: p.type,
        currency: "USD",
        monthly_price_cents: p.default_monthly,
        annual_price_cents: p.default_annual,
        one_time_price_cents: p.default_one_time,
        is_complimentary: client.is_complimentary,
        is_active: true,
        is_offered: true,
        display_order: p.display_order,
      }));
      const { error: insertErr } = await supabaseAdmin
        .from("client_pricing")
        .insert(rowsToInsert);
      if (insertErr) {
        return res.status(500).json({ error: "DB seed failed: " + insertErr.message });
      }
    }

    const { data: full, error: readErr2 } = await supabaseAdmin
      .from("client_pricing")
      .select("*")
      .eq("client_id", clientId)
      .order("display_order");

    if (readErr2) {
      return res.status(500).json({ error: "DB read failed: " + readErr2.message });
    }

    return res.status(200).json({
      client: {
        id: client.id,
        name: client.name,
        is_complimentary: client.is_complimentary,
      },
      pricing: full || [],
    });
  }

  // ─── PUT (save draft, no Stripe) ──────────────────────────────────────────
  if (req.method === "PUT") {
    const body = req.body || {};
    const updates: Array<{
      package_type: PackageType;
      currency: string;
      monthly_price_cents: number | null;
      annual_price_cents: number | null;
      one_time_price_cents: number | null;
      is_offered: boolean;
    }> = body.pricing || [];

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "Body must include pricing array" });
    }

    const validTypes = new Set<PackageType>(PACKAGE_DEFS.map(p => p.type));
    for (const u of updates) {
      if (!validTypes.has(u.package_type)) {
        return res.status(400).json({ error: `Invalid package_type: ${u.package_type}` });
      }
      if (!u.currency || u.currency.length !== 3) {
        return res.status(400).json({ error: "Currency must be 3-letter ISO code" });
      }
      if (typeof u.is_offered !== "boolean") {
        return res.status(400).json({ error: "is_offered must be boolean" });
      }
    }

    // Upsert each row. Note: stripe_* fields are NOT touched here.
    const results = [];
    for (const u of updates) {
      const def = PACKAGE_DEFS.find(p => p.type === u.package_type)!;
      const upsertRow = {
        client_id: clientId,
        package_type: u.package_type,
        currency: u.currency,
        monthly_price_cents: u.monthly_price_cents,
        annual_price_cents: u.annual_price_cents,
        one_time_price_cents: u.one_time_price_cents,
        is_complimentary: client.is_complimentary,
        is_active: true,
        is_offered: u.is_offered,
        display_order: def.display_order,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertErr } = await supabaseAdmin
        .from("client_pricing")
        .upsert(upsertRow, { onConflict: "client_id,package_type" })
        .select()
        .single();

      if (upsertErr) {
        console.error("Upsert failed:", upsertErr);
        return res.status(500).json({ error: "DB upsert failed: " + upsertErr.message });
      }

      results.push(upserted);
    }

    return res.status(200).json({
      ok: true,
      pricing: results,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
