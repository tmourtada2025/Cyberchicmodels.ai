import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { loadCampaign } from '../features/campaigns/loaders'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { mediaUrl } from '../lib/media'
import type { CampaignDetail, CampaignImage } from '../lib/types'
import '../features/campaigns/campaigns.css'

export function CampaignDetailPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const modelSlug = params.get('model') || undefined
  const [attempt, setAttempt] = useState(0)
  const campaign = useAsync(JSON.stringify([slug, modelSlug, attempt]), () => loadCampaign(slug, modelSlug))
  useDocumentTitle(campaign.status === 'ready' && campaign.data ? campaign.data.name : 'Campaign')

  if (campaign.status !== 'ready' || !campaign.data) {
    const loading = campaign.status === 'loading'
    const error = campaign.status === 'error'
    return <section className="section"><div className="container campaign-state" aria-busy={loading}>
      <p className="label">Work</p>
      <h1 className="display">{loading ? 'Loading campaign…' : error ? 'Campaign unavailable' : 'Campaign not found'}</h1>
      <p role={error ? 'alert' : 'status'}>{loading ? 'Loading the published story and photography.' : error ? 'This campaign couldn’t be loaded right now. Please try again.' : 'No published campaign is available at this address. Open the campaign from its model profile or explore our concept work.'}</p>
      {error && <button className="btn btn-primary" onClick={() => setAttempt((value) => value + 1)}>Try again</button>}
      <Link className="label" to="/campaigns">← Explore work</Link>
    </div></section>
  }
  return <CampaignView key={`${campaign.data.id}:${attempt}`} campaign={campaign.data} />
}

function CampaignView({ campaign }: { campaign: CampaignDetail }) {
  const inquiry = `mailto:agent@cyberchicmodels.ai?subject=${encodeURIComponent(`Commercial inquiry: ${campaign.name}`)}&body=${encodeURIComponent(`I'm interested in discussing a project featuring ${campaign.model.name}, with reference to ${campaign.name}.\n\nCompany:\nProduct and intended use:\nTerritory:\nTimeline:\n`)}`
  return <article className="section campaign-detail"><div className="container">
    <header className="campaign-head">
      <Link className="label" to="/campaigns">← Explore work</Link>
      <p className="eyebrow label">Published portfolio</p>
      <h1 className="display">{campaign.name}</h1>
      {campaign.description && <p className="campaign-description">{campaign.description}</p>}
      <dl className="campaign-facts"><div><dt className="label">Model</dt><dd><Link to={`/models/${campaign.model.slug}`}>{campaign.model.name} →</Link></dd></div>
        {campaign.location && <div><dt className="label">Location</dt><dd>{campaign.location}</dd></div>}
      </dl>
      {campaign.narrative && <p className="campaign-narrative">{campaign.narrative}</p>}
    </header>
    {campaign.images.length ? <section className="campaign-gallery" aria-label="Campaign photography">
      {campaign.images.map((image, index) => <CampaignPhoto key={image.storage_path} image={image} name={campaign.name} index={index} />)}
    </section> : <p className="campaign-empty" role="status">Photography is not available for this campaign yet.</p>}
    <footer className="campaign-inquiry"><h2 className="display">Discuss your next campaign</h2><p>Tell us your product, intended use and timeline. Availability and commercial terms are confirmed individually.</p><a className="btn btn-primary" href={inquiry}>Commercial inquiry →</a></footer>
  </div></article>
}

function CampaignPhoto({ image, name, index }: { image: CampaignImage; name: string; index: number }) {
  const [failed, setFailed] = useState(false)
  return <figure>{failed ? <div className="campaign-empty" role="status">Image unavailable</div> : <img src={mediaUrl(image.storage_path)} alt={image.alt_text || `${name} — photograph ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} onError={() => setFailed(true)} />}
    {image.alt_text && <figcaption>{image.alt_text}</figcaption>}
  </figure>
}
