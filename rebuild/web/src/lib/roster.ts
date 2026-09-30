import { supabase } from './supabase'

// Public columns for a roster card. Internal fields (descriptors, LoRA, vip_score, market_gap) are never read.
export const ROSTER_COLUMNS = 'id, slug, name, look:ethnicity, specialties, portrait_path, display_order'

// Published models in curated order (visual-lock §4). RLS enforces published-only; the filter restates it.
export function publishedModels() {
  return supabase
    .from('models')
    .select(ROSTER_COLUMNS, { count: 'exact' })
    .eq('roster_status', 'published')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
}
