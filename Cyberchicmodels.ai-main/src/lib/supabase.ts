import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** ---- Client ---- */
// Grab the Supabase URL and anon key from Vite's environment variables.  These
// should be defined in your `.env` file or in your deployment environment
// (e.g. Vercel).  If they aren't set, the Supabase client will not be
// initialized and the application will fall back to local placeholder data.
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
//
// Buckets configuration
//
// To align with the new database schema, the storage buckets have been renamed.
// - `model-thumbnails`: stores the small images used on the models overview page.
// - `model-collections`: stores images belonging to each model and their collections.
// - `styles`: stores the primary images for styles and garments.
// - `hero`: stores the images used in the hero carousel.
export const BUCKETS = {
  MODELS: "model-thumbnails",
  STYLES: "styles",
  COLLECTIONS: "model-collections",
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
  thumbnail_path?: string | null; // storage path for the overview thumbnail
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
  /**
   * Name of the collection (e.g. "Editorial", "Runway").  In the previous
   * schema this was stored in `title`.  The new schema uses `name` and a
   * numeric `display_order` to control the ordering of the pill tabs.
   */
  name: string;
  /**
   * Display order for the pill/tab.  Lower numbers appear first.  This
   * replaces `sort_order` from the old schema.
   */
  display_order?: number | null;
};

export type ModelPhoto = {
  id: string | number;
  /**
   * Optional model identifier.  Included for convenience when querying
   * images across a whole model (including those without an associated
   * collection).
   */
  model_id?: string | number;
  /**
   * Collection identifier.  Can be null if the image belongs to the model
   * but not to a specific collection.
   */
  collection_id: string | number | null;
  /**
   * Relative path within the `model-collections` bucket.  This replaces
   * `storage_path` from the old schema.
   */
  path: string;
  /**
   * Optional caption/alt text for the photo.
   */
  caption?: string | null;
  /**
   * Display order for the photo.  Lower numbers appear first.  This
   * replaces `sort_order` from the old schema.
   */
  display_order?: number | null;
};

/**
 * Represents a single hero image used in the hero carousel.  The new
 * `hero_images` table stores only the storage path and optional alt text.
 * Additional metadata like title and button labels are added at the
 * presentation layer.
 */
export type HeroImage = {
  id: string;
  /** Relative path within the `hero` storage bucket */
  path: string;
  /** Optional alt text or description for accessibility */
  alt_text?: string | null;
  /** Defines the order in which the images appear */
  display_order?: number | null;
  created_at: string;
  updated_at: string;
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
    .from("model_collections")
    .select("id, model_id, slug, name, display_order")
    .eq("model_id", modelId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ModelCollection[];
}

export async function fetchPhotosForCollection(collectionId: string | number) {
  const { data, error } = await supabase
    .from("model_collection_images")
    .select("id, model_id, collection_id, path, caption, display_order")
    .eq("collection_id", collectionId)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ModelPhoto[];
}

/**
 * Fetch all hero images from the `hero_images` table.  The results are
 * ordered by `display_order` so they appear in the intended sequence.
 */
export async function fetchHeroImages() {
  const { data, error } = await supabase
    .from("hero_images")
    .select("id, path, alt_text, display_order, created_at, updated_at")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HeroImage[];
}

/**
 * HeroSlide and Style types remain for backward compatibility with existing
 * components.  While the new schema simplifies hero images to only
 * include a `path` and `display_order`, the front-end can still use
 * these types by supplying default text.
 */
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

// Added: HeroImage type for the new hero_images table
export type HeroImage = {
  id: string;
  path: string | null;
  alt_text?: string | null;
  display_order?: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Fetch hero images from the new `hero_images` table. Returns images
 * ordered by display_order.
 */
export async function fetchHeroImages() {
  const { data, error } = await supabase
    .from("hero_images")
    .select("id, path, alt_text, display_order, created_at, updated_at")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as HeroImage[];
}
