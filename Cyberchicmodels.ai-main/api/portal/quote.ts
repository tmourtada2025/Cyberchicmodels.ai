// api/portal/quote.ts
// GET: returns the data needed for the client quote page.
// Auth-gated: only the logged-in client can fetch their own data.
//
// STEP 9 LITE UPDATE:
// Now includes `deliveries` array with scheduled posts, captions, hashtags,
// and signed download URLs for any uploaded files.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Signed URLs expire after 1 hour — long enough to browse, short enough that
// a leaked URL has limited utility.
const SIGNED_URL_EXPIRY_SECONDS = 3600;

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
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

  // ─── Resolve client from auth user ─────────────────────────────────────
  const { data: clientUserRow, error: cuErr } = await supabaseAdmin
    .from("client_users")
    .select("client_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (cuErr || !clientUserRow) {
    return res.status(403).json({ error: "Account not linked to a client portal" });
  }

  const clientId = clientUserRow.client_id;

  const requestedSlug = (req.query.slug as string | undefined)?.toLowerCase();

  // ─── Fetch client ──────────────────────────────────────────────────────
  const { data: client, error: cErr } = await supabaseAdmin
    .from("clients")
    .select(`
      id, slug, name, logo_url, hero_image_url,
      default_language, default_currency,
      is_active, is_complimentary, complimentary_activated_at,
      assigned_model_id
    `)
    .eq("id", clientId)
    .maybeSingle();

  if (cErr || !client) {
    return res.status(404).json({ error: "Client not found" });
  }

  if (requestedSlug && requestedSlug !== client.slug) {
    return res.status(403).json({ error: "Slug mismatch" });
  }

  if (!client.is_active) {
    return res.status(403).json({ error: "Client account inactive" });
  }

  // ─── Fetch assigned model (if any) ─────────────────────────────────────
  let assignedModel: any = null;
  if (client.assigned_model_id) {
    const { data: modelRow } = await supabaseAdmin
      .from("models")
      .select("id, slug, name, thumbnail_path")
      .eq("id", client.assigned_model_id)
      .maybeSingle();
    if (modelRow) {
      assignedModel = modelRow;
    }
  }

  // ─── Fetch pricing rows ────────────────────────────────────────────────
  const { data: pricingRows, error: pErr } = await supabaseAdmin
    .from("client_pricing")
    .select(`
      package_type, currency,
      monthly_price_cents, annual_price_cents, one_time_price_cents,
      is_offered, is_active, is_complimentary,
      stripe_price_id_monthly, stripe_price_id_annual, stripe_price_id_one_time,
      display_order
    `)
    .eq("client_id", clientId)
    .order("display_order", { ascending: true });

  if (pErr) {
    return res.status(500).json({ error: "Failed to load pricing" });
  }

  const SUBSCRIPTION_TYPES = ["basic", "standard", "exclusive"];
  const ONE_TIME_TYPES = ["campaign", "single_image", "single_video"];

  const subscriptionPackages = (pricingRows || [])
    .filter(p => SUBSCRIPTION_TYPES.includes(p.package_type))
    .map(p => ({
      package_type: p.package_type,
      currency: p.currency,
      monthly_price_cents: p.monthly_price_cents,
      annual_price_cents: p.annual_price_cents,
      is_offered: p.is_offered,
      is_active: p.is_active,
      has_stripe_monthly: !!p.stripe_price_id_monthly,
      has_stripe_annual: !!p.stripe_price_id_annual,
      display_order: p.display_order,
    }));

  const oneTimePackages = (pricingRows || [])
    .filter(p => ONE_TIME_TYPES.includes(p.package_type))
    .map(p => ({
      package_type: p.package_type,
      currency: p.currency,
      one_time_price_cents: p.one_time_price_cents,
      is_offered: p.is_offered,
      is_active: p.is_active,
      has_stripe_one_time: !!p.stripe_price_id_one_time,
      display_order: p.display_order,
    }));

  // ─── STEP 9 LITE: Fetch deliveries ─────────────────────────────────────
  // Returns all deliveries (pending + delivered) so the client sees the
  // full posting calendar, with download links activated only on delivered ones.
  const { data: deliveryRows, error: dErr } = await supabaseAdmin
    .from("client_deliveries")
    .select(`
      id, filename, content_type, storage_path, storage_bucket,
      scheduled_post_date, scheduled_post_time, scheduled_post_label,
      caption_es, caption_pt, caption_en, hashtags, required_tags,
      status, delivered_at, is_complimentary, package_reference,
      display_order, notes
    `)
    .eq("client_id", clientId)
    .neq("status", "archived")
    .order("display_order", { ascending: true });

  if (dErr) {
    console.error("Failed to load deliveries:", dErr);
    // Don't fail the whole request — just return empty deliveries
  }

  // Generate signed URLs for delivered files. We do this in parallel.
  const deliveries = await Promise.all(
    (deliveryRows || []).map(async (d) => {
      let downloadUrl: string | null = null;

      if (d.status === "delivered" && d.storage_path && d.storage_bucket) {
        try {
          const { data: signed, error: sErr } = await supabaseAdmin
            .storage
            .from(d.storage_bucket)
            .createSignedUrl(d.storage_path, SIGNED_URL_EXPIRY_SECONDS);

          if (!sErr && signed) {
            downloadUrl = signed.signedUrl;
          }
        } catch (e) {
          // Don't fail the whole row — just leave downloadUrl null
          console.error(`Failed to sign URL for ${d.filename}:`, e);
        }
      }

      return {
        id: d.id,
        filename: d.filename,
        content_type: d.content_type,
        scheduled_post_date: d.scheduled_post_date,
        scheduled_post_time: d.scheduled_post_time,
        scheduled_post_label: d.scheduled_post_label,
        caption_es: d.caption_es,
        caption_pt: d.caption_pt,
        caption_en: d.caption_en,
        hashtags: d.hashtags,
        required_tags: d.required_tags,
        status: d.status,
        delivered_at: d.delivered_at,
        is_complimentary: d.is_complimentary,
        package_reference: d.package_reference,
        display_order: d.display_order,
        notes: d.notes,
        download_url: downloadUrl,
      };
    })
  );

  // Summary counters for the deliveries section
  const deliverySummary = {
    total: deliveries.length,
    delivered: deliveries.filter(d => d.status === "delivered").length,
    pending: deliveries.filter(d => d.status === "pending").length,
    in_production: deliveries.filter(d => d.status === "in_production").length,
  };

  // ─── Response ──────────────────────────────────────────────────────────
  return res.status(200).json({
    client: {
      slug: client.slug,
      name: client.name,
      logo_url: client.logo_url,
      hero_image_url: client.hero_image_url,
      default_language: client.default_language,
      default_currency: client.default_currency,
      is_complimentary: client.is_complimentary,
      complimentary_activated_at: client.complimentary_activated_at,
    },
    assigned_model: assignedModel,
    packages: {
      subscriptions: subscriptionPackages,
      one_time: oneTimePackages,
    },
    deliveries,
    delivery_summary: deliverySummary,
  });
}
