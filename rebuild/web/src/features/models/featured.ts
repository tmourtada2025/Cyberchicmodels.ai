import type { RosterModel } from '../../lib/types'

// Models whose detail page is a finished static build under public/m/<slug>/, not the SPA profile route.
// Listed ahead of the Supabase roster; roster rows with the same slug are dropped to avoid duplicates.
export const FEATURED_MODELS: RosterModel[] = [
  {
    id: 'static-dalia',
    slug: 'dalia',
    name: 'Dalia',
    ethnicity: 'Levantine',
    specialties: ['Pro-age beauty', 'Fine jewellery', 'Luxury'],
    portrait_path: '/m/dalia/img/dalia-card-800x1000.webp',
    display_order: 1,
    href: '/m/dalia/',
  },
  {
    id: 'static-ariadne',
    slug: 'ariadne',
    name: 'Ariadne',
    ethnicity: 'Greek / Mediterranean',
    specialties: ['Wine', 'Hospitality', 'Resortwear'],
    portrait_path: '/m/ariadne/img/ariadne-dig-a1-1120x1400.webp',
    display_order: 2,
    href: '/m/ariadne/',
  },
]

export function withFeatured(models: RosterModel[]): RosterModel[] {
  const slugs = new Set(FEATURED_MODELS.map((m) => m.slug))
  return [...FEATURED_MODELS, ...models.filter((m) => !slugs.has(m.slug))]
}
