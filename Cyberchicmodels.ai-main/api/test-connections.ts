/**
 * Test endpoint — verifies Supabase admin client and Stripe SDK are wired correctly.
 *
 * Hit this once after deploy:
 *   GET https://www.cyberchicmodels.ai/api/test-connections
 *
 * Expected response:
 *   { supabase: { ok: true, clients_table: ... }, stripe: { ok: true, account: ... } }
 *
 * DELETE THIS FILE before going to production. It exposes diagnostic info.
 * It's only here to confirm Step 2 wiring works.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getSupabaseAdmin } from "../src/lib/supabase-server";
import { getStripe } from "../src/lib/stripe";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const result: Record<string, unknown> = {};

  // ── Supabase check ──
  try {
    const supabase = getSupabaseAdmin();
    // Service-role query: count rows in `clients` table.
    // RLS would block this with anon key. If service role works, count succeeds.
    const { count, error } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    result.supabase = {
      ok: true,
      clients_table_row_count: count,
      service_role_active: true,
    };
  } catch (e) {
    result.supabase = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // ── Stripe check ──
  try {
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve();
    result.stripe = {
      ok: true,
      account_id: account.id,
      account_country: account.country,
      account_default_currency: account.default_currency,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
    };
  } catch (e) {
    result.stripe = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // ── Env vars sanity check (never log values, only presence) ──
  result.env = {
    VITE_SUPABASE_URL_set: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY_set: !!process.env.STRIPE_SECRET_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY_set: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    APP_URL_set: !!process.env.APP_URL,
  };

  res.status(200).json(result);
}
