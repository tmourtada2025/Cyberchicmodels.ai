import { supabase } from '../../lib/supabase'
import type { CampaignDetail } from '../../lib/types'

export async function loadCampaign(slug: string, modelSlug?: string): Promise<CampaignDetail | null> {
  let query = supabase.from('campaigns')
    .select('id, slug, name, description, narrative, location, model:models!inner(slug, name, roster_status), images:campaign_images(storage_path, register, is_hero, display_order, alt_text)')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('model.roster_status', 'published')
    .eq('images.storage_bucket', 'media')
  if (modelSlug) query = query.eq('model.slug', modelSlug)
  const { data, error } = await query.limit(2)
  if (error) throw error
  // Slugs are unique per model, not globally. Never pick an arbitrary campaign.
  if (!data || data.length !== 1) return null
  const campaign = data[0] as unknown as CampaignDetail
  return {
    ...campaign,
    images: (campaign.images ?? []).filter((image) => image.storage_path?.trim())
      .sort((a, b) => a.display_order - b.display_order || a.storage_path.localeCompare(b.storage_path)),
  }
}
