import { publishedModels, ROSTER_COLUMNS } from '../../lib/roster'
import { supabase } from '../../lib/supabase'
import type { ModelCampaign, ModelProfile, RosterModel } from '../../lib/types'

const ROSTER_LIMIT = 200

export type Roster = { models: RosterModel[]; total: number }

export async function loadRoster(): Promise<Roster> {
  const { data, count, error } = await publishedModels().limit(ROSTER_LIMIT)
  if (error) throw error
  return { models: data as RosterModel[], total: count ?? data.length }
}

export type Profile = { model: ModelProfile; campaigns: ModelCampaign[] } | null

// Null when the slug isn't a published model (unpublished rows are invisible to anon via RLS).
export async function loadProfile(slug: string): Promise<Profile> {
  const { data: model, error } = await supabase
    .from('models')
    .select(`${ROSTER_COLUMNS}, age_range_min, age_range_max`)
    .eq('slug', slug)
    .eq('roster_status', 'published')
    .maybeSingle()
  if (error) throw error
  if (!model) return null

  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, slug, name, images:campaign_images(storage_path, register, is_hero, display_order, alt_text)')
    .eq('model_id', model.id)
    .eq('status', 'published')
    .eq('images.storage_bucket', 'media')
    .order('display_order', { ascending: true })
  if (campaignsError) throw campaignsError

  return { model: model as ModelProfile, campaigns: campaigns as unknown as ModelCampaign[] }
}
