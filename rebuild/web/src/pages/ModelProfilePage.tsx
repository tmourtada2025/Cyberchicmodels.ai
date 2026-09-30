import { Link, useParams } from 'react-router-dom'
import { CampaignBlock } from '../components/campaign/CampaignBlock'
import { EmptyState, SectionHead } from '../components/ui/SectionHead'
import { ORIGIN } from '../features/models/featured'
import { loadProfile, type Profile } from '../features/models/loaders'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { mediaUrl } from '../lib/media'
import { PlaceholderPage } from './PlaceholderPage'
import '../features/models/models.css'

export function ModelProfilePage() {
  const { slug = '' } = useParams()
  const profile = useAsync(`profile:${slug}`, () => loadProfile(slug))

  if (profile.status === 'loading') {
    return (
      <section className="section">
        <div className="container profile is-skeleton" aria-busy="true">
          <div className="profile-portrait" />
        </div>
      </section>
    )
  }

  if (profile.status === 'error') {
    return (
      <section className="section">
        <div className="container">
          <EmptyState title="Profile unavailable">This profile couldn&rsquo;t be loaded right now. Please try again shortly.</EmptyState>
        </div>
      </section>
    )
  }

  if (!profile.data) {
    return <PlaceholderPage eyebrow="404" title="Model not found" body="This model isn't on the published roster." />
  }

  return <ProfileView profile={profile.data} />
}

function ageRange(min: number | null, max: number | null): string | null {
  if (min && max) return min === max ? `${min}` : `${min}–${max}`
  return min ? `${min}+` : null
}

function ProfileView({ profile }: { profile: NonNullable<Profile> }) {
  const { model, campaigns } = profile
  useDocumentTitle(model.name)
  const age = ageRange(model.age_range_min, model.age_range_max)

  const facts = [
    { k: 'Look', v: model.look },
    { k: 'Origin', v: ORIGIN },
    { k: 'Age range', v: age },
  ].filter((f): f is { k: string; v: string } => Boolean(f.v))

  return (
    <>
      <section className="section">
        <div className="container profile">
          <div className="profile-portrait">
            {model.portrait_path ? (
              <img src={mediaUrl(model.portrait_path)} alt={model.look ? `${model.name}, ${model.look}` : model.name} />
            ) : (
              <span className="card-pending label">Portrait pending</span>
            )}
          </div>

          <div className="profile-info">
            <Link to="/models" className="label back-link">
              ← All models
            </Link>
            {model.look && <span className="eyebrow label">{model.look}</span>}
            <h1 className="display profile-name">{model.name}</h1>

            {facts.length > 0 && (
              <dl className="profile-facts">
                {facts.map((f) => (
                  <div key={f.k}>
                    <dt className="label">{f.k}</dt>
                    <dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {model.specialties.length > 0 && (
              <div className="profile-registers" aria-label="Categories">
                <div className="filter-chips">
                  {model.specialties.map((s) => (
                    <span key={s} className="chip label is-static">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="cta-row">
              <Link to={`/brief?model=${encodeURIComponent(model.slug)}`} className="btn btn-primary">
                License this face →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section profile-campaigns">
        <div className="container">
          <SectionHead
            title={
              <>
                In <em>campaign</em>
              </>
            }
          />
          {campaigns.length === 0 ? (
            <EmptyState title="No published campaigns yet">
              {model.name}&rsquo;s campaigns appear here as each one is published.
            </EmptyState>
          ) : (
            <div className={`cams cams-${Math.min(campaigns.length, 2)}`}>
              {campaigns.map((c) => (
                <CampaignBlock key={c.id} slug={c.slug} name={c.name} images={c.images} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
