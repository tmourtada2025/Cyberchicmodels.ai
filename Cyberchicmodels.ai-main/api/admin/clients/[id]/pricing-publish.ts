// api/admin/clients/[id]/pricing-publish.ts
// POST: publish offered packages to Stripe.
// - Skips complimentary clients entirely (returns 400)
// - Creates Stripe Product (or reuses existing via stripe_product_id)
// - Creates Stripe Prices (immutable — always new)
// - Updates DB rows with Stripe IDs + published_to_stripe_at

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia" as any,
});

const PACKAGE_META: Record<string, { kind: "subscription" | "one_time"; name: string; description: string }> = {
  basic:        { kind: "subscription", name: "Basic",        description: "Entry-level model licensing" },
  standard:     { kind: "subscription", name: "Standard",     description: "Mid-tier model licensing" },
  exclusive:    { kind: "subscription", name: "Exclusive",    description: "Top-tier exclusive model licensing" },
  campaign:     { kind: "one_time",     name: "Campaign",     description: "Single campaign deliverable" },
  single_image: { kind: "one_time",     name: "Single Image", description: "One-off image purchase" },
  single_video: { kind: "one_time",     name: "Single Video", description: "One-off video purchase" },
};

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const clientId = req.query.id as string;
  if (!clientId) {
    return res.status(400).json({ error: "Missing client id" });
  }

  // Validate client
  const { data: client, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("id, name, is_complimentary")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) {
    return res.status(404).json({ error: "Client not found" });
  }

  if (client.is_complimentary) {
    return res.status(400).json({
      error: "Cannot publish complimentary client to Stripe. This client receives a custom complimentary grant outside of Stripe billing.",
    });
  }

  // Get all pricing rows
  const { data: pricingRows, error: readErr } = await supabaseAdmin
    .from("client_pricing")
    .select("*")
    .eq("client_id", clientId);

  if (readErr || !pricingRows) {
    return res.status(500).json({ error: "DB read failed: " + (readErr?.message || "no data") });
  }

  // Filter to offered packages only
  const offeredRows = pricingRows.filter(r => r.is_offered);
  if (offeredRows.length === 0) {
    return res.status(400).json({ error: "No packages are offered. Toggle at least one package on before publishing." });
  }

  // Process each offered package
  const publishedAt = new Date().toISOString();
  const results: any[] = [];

  for (const row of offeredRows) {
    const meta = PACKAGE_META[row.package_type];
    if (!meta) {
      return res.status(500).json({ error: `Unknown package_type in DB: ${row.package_type}` });
    }

    try {
      // ─── Product (idempotent) ─────────────────────────────────────────
      let productId = row.stripe_product_id as string | null;
      if (!productId) {
        const product = await stripe.products.create({
          name: `${client.name} — ${meta.name}`,
          description: meta.description,
          metadata: {
            client_id: clientId,
            package_type: row.package_type,
          },
        });
        productId = product.id;
      } else {
        // Update existing product (e.g. if client name changed)
        await stripe.products.update(productId, {
          name: `${client.name} — ${meta.name}`,
          description: meta.description,
        });
      }

      // ─── Prices (immutable — always new) ──────────────────────────────
      let priceMonthlyId: string | null = null;
      let priceAnnualId: string | null = null;
      let priceOneTimeId: string | null = null;

      const cur = (row.currency || "USD").toLowerCase();

      if (meta.kind === "subscription") {
        if (row.monthly_price_cents != null && row.monthly_price_cents > 0) {
          const p = await stripe.prices.create({
            product: productId,
            unit_amount: row.monthly_price_cents,
            currency: cur,
            recurring: { interval: "month" },
            metadata: { client_id: clientId, package_type: row.package_type, period: "monthly" },
          });
          priceMonthlyId = p.id;
        }
        if (row.annual_price_cents != null && row.annual_price_cents > 0) {
          const p = await stripe.prices.create({
            product: productId,
            unit_amount: row.annual_price_cents,
            currency: cur,
            recurring: { interval: "year" },
            metadata: { client_id: clientId, package_type: row.package_type, period: "annual" },
          });
          priceAnnualId = p.id;
        }
        if (priceMonthlyId === null && priceAnnualId === null) {
          return res.status(400).json({
            error: `Package ${row.package_type} is offered but has no monthly or annual price set.`,
          });
        }
      } else {
        if (row.one_time_price_cents != null && row.one_time_price_cents > 0) {
          const p = await stripe.prices.create({
            product: productId,
            unit_amount: row.one_time_price_cents,
            currency: cur,
            metadata: { client_id: clientId, package_type: row.package_type, period: "one_time" },
          });
          priceOneTimeId = p.id;
        } else {
          return res.status(400).json({
            error: `Package ${row.package_type} is offered but has no price set.`,
          });
        }
      }

      // ─── Update DB row ────────────────────────────────────────────────
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("client_pricing")
        .update({
          stripe_product_id: productId,
          stripe_price_id_monthly: priceMonthlyId,
          stripe_price_id_annual: priceAnnualId,
          stripe_price_id_one_time: priceOneTimeId,
          published_to_stripe_at: publishedAt,
          updated_at: publishedAt,
        })
        .eq("id", row.id)
        .select()
        .single();

      if (updateErr) {
        return res.status(500).json({
          error: `DB update failed for ${row.package_type}: ${updateErr.message}`,
        });
      }

      results.push(updated);
    } catch (e: any) {
      console.error(`Stripe publish failed for ${row.package_type}:`, e);
      return res.status(500).json({
        error: `Stripe publish failed for ${row.package_type}: ${e.message || "unknown error"}`,
        package_type: row.package_type,
      });
    }
  }

  return res.status(200).json({
    ok: true,
    published_count: results.length,
    pricing: results,
  });
}
