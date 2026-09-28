// Nav targets. PROVISIONAL: pages-build-spec.md (the route authority) was not in the repo
// at Stage 1 — reconcile these against it before any page is built.
export const NAV_LINKS = [
  { label: 'Roster', to: '/roster' },
  { label: 'Campaigns', to: '/campaigns' },
  { label: 'Licensing', to: '/licensing' },
] as const

export const PRIMARY_CTA = { label: 'Start a brief', to: '/brief' } as const
