/**
 * Test endpoint - verifies Supabase admin and Stripe SDK are wired.
 * Self-contained: no imports from src/lib to avoid ESM resolution issues.
 */

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const result = {};

  // Supabase check
  try {
    if (!process.env.VITE_SUPABASE_URL) {
      throw new Error("VITE_SUPABASE_URL not set");
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
    }
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
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

  // Stripe check
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not set");
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
    });
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

  // Env vars sanity check
  result.env = {
    VITE_SUPABASE_URL_set: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY_set: !!process.env.STRIPE_SECRET_KEY,
    VITE_STRIPE_PUBLISHABLE_KEY_set: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    APP_URL_set: !!process.env.APP_URL,
  };

  res.status(200).json(result);
}
