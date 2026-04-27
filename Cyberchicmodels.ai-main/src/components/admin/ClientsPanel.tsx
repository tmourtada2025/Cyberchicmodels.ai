/**
 * ClientsPanel — Admin panel for managing client tenants.
 *
 * Drop into src/components/admin/ClientsPanel.tsx
 *
 * Then in Admin.tsx:
 *   1. Add import: import { ClientsPanel } from "../components/admin/ClientsPanel";
 *   2. Add "clients" to Tab type alias
 *   3. Add { key: "clients", label: "Clients" } to tabs array
 *   4. Add {activeTab === "clients" && <ClientsPanel />} to render section
 *
 * Uses the same `colors`, `btnStyle`, `inputStyle`, `Field`, `Toggle`, `Toast`,
 * `ImageUploader` primitives as your existing Admin.tsx. These need to be either
 * exported from Admin.tsx or duplicated here. Simplest path: duplicate inline.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const BUCKETS = {
  CLIENT_LOGOS: "client-logos",
  CLIENT_HEROES: "client-heroes",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  slug: string;
  name: string;
  contact_email: string;
  contact_name: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  assigned_model_id: string | null;
  default_language: string;
  default_currency: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  models?: { id: string; name: string; slug: string } | null;
}

interface ModelLite {
  id: string;
  name: string;
  slug: string;
}

// ─── Style helpers (duplicated from Admin.tsx for self-containment) ──────────
const colors = {
  bg: "#0d0d0d", surface: "#161616", border: "#2a2a2a",
  accent: "#c9a96e", accentDim: "rgba(201,169,110,0.15)",
  text: "#f0ece4", muted: "#888", danger: "#ef4444", success: "#4ade80",
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

function labelStyle(): React.CSSProperties {
  return { fontSize: 11, fontWeight: 600, color: colors.muted, letterSpacing: "0.08em", textTransform: "uppercase" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle()}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: 10, position: "relative",
        background: checked ? colors.accent : colors.border, transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: checked ? "#0d0d0d" : colors.muted, transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 13, color: colors.text }}>{label}</span>
    </label>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "12px 20px", borderRadius: 8,
      background: type === "success" ? "#1a1a2e" : "#2d0a0a",
      border: `1px solid ${type === "success" ? "#4ade80" : "#f87171"}`,
      color: type === "success" ? "#4ade80" : "#f87171",
      fontSize: 14, fontFamily: "monospace",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 320,
    }}>
      {type === "success" ? "✓ " : "✗ "}{message}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function publicUrl(bucket: string, path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Fetch with auth header
async function authedFetch(path: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
    ...(init.headers || {}),
  };
  return fetch(path, { ...init, headers });
}

// ─── ImageUploader (duplicated, simplified) ──────────────────────────────────
function ImageUploader({ bucket, folder, currentPath, onUploaded, label }: {
  bucket: string; folder: string; currentPath?: string | null;
  onUploaded: (path: string) => void; label: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    setUploading(false);
    if (!error) onUploaded(path);
    else alert("Upload failed: " + error.message);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {currentPath && (
        <img src={publicUrl(bucket, currentPath)} alt="preview"
          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 6, border: "1px solid #333" }} />
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={btnStyle("secondary")}>
        {uploading ? "Uploading…" : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
    </div>
  );
}

// ─── Client Form ─────────────────────────────────────────────────────────────
const emptyClient = (): Partial<Client> => ({
  name: "", slug: "", contact_email: "", contact_name: "",
  logo_url: "", hero_image_url: "", assigned_model_id: null,
  default_language: "en", default_currency: "USD",
  is_active: true, notes: "",
});

function ClientForm({ initial, models, onSaved, onCancel }: {
  initial?: Partial<Client>;
  models: ModelLite[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Client>>(initial || emptyClient());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial?.id;

  const set = (key: keyof Client, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    if (!form.name?.trim()) return setError("Name is required");
    if (!form.contact_email?.trim()) return setError("Contact email is required");

    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name!),
      };

      const path = isEdit
        ? `/api/admin/clients/${form.id}`
        : `/api/admin/clients`;
      const method = isEdit ? "PATCH" : "POST";

      const response = await authedFetch(path, {
        method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const ddStyle: React.CSSProperties = {
    ...inputStyle(), appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C%2Fsvg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
      <Field label="Logo">
        <ImageUploader bucket={BUCKETS.CLIENT_LOGOS} folder={form.slug || "client"}
          currentPath={form.logo_url} onUploaded={path => set("logo_url", path)} label="Upload Logo" />
      </Field>

      <Field label="Hero Banner">
        <ImageUploader bucket={BUCKETS.CLIENT_HEROES} folder={form.slug || "client"}
          currentPath={form.hero_image_url} onUploaded={path => set("hero_image_url", path)} label="Upload Hero Image" />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Client Name *">
          <input value={form.name || ""} onChange={e => { set("name", e.target.value); if (!isEdit) set("slug", slugify(e.target.value)); }}
            style={inputStyle()} placeholder="e.g. Hairvella Spain" />
        </Field>
        <Field label="Slug *">
          <input value={form.slug || ""} onChange={e => set("slug", e.target.value)}
            style={inputStyle()} placeholder="e.g. hairvella-spain" />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Contact Email *">
          <input type="email" value={form.contact_email || ""} onChange={e => set("contact_email", e.target.value)}
            style={inputStyle()} placeholder="contact@brand.com" />
        </Field>
        <Field label="Contact Name">
          <input value={form.contact_name || ""} onChange={e => set("contact_name", e.target.value)}
            style={inputStyle()} placeholder="Optional" />
        </Field>
      </div>

      <Field label="Assigned Model">
        <select value={form.assigned_model_id || ""} onChange={e => set("assigned_model_id", e.target.value || null)}
          style={ddStyle}>
          <option value="">— None —</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Default Language">
          <select value={form.default_language || "en"} onChange={e => set("default_language", e.target.value)} style={ddStyle}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </Field>
        <Field label="Default Currency">
          <select value={form.default_currency || "USD"} onChange={e => set("default_currency", e.target.value)} style={ddStyle}>
            <option value="USD">USD</option>
          </select>
        </Field>
      </div>

      <Field label="Internal Notes (admin only)">
        <textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)}
          style={{ ...inputStyle(), minHeight: 60, resize: "vertical" }}
          placeholder="Notes about this client — visible only to admin" />
      </Field>

      <div style={{ padding: "12px 16px", background: "#1a1a1a", borderRadius: 8 }}>
        <Toggle label="Active (client can access portal)" checked={!!form.is_active} onChange={v => set("is_active", v)} />
      </div>

      {error && <div style={{ fontSize: 12, color: colors.danger, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 20, marginTop: "auto", borderTop: `1px solid ${colors.border}` }}>
        <button type="button" onClick={onCancel} style={btnStyle("ghost")}>Cancel</button>
        <button type="button" onClick={save} disabled={saving} style={btnStyle("primary")}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Client"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────
export function ClientsPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [models, setModels] = useState<ModelLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, { data: m }] = await Promise.all([
        authedFetch("/api/admin/clients"),
        supabase.from("models").select("id, name, slug").order("name"),
      ]);

      if (!clientsRes.ok) {
        const errData = await clientsRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load clients");
      }
      const clientsData = await clientsRes.json();
      setClients(clientsData.clients || []);
      setModels(m || []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Load failed", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteClient = async (c: Client) => {
    if (!confirm(`Delete client "${c.name}"? This cannot be undone. All their pricing, subscriptions, and purchases will also be deleted.`)) return;
    try {
      const res = await authedFetch(`/api/admin/clients/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Delete failed");
      }
      showToast(`${c.name} deleted`);
      load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error");
    }
  };

  const filtered = clients.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_email.toLowerCase().includes(search.toLowerCase())
  );

  if (creating || editing) {
    return (
      <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
        {toast && <Toast message={toast.msg} type={toast.type} />}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setCreating(false); setEditing(null); }}
            style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>
            {editing ? `Edit: ${editing.name}` : "New Client"}
          </h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ClientForm
            initial={editing || undefined}
            models={models}
            onSaved={() => { setCreating(false); setEditing(null); load(); showToast("Client saved"); }}
            onCancel={() => { setCreating(false); setEditing(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>
          Clients <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({clients.length})</span>
        </h2>
        <button type="button" onClick={() => setCreating(true)} style={btnStyle("primary")}>+ New Client</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, slug, or email…"
          style={{ ...inputStyle(), flex: 1, fontSize: 12 }} />
        {search && (
          <button type="button" onClick={() => setSearch("")} style={{ ...btnStyle("ghost"), fontSize: 12 }}>✕ Clear</button>
        )}
      </div>

      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ color: colors.muted, textAlign: "center", padding: 40, fontSize: 13 }}>
              {search ? "No clients match your search." : "No clients yet. Create your first one."}
            </div>
          )}
          {filtered.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <img
                src={publicUrl(BUCKETS.CLIENT_LOGOS, c.logo_url) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23333'/%3E%3C/svg%3E"}
                alt={c.name}
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{c.name}</span>
                  {c.is_active ? (
                    <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(74,222,128,0.15)", color: colors.success, borderRadius: 4 }}>ACTIVE</span>
                  ) : (
                    <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(136,136,136,0.15)", color: colors.muted, borderRadius: 4 }}>INACTIVE</span>
                  )}
                  <span style={{ fontSize: 10, padding: "2px 6px", background: colors.accentDim, color: colors.accent, borderRadius: 4, fontFamily: "monospace" }}>
                    /{c.slug}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {c.contact_email}
                  {c.models?.name && <span style={{ color: colors.accent, marginLeft: 8 }}>· {c.models.name}</span>}
                  <span style={{ marginLeft: 8 }}>· {c.default_currency} · {c.default_language.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => setEditing(c)} style={btnStyle("secondary")}>Edit</button>
                <button type="button" onClick={() => deleteClient(c)} style={btnStyle("danger")}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
