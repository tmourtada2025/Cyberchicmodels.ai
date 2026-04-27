// src/pages/AuthCallback.tsx
// Handles return from magic link click.
// Supabase auto-processes the URL fragment to set session.
// We then call /api/auth/whoami to determine role + redirect.

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

  useEffect(() => {
    let mounted = true;

    const resolve = async () => {
      // Supabase has detectSessionInUrl: true, so by the time this component
      // renders, the session should already be set. But to be safe, await it.
      let attempts = 0;
      let session = null;

      while (attempts < 10 && !session) {
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
        setErrorMsg("Could not establish session. The link may have expired or already been used.");
        return;
      }

      // Call whoami to determine routing
      try {
        const r = await fetch("/api/auth/whoami", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!r.ok) {
          if (mounted) {
            setStatus("error");
            setErrorMsg("Failed to verify account. Please try again.");
          }
          return;
        }

        const body = await r.json();

        if (!mounted) return;

        if (body.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (body.role === "client" && body.client_slug) {
          navigate(`/portal/${body.client_slug}`, { replace: true });
        } else if (body.role === "client_inactive") {
          setStatus("error");
          setErrorMsg("Your client account is currently inactive. Please contact your admin.");
        } else if (body.role === "orphan") {
          setStatus("error");
          setErrorMsg(
            "Your account is not linked to a client portal. " +
            "If this is unexpected, contact your CyberChicModels representative."
          );
          // Sign them out so they don't loop
          await supabase.auth.signOut();
        } else {
          setStatus("error");
          setErrorMsg("Unable to determine account access level.");
        }
      } catch (e: any) {
        if (mounted) {
          setStatus("error");
          setErrorMsg(e.message || "Network error during sign-in.");
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

  // Error state
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
        maxWidth: 460, padding: 40,
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
        <p style={{ color: colors.muted, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
          {errorMsg}
        </p>
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
