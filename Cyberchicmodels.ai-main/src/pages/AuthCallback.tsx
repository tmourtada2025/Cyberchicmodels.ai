// src/pages/AuthCallback.tsx
// PATCHED — Step 5 fix.
// Handles return from magic link click.
// - Longer session polling (5 sec instead of 2)
// - Surfaces whoami response details on error for debugging

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

const colors = {
  bg: "#0d0d0d", surface: "#161616", border: "#2a2a2a",
  accent: "#c9a96e", accentDim: "rgba(201,169,110,0.15)",
  text: "#f0ece4", muted: "#888", danger: "#ef4444",
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"resolving" | "error">("resolving");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const resolve = async () => {
      // Poll for up to 5 seconds for session to be established.
      let attempts = 0;
      let session = null;

      while (attempts < 25 && !session) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise(r => setTimeout(r, 200));
        attempts++;
      }

      if (!mounted) return;

      if (!session) {
        setStatus("error");
        setErrorMsg("Could not establish session.");
        setErrorDetail("The magic link may have expired, already been used, or the URL fragment was lost. Please request a new link.");
        return;
      }

      // Call whoami to determine routing
      try {
        const r = await fetch("/api/auth/whoami", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        const body = await r.json().catch(() => ({}));

        if (!mounted) return;

        if (!r.ok) {
          setStatus("error");
          setErrorMsg(`Verification request failed (HTTP ${r.status})`);
          setErrorDetail(body?.error || body?.detail || JSON.stringify(body));
          return;
        }

        if (body.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (body.role === "client" && body.client_slug) {
          navigate(`/portal/${body.client_slug}`, { replace: true });
        } else if (body.role === "client_inactive") {
          setStatus("error");
          setErrorMsg("Your client account is inactive.");
          setErrorDetail("Please contact your CyberChicModels representative.");
        } else if (body.role === "orphan") {
          setStatus("error");
          setErrorMsg("Account not linked to a client portal.");
          setErrorDetail(
            body?.reason === "no_client_user_row"
              ? "You're authenticated but no client portal is linked to this email. Contact your admin."
              : (body?.detail || "Unknown reason.")
          );
          await supabase.auth.signOut();
        } else if (body.role === "none") {
          setStatus("error");
          setErrorMsg("Authentication state was lost.");
          setErrorDetail(body?.reason || body?.detail || "Token verification failed.");
        } else {
          setStatus("error");
          setErrorMsg("Unable to determine account access level.");
          setErrorDetail(`Unexpected response role: ${body?.role || "unknown"}`);
        }
      } catch (e: any) {
        if (mounted) {
          setStatus("error");
          setErrorMsg("Network error during sign-in.");
          setErrorDetail(e?.message || String(e));
        }
      }
    };

    resolve();

    return () => { mounted = false; };
  }, [navigate]);

  if (status === "resolving") {
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
        <div style={{ fontSize: 14 }}>Signing you in…</div>
      </div>
    );
  }

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
        maxWidth: 520, padding: 40,
        background: colors.surface, borderRadius: 12,
        border: `1px solid ${colors.border}`, textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.3em",
          color: colors.accent, textTransform: "uppercase",
          marginBottom: 16,
        }}>
          CyberChicModels
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 400, marginBottom: 16 }}>
          Sign-in problem
        </h1>
        <p style={{ color: colors.text, fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
          {errorMsg}
        </p>
        {errorDetail && (
          <div style={{
            color: colors.muted,
            fontSize: 12,
            lineHeight: 1.5,
            marginBottom: 24,
            padding: "10px 14px",
            background: "#1e1e1e",
            borderRadius: 6,
            fontFamily: "monospace",
            textAlign: "left",
            wordBreak: "break-word",
          }}>
            {errorDetail}
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
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
          Return to home
        </button>
      </div>
    </div>
  );
}
