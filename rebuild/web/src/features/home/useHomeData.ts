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
// "In campaign" and its metric count client campaigns only (kind 'client'). Editorial series are concept
// work and never count as campaigns here; range and digitals are model-page sections.
async function loadHome(): Promise<HomeData> {
  const [models, campaigns] = await Promise.all([
    publishedModels().limit(WALL_LIMIT),
    supabase
      .from('campaigns')
      .select(
        'id, slug, name, anchor, model:models(name, slug, display_order), images:campaign_images(storage_path, register, is_hero, display_order, alt_text)',
      )
      .eq('status', 'published')
      .eq('kind', 'client')
      .eq('images.storage_bucket', 'media'),
  ])

  if (models.error || campaigns.error) return { status: 'error' }

  const client = (campaigns.data as unknown as HomeCampaign[]).sort(
    (a, b) => (a.model?.display_order ?? 0) - (b.model?.display_order ?? 0),
  )

  return {
    status: 'ready',
    models: models.data as unknown as RosterModel[],
    modelCount: models.count ?? models.data.length,
    campaigns: client.slice(0, CAMPAIGN_LIMIT),
    campaignCount: client.length,
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
