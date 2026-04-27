// src/pages/ClientLogin.tsx
// Branded login page at /portal/:slug/login
// Loads public client info to display logo + name.
// Magic link sent via supabase.auth.signInWithOtp.

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
  text: "#f0ece4", muted: "#888", danger: "#ef4444", success: "#4ade80",
};

interface PublicClient {
  slug: string;
  name: string;
  logo_url: string | null;
  hero_image_url: string | null;
  default_language: string;
}

function publicAssetUrl(bucket: string, path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export default function ClientLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<PublicClient | null>(null);
  const [loadingClient, setLoadingClient] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // ─── Already logged in? Skip to whoami routing ───────────────────────────
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && mounted) {
        navigate("/auth/callback", { replace: true });
      }
    });
    return () => { mounted = false; };
  }, [navigate]);

  // ─── Load client info ────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) {
      setClientError("Missing slug");
      setLoadingClient(false);
      return;
    }
    let mounted = true;
    fetch(`/api/public/client/${encodeURIComponent(slug)}`)
      .then(async r => {
        if (!mounted) return;
        if (!r.ok) {
          const errBody = await r.json().catch(() => ({}));
          setClientError(errBody.error || "Client not found");
          setClient(null);
        } else {
          const body = await r.json();
          setClient(body.client);
        }
      })
      .catch(e => {
        if (mounted) setClientError(e.message || "Network error");
      })
      .finally(() => {
        if (mounted) setLoadingClient(false);
      });
    return () => { mounted = false; };
  }, [slug]);

  // ─── Send magic link ─────────────────────────────────────────────────────
  const sendMagicLink = async () => {
    if (!email.trim()) {
      setSendError("Email is required");
      return;
    }
    setSending(true);
    setSendError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false, // admin must invite first
        },
      });

      if (error) {
        // Don't leak whether email exists. Generic message.
        // Specific error codes: shouldCreateUser:false + non-existent → "Signups not allowed"
        setSendError(
          "If this email is registered for this client, a magic link has been sent. " +
          "Check your inbox (and spam folder). If you don't receive it, contact your admin."
        );
        // Still show "sent" UI for security
        setSent(true);
      } else {
        setSent(true);
      }
    } catch (e: any) {
      setSendError(e.message || "Failed to send magic link");
    } finally {
      setSending(false);
    }
  };

  // ─── Render: loading client info ─────────────────────────────────────────
  if (loadingClient) {
    return (
      <div style={{
        minHeight: "100vh",
        background: colors.bg,
        color: colors.muted,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Georgia', serif",
      }}>
        Loading…
      </div>
    );
  }

  // ─── Render: client not found ────────────────────────────────────────────
  if (clientError || !client) {
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
          <div style={{
            fontSize: 13, letterSpacing: "0.3em",
            color: colors.accent, textTransform: "uppercase", marginBottom: 12,
          }}>CyberChicModels</div>
          <h1 style={{ fontSize: 22, fontWeight: 400, marginBottom: 16 }}>
            Portal Not Found
          </h1>
          <p style={{ color: colors.muted, fontSize: 14, lineHeight: 1.6 }}>
            We couldn't find a client portal at this address. If this is unexpected,
            please contact your admin.
          </p>
        </div>
      </div>
    );
  }

  const heroBg = client.hero_image_url
    ? publicAssetUrl("client-heroes", client.hero_image_url)
    : null;

  // ─── Render: login form ──────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: heroBg ? `url(${heroBg}) center/cover no-repeat` : colors.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif",
      padding: 20,
      position: "relative",
    }}>
      {/* Dark overlay for readability over hero image */}
      {heroBg && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.65)",
        }} />
      )}

      <div style={{
        position: "relative",
        width: "100%", maxWidth: 420,
        padding: 40,
        background: colors.surface,
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Logo + branding */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {client.logo_url ? (
            <img
              src={publicAssetUrl("client-logos", client.logo_url)}
              alt={client.name}
              style={{
                maxHeight: 80, maxWidth: 200,
                objectFit: "contain",
                marginBottom: 16,
              }}
            />
          ) : (
            <div style={{
              fontSize: 13, letterSpacing: "0.3em",
              color: colors.accent, textTransform: "uppercase",
              marginBottom: 8,
            }}>
              CyberChicModels
            </div>
          )}
          <div style={{ fontSize: 22, color: colors.text, fontWeight: 400, marginBottom: 6 }}>
            {client.name}
          </div>
          <div style={{ fontSize: 12, color: colors.muted, letterSpacing: "0.05em" }}>
            Client Portal
          </div>
        </div>

        {!sent ? (
          <>
            {/* Email input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{
                  fontSize: 11, fontWeight: 600, color: colors.muted,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  display: "block", marginBottom: 6,
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMagicLink()}
                  placeholder="you@yourcompany.com"
                  disabled={sending}
                  autoFocus
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 6,
                    background: "#1e1e1e", border: `1px solid ${colors.border}`,
                    color: colors.text, fontSize: 14, fontFamily: "inherit",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {sendError && (
                <div style={{
                  fontSize: 12, color: colors.danger,
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  borderRadius: 6,
                  lineHeight: 1.5,
                }}>
                  {sendError}
                </div>
              )}

              <button
                type="button"
                onClick={sendMagicLink}
                disabled={sending}
                style={{
                  padding: "12px",
                  background: colors.accent,
                  color: "#0d0d0d",
                  border: "none",
                  borderRadius: 6,
                  cursor: sending ? "default" : "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  marginTop: 8,
                  opacity: sending ? 0.6 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {sending ? "Sending…" : "Send Magic Link"}
              </button>
            </div>

            <div style={{
              fontSize: 11, color: colors.muted,
              textAlign: "center", marginTop: 24,
              lineHeight: 1.6,
            }}>
              Access is by invitation only. If you don't have an account,
              please contact your CyberChicModels representative.
            </div>
          </>
        ) : (
          <>
            {/* Success state */}
            <div style={{
              padding: 20,
              background: colors.accentDim,
              border: `1px solid ${colors.accent}`,
              borderRadius: 8,
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 32, marginBottom: 8,
              }}>
                ✉
              </div>
              <div style={{ fontSize: 16, color: colors.text, fontWeight: 500, marginBottom: 8 }}>
                Check your email
              </div>
              <div style={{ fontSize: 13, color: colors.muted, lineHeight: 1.6 }}>
                If <span style={{ color: colors.accent }}>{email}</span> is registered for this portal,
                a magic link has been sent. The link expires in one hour.
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setSendError(null); }}
              style={{
                width: "100%", padding: "10px",
                background: "transparent",
                color: colors.muted,
                border: `1px solid ${colors.border}`,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                fontFamily: "inherit",
                marginTop: 16,
              }}
            >
              Send to a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
