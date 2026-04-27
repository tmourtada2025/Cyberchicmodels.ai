/**
 * Stripe SDK — server-side only.
 *
 * NEVER import this from client-side code. The secret key would leak.
 * For client-side Stripe (loading Stripe.js), use VITE_STRIPE_PUBLISHABLE_KEY directly.
 *
 * API version is pinned. When upgrading, test thoroughly — Stripe API changes can break webhooks.
 */

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Add it to Vercel environment variables (server-side only).",
  );
}

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  cached = new Stripe(secretKey!, {
    // Pin to a specific Stripe API version. Update deliberately, not automatically.
    // Latest stable as of this write: 2024-11-20.acacia
    apiVersion: "2024-11-20.acacia",
    typescript: true,
    appInfo: {
      name: "CyberChicModels",
      version: "1.0.0",
    },
  });
  return cached;
}
