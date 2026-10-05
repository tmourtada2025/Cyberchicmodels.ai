import { supabase } from '../../lib/supabase'
import type { LicenseFeature, LicenseTier } from '../../lib/types'

export type Licensing = { tiers: LicenseTier[]; features: LicenseFeature[] }

// Active tiers and the comparison rows that exist; the UI renders whatever is there, with no fallback.
export async function loadLicensing(): Promise<Licensing> {
  const [tiers, features] = await Promise.all([
    supabase.from('license_tiers').select('id, code, name, summary, price_display, display_order').eq('is_active', true).order('display_order'),
    supabase.from('license_features').select('id, label, display_order, values:license_tier_features(license_tier_id, is_included, value_note)').order('display_order'),
  ])
  if (tiers.error) throw tiers.error
  if (features.error) throw features.error
  return { tiers: tiers.data as LicenseTier[], features: features.data as unknown as LicenseFeature[] }
}

// Roster options for the brief form: published models in roster order.
export async function loadBriefModels(): Promise<{ slug: string; name: string; model_code: string | null }[]> {
  const { data, error } = await supabase
    .from('models')
    .select('slug, name, model_code')
    .eq('roster_status', 'published')
    .order('display_order')
  if (error) throw error
  return data
}
