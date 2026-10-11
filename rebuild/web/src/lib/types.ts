// Row shapes for the public, published-only reads the site makes.

export type ImageRegister = 'editorial' | 'beauty' | 'campaign' | 'lifestyle' | 'digital'
export type CampaignKind = 'editorial' | 'range' | 'digitals' | 'client'

export type RosterModel = {
  id: string
  slug: string
  name: string
  // Stored in models.ethnicity, read as `look`: the site shows Look + Origin, never an ethnicity label.
  look: string | null
  specialties: string[]
  portrait_path: string | null
  display_order: number
  on_roster_cards: boolean
  on_hero_wall: boolean
  // Hero-wall tile when it differs from the card portrait.
  wall_path: string | null
  // Hero-wall position when it differs from display_order; null means the roster order.
  wall_order: number | null
}

export type LabelValue = { label: string; value: string }

// One row of a section grid, verbatim from the model's static page: `grid` is the row's class
// ("g3", "row a", ...) or "full" for a bare full-width figure; items point at images by display_order.
export type LayoutRow = {
  grid: string
  // img: the image's own inline CSS from the static page, e.g. "object-position:50% 22%".
  items: { order: number; ph?: string; figure?: string; img?: string }[]
}

export type SectionImage = {
  storage_path: string
  alt_text: string | null
  caption_mark: string | null
  caption: string | null
  display_order: number
}

export type ModelSection = {
  id: string
  slug: string
  kind: CampaignKind
  name: string
  heading_accent: string | null
  intro: string | null
  anchor: string | null
  layout: LayoutRow[] | null
  images: SectionImage[]
}

export type ModelPage = {
  id: string
  slug: string
  name: string
  look: string | null
  model_code: string | null
  meta_description: string | null
  hero_desktop_path: string | null
  hero_mobile_path: string | null
  hero_alt: string | null
  hero_focus: string | null
  hero_focus_mobile: string | null
  hero_align: 'left' | 'right'
  hero_title_scale: 'xl' | 'l'
  hero_facts: LabelValue[]
  strip_items: string[]
  story_lead: string | null
  story_body: string | null
  comp_stats: LabelValue[]
  compcard_path: string | null
  compcard_pdf_path: string | null
  sections: ModelSection[]
}

export type CampaignImage = {
  storage_path: string
  register: ImageRegister
  is_hero: boolean
  display_order: number
  alt_text: string | null
}

export type HomeCampaign = {
  id: string
  slug: string
  name: string
  anchor: string | null
  model: { name: string; slug: string; display_order: number } | null
  images: CampaignImage[]
}

export type LicenseTier = {
  id: string
  code: string
  name: string
  summary: string | null
  price_display: string
  display_order: number
}

export type LicenseFeature = {
  id: string
  label: string
  display_order: number
  values: { license_tier_id: string; is_included: boolean; value_note: string | null }[]
}
