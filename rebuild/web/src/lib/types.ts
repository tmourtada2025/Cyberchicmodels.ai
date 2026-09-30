// Row shapes for the public, published-only reads the site makes.

export type ImageRegister = 'editorial' | 'beauty' | 'campaign' | 'lifestyle'

export type RosterModel = {
  id: string
  slug: string
  name: string
  // Stored in models.ethnicity, read as `look`: the site shows Look + Origin, never an ethnicity label.
  look: string | null
  specialties: string[]
  portrait_path: string | null
  display_order: number
  // Set only for statically served model pages (full navigation, absolute portrait path).
  href?: string
}

export type ModelProfile = RosterModel & {
  age_range_min: number | null
  age_range_max: number | null
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
  description: string | null
  model: { name: string } | null
  images: CampaignImage[]
}

export type ModelCampaign = {
  id: string
  slug: string
  name: string
  images: CampaignImage[]
}
