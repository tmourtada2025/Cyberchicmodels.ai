import type { RosterModel } from '../../lib/types'

// Every model on the roster is AI-generated; cards and profiles show this as the model's Origin.
export const ORIGIN = 'AI-generated'

// Models whose detail page is a finished static build under public/m/<slug>/, not the SPA profile route.
// Listed ahead of the Supabase roster; roster rows with the same slug are dropped to avoid duplicates.
export const FEATURED_MODELS: RosterModel[] = [
  {
    id: 'static-dalia',
    slug: 'dalia',
    name: 'Dalia',
    look: 'Lebanese',
    specialties: ['Pro-age beauty', 'Fine jewellery', 'Luxury'],
    portrait_path: '/m/dalia/img/dalia-card-800x1000.webp',
    display_order: 1,
    href: '/m/dalia/',
  },
  {
    id: 'static-ariadne',
    slug: 'ariadne',
    name: 'Ariadne',
    look: 'Greek',
    specialties: ['Wine', 'Hospitality', 'Resortwear'],
    portrait_path: '/m/ariadne/img/ariadne-dig-a1-1120x1400.webp',
    display_order: 2,
    href: '/m/ariadne/',
  },
  {
    id: 'static-beckie',
    slug: 'beckie',
    name: 'Beckie',
    look: 'American',
    specialties: ['Body care', 'Haircare', 'Plus-size fashion', 'Resortwear', 'Hospitality'],
    portrait_path: '/m/beckie/img/beckie-portrait-960x1280.webp',
    display_order: 3,
    href: '/m/beckie/',
  },
  {
    // Not on the homepage roster cards (roster: false).
    id: 'static-athena',
    slug: 'athena',
    name: 'Athena',
    look: 'Italian-French',
    specialties: ['Skincare', 'Fragrance', 'Watches', 'Leather goods'],
    portrait_path: '/m/athena/img/athena-card-800x1000.webp',
    display_order: 4,
    href: '/m/athena/',
    roster: false,
  },
]

// Featured models ahead of the Supabase roster, same-slug rows dropped.
// { roster: true } is the homepage roster cards, which skip entries marked roster: false.
export function withFeatured(models: RosterModel[], { roster = false } = {}): RosterModel[] {
  const featured = FEATURED_MODELS.filter((m) => !roster || m.roster !== false)
  const slugs = new Set(FEATURED_MODELS.map((m) => m.slug))
  return [...featured, ...models.filter((m) => !slugs.has(m.slug))]
}
