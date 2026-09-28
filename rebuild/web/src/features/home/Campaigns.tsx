import { Link } from 'react-router-dom'
import { mediaUrl } from '../../lib/media'
import type { CampaignImage, HomeCampaign } from '../../lib/types'
import { EmptyState, SectionHead } from './SectionHead'

type CampaignsProps =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; campaigns: HomeCampaign[] }

export function Campaigns(props: CampaignsProps) {
  return (
    <section className="section" id="campaigns">
      <div className="container">
        <SectionHead
          title={
            <>
              In <em>campaign</em>
            </>
          }
          side="One model. One documented campaign. Wardrobe locked, accessories locked."
        />
        <CampaignsBody {...props} />
      </div>
    </section>
  )
}

function CampaignsBody(props: CampaignsProps) {
  if (props.status === 'loading') {
    return (
      <div className="cams cams-3 is-skeleton" aria-hidden="true">
        <div className="cam cam-tall" />
        <div className="cam" />
        <div className="cam" />
      </div>
    )
  }

  if (props.status === 'error') {
    return <EmptyState title="Campaigns unavailable">Campaigns couldn&rsquo;t be loaded right now. Please try again shortly.</EmptyState>
  }

  const { campaigns } = props

  if (campaigns.length === 0) {
    return <EmptyState title="No published campaigns yet">Campaigns appear here as each one is published.</EmptyState>
  }

  return (
    <div className={`cams cams-${campaigns.length}`}>
      {campaigns.map((c, i) => (
        <CampaignBlock key={c.id} campaign={c} tall={campaigns.length === 3 && i === 0} />
      ))}
    </div>
  )
}

// Hero-flagged image first, then curated order.
function coverImage(images: CampaignImage[]): CampaignImage | undefined {
  return [...images].sort((a, b) => Number(b.is_hero) - Number(a.is_hero) || a.display_order - b.display_order)[0]
}

function CampaignBlock({ campaign, tall }: { campaign: HomeCampaign; tall: boolean }) {
  const cover = coverImage(campaign.images)
  const kicker = [cover?.register, campaign.model?.name].filter(Boolean).join(' · ')

  return (
    <Link to={`/campaigns/${campaign.slug}`} className={`cam ${tall ? 'cam-tall' : ''}`}>
      {cover && (
        <img className="cam-img" src={mediaUrl(cover.storage_path)} alt={cover.alt_text ?? ''} loading="lazy" />
      )}
      <div className="cam-shade" />
      <div className="cam-txt">
        {kicker && <div className="label cam-kicker">{kicker}</div>}
        <div className="display cam-title">{campaign.name}</div>
      </div>
    </Link>
  )
}
