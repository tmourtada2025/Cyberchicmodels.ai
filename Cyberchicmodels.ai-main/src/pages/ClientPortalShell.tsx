// src/pages/ClientPortalShell.tsx
// Step 7: Real quote page with Stripe Checkout integration.
// - Global Monthly / Annual toggle for subscription packages
// - Select buttons create Stripe Checkout Session and redirect
// - Detects ?status=success / ?status=cancel URL params after Stripe redirect
// - Real package feature descriptions

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const colors = {
  bg: "#0d0d0d",
  surface: "#161616",
  surfaceAlt: "#1e1e1e",
  border: "#2a2a2a",
  borderSoft: "#222",
  accent: "#c9a96e",
  accentSoft: "rgba(201,169,110,0.15)",
  accentDim: "rgba(201,169,110,0.08)",
  text: "#f0ece4",
  textSoft: "#cfcabf",
  muted: "#888",
  mutedDeep: "#555",
  danger: "#ef4444",
  success: "#10b981",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatPrice(cents: number | null | undefined, currency: string): string {
  if (cents == null) return "—";
  const amount = cents / 100;
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  });
  return fmt.format(amount);
}

const PACKAGE_LABELS: Record<string, string> = {
  basic: "Basic",
  standard: "Standard",
  exclusive: "Exclusive",
  campaign: "Campaign",
  single_image: "Single Image",
  single_video: "Single Video",
};

// Real feature lists from Hairvella package definitions
const PACKAGE_DETAILS: Record<string, { tagline: string; features: string[] }> = {
  basic: {
    tagline: "Steady presence on social.",
    features: [
      "10 branded images per month",
      "Your assigned model + your product",
      "Captions ready to publish (EN/ES/PT)",
      "Ideal for consistent brand presence",
    ],
  },
  standard: {
    tagline: "Active content calendar.",
    features: [
      "20 images + 2 videos per month",
      "Mix of feed posts, reels, and stories",
      "Captions ready to publish (EN/ES/PT)",
      "For brands posting multiple times per week",
    ],
  },
  exclusive: {
    tagline: "Full access. Category exclusivity.",
    features: [
      "Unlimited images and videos",
      "Your model does not appear with competing brands in your category",
      "Priority on new collections and features",
      "Direct line to creative direction team",
    ],
  },
  campaign: {
    tagline: "One-time launch package.",
    features: [
      "30 images + 4 videos",
      "Posting schedule and captions delivered",
      "Use across paid ads, organic, and storefront",
      "Ideal for product launches or seasonal campaigns",
    ],
  },
  single_image: {
    tagline: "One image, fully licensed.",
    features: [
      "1 custom image with your product",
      "Your assigned model",
      "Full commercial use",
      "Top-up for an existing campaign",
    ],
  },
  single_video: {
    tagline: "One video, fully licensed.",
    features: [
      "1 × 15-second vertical video",
      "Reels / Stories / TikTok format",
      "Full commercial use",
      "Top-up for an existing campaign",
    ],
  },
};

// ─── Types ────────────────────────────────────────────────────────────────

type SubscriptionPackage = {
  package_type: string;
  currency: string;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  is_offered: boolean;
  is_active: boolean;
  has_stripe_monthly: boolean;
  has_stripe_annual: boolean;
  display_order: number;
};

type OneTimePackage = {
  package_type: string;
  currency: string;
  one_time_price_cents: number | null;
  is_offered: boolean;
  is_active: boolean;
  has_stripe_one_time: boolean;
  display_order: number;
};

type AssignedModel = {
  id: string;
  slug: string;
  name: string;
  thumbnail_path: string | null;
};

type QuoteData = {
  client: {
    slug: string;
    name: string;
    logo_url: string | null;
    hero_image_url: string | null;
    default_language: string;
    default_currency: string;
    is_complimentary: boolean;
    complimentary_activated_at: string | null;
  };
  assigned_model: AssignedModel | null;
  packages: {
    subscriptions: SubscriptionPackage[];
    one_time: OneTimePackage[];
  };
};

type BillingPeriod = "monthly" | "annual";

// ─── Component ────────────────────────────────────────────────────────────

export default function ClientPortalShell() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [checkingOut, setCheckingOut] = useState<string | null>(null); // package_type while checkout is running
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "info" | "error" } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  // ─── Detect ?status=success / ?status=cancel and show banner ─────────
  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      setToast({
        msg: "Payment received. Your subscription is being activated — refresh in a few seconds to see updated status.",
        tone: "success",
      });
      // Clean the URL but keep slug
      const next = new URLSearchParams(searchParams);
      next.delete("status");
      next.delete("session_id");
      setSearchParams(next, { replace: true });
    } else if (status === "cancel") {
      setToast({
        msg: "Checkout cancelled. No charge was made.",
        tone: "info",
      });
      const next = new URLSearchParams(searchParams);
      next.delete("status");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ─── Initial load ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const { data: sessData } = await supabase.auth.getSession();
      if (!sessData.session) {
        navigate(`/portal/${slug}/login`, { replace: true });
        return;
      }

      if (mounted) setUserEmail(sessData.session.user.email || null);

      try {
        const r = await fetch(`/api/portal/quote?slug=${slug}`, {
          headers: { Authorization: `Bearer ${sessData.session.access_token}` },
        });
        const body = await r.json();

        if (!mounted) return;

        if (!r.ok) {
          setError(body?.error || `Failed to load (HTTP ${r.status})`);
          setLoading(false);
          return;
        }

        setQuote(body);
        setLoading(false);
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || "Network error");
          setLoading(false);
        }
      }
    };

    load();
    return () => { mounted = false; };
  }, [slug, navigate]);

  // ─── Auto-clear toast ────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Sign out ────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  // ─── Activate complimentary grant ────────────────────────────────────
  const handleActivateGrant = async () => {
    setActivating(true);
    try {
      const { data: sessData } = await supabase.auth.getSession();
      if (!sessData.session) {
        navigate(`/portal/${slug}/login`, { replace: true });
        return;
      }

      const r = await fetch("/api/portal/activate-grant", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessData.session.access_token}` },
      });
      const body = await r.json();

      if (!r.ok) {
        setToast({ msg: body?.error || "Failed to activate. Please try again.", tone: "error" });
        setActivating(false);
        return;
      }

      setQuote(prev => prev
        ? {
            ...prev,
            client: {
              ...prev.client,
              complimentary_activated_at: body.complimentary_activated_at,
            },
          }
        : prev);

      setToast({
        msg: body.already_activated
          ? "Your complimentary package was already active."
          : "Your complimentary package is now active.",
        tone: "success",
      });
    } catch (e: any) {
      setToast({ msg: "Network error: " + (e?.message || ""), tone: "error" });
    } finally {
      setActivating(false);
    }
  };

  // ─── Stripe Checkout flow ────────────────────────────────────────────
  const handleCheckout = async (packageType: string, cycle: "monthly" | "annual" | "one_time") => {
    setCheckingOut(packageType);
    try {
      const { data: sessData } = await supabase.auth.getSession();
      if (!sessData.session) {
        navigate(`/portal/${slug}/login`, { replace: true });
        return;
      }

      const r = await fetch("/api/portal/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessData.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ package_type: packageType, billing_cycle: cycle }),
      });
      const body = await r.json();

      if (!r.ok) {
        setToast({
          msg: body?.error || "Could not start checkout. Please try again or contact your representative.",
          tone: "error",
        });
        setCheckingOut(null);
        return;
      }

      if (!body.url) {
        setToast({ msg: "Checkout URL was not returned. Contact your representative.", tone: "error" });
        setCheckingOut(null);
        return;
      }

      // Redirect to Stripe-hosted checkout
      window.location.href = body.url;
    } catch (e: any) {
      setToast({ msg: "Network error: " + (e?.message || ""), tone: "error" });
      setCheckingOut(null);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.muted,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16,
        fontFamily: "'Georgia', serif",
      }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.3em",
          color: colors.accent, textTransform: "uppercase",
        }}>
          CyberChicModels
        </div>
        <div style={{ fontSize: 14 }}>Loading your portal…</div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────
  if (error || !quote) {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Georgia', serif", padding: 20,
      }}>
        <div style={{
          maxWidth: 480, padding: 32,
          background: colors.surface, borderRadius: 12,
          border: `1px solid ${colors.border}`, textAlign: "center",
        }}>
          <div style={{
            fontSize: 11, letterSpacing: "0.3em",
            color: colors.accent, textTransform: "uppercase", marginBottom: 16,
          }}>
            CyberChicModels
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 400, marginBottom: 12 }}>
            Unable to load portal
          </h1>
          <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
            {error || "Unknown error"}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: "10px 20px",
              background: "transparent",
              color: colors.accent,
              border: `1px solid ${colors.accent}`,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const { client, assigned_model, packages } = quote;
  const offeredSubs = packages.subscriptions.filter(p => p.is_offered && p.is_active);
  const offeredOneTime = packages.one_time.filter(p => p.is_offered && p.is_active);
  const isComplimentary = client.is_complimentary;
  const grantActivated = !!client.complimentary_activated_at;

  // ─── Main render ─────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bg,
      color: colors.text,
      fontFamily: "'Georgia', serif",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 40px",
        borderBottom: `1px solid ${colors.borderSoft}`,
      }}>
        <div>
          <div style={{
            fontSize: 10, letterSpacing: "0.3em",
            color: colors.accent, textTransform: "uppercase", marginBottom: 6,
          }}>
            CyberChicModels
          </div>
          <div style={{ fontSize: 22, fontWeight: 400 }}>
            {client.name}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {userEmail && (
            <span style={{ fontSize: 12, color: colors.muted }}>{userEmail}</span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              padding: "6px 14px",
              background: "transparent",
              color: colors.accent,
              border: `1px solid ${colors.accent}`,
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontFamily: "inherit",
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "40px 40px 80px",
      }}>
        {/* Welcome */}
        <section style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32, fontWeight: 400, margin: 0, marginBottom: 8,
          }}>
            Welcome, {client.name}
          </h1>
          <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
            Your private portal — packages, pricing, and your assigned model.
          </p>
        </section>

        {/* Assigned Model */}
        {assigned_model && (
          <section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}>
            {assigned_model.thumbnail_path && (
              <div style={{
                width: 80, height: 120,
                background: colors.surfaceAlt,
                borderRadius: 8,
                overflow: "hidden",
                flexShrink: 0,
                border: `1px solid ${colors.borderSoft}`,
              }}>
                <img
                  src={`https://iqoifrsavdreyiixuksd.supabase.co/storage/v1/object/public/${assigned_model.thumbnail_path}`}
                  alt={assigned_model.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            <div>
              <div style={{
                fontSize: 10, letterSpacing: "0.2em",
                color: colors.accent, textTransform: "uppercase", marginBottom: 6,
              }}>
                Your Assigned Model
              </div>
              <div style={{ fontSize: 22, fontWeight: 400, marginBottom: 4 }}>
                {assigned_model.name}
              </div>
              <div style={{ fontSize: 13, color: colors.muted }}>
                Selected to match your brand identity. License to use her likeness across your campaigns is part of every package.
              </div>
            </div>
          </section>
        )}

        {/* Complimentary grant section */}
        {isComplimentary && (
          <section style={{
            background: grantActivated ? colors.accentDim : colors.surface,
            border: `1px solid ${grantActivated ? colors.accent : colors.border}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
          }}>
            <div style={{
              fontSize: 10, letterSpacing: "0.2em",
              color: colors.accent, textTransform: "uppercase", marginBottom: 8,
            }}>
              Complimentary Package
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 400, margin: 0, marginBottom: 12 }}>
              {grantActivated ? "Active" : "Ready to activate"}
            </h2>
            <p style={{ color: colors.textSoft, fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
              You've been granted a complimentary content package as part of our launch partnership.
              Specific allotment (images, videos, product images) and licensing terms have been agreed
              with your representative. Exact counters appear here once content delivery begins.
            </p>
            {!grantActivated ? (
              <button
                type="button"
                onClick={handleActivateGrant}
                disabled={activating}
                style={{
                  padding: "12px 24px",
                  background: colors.accent,
                  color: "#0d0d0d",
                  border: "none",
                  borderRadius: 6,
                  cursor: activating ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  fontFamily: "inherit",
                  opacity: activating ? 0.6 : 1,
                }}
              >
                {activating ? "Activating…" : "Claim your complimentary package"}
              </button>
            ) : (
              <div style={{
                fontSize: 12, color: colors.muted,
                fontStyle: "italic",
              }}>
                Activated {new Date(client.complimentary_activated_at!).toLocaleDateString(undefined, {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </div>
            )}
          </section>
        )}

        {/* Subscription packages — only if NOT complimentary */}
        {!isComplimentary && offeredSubs.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}>
              <h2 style={{
                fontSize: 14, fontWeight: 400,
                letterSpacing: "0.3em", textTransform: "uppercase",
                color: colors.accent, margin: 0,
              }}>
                Subscription Packages
              </h2>

              {/* Monthly / Annual toggle */}
              <div style={{
                display: "inline-flex",
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 999,
                padding: 4,
              }}>
                {(["monthly", "annual"] as const).map(period => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setBillingPeriod(period)}
                    style={{
                      padding: "8px 18px",
                      background: billingPeriod === period ? colors.accent : "transparent",
                      color: billingPeriod === period ? "#0d0d0d" : colors.text,
                      border: "none",
                      borderRadius: 999,
                      cursor: "pointer",
                      fontSize: 12,
                      letterSpacing: "0.05em",
                      fontFamily: "inherit",
                      textTransform: "capitalize",
                      fontWeight: billingPeriod === period ? 600 : 400,
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >
                    {period}
                    {period === "annual" && (
                      <span style={{
                        marginLeft: 6,
                        fontSize: 10,
                        fontWeight: 600,
                        color: billingPeriod === period ? "#0d0d0d" : colors.accent,
                      }}>
                        SAVE 20%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {offeredSubs.map(pkg => {
                const detail = PACKAGE_DETAILS[pkg.package_type] || { tagline: "", features: [] };
                const cents = billingPeriod === "monthly"
                  ? pkg.monthly_price_cents
                  : pkg.annual_price_cents;
                const stripeReady = billingPeriod === "monthly"
                  ? pkg.has_stripe_monthly
                  : pkg.has_stripe_annual;
                const monthlyEquivalent = billingPeriod === "annual" && pkg.annual_price_cents
                  ? Math.round(pkg.annual_price_cents / 12)
                  : null;

                return (
                  <PackageCard
                    key={pkg.package_type}
                    title={PACKAGE_LABELS[pkg.package_type] || pkg.package_type}
                    tagline={detail.tagline}
                    features={detail.features}
                    primaryPrice={formatPrice(cents, pkg.currency)}
                    primaryLabel={billingPeriod === "monthly" ? "per month" : "per year"}
                    secondaryPrice={
                      monthlyEquivalent != null
                        ? formatPrice(monthlyEquivalent, pkg.currency) + "/mo equivalent"
                        : null
                    }
                    isLoading={checkingOut === pkg.package_type}
                    isDisabled={!stripeReady || checkingOut !== null}
                    disabledReason={!stripeReady ? "Pricing pending — contact your rep" : null}
                    onSelect={() => handleCheckout(pkg.package_type, billingPeriod)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* One-time packages — only if NOT complimentary */}
        {!isComplimentary && offeredOneTime.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 14, fontWeight: 400,
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: colors.accent, marginBottom: 16,
            }}>
              One-Time Packages
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {offeredOneTime.map(pkg => {
                const detail = PACKAGE_DETAILS[pkg.package_type] || { tagline: "", features: [] };
                return (
                  <PackageCard
                    key={pkg.package_type}
                    title={PACKAGE_LABELS[pkg.package_type] || pkg.package_type}
                    tagline={detail.tagline}
                    features={detail.features}
                    primaryPrice={formatPrice(pkg.one_time_price_cents, pkg.currency)}
                    primaryLabel="one-time"
                    secondaryPrice={null}
                    isLoading={checkingOut === pkg.package_type}
                    isDisabled={!pkg.has_stripe_one_time || checkingOut !== null}
                    disabledReason={!pkg.has_stripe_one_time ? "Pricing pending — contact your rep" : null}
                    onSelect={() => handleCheckout(pkg.package_type, "one_time")}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state for complimentary clients (no packages section shown) */}
        {/* (intentionally blank — complimentary section handles their case) */}

        {/* Empty state for non-complimentary with nothing offered */}
        {!isComplimentary && offeredSubs.length === 0 && offeredOneTime.length === 0 && (
          <section style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
          }}>
            <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
              Your custom quote is being prepared by your representative.
              You'll receive an email when it's ready.
            </p>
          </section>
        )}

        <footer style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: `1px solid ${colors.borderSoft}`,
          fontSize: 11,
          color: colors.mutedDeep,
          textAlign: "center",
          letterSpacing: "0.05em",
        }}>
          Questions? Contact your CyberChicModels representative.
        </footer>
      </main>

      {/* Toast banner — bottom of viewport */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24, left: "50%",
          transform: "translateX(-50%)",
          background: colors.surface,
          border: `1px solid ${
            toast.tone === "success" ? colors.success
              : toast.tone === "error" ? colors.danger
                : colors.accent
          }`,
          color: colors.text,
          padding: "14px 22px",
          borderRadius: 8,
          fontSize: 13,
          maxWidth: 560,
          zIndex: 1000,
          fontFamily: "inherit",
          lineHeight: 1.5,
          boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────

function PackageCard(props: {
  title: string;
  tagline: string;
  features: string[];
  primaryPrice: string;
  primaryLabel: string;
  secondaryPrice: string | null;
  isLoading: boolean;
  isDisabled: boolean;
  disabledReason: string | null;
  onSelect: () => void;
}) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 12,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <div>
        <h3 style={{
          fontSize: 18, fontWeight: 400,
          margin: 0, marginBottom: 6,
        }}>
          {props.title}
        </h3>
        <p style={{
          fontSize: 12,
          color: colors.muted,
          lineHeight: 1.5,
          margin: 0,
          fontStyle: "italic",
        }}>
          {props.tagline}
        </p>
      </div>

      <ul style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        {props.features.map((feat, i) => (
          <li key={i} style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 12,
            color: colors.textSoft,
            lineHeight: 1.5,
          }}>
            <span style={{
              color: colors.accent,
              flexShrink: 0,
              marginTop: 2,
            }}>·</span>
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: "auto" }}>
        <div style={{
          fontSize: 26, fontWeight: 400,
          color: colors.text, marginBottom: 4,
        }}>
          {props.primaryPrice}
          <span style={{ fontSize: 11, color: colors.muted, marginLeft: 6 }}>
            {props.primaryLabel}
          </span>
        </div>
        {props.secondaryPrice && (
          <div style={{ fontSize: 11, color: colors.mutedDeep, marginBottom: 4 }}>
            {props.secondaryPrice}
          </div>
        )}
        {props.disabledReason && (
          <div style={{ fontSize: 10, color: colors.muted, fontStyle: "italic", marginBottom: 4 }}>
            {props.disabledReason}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={props.onSelect}
        disabled={props.isDisabled}
        style={{
          padding: "10px 16px",
          background: props.isLoading ? colors.accentSoft : "transparent",
          color: colors.accent,
          border: `1px solid ${colors.accent}`,
          borderRadius: 6,
          cursor: props.isDisabled ? "not-allowed" : "pointer",
          fontSize: 12,
          fontFamily: "inherit",
          letterSpacing: "0.05em",
          opacity: props.isDisabled ? 0.4 : 1,
        }}
      >
        {props.isLoading ? "Starting checkout…" : "Select package"}
      </button>
    </div>
  );
}
