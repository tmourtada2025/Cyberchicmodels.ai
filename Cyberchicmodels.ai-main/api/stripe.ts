/**
 * Stripe SDK initialization — server-side only.
 * Never import from client code.
 */

import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

let cached = null;

export function getStripe() {
  if (cached) return cached;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in Vercel env vars");
  }
  cached = new Stripe(secretKey, {
    apiVersion: "2024-11-20.acacia",
    appInfo: {
      name: "CyberChicModels",
      version: "1.0.0",
    },
  });
  return cached;
}
