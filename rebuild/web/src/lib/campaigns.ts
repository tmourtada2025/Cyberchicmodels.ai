import type { CampaignImage } from './types'

// Hero-flagged image first, then curated order.
export function coverImage(images: CampaignImage[]): CampaignImage | undefined {
  return [...images].sort((a, b) => Number(b.is_hero) - Number(a.is_hero) || a.display_order - b.display_order)[0]
}
