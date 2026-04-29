// src/pages/ClientPortalShell.tsx
// Step 6: Real quote page (replaces the "your portal is being prepared" stub).
// Shows client info, assigned model, complimentary grant state, and pricing packages.
// Select buttons are placeholders — Step 7 will wire them to Stripe Checkout.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const PACKAGE_DESCRIPTIONS: Record<string, string> = {
  basic: "Entry tier — limited library access for emerging brands.",
  standard: "Mid-tier — broader content rights, faster turnaround.",
  exclusive: "Full access — exclusivity windows, priority support.",
  campaign: "One-time campaign shoot — fully licensed, custom direction.",
  single_image: "Per-image purchase — extend an existing campaign.",
  single_video: "Per-video purchase — short-form content, fully licensed.",
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

// ─── Component ────────────────────────────────────────────────────────────

export default function ClientPortalShell() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Session check + initial load
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

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

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
        setToast(body?.error || "Failed to activate. Please try again.");
        setActivating(false);
        return;
      }

      // Refresh quote
      setQuote(prev => prev
        ? {
            ...prev,
            client: {
              ...prev.client,
              complimentary_activated_at: body.complimentary_activated_at,
            },
          }
        : prev);

      setToast(body.already_activated
        ? "Your complimentary package was already active."
        : "Your complimentary package is now active.");
    } catch (e: any) {
      setToast("Network error: " + (e?.message || ""));
    } finally {
      setActivating(false);
    }
  };

  const handleSelectPackage = (label: string) => {
    setToast(`${label} — checkout coming soon. Your representative will be in touch.`);
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
        {/* Welcome / intro */}
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

        {/* Subscription packages */}
        {offeredSubs.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{
              fontSize: 14, fontWeight: 400,
              letterSpacing: "0.3em", textTransform: "uppercase",
              color: colors.accent, marginBottom: 16,
            }}>
              Subscription Packages
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}>
              {offeredSubs.map(pkg => (
                <PackageCard
                  key={pkg.package_type}
                  title={PACKAGE_LABELS[pkg.package_type] || pkg.package_type}
                  description={PACKAGE_DESCRIPTIONS[pkg.package_type] || ""}
                  primaryPrice={formatPrice(pkg.monthly_price_cents, pkg.currency)}
                  primaryLabel="per month"
                  secondaryPrice={
                    pkg.annual_price_cents != null
                      ? formatPrice(pkg.annual_price_cents, pkg.currency) + " billed annually"
                      : null
                  }
                  onSelect={() => handleSelectPackage(PACKAGE_LABELS[pkg.package_type])}
                />
              ))}
            </div>
          </section>
        )}

        {/* One-time packages */}
        {offeredOneTime.length > 0 && (
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
              {offeredOneTime.map(pkg => (
                <PackageCard
                  key={pkg.package_type}
                  title={PACKAGE_LABELS[pkg.package_type] || pkg.package_type}
                  description={PACKAGE_DESCRIPTIONS[pkg.package_type] || ""}
                  primaryPrice={formatPrice(pkg.one_time_price_cents, pkg.currency)}
                  primaryLabel="one-time"
                  secondaryPrice={null}
                  onSelect={() => handleSelectPackage(PACKAGE_LABELS[pkg.package_type])}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {offeredSubs.length === 0 && offeredOneTime.length === 0 && !isComplimentary && (
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

        {/* Footer */}
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

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24, left: "50%",
          transform: "translateX(-50%)",
          background: colors.surface,
          border: `1px solid ${colors.accent}`,
          color: colors.text,
          padding: "12px 20px",
          borderRadius: 8,
          fontSize: 13,
          maxWidth: 480,
          zIndex: 1000,
          fontFamily: "inherit",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Package Card ─────────────────────────────────────────────────────────

function PackageCard(props: {
  title: string;
  description: string;
  primaryPrice: string;
  primaryLabel: string;
  secondaryPrice: string | null;
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
        }}>
          {props.description}
        </p>
      </div>
      <div>
        <div style={{
          fontSize: 28, fontWeight: 400,
          color: colors.text, marginBottom: 4,
        }}>
          {props.primaryPrice}
          <span style={{ fontSize: 12, color: colors.muted, marginLeft: 6 }}>
            {props.primaryLabel}
          </span>
        </div>
        {props.secondaryPrice && (
          <div style={{ fontSize: 11, color: colors.mutedDeep }}>
            {props.secondaryPrice}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={props.onSelect}
        style={{
          padding: "10px 16px",
          background: "transparent",
          color: colors.accent,
          border: `1px solid ${colors.accent}`,
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "inherit",
          letterSpacing: "0.05em",
          marginTop: "auto",
        }}
      >
        Select package
      </button>
    </div>
  );
}
