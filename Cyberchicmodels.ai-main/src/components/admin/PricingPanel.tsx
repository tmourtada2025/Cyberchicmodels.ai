// src/components/admin/PricingPanel.tsx
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

// ─── Style helpers (duplicated from Admin.tsx; refactor target) ──────────────
const colors = {
  bg: "#0d0d0d", surface: "#161616", border: "#2a2a2a",
  accent: "#c9a96e", accentDim: "rgba(201,169,110,0.15)",
  text: "#f0ece4", muted: "#888", danger: "#ef4444", success: "#4ade80",
  warning: "#facc15",
};

function btnStyle(variant: "primary" | "secondary" | "danger" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 6, cursor: "pointer",
    fontSize: 13, fontFamily: "inherit", fontWeight: 500,
    transition: "all 0.15s", border: "1px solid transparent", whiteSpace: "nowrap",
  };
  if (variant === "primary") return { ...base, background: colors.accent, color: "#0d0d0d", borderColor: colors.accent };
  if (variant === "secondary") return { ...base, background: "transparent", color: colors.accent, borderColor: colors.accent };
  if (variant === "danger") return { ...base, background: "transparent", color: colors.danger, borderColor: colors.danger };
  return { ...base, background: "transparent", color: colors.muted, borderColor: "transparent" };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%", padding: "8px 12px", borderRadius: 6,
    background: "#1e1e1e", border: `1px solid ${colors.border}`,
    color: colors.text, fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };
}

// ─── Package metadata ─────────────────────────────────────────────────────────
type PackageKind = "subscription" | "one_time";
interface PackageMeta {
  type: string;
  kind: PackageKind;
  name: string;
  description: string;
}

const PACKAGES: PackageMeta[] = [
  { type: "basic",        kind: "subscription", name: "Basic",        description: "Entry-level licensing — monthly or annual" },
  { type: "standard",     kind: "subscription", name: "Standard",     description: "Mid-tier licensing — monthly or annual" },
  { type: "exclusive",    kind: "subscription", name: "Exclusive",    description: "Top-tier exclusive licensing — monthly or annual" },
  { type: "campaign",     kind: "one_time",     name: "Campaign",     description: "Single campaign deliverable" },
  { type: "single_image", kind: "one_time",     name: "Single Image", description: "One-off image purchase" },
  { type: "single_video", kind: "one_time",     name: "Single Video", description: "One-off video purchase" },
];

interface PricingRow {
  id?: string;
  client_id: string;
  package_type: string;
  currency: string;
  monthly_price_cents: number | null;
  annual_price_cents: number | null;
  one_time_price_cents: number | null;
  stripe_product_id: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  stripe_price_id_one_time: string | null;
  is_complimentary: boolean;
  is_active: boolean;
  is_offered: boolean;
  display_order: number;
  published_to_stripe_at: string | null;
  updated_at?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function centsToDisplay(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2);
}

function displayToCents(display: string): number | null {
  if (!display.trim()) return null;
  const n = parseFloat(display);
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

type Status = "draft" | "published" | "modified";

function rowStatus(r: PricingRow): Status {
  if (!r.published_to_stripe_at) return "draft";
  if (!r.updated_at) return "published";
  // Compare timestamps; if updated_at > published_to_stripe_at + 1s, consider modified
  const publishedTs = new Date(r.published_to_stripe_at).getTime();
  const updatedTs = new Date(r.updated_at).getTime();
  return updatedTs > publishedTs + 1000 ? "modified" : "published";
}

function StatusPill({ status }: { status: Status }) {
  const config = {
    draft:     { bg: "rgba(136,136,136,0.15)", color: colors.muted,   label: "Draft" },
    published: { bg: "rgba(74,222,128,0.15)",  color: colors.success, label: "Published" },
    modified:  { bg: "rgba(250,204,21,0.15)",  color: colors.warning, label: "Modified" },
  }[status];
  return (
    <span style={{
      fontSize: 10, padding: "2px 8px", borderRadius: 4,
      background: config.bg, color: config.color,
      fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {config.label}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  clientId: string;
  clientName: string;
}

export function PricingPanel({ clientId, clientName }: Props) {
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isComplimentary, setIsComplimentary] = useState(false);
  const [rows, setRows] = useState<PricingRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      const r = await fetch(`/api/admin/clients/${clientId}/pricing`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        setError(errBody.error || `HTTP ${r.status}`);
        setLoading(false);
        return;
      }
      const body = await r.json();
      setIsComplimentary(!!body.client?.is_complimentary);

      const fetched: PricingRow[] = body.pricing || [];
      // Order rows by display_order using PACKAGES sequence
      const byType = new Map(fetched.map(p => [p.package_type, p]));
      const ordered = PACKAGES.map(p => byType.get(p.type)).filter((x): x is PricingRow => !!x);
      setRows(ordered);
    } catch (e: any) {
      setError(e.message || "Load failed");
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const updateRow = (packageType: string, patch: Partial<PricingRow>) => {
    setRows(prev => prev.map(r => r.package_type === packageType ? { ...r, ...patch } : r));
  };

  const updatePrice = (packageType: string, field: "monthly" | "annual" | "one_time", display: string) => {
    const cents = displayToCents(display);
    if (field === "monthly") updateRow(packageType, { monthly_price_cents: cents });
    else if (field === "annual") updateRow(packageType, { annual_price_cents: cents });
    else if (field === "one_time") updateRow(packageType, { one_time_price_cents: cents });
  };

  // ─── Save Draft (DB only) ────────────────────────────────────────────────
  const saveDraft = async () => {
    setSavingDraft(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not authenticated");
        setSavingDraft(false);
        return;
      }

      const payload = rows.map(r => ({
        package_type: r.package_type,
        currency: r.currency || "USD",
        monthly_price_cents: r.monthly_price_cents,
        annual_price_cents: r.annual_price_cents,
        one_time_price_cents: r.one_time_price_cents,
        is_offered: r.is_offered,
      }));

      const r = await fetch(`/api/admin/clients/${clientId}/pricing`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pricing: payload }),
      });

      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        setError(errBody.error || `HTTP ${r.status}`);
        setSavingDraft(false);
        return;
      }

      const body = await r.json();
      // Re-sort returned rows
      const byType = new Map((body.pricing || []).map((p: PricingRow) => [p.package_type, p]));
      const ordered = PACKAGES.map(p => byType.get(p.type)).filter((x): x is PricingRow => !!x);
      setRows(ordered);
      setSuccess("Draft saved.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e.message || "Save failed");
    }
    setSavingDraft(false);
  };

  // ─── Publish to Stripe ───────────────────────────────────────────────────
  const publish = async () => {
    if (!confirm(
      "Publish offered packages to Stripe?\n\n" +
      "This creates Stripe Products and Prices. Note: Stripe Prices are immutable, " +
      "so re-publishing after a price change creates new Price objects."
    )) return;

    setPublishing(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Not authenticated");
        setPublishing(false);
        return;
      }

      const r = await fetch(`/api/admin/clients/${clientId}/pricing-publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!r.ok) {
        const errBody = await r.json().catch(() => ({}));
        setError(errBody.error || `HTTP ${r.status}`);
        setPublishing(false);
        return;
      }

      const body = await r.json();
      // Re-load to get fresh state including Stripe IDs
      await load();
      setSuccess(`Published ${body.published_count} package(s) to Stripe.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: any) {
      setError(e.message || "Publish failed");
    }
    setPublishing(false);
  };

  if (loading) {
    return <div style={{ color: colors.muted, padding: 20, fontSize: 13 }}>Loading pricing…</div>;
  }

  const subscriptionRows = rows.filter(r => PACKAGES.find(p => p.type === r.package_type)?.kind === "subscription");
  const oneTimeRows = rows.filter(r => PACKAGES.find(p => p.type === r.package_type)?.kind === "one_time");

  const renderPackageCard = (r: PricingRow) => {
    const def = PACKAGES.find(p => p.type === r.package_type)!;
    const status = rowStatus(r);
    const dimmed = !r.is_offered;

    return (
      <div key={r.package_type} style={{
        padding: 16,
        background: colors.surface,
        borderRadius: 10,
        border: `1px solid ${dimmed ? colors.border : (status === "modified" ? colors.warning : colors.border)}`,
        opacity: dimmed ? 0.5 : 1,
        transition: "opacity 0.2s",
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            {/* Offered toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
              <div onClick={() => updateRow(r.package_type, { is_offered: !r.is_offered })} style={{
                width: 36, height: 20, borderRadius: 10, position: "relative",
                background: r.is_offered ? colors.accent : colors.border,
                transition: "background 0.2s",
              }}>
                <div style={{
                  position: "absolute", top: 2, left: r.is_offered ? 18 : 2,
                  width: 16, height: 16, borderRadius: "50%",
                  background: r.is_offered ? "#0d0d0d" : colors.muted,
                  transition: "left 0.2s",
                }} />
              </div>
            </label>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{def.name}</div>
              <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{def.description}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!isComplimentary && <StatusPill status={status} />}
            {r.stripe_product_id && (
              <span style={{
                fontSize: 9, padding: "2px 6px",
                background: colors.accentDim, color: colors.accent,
                borderRadius: 4, fontFamily: "monospace",
              }}>
                {r.stripe_product_id.slice(0, 14)}…
              </span>
            )}
          </div>
        </div>

        {/* Price inputs */}
        {def.kind === "subscription" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>
                Monthly (USD)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: colors.muted, fontSize: 13 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={centsToDisplay(r.monthly_price_cents)}
                  onChange={e => updatePrice(r.package_type, "monthly", e.target.value)}
                  disabled={!r.is_offered}
                  style={inputStyle()}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>
                Annual (USD)
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: colors.muted, fontSize: 13 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={centsToDisplay(r.annual_price_cents)}
                  onChange={e => updatePrice(r.package_type, "annual", e.target.value)}
                  disabled={!r.is_offered}
                  style={inputStyle()}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 240 }}>
            <label style={{ fontSize: 11, color: colors.muted, display: "block", marginBottom: 4 }}>
              Price (USD)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: colors.muted, fontSize: 13 }}>$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={centsToDisplay(r.one_time_price_cents)}
                onChange={e => updatePrice(r.package_type, "one_time", e.target.value)}
                disabled={!r.is_offered}
                style={inputStyle()}
                placeholder="0.00"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Complimentary banner */}
      {isComplimentary && (
        <div style={{
          padding: "12px 16px",
          background: colors.accentDim,
          border: `1px solid ${colors.accent}`,
          borderRadius: 8,
          fontSize: 13,
          color: colors.accent,
        }}>
          <strong>Complimentary client.</strong> Prices are stored for reference but Stripe will not be used.
          Publishing is disabled.
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(239,68,68,0.1)",
          border: `1px solid ${colors.danger}`,
          borderRadius: 8, color: colors.danger, fontSize: 13,
        }}>
          ✗ {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{
          padding: "10px 14px",
          background: "rgba(74,222,128,0.1)",
          border: `1px solid ${colors.success}`,
          borderRadius: 8, color: colors.success, fontSize: 13,
        }}>
          ✓ {success}
        </div>
      )}

      {/* Subscription packages */}
      <div>
        <div style={{
          fontSize: 11, color: colors.muted,
          textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: 10, fontWeight: 600,
        }}>
          Subscription Packages
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {subscriptionRows.map(renderPackageCard)}
        </div>
      </div>

      {/* One-time packages */}
      <div>
        <div style={{
          fontSize: 11, color: colors.muted,
          textTransform: "uppercase", letterSpacing: "0.08em",
          marginBottom: 10, fontWeight: 600,
        }}>
          One-Time Packages
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {oneTimeRows.map(renderPackageCard)}
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 10,
        paddingTop: 16, marginTop: 8,
        borderTop: `1px solid ${colors.border}`,
      }}>
        <button
          type="button"
          onClick={saveDraft}
          disabled={savingDraft || publishing}
          style={btnStyle("secondary")}
        >
          {savingDraft ? "Saving…" : "Save Draft"}
        </button>
        {!isComplimentary && (
          <button
            type="button"
            onClick={publish}
            disabled={savingDraft || publishing}
            style={btnStyle("primary")}
          >
            {publishing ? "Publishing…" : "Publish to Stripe"}
          </button>
        )}
      </div>
    </div>
  );
}
