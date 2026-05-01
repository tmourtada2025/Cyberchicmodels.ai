// api/portal/checkout.ts
// POST: creates a Stripe Checkout Session for the logged-in client.
// Body: { package_type: string, billing_cycle: "monthly" | "annual" | "one_time" }
// Returns: { url: string } — Stripe-hosted checkout URL.
//
// Step 7 only creates the session. Step 8 webhook writes to client_subscriptions
// and client_one_time_purchases when Stripe confirms payment.

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SITE_URL = process.env.VITE_SITE_URL || process.env.SITE_URL || "https://www.cyberchicmodels.ai";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia" as any,
});

const SUBSCRIPTION_TYPES = ["basic", "standard", "exclusive"];
const ONE_TIME_TYPES = ["campaign", "single_image", "single_video"];

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

  // ─── Validate body ─────────────────────────────────────────────────────
  const { package_type, billing_cycle } = req.body || {};

  if (!package_type || typeof package_type !== "string") {
    return res.status(400).json({ error: "Missing package_type" });
  }

  if (!billing_cycle || !["monthly", "annual", "one_time"].includes(billing_cycle)) {
    return res.status(400).json({ error: "Invalid billing_cycle. Must be monthly, annual, or one_time." });
  }

  // Validate package type fits the billing cycle
  const isSubscription = SUBSCRIPTION_TYPES.includes(package_type);
  const isOneTime = ONE_TIME_TYPES.includes(package_type);

  if (!isSubscription && !isOneTime) {
    return res.status(400).json({ error: "Unknown package_type" });
  }

  if (isSubscription && billing_cycle === "one_time") {
    return res.status(400).json({ error: "Subscription packages require monthly or annual billing" });
  }

  if (isOneTime && billing_cycle !== "one_time") {
    return res.status(400).json({ error: "One-time packages require one_time billing" });
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
    .select("id, slug, name, contact_email, is_active, is_complimentary, default_currency")
    .eq("id", clientUserRow.client_id)
    .maybeSingle();

  if (cErr || !client) {
    return res.status(404).json({ error: "Client not found" });
  }

  if (!client.is_active) {
    return res.status(403).json({ error: "Client account is inactive" });
  }

  if (client.is_complimentary) {
    return res.status(400).json({
      error: "Complimentary clients cannot purchase packages. Contact your representative.",
    });
  }

  // ─── Look up pricing row ───────────────────────────────────────────────
  const { data: pricing, error: pErr } = await supabaseAdmin
    .from("client_pricing")
    .select(`
      id, currency, is_offered, is_active,
      stripe_price_id_monthly, stripe_price_id_annual, stripe_price_id_one_time,
      monthly_price_cents, annual_price_cents, one_time_price_cents
    `)
    .eq("client_id", client.id)
    .eq("package_type", package_type)
    .maybeSingle();

  if (pErr) {
    return res.status(500).json({ error: "Pricing lookup failed: " + pErr.message });
  }

  if (!pricing) {
    return res.status(404).json({ error: "Pricing not configured for this package" });
  }

  if (!pricing.is_offered || !pricing.is_active) {
    return res.status(400).json({ error: "This package is not currently available" });
  }

  // ─── Pick the right Stripe price ID ────────────────────────────────────
  let stripePriceId: string | null = null;
  if (billing_cycle === "monthly") stripePriceId = pricing.stripe_price_id_monthly;
  else if (billing_cycle === "annual") stripePriceId = pricing.stripe_price_id_annual;
  else if (billing_cycle === "one_time") stripePriceId = pricing.stripe_price_id_one_time;

  if (!stripePriceId) {
    return res.status(400).json({
      error: "Pricing has not been published to Stripe yet. Please contact your representative.",
    });
  }

  // ─── Create Stripe Checkout Session ────────────────────────────────────
  const stripeMode = isSubscription ? "subscription" : "payment";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: stripeMode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      customer_email: client.contact_email,
      client_reference_id: client.id, // links back to our client row in webhook
      metadata: {
        client_id: client.id,
        client_slug: client.slug,
        package_type,
        billing_cycle,
        client_pricing_id: pricing.id,
      },
      // Subscription-mode session subscription metadata also gets these
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: {
                client_id: client.id,
                client_slug: client.slug,
                package_type,
                billing_cycle,
                client_pricing_id: pricing.id,
              },
            },
          }
        : {}),
      success_url: `${SITE_URL}/portal/${client.slug}?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/portal/${client.slug}?status=cancel`,
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe did not return a checkout URL" });
    }

    return res.status(200).json({
      url: session.url,
      session_id: session.id,
    });
  } catch (e: any) {
    console.error("Stripe checkout creation failed:", e);
    return res.status(500).json({
      error: "Failed to create checkout session: " + (e?.message || String(e)),
    });
  }
}
