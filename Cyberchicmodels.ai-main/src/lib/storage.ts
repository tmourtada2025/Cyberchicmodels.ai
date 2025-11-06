import { supabase } from './supabase';

/** ---- Public URL helpers ---- */
export const getStorageUrl = (bucket: string, path?: string | null) => {
  if (!path) return "";
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path;
  
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
};

// Alias for backward compatibility
export const publicUrl = getStorageUrl;