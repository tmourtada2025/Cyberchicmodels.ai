import { publishedModels } from '../../lib/roster'
import { supabase } from '../../lib/supabase'
import type { ModelPage, RosterModel } from '../../lib/types'

const ROSTER_LIMIT = 200

export type Roster = { models: RosterModel[]; total: number }

export async function loadRoster(): Promise<Roster> {
  const { data, count, error } = await publishedModels().limit(ROSTER_LIMIT)
  if (error) throw error
  return { models: data as unknown as RosterModel[], total: count ?? data.length }
}

const PAGE_COLUMNS = [
  'id, slug, name, look:ethnicity, model_code, meta_description',
  'hero_desktop_path, hero_mobile_path, hero_alt, hero_focus, hero_focus_mobile, hero_align, hero_title_scale, hero_facts',
  'strip_items, story_lead, story_body, comp_stats, compcard_path, compcard_pdf_path',
].join(', ')

const SECTION_COLUMNS =
  'id, slug, kind, name, heading_accent, intro, anchor, layout, ' +
  'images:campaign_images(storage_path, alt_text, caption_mark, caption, display_order)'

// Null when the slug isn't a published model (unpublished rows are invisible to anon via RLS).
export async function loadModelPage(slug: string): Promise<ModelPage | null> {
  const { data: model, error } = await supabase
    .from('models')
    .select(PAGE_COLUMNS)
    .eq('slug', slug)
    .eq('roster_status', 'published')
    .maybeSingle()
  if (error) throw error
  if (!model) return null

  const { data: sections, error: sectionsError } = await supabase
    .from('campaigns')
    .select(SECTION_COLUMNS)
    .eq('model_id', (model as unknown as { id: string }).id)
    .eq('status', 'published')
    .eq('images.storage_bucket', 'media')
  if (sectionsError) throw sectionsError

  return { ...(model as unknown as Omit<ModelPage, 'sections'>), sections: sections as unknown as ModelPage['sections'] }
}
