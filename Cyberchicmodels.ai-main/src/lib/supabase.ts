// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** ---- Client ---- */
const VITE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const VITE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Check if environment variables are properly set
if (!VITE_URL || !VITE_ANON || VITE_ANON.includes('REPLACE_WITH_YOUR_ACTUAL')) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY", {
    url: VITE_URL ? "✓" : "✗",
    key: VITE_ANON && !VITE_ANON.includes('REPLACE_WITH_YOUR_ACTUAL') ? "✓" : "✗"
  });
}

// Only create client if we have valid credentials
export const supabase: SupabaseClient = VITE_URL && VITE_ANON && !VITE_ANON.includes('REPLACE_WITH_YOUR_ACTUAL') 
  ? createClient(VITE_URL, VITE_ANON, {
  auth: { 
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
}) 
  : null as any; // This will cause errors if used, which is what we want for debugging

/** ---- Buckets ---- */
export const BUCKETS = {
  MODELS: "models",
  STYLES: "styles",
  COLLECTIONS: "collections",
  HERO: "hero",
} as const;

/** ---- Common types used across components ---- */
export type Model = {
  id: string | number;
  slug?: string | null;
  name: string;
  tagline?: string | null;
  specialty?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  gender?: string | null;
  age?: number | null;
  age_group?: string | null;
  height?: string | null;
  weight?: string | null;
  thumbnail_path?: string | null; // storage path
  is_featured?: boolean | null;
  is_new?: boolean | null;
  is_popular?: boolean | null;
  is_coming_soon?: boolean | null;
  bio?: string | null;
  hobbies?: string | null;
  experience_years?: number | null;
  social_media?: any | null;
  measurements?: any | null;
  price_usd?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type ModelCollection = {
  id: string | number;
  model_id: string | number;
  slug: string;
  title: string;
  cover_path?: string | null; // storage path
  sort_order?: number | null;
};

export type ModelPhoto = {
  id: string | number;
  collection_id: string | number;
  storage_path: string; // storage path
  caption?: string | null;
  sort_order?: number | null;
};

/** ---- Optional: tiny fetch helpers ---- */
export async function fetchModels(limit = 100) {
  const { data, error } = await supabase
    .from("models")
    .select(
      "id,slug,name,tagline,specialty,nationality,ethnicity,gender,age,age_group,height,weight,thumbnail_path,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Model[];
}

export async function fetchModelByIdOrSlug(idOrSlug: string) {
  const { data, error } = await supabase
    .from("models")
    .select(
      "id,slug,name,tagline,specialty,nationality,ethnicity,gender,age,age_group,height,weight,thumbnail_path,created_at"
    )
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();
  if (error) throw error;
  return data as Model | null;
}

export async function fetchCollectionsForModel(modelId: string | number) {
  const { data, error } = await supabase
    .from("collections")
    .select("id,model_id,slug,title,cover_path,sort_order")
    .eq("model_id", modelId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ModelCollection[];
}

export async function fetchPhotosForCollection(collectionId: string | number) {
  const { data, error } = await supabase
    .from("photos")
    .select("id,collection_id,storage_path,caption,sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ModelPhoto[];
}

export type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  background_image_path?: string | null;
  button_text: string;
  button_link: string;
  sort_order?: number | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Style = {
  id: string;
  slug?: string | null;
  name: string;
  clothing_type?: string | null;
  style_theme?: string | null;
  image_path?: string | null;
  back_image_path?: string | null;
  colors: string[];
  angle?: string | null;
  price_usd?: number | null;
  description?: string | null;
  created_at: string;
};