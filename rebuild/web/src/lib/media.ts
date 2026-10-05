import { supabase } from './supabase'

// Public URL for an object in the public `media` bucket. Never used for the private `pipeline` bucket.
export function mediaUrl(path: string): string {
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}
