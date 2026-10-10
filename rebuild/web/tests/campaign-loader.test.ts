import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadCampaign } from '../src/features/campaigns/loaders'
const { query, from } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), limit: vi.fn() }
  return { query, from: vi.fn(() => query) }
})
vi.mock('../src/lib/supabase', () => ({ supabase: { from } }))
beforeEach(() => { vi.clearAllMocks(); query.select.mockReturnValue(query); query.eq.mockReturnValue(query) })
describe('published campaign loader', () => {
  it('restricts published models/campaigns and public media; scopes duplicate slugs and sorts by gallery order, not hero', async () => {
    query.limit.mockResolvedValue({ data: [{ id: '1', images: [
      { storage_path: 'last', display_order: 2, is_hero: true },
      { storage_path: 'first', display_order: 1, is_hero: false },
      { storage_path: '', display_order: 0 },
    ] }], error: null })
    expect((await loadCampaign('story', 'athena'))?.images.map(i => i.storage_path)).toEqual(['first', 'last'])
    for (const args of [['status', 'published'], ['model.roster_status', 'published'], ['images.storage_bucket', 'media'], ['model.slug', 'athena']]) expect(query.eq).toHaveBeenCalledWith(...args)
    expect(query.eq).toHaveBeenCalledWith('slug', 'story')
  })
  it.each([[], [{ id: '1' }, { id: '2' }]])('returns no detail for invisible/unknown or ambiguous records', async (data) => {
    query.limit.mockResolvedValue({ data, error: null })
    expect(await loadCampaign('unknown')).toBeNull()
  })
  it('propagates database errors for the retry state', async () => {
    query.limit.mockResolvedValue({ data: null, error: new Error('database') })
    await expect(loadCampaign('story')).rejects.toThrow('database')
  })
})
