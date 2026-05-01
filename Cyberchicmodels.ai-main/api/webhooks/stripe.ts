// api/webhooks/stripe.ts
// Stripe webhook handler — receives events and writes to DB.
//
// Events handled:
// 1. checkout.session.completed       → CREATE subscription or one-time purchase row
// 2. customer.subscription.updated    → UPDATE subscription state, period dates, cancel flags
// 3. customer.subscription.deleted    → MARK subscription as canceled
// 4. invoice.payment_succeeded        → UPDATE current period (renewal succeeded)
// 5. invoice.payment_failed           → MARK subscription as past_due
//
// Signature verification is mandatory — uses STRIPE_WEBHOOK_SECRET to verify
// the raw request body against the Stripe-Signature header. Without this, an
// attacker could POST fake events and create fraudulent subscription rows.
//
// IMPORTANT — RAW BODY: Stripe signature verification requires the raw request
// body, not parsed JSON. Vercel parses JSON by default. We disable parsing via
// `export const config` and read the raw body manually with a buffer.

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  throw new Error("Missing required env vars (SUPABASE_URL, SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia" as any,
});

// Disable Vercel's automatic body parsing so we get the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────

async function readRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function tsToISO(ts: number | null | undefined): string | null {
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

// ─── Main handler ────────────────────────────────────────────────────────

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ─── Verify signature ───────────────────────────────────────────────
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    console.error("Webhook: missing Stripe-Signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  let rawBody: Buffer;
  try {
    rawBody = await readRawBody(req);
  } catch (e: any) {
    console.error("Webhook: failed to read raw body:", e?.message);
    return res.status(400).json({ error: "Failed to read body" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    console.error("Webhook: signature verification failed:", e?.message);
    return res.status(400).json({ error: "Signature verification failed: " + e?.message });
  }

  console.log(`Webhook received: ${event.type} (id: ${event.id})`);

  // ─── Route by event type ────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Webhook: unhandled event type ${event.type} (acknowledging anyway)`);
    }

    return res.status(200).json({ received: true, type: event.type });
  } catch (e: any) {
    console.error(`Webhook: error handling ${event.type}:`, e);
    // Return 500 so Stripe retries. If we return 200, Stripe drops the event forever.
    return res.status(500).json({
      error: "Handler failed: " + (e?.message || String(e)),
      event_type: event.type,
    });
  }
}

// ─── Event handlers ──────────────────────────────────────────────────────

/**
 * checkout.session.completed
 *
 * Fired when client completes checkout (payment + redirect happened).
 * Creates the subscription row (mode: subscription) or one-time purchase row (mode: payment).
 *
 * Idempotency: we look up by stripe_checkout_session_id first. If a row already
 * exists for this session, we skip. Stripe can deliver the same event multiple
 * times — we must handle this safely.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`checkout.session.completed: ${session.id}, mode=${session.mode}`);

  const meta = session.metadata || {};
  const clientId = meta.client_id || session.client_reference_id;
  const packageType = meta.package_type;
  const billingCycle = meta.billing_cycle;
  const clientPricingId = meta.client_pricing_id;

  if (!clientId || !packageType || !billingCycle || !clientPricingId) {
    throw new Error(
      `checkout.session.completed missing required metadata: client_id=${clientId}, ` +
      `package_type=${packageType}, billing_cycle=${billingCycle}, client_pricing_id=${clientPricingId}`
    );
  }

  if (session.mode === "subscription") {
    // ─── Subscription mode ─────────────────────────────────────────
    if (!session.subscription || typeof session.subscription !== "string") {
      throw new Error("Subscription session missing subscription ID");
    }

    // Idempotency check
    const { data: existing } = await supabaseAdmin
      .from("client_subscriptions")
      .select("id")
      .eq("stripe_subscription_id", session.subscription)
      .maybeSingle();

    if (existing) {
      console.log(`Subscription ${session.subscription} already recorded, skipping`);
      return;
    }

    // Fetch full subscription object from Stripe to get accurate period + price
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const item = subscription.items.data[0];
    if (!item) throw new Error("Subscription has no line items");

    const stripePriceId = typeof item.price === "string" ? item.price : item.price.id;
    const amountCents = typeof item.price === "string" ? 0 : (item.price.unit_amount || 0);
    const currency = (typeof item.price === "string" ? "usd" : (item.price.currency || "usd")).toUpperCase();

    const customerId = typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

    const { error } = await supabaseAdmin
      .from("client_subscriptions")
      .insert({
        client_id: clientId,
        client_pricing_id: clientPricingId,
        package_type: packageType,
        billing_cycle: billingCycle,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        stripe_price_id: stripePriceId,
        status: subscription.status, // active, trialing, past_due, etc.
        is_complimentary: false,
        auto_renew: !subscription.cancel_at_period_end,
        current_period_start: tsToISO(subscription.current_period_start)!,
        current_period_end: tsToISO(subscription.current_period_end)!,
        canceled_at: tsToISO(subscription.canceled_at),
        cancel_at_period_end: subscription.cancel_at_period_end,
        amount_cents: amountCents,
        currency: currency,
      });

    if (error) {
      throw new Error(`Failed to insert subscription: ${error.message}`);
    }
    console.log(`Subscription created for client ${clientId}: ${subscription.id}`);
  } else if (session.mode === "payment") {
    // ─── One-time payment mode ─────────────────────────────────────
    // Idempotency check by checkout session ID
    const { data: existing } = await supabaseAdmin
      .from("client_one_time_purchases")
      .select("id")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (existing) {
      console.log(`One-time purchase for session ${session.id} already recorded, skipping`);
      return;
    }

    const paymentIntentId = typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null;

    const amountCents = session.amount_total || 0;
    const currency = (session.currency || "usd").toUpperCase();

    const { error } = await supabaseAdmin
      .from("client_one_time_purchases")
      .insert({
        client_id: clientId,
        client_pricing_id: clientPricingId,
        package_type: packageType,
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: session.id,
        status: session.payment_status === "paid" ? "paid" : (session.payment_status || "pending"),
        is_complimentary: false,
        amount_cents: amountCents,
        currency: currency,
        quantity: 1,
        paid_at: session.payment_status === "paid" ? new Date().toISOString() : null,
      });

    if (error) {
      throw new Error(`Failed to insert one-time purchase: ${error.message}`);
    }
    console.log(`One-time purchase created for client ${clientId}: ${session.id}`);
  } else {
    console.log(`Unknown session mode: ${session.mode}, skipping`);
  }
}

/**
 * customer.subscription.updated
 *
 * Fired when a subscription's state changes — status flip (active → past_due),
 * cancel-at-period-end set, plan change, etc.
 *
 * We update the existing row. If we don't have a row yet (rare race condition
 * where this fires before checkout.session.completed), we log and skip — the
 * checkout handler will create it shortly.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`customer.subscription.updated: ${subscription.id}, status=${subscription.status}`);

  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from("client_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (lookupErr) {
    throw new Error(`Subscription lookup failed: ${lookupErr.message}`);
  }

  if (!existing) {
    console.log(`Subscription ${subscription.id} not yet in DB — likely race with checkout.session.completed, skipping update`);
    return;
  }

  const item = subscription.items.data[0];
  const stripePriceId = item ? (typeof item.price === "string" ? item.price : item.price.id) : null;

  const { error } = await supabaseAdmin
    .from("client_subscriptions")
    .update({
      status: subscription.status,
      auto_renew: !subscription.cancel_at_period_end,
      current_period_start: tsToISO(subscription.current_period_start)!,
      current_period_end: tsToISO(subscription.current_period_end)!,
      canceled_at: tsToISO(subscription.canceled_at),
      cancel_at_period_end: subscription.cancel_at_period_end,
      ...(stripePriceId ? { stripe_price_id: stripePriceId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
  console.log(`Subscription ${subscription.id} updated`);
}

/**
 * customer.subscription.deleted
 *
 * Fired when a subscription is fully canceled (either at period end after
 * cancel_at_period_end, or immediately via API).
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`customer.subscription.deleted: ${subscription.id}`);

  const { error } = await supabaseAdmin
    .from("client_subscriptions")
    .update({
      status: "canceled",
      canceled_at: tsToISO(subscription.canceled_at) || new Date().toISOString(),
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    throw new Error(`Failed to mark subscription canceled: ${error.message}`);
  }
  console.log(`Subscription ${subscription.id} marked canceled`);
}

/**
 * invoice.payment_succeeded
 *
 * Fired when a subscription renewal is paid successfully. We refresh the
 * period dates from the latest subscription state.
 *
 * Note: this also fires for the FIRST invoice when the subscription was
 * created. That's fine — we update the same fields the checkout handler set,
 * which is idempotent.
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log("invoice.payment_succeeded with no subscription ID, skipping (probably one-time invoice)");
    return;
  }

  console.log(`invoice.payment_succeeded for subscription ${subscriptionId}`);

  // Fetch fresh subscription state to get current period
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const { data: existing } = await supabaseAdmin
    .from("client_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();

  if (!existing) {
    console.log(`Subscription ${subscriptionId} not yet in DB, skipping invoice update`);
    return;
  }

  const { error } = await supabaseAdmin
    .from("client_subscriptions")
    .update({
      status: subscription.status,
      current_period_start: tsToISO(subscription.current_period_start)!,
      current_period_end: tsToISO(subscription.current_period_end)!,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    throw new Error(`Failed to update subscription on invoice success: ${error.message}`);
  }
  console.log(`Subscription ${subscriptionId} renewed (period updated)`);
}

/**
 * invoice.payment_failed
 *
 * Fired when a renewal payment fails. Stripe will keep retrying (Smart Retries)
 * for ~3 weeks. We mark the subscription as past_due so the portal can show
 * a banner.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log("invoice.payment_failed with no subscription ID, skipping");
    return;
  }

  console.log(`invoice.payment_failed for subscription ${subscriptionId}`);

  const { error } = await supabaseAdmin
    .from("client_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    throw new Error(`Failed to mark subscription past_due: ${error.message}`);
  }
  console.log(`Subscription ${subscriptionId} marked past_due`);
}
