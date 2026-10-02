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
  {
    // Not in the homepage hero drift wall (drift: false).
    id: 'static-michelle',
    slug: 'michelle',
    name: 'Michelle',
    look: 'Belgian',
    specialties: ['Haircare', 'Skincare', 'Denim', 'Eyewear'],
    portrait_path: '/m/michelle/img/michelle-card-800x1000.webp',
    display_order: 5,
    href: '/m/michelle/',
    drift: false,
  },
  {
    // /models and her page only: off the homepage roster cards and the hero drift wall.
    id: 'static-yasmin',
    slug: 'yasmin',
    name: 'Yasmin',
    look: 'Afro-Brazilian',
    specialties: ['Skincare', 'Haircare', 'Body care', 'Cosmetics'],
    portrait_path: '/m/yasmin/img/yasmin-card-800x1000.webp',
    display_order: 6,
    href: '/m/yasmin/',
    roster: false,
    drift: false,
  },
  {
    // Roster strip and /models; not in the hero drift wall (drift: false).
    id: 'static-trang',
    slug: 'trang',
    name: 'Trang',
    look: 'Vietnamese',
    specialties: ['Skincare', 'Haircare', 'Rainwear', 'Fragrance'],
    portrait_path: '/m/trang/img/trang-card-800x1000.webp',
    display_order: 7,
    href: '/m/trang/',
    roster: true,
    drift: false,
  },
  {
    // The hero drift wall uses her saffron wall tile (drift_path); roster strip and /models use the card.
    id: 'static-amara',
    slug: 'amara',
    name: 'Amara',
    look: 'Nigerian',
    specialties: ['Fine jewellery', 'Tailoring', 'Skincare', 'Eyewear'],
    portrait_path: '/m/amara/img/amara-card-800x1000.webp',
    drift_path: '/m/amara/img/amara-wall-800x1000.webp',
    display_order: 8,
    href: '/m/amara/',
    roster: true,
    drift: true,
  },
]

// Featured models ahead of the Supabase roster, same-slug rows dropped.
// { roster: true } is the homepage roster cards, which skip entries marked roster: false.
export function withFeatured(models: RosterModel[], { roster = false } = {}): RosterModel[] {
  const featured = FEATURED_MODELS.filter((m) => !roster || m.roster !== false)
  const slugs = new Set(FEATURED_MODELS.map((m) => m.slug))
  return [...featured, ...models.filter((m) => !slugs.has(m.slug))]
}
