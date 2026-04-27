// src/pages/ClientPortalShell.tsx
// Stub for /portal/:slug — Step 6 will fill the actual quote page UI.
// This shell handles:
//   1. Auth gate: must be logged in
//   2. Authorization gate: logged-in user must belong to THIS client (slug match)
//   3. If wrong client, redirect to their actual portal
//   4. Sign-out button (basic for now)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const colors = {
  bg: "#0d0d0d", surface: "#161616", border: "#2a2a2a",
  accent: "#c9a96e", accentDim: "rgba(201,169,110,0.15)",
  text: "#f0ece4", muted: "#888",
};

interface WhoamiResult {
  role: "admin" | "client" | "client_inactive" | "orphan" | "none";
  email?: string;
  client_slug?: string;
  client_name?: string;
  client_role?: "owner" | "member" | "viewer";
}

export default function ClientPortalShell() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [whoami, setWhoami] = useState<WhoamiResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!sessionData.session) {
        // Not logged in — redirect to slug-specific login
        navigate(`/portal/${slug}/login`, { replace: true });
        return;
      }

      try {
        const r = await fetch("/api/auth/whoami", {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });
        if (!r.ok) {
          if (mounted) {
            setError("Failed to verify account.");
            setLoading(false);
          }
          return;
        }
        const body: WhoamiResult = await r.json();

        if (!mounted) return;

        if (body.role === "admin") {
          // Admin trying to view a client portal directly. Bounce to admin.
          navigate("/admin", { replace: true });
          return;
        }

        if (body.role === "client") {
          if (body.client_slug !== slug) {
            // Logged in as a different client — redirect to their own portal
            navigate(`/portal/${body.client_slug}`, { replace: true });
            return;
          }
          setWhoami(body);
          setLoading(false);
          return;
        }

        // Any other role: not allowed here
        navigate(`/portal/${slug}/login`, { replace: true });
      } catch (e: any) {
        if (mounted) {
          setError(e.message || "Network error.");
          setLoading(false);
        }
      }
    };

    verify();

    return () => { mounted = false; };
  }, [slug, navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate(`/portal/${slug}/login`, { replace: true });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.muted,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Georgia', serif",
      }}>
        Loading portal…
      </div>
    );
  }

  if (error || !whoami) {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Georgia', serif",
        padding: 20,
      }}>
        <div style={{
          maxWidth: 420, padding: 40,
          background: colors.surface, borderRadius: 12,
          border: `1px solid ${colors.border}`, textAlign: "center",
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 400, marginBottom: 12 }}>Error</h1>
          <p style={{ color: colors.muted, fontSize: 13, marginBottom: 20 }}>
            {error || "Unknown error"}
          </p>
          <button onClick={signOut} style={{
            padding: "10px 20px",
            background: "transparent",
            color: colors.accent,
            border: `1px solid ${colors.accent}`,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13, fontFamily: "inherit",
          }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // ─── Authorized: show portal stub (Step 6 fills this in) ──────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: colors.bg,
      color: colors.text,
      fontFamily: "'Georgia', serif",
    }}>
      {/* Top bar */}
      <div style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${colors.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: colors.surface,
      }}>
        <div>
          <div style={{
            fontSize: 10, letterSpacing: "0.3em",
            color: colors.accent, textTransform: "uppercase",
          }}>
            CyberChicModels
          </div>
          <div style={{ fontSize: 16, color: colors.text, marginTop: 2 }}>
            {whoami.client_name}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 12, color: colors.muted }}>{whoami.email}</span>
          <button onClick={signOut} style={{
            padding: "6px 14px",
            background: "transparent",
            color: colors.muted,
            border: `1px solid ${colors.border}`,
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12, fontFamily: "inherit",
          }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Stub content */}
      <div style={{ padding: "60px 24px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          padding: 40,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
          <h1 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8 }}>
            Welcome, {whoami.client_name}
          </h1>
          <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
            Your private portal is being prepared. Your quote page, packages,
            and assigned model will appear here in the next phase.
          </p>
          <p style={{ color: colors.muted, fontSize: 12, marginTop: 16, fontStyle: "italic" }}>
            Phase 1 Step 5 complete — Step 6 (quote page UI) coming next.
          </p>
        </div>
      </div>
    </div>
  );
}
