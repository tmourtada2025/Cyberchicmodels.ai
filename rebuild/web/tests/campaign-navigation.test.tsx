import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import App from '../src/App'
import { CampaignBlock } from '../src/components/campaign/CampaignBlock'
import { CampaignDetailPage } from '../src/pages/CampaignDetailPage'
import { loadCampaign } from '../src/features/campaigns/loaders'
vi.mock('../src/features/campaigns/loaders', () => ({ loadCampaign: vi.fn() }))
const campaign = { id: '1', slug: 'story', name: 'A published story', description: 'Recorded description', narrative: null, location: 'Recorded location', model: { slug: 'athena', name: 'Athena' }, images: [{ storage_path: 'campaigns/athena/story/first.webp', display_order: 1, is_hero: false, alt_text: 'First frame', register: 'editorial' as const }] }
beforeEach(() => { vi.mocked(loadCampaign).mockReset(); vi.mocked(loadCampaign).mockResolvedValue(campaign); window.history.replaceState({}, '', '/') })
it('published profile cards navigate to the real detail route with model context', async () => {
  render(<MemoryRouter><Routes><Route path="/" element={<CampaignBlock slug="story" name="A published story" images={[]} modelSlug="athena" />} /><Route path="/campaigns/:slug" element={<CampaignDetailPage />} /></Routes></MemoryRouter>)
  await userEvent.click(screen.getByRole('link', { name: 'A published story' }))
  expect(await screen.findByRole('heading', { name: 'A published story' })).toBeTruthy()
  expect(loadCampaign).toHaveBeenCalledWith('story', 'athena')
  expect(screen.getByRole('link', { name: 'Athena →' }).getAttribute('href')).toBe('/models/athena')
  const inquiry = screen.getByRole('link', { name: 'Commercial inquiry →' }).getAttribute('href')!
  expect(decodeURIComponent(inquiry)).toContain('Commercial inquiry: A published story')
  expect(screen.getByText('Recorded description')).toBeTruthy()
})
it('App wires direct campaign URLs to detail, not the generic placeholder', async () => {
  window.history.replaceState({}, '', '/campaigns/story')
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'A published story' })).toBeTruthy()
})
it('handles unknown or unpublished campaigns without invented content', async () => {
  vi.mocked(loadCampaign).mockResolvedValue(null)
  render(<MemoryRouter><CampaignDetailPage /></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: 'Campaign not found' })).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Commercial inquiry →' })).toBeNull()
})
it('retries database failures', async () => {
  vi.mocked(loadCampaign).mockRejectedValueOnce(new Error('private database details'))
  render(<MemoryRouter><CampaignDetailPage /></MemoryRouter>)
  await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))
  expect(await screen.findByRole('heading', { name: campaign.name })).toBeTruthy()
  expect(screen.queryByText('private database details')).toBeNull()
})
it('handles empty galleries and broken public images', async () => {
  const view = render(<MemoryRouter><CampaignDetailPage /></MemoryRouter>)
  fireEvent.error(await screen.findByAltText('First frame'))
  expect(screen.getByText('Image unavailable')).toBeTruthy()
  view.unmount()
  vi.mocked(loadCampaign).mockResolvedValue({ ...campaign, images: [] })
  render(<MemoryRouter><CampaignDetailPage /></MemoryRouter>)
  expect(await screen.findByText('Photography is not available for this campaign yet.')).toBeTruthy()
})
it('shows loading and ignores stale results when navigating between slugs', async () => {
  let finish!: (value: typeof campaign) => void
  vi.mocked(loadCampaign).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  render(<MemoryRouter initialEntries={['/campaigns/old']}><Link to="/campaigns/new">Next campaign</Link><Routes><Route path="/campaigns/:slug" element={<CampaignDetailPage />} /></Routes></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Loading campaign…' })).toBeTruthy()
  vi.mocked(loadCampaign).mockResolvedValue({ ...campaign, id: '2', name: 'New story' })
  await userEvent.click(screen.getByRole('link', { name: 'Next campaign' }))
  expect(await screen.findByRole('heading', { name: 'New story' })).toBeTruthy()
  finish(campaign)
  await waitFor(() => expect(screen.queryByRole('heading', { name: campaign.name })).toBeNull())
})
