import { useEffect, useState } from 'react'
import { publishedModels } from '../../lib/roster'
import { supabase } from '../../lib/supabase'
import type { HomeCampaign, RosterModel } from '../../lib/types'

export type HomeData =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready'
      models: RosterModel[]
      modelCount: number
      campaigns: HomeCampaign[]
      campaignCount: number
    }

const WALL_LIMIT = 40
const CAMPAIGN_LIMIT = 3

// Read-only, published-only. RLS enforces visibility; the explicit status filters restate it.
async function loadHome(): Promise<HomeData> {
  const [models, campaigns] = await Promise.all([
    publishedModels().limit(WALL_LIMIT),
    supabase
      .from('campaigns')
      .select(
        'id, slug, name, description, model:models(name), images:campaign_images(storage_path, register, is_hero, display_order, alt_text)',
        { count: 'exact' },
      )
      .eq('status', 'published')
      .eq('images.storage_bucket', 'media')
      .order('display_order', { ascending: true })
      .limit(CAMPAIGN_LIMIT),
  ])

  if (models.error || campaigns.error) return { status: 'error' }

  return {
    status: 'ready',
    models: models.data as RosterModel[],
    modelCount: models.count ?? models.data.length,
    campaigns: campaigns.data as unknown as HomeCampaign[],
    campaignCount: campaigns.count ?? campaigns.data.length,
  }
}

export function useHomeData(): HomeData {
  const [data, setData] = useState<HomeData>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    loadHome()
      .catch((): HomeData => ({ status: 'error' }))
      .then((result) => {
        if (!cancelled) setData(result)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return data
}
