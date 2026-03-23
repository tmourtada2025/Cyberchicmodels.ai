/**
 * CyberChicModels Admin Panel
 * Drop this file into: src/pages/Admin.tsx
 *
 * Then add to your router (e.g. src/App.tsx):
 *   import AdminPage from './pages/Admin';
 *   <Route path="/admin" element={<AdminPage />} />
 *
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env
 * Auth: Supabase email/password â only your admin account can log in
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

// âââ Supabase client (isolated from app client to avoid any auth conflicts) âââ
const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const BUCKETS = {
  MODELS: "model-thumbnails",
  COLLECTIONS: "model-collections",
  STYLES: "styles",
  HERO: "hero",
};

// âââ Types âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
interface Model {
  id: string;
  name: string;
  slug: string;
  nationality: string;
  ethnicity: string;
  gender: string;
  age_group: string;
  height: string;
  weight: string;
  specialty: string;
  hobbies: string;
  bio: string;
  thumbnail_path: string;
  price_usd: number;
  is_published: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_popular: boolean;
  is_coming_soon: boolean;
  social_media: string;
  measurements: string;
}

interface Collection {
  id: string;
  model_id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface CollectionImage {
  id: string;
  model_id: string;
  collection_id: string;
  path: string;
  display_order: number;
}

interface Style {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_path: string;
}

type Tab = "models" | "styles" | "hero";

// âââ Helpers âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function publicUrl(bucket: string, path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// âââ Sub-components âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        padding: "12px 20px",
        borderRadius: 8,
        background: type === "success" ? "#1a1a2e" : "#2d0a0a",
        border: `1px solid ${type === "success" ? "#4ade80" : "#f87171"}`,
        color: type === "success" ? "#4ade80" : "#f87171",
        fontSize: 14,
        fontFamily: "monospace",
        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        maxWidth: 320,
      }}
    >
      {type === "success" ? "â " : "â "}{message}
    </div>
  );
}

function ImageUploader({
  bucket,
  folder,
  currentPath,
  onUploaded,
  label = "Upload Image",
}: {
  bucket: string;
  folder: string;
  currentPath?: string | null;
  onUploaded: (path: string) => void;
  label?: string;
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
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {currentPath && (
        <img
          src={publicUrl(bucket, currentPath)}
          alt="preview"
          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 6, border: "1px solid #333" }}
        />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={btnStyle("secondary")}
      >
        {uploading ? "Uploadingâ¦" : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleUpload} style={{ display: "none" }} />
    </div>
  );
}

function MultiImageUploader({
  bucket,
  folder,
  images,
  onAdded,
  onDeleted,
}: {
  bucket: string;
  folder: string;
  images: CollectionImage[];
  onAdded: (path: string) => void;
  onDeleted: (img: CollectionImage) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (!error) onAdded(path);
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: "relative" }}>
            <img
              src={publicUrl(bucket, img.path)}
              alt=""
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #333" }}
            />
            <button
              type="button"
              onClick={() => onDeleted(img)}
              style={{
                position: "absolute", top: -6, right: -6,
                width: 20, height: 20, borderRadius: "50%",
                background: "#ef4444", border: "none", color: "#fff",
                cursor: "pointer", fontSize: 12, lineHeight: "20px", padding: 0,
              }}
            >Ã</button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={btnStyle("secondary")}>
        {uploading ? "Uploadingâ¦" : "ï¼ Add Images"}
      </button>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={handleUpload} style={{ display: "none" }} />
    </div>
  );
}

// âââ Style helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const colors = {
  bg: "#0d0d0d",
  surface: "#161616",
  border: "#2a2a2a",
  accent: "#c9a96e",
  accentDim: "rgba(201,169,110,0.15)",
  text: "#f0ece4",
  muted: "#888",
  danger: "#ef4444",
  success: "#4ade80",
};

function btnStyle(variant: "primary" | "secondary" | "danger" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 6, cursor: "pointer",
    fontSize: 13, fontFamily: "inherit", fontWeight: 500,
    transition: "all 0.15s", border: "1px solid transparent",
    whiteSpace: "nowrap",
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
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10, position: "relative",
          background: checked ? colors.accent : colors.border,
          transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: checked ? "#0d0d0d" : colors.muted,
          transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 13, color: colors.text }}>{label}</span>
    </label>
  );
}

// âââ Model Form âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const emptyModel = (): Partial<Model> => ({
  name: "", slug: "", nationality: "", ethnicity: "", gender: "female",
  age_group: "", height: "", weight: "", specialty: "", hobbies: "",
  bio: "", thumbnail_path: "", price_usd: 0,
  is_published: false, is_featured: false, is_new: false, is_popular: false, is_coming_soon: false,
  social_media: "", measurements: "",
});

function CollectionsEditor({ modelId, modelSlug }: { modelId: string; modelSlug: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [images, setImages] = useState<Record<string, CollectionImage[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCollName, setNewCollName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("model_collections").select("*").eq("model_id", modelId).order("display_order");
    setCollections(data || []);
    setLoading(false);
  }, [modelId]);

  useEffect(() => { loadCollections(); }, [loadCollections]);

  const loadImages = async (collId: string) => {
    const { data } = await supabase.from("model_collection_images").select("*").eq("collection_id", collId).order("display_order");
    setImages(prev => ({ ...prev, [collId]: data || [] }));
  };

  const addCollection = async () => {
    if (!newCollName.trim()) return;
    const maxOrder = Math.max(0, ...collections.map(c => c.display_order || 0));
    await supabase.from("model_collections").insert({
      model_id: modelId,
      name: newCollName.trim(),
      slug: slugify(newCollName.trim()),
      display_order: maxOrder + 1,
    });
    setNewCollName("");
    loadCollections();
  };

  const deleteCollection = async (coll: Collection) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    if (!confirm(`Delete collection "${coll.name}" and all its images?`)) return;
    await supabase.from("model_collection_images").delete().eq("collection_id", coll.id);
    await supabase.from("model_collections").delete().eq("id", coll.id);
    loadCollections();
  };

  const addImage = async (collId: string, path: string) => {
    const existing = images[collId] || [];
    await supabase.from("model_collection_images").insert({
      model_id: modelId, collection_id: collId,
      path, display_order: existing.length,
    });
    loadImages(collId);
  };

  const deleteImage = async (img: CollectionImage) => {
    await supabase.from("model_collection_images").delete().eq("id", img.id);
    loadImages(img.collection_id);
  };

  if (loading) return <div style={{ color: colors.muted, fontSize: 13 }}>Loading collectionsâ¦</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={newCollName}
          onChange={e => setNewCollName(e.target.value)}
          placeholder="New collection name (e.g. Editorial)"
          style={{ ...inputStyle(), flex: 1 }}
          onKeyDown={e => e.key === "Enter" && addCollection()}
        />
        <button type="button" onClick={addCollection} style={btnStyle("primary")}>Add</button>
      </div>

      {collections.map(coll => (
        <div key={coll.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: "#1a1a1a", cursor: "pointer",
            }}
            onClick={() => {
              setExpanded(expanded === coll.id ? null : coll.id);
              if (expanded !== coll.id) loadImages(coll.id);
            }}
          >
            <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{coll.name}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: colors.muted }}>{images[coll.id]?.length ?? "?"} images</span>
              <button type="button" onClick={e => { e.stopPropagation(); deleteCollection(coll); }} style={{ ...btnStyle("danger"), padding: "4px 10px", fontSize: 12 }}>Delete</button>
              <span style={{ color: colors.muted, fontSize: 16 }}>{expanded === coll.id ? "â²" : "â¼"}</span>
            </div>
          </div>

          {expanded === coll.id && (
            <div style={{ padding: 14, background: colors.surface }}>
              <MultiImageUploader
                bucket={BUCKETS.COLLECTIONS}
                folder={`${modelSlug}/${coll.slug}`}
                images={images[coll.id] || []}
                onAdded={path => addImage(coll.id, path)}
                onDeleted={deleteImage}
              />
            </div>
          )}
        </div>
      ))}

      {collections.length === 0 && (
        <div style={{ color: colors.muted, fontSize: 13, textAlign: "center", padding: 20 }}>
          No collections yet. Add one above.
        </div>
      )}
    </div>
  );
}

function ModelForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Partial<Model>;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Partial<Model>>(initial || emptyModel());
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"details" | "collections">("details");
  const isEdit = !!initial?.id;

  const set = (key: keyof Model, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    if (!form.name?.trim()) return alert("Name is required");
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name!),
      updated_at: new Date().toISOString(),
    };
    if (isEdit) {
      await supabase.from("models").update(payload).eq("id", form.id!);
    } else {
      await supabase.from("models").insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, marginBottom: 24 }}>
        {(["details", "collections"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "10px 20px", background: "none", border: "none",
              borderBottom: `2px solid ${tab === t ? colors.accent : "transparent"}`,
              color: tab === t ? colors.accent : colors.muted,
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              textTransform: "capitalize", transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
          {/* Thumbnail */}
          <Field label="Thumbnail Photo">
            <ImageUploader
              bucket={BUCKETS.MODELS}
              folder={form.slug || "models"}
              currentPath={form.thumbnail_path}
              onUploaded={path => set("thumbnail_path", path)}
              label="Upload Thumbnail"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name *">
              <input value={form.name || ""} onChange={e => { set("name", e.target.value); set("slug", slugify(e.target.value)); }} style={inputStyle()} placeholder="e.g. Layal N" />
            </Field>
            <Field label="Slug">
              <input value={form.slug || ""} onChange={e => set("slug", e.target.value)} style={inputStyle()} placeholder="auto-generated" />
            </Field>
          </div>

          <Field label="Specialty / Tagline">
            <input value={form.specialty || ""} onChange={e => set("specialty", e.target.value)} style={inputStyle()} placeholder="e.g. Editorial fashion, luxury lifestyle campaigns" />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Nationality">
              <input value={form.nationality || ""} onChange={e => set("nationality", e.target.value)} style={inputStyle()} placeholder="e.g. Lebanese" />
            </Field>
            <Field label="Ethnicity">
              <input value={form.ethnicity || ""} onChange={e => set("ethnicity", e.target.value)} style={inputStyle()} placeholder="e.g. Middle Eastern" />
            </Field>
            <Field label="Gender">
              <select value={form.gender || "female"} onChange={e => set("gender", e.target.value)} style={inputStyle()}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Age Group">
              <input value={form.age_group || ""} onChange={e => set("age_group", e.target.value)} style={inputStyle()} placeholder="e.g. 18-25" />
            </Field>
            <Field label="Height">
              <input value={form.height || ""} onChange={e => set("height", e.target.value)} style={inputStyle()} placeholder="e.g. 172cm" />
            </Field>
            <Field label="Weight">
              <input value={form.weight || ""} onChange={e => set("weight", e.target.value)} style={inputStyle()} placeholder="e.g. 54kg" />
            </Field>
          </div>

          <Field label="Measurements">
            <input value={form.measurements || ""} onChange={e => set("measurements", e.target.value)} style={inputStyle()} placeholder="e.g. 34-24-35" />
          </Field>

          <Field label="Hobbies / Interests">
            <input value={form.hobbies || ""} onChange={e => set("hobbies", e.target.value)} style={inputStyle()} placeholder="e.g. Modern dance, pilates, sketching interiors" />
          </Field>

          <Field label="Bio">
            <textarea
              value={form.bio || ""}
              onChange={e => set("bio", e.target.value)}
              style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }}
              placeholder="Short model biographyâ¦"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Social Media (JSON or handle)">
              <input value={form.social_media || ""} onChange={e => set("social_media", e.target.value)} style={inputStyle()} placeholder='e.g. @handle or {"ig":"@handle"}' />
            </Field>
            <Field label="Price (USD)">
              <input type="number" value={form.price_usd || 0} onChange={e => set("price_usd", parseFloat(e.target.value))} style={inputStyle()} />
            </Field>
          </div>

          {/* Flags */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 16px", background: "#1a1a1a", borderRadius: 8 }}>
            <Toggle label="Published" checked={!!form.is_published} onChange={v => set("is_published", v)} />
            <Toggle label="Featured" checked={!!form.is_featured} onChange={v => set("is_featured", v)} />
            <Toggle label="New" checked={!!form.is_new} onChange={v => set("is_new", v)} />
            <Toggle label="Popular" checked={!!form.is_popular} onChange={v => set("is_popular", v)} />
            <Toggle label="Coming Soon" checked={!!form.is_coming_soon} onChange={v => set("is_coming_soon", v)} />
          </div>
        </div>
      )}

      {tab === "collections" && isEdit && (
        <CollectionsEditor modelId={form.id!} modelSlug={form.slug || "model"} />
      )}

      {tab === "collections" && !isEdit && (
        <div style={{ color: colors.muted, fontSize: 13, textAlign: "center", padding: 40 }}>
          Save the model first, then manage its photo collections here.
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 20, marginTop: "auto", borderTop: `1px solid ${colors.border}` }}>
        <button type="button" onClick={onCancel} style={btnStyle("ghost")}>Cancel</button>
        {tab === "details" && (
          <button type="button" onClick={save} disabled={saving} style={btnStyle("primary")}>
            {saving ? "Savingâ¦" : isEdit ? "Save Changes" : "Create Model"}
          </button>
        )}
      </div>
    </div>
  );
}

// âââ Style Form âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
const emptyStyle = (): Partial<Style> => ({ name: "", slug: "", description: "", thumbnail_path: "" });

function StyleForm({ initial, onSaved, onCancel }: { initial?: Partial<Style>; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Style>>(initial || emptyStyle());
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;
  const set = (key: keyof Style, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    if (!form.name?.trim()) return alert("Name is required");
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name!) };
    if (isEdit) {
      await supabase.from("styles").update(payload).eq("id", form.id!);
    } else {
      await supabase.from("styles").insert(payload);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Thumbnail">
        <ImageUploader bucket={BUCKETS.STYLES} folder={form.slug || "styles"} currentPath={form.thumbnail_path} onUploaded={path => set("thumbnail_path", path)} label="Upload Thumbnail" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Style Name *">
          <input value={form.name || ""} onChange={e => { set("name", e.target.value); set("slug", slugify(e.target.value)); }} style={inputStyle()} placeholder="e.g. Silk Evening Gown" />
        </Field>
        <Field label="Slug">
          <input value={form.slug || ""} onChange={e => set("slug", e.target.value)} style={inputStyle()} />
        </Field>
      </div>
      <Field label="Description">
        <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }} />
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
        <button type="button" onClick={onCancel} style={btnStyle("ghost")}>Cancel</button>
        <button type="button" onClick={save} disabled={saving} style={btnStyle("primary")}>
          {saving ? "Savingâ¦" : isEdit ? "Save Changes" : "Create Style"}
        </button>
      </div>
    </div>
  );
}

// âââ Models Panel âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function ModelsPanel() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Model> | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("models").select("*").order("created_at", { ascending: false });
    setModels(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteModel = async (m: Model) => {
    if (!confirm(`Delete "${m.name}"? This cannot be undone.`)) return;
    await supabase.from("model_collection_images").delete().eq("model_id", m.id);
    await supabase.from("model_collections").delete().eq("model_id", m.id);
    await supabase.from("models").delete().eq("id", m.id);
    showToast(`${m.name} deleted`);
    load();
  };

  if (creating || editing) {
    return (
      <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setCreating(false); setEditing(null); }} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>â</button>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>{editing ? `Edit: ${editing.name}` : "New Model"}</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ModelForm
            initial={editing || undefined}
            onSaved={() => { setCreating(false); setEditing(null); load(); showToast("Model saved"); }}
            onCancel={() => { setCreating(false); setEditing(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>Models <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({models.length})</span></h2>
        <button type="button" onClick={() => setCreating(true)} style={btnStyle("primary")}>ï¼ New Model</button>
      </div>

      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loadingâ¦</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {models.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <img
                src={publicUrl(BUCKETS.MODELS, m.thumbnail_path) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23333'/%3E%3C/svg%3E"}
                alt={m.name}
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{m.name}</span>
                  {m.is_published && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(74,222,128,0.15)", color: colors.success, borderRadius: 4 }}>LIVE</span>}
                  {m.is_coming_soon && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(250,204,21,0.15)", color: "#facc15", borderRadius: 4 }}>SOON</span>}
                  {m.is_new && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(201,169,110,0.15)", color: colors.accent, borderRadius: 4 }}>NEW</span>}
                  {m.is_popular && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(239,68,68,0.15)", color: colors.danger, borderRadius: 4 }}>POPULAR</span>}
                </div>
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{m.nationality} Â· {m.specialty || "No specialty set"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => setEditing(m)} style={btnStyle("secondary")}>Edit</button>
                <button type="button" onClick={() => deleteModel(m)} style={btnStyle("danger")}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// âââ Styles Panel âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function StylesPanel() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Style> | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("styles").select("*").order("name");
    setStyles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteStyle = async (s: Style) => {
    if (!confirm(`Delete style "${s.name}"?`)) return;
    await supabase.from("styles").delete().eq("id", s.id);
    showToast(`${s.name} deleted`);
    load();
  };

  if (creating || editing) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setCreating(false); setEditing(null); }} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>â</button>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>{editing ? `Edit: ${editing.name}` : "New Style"}</h2>
        </div>
        <StyleForm
          initial={editing || undefined}
          onSaved={() => { setCreating(false); setEditing(null); load(); showToast("Style saved"); }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>Styles <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({styles.length})</span></h2>
        <button type="button" onClick={() => setCreating(true)} style={btnStyle("primary")}>ï¼ New Style</button>
      </div>
      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loadingâ¦</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {styles.map(s => (
            <div key={s.id} style={{ background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              <img
                src={publicUrl(BUCKETS.STYLES, s.thumbnail_path) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect width='200' height='120' fill='%23333'/%3E%3C/svg%3E"}
                alt={s.name}
                style={{ width: "100%", height: 120, objectFit: "cover" }}
              />
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: colors.muted, marginBottom: 10 }}>{s.description?.slice(0, 60) || "No description"}{(s.description?.length || 0) > 60 ? "â¦" : ""}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => setEditing(s)} style={{ ...btnStyle("secondary"), flex: 1 }}>Edit</button>
                  <button type="button" onClick={() => deleteStyle(s)} style={btnStyle("danger")}>â</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// âââ Hero Panel âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function HeroPanel() {
  const [images, setImages] = useState<{ id: string; path: string; display_order: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("hero_images").select("*").order("display_order");
    setImages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addImage = async (path: string) => {
    const maxOrder = Math.max(0, ...images.map(i => i.display_order));
    await supabase.from("hero_images").insert({ path, display_order: maxOrder + 1 });
    showToast("Hero image added");
    load();
  };

  const deleteImage = async (id: string) => {
    await supabase.from("hero_images").delete().eq("id", id);
    showToast("Image removed");
    load();
  };

  const moveUp = async (idx: number) => {
    if (idx === 0) return;
    const a = images[idx], b = images[idx - 1];
    await supabase.from("hero_images").update({ display_order: b.display_order }).eq("id", a.id);
    await supabase.from("hero_images").update({ display_order: a.display_order }).eq("id", b.id);
    load();
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>Hero Images <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({images.length})</span></h2>
        <ImageUploader bucket={BUCKETS.HERO} folder="hero" onUploaded={addImage} label="ï¼ Upload Hero Image" />
      </div>
      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loadingâ¦</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {images.map((img, idx) => (
            <div key={img.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <img src={publicUrl(BUCKETS.HERO, img.path)} alt="" style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 6 }} />
              <div style={{ flex: 1, fontSize: 12, color: colors.muted, fontFamily: "monospace" }}>{img.path}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} style={{ ...btnStyle("ghost"), padding: "6px 10px" }}>â</button>
                <button type="button" onClick={() => deleteImage(img.id)} style={btnStyle("danger")}>Remove</button>
              </div>
            </div>
          ))}
          {images.length === 0 && <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>No hero images. Upload one above.</div>}
        </div>
      )}
    </div>
  );
}

// âââ Login ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onLogin();
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: colors.bg, fontFamily: "'Georgia', serif",
    }}>
      <div style={{ width: 360, padding: 40, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, letterSpacing: "0.3em", color: colors.accent, textTransform: "uppercase", marginBottom: 8 }}>CyberChic</div>
          <div style={{ fontSize: 22, color: colors.text, fontWeight: 400 }}>Admin Access</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle()} placeholder="admin@example.com" onKeyDown={e => e.key === "Enter" && login()} />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle()} onKeyDown={e => e.key === "Enter" && login()} />
          </Field>

          {error && <div style={{ fontSize: 12, color: colors.danger, textAlign: "center" }}>{error}</div>}

          <button type="button" onClick={login} disabled={loading} style={{ ...btnStyle("primary"), width: "100%", padding: "10px", marginTop: 8, fontSize: 14 }}>
            {loading ? "Signing inâ¦" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// âââ Main Admin Shell âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("models");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontFamily: "monospace" }}>Loadingâ¦</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "models", label: "Models" },
    { key: "styles", label: "Styles" },
    { key: "hero", label: "Hero" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "'Georgia', serif" }}>
      {/* Sidebar */}
      <div style={{ position: "fixed", left: 0, top: 64, bottom: 0, width: 220, background: colors.surface, borderRight: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: colors.accent, textTransform: "uppercase", marginBottom: 4 }}>CyberChic</div>
          <div style={{ fontSize: 15, color: colors.text }}>Admin</div>
        </div>

        <nav style={{ padding: "0 12px", flex: 1 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: activeTab === t.key ? colors.accentDim : "transparent",
                border: "none", color: activeTab === t.key ? colors.accent : colors.muted,
                cursor: "pointer", fontSize: 13, textAlign: "left",
                fontFamily: "inherit", transition: "all 0.15s", marginBottom: 2,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            style={{ ...btnStyle("ghost"), width: "100%", textAlign: "left", padding: "6px 0", fontSize: 12 }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, padding: '40px 40px 40px 40px', paddingTop: 40, maxWidth: 960 }}>
        {activeTab === "models" && <ModelsPanel />}
        {activeTab === "styles" && <StylesPanel />}
        {activeTab === "hero" && <HeroPanel />}
      </div>
    </div>
  );
}
