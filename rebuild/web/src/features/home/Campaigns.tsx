import { CampaignBlock } from '../../components/campaign/CampaignBlock'
import { EmptyState, SectionHead } from '../../components/ui/SectionHead'
import type { HomeCampaign } from '../../lib/types'

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
        <CampaignBlock
          key={c.id}
          slug={c.slug}
          name={c.name}
          images={c.images}
          modelName={c.model?.name}
          tall={campaigns.length === 3 && i === 0}
        />
      ))}
    </div>
  )
}
