import { supabase } from './supabase'

// Public URL for an object in the public `media` bucket. Never used for the private `pipeline` bucket.
export function mediaUrl(path: string): string {
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

// Statically served models (href set) keep their portrait under public/, not in the media bucket.
export function portraitSrc(model: { href?: string; portrait_path: string }): string {
  return model.href ? model.portrait_path : mediaUrl(model.portrait_path)
}
