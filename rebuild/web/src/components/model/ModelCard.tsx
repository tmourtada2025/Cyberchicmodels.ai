import { Link } from 'react-router-dom'
import { ORIGIN } from '../../features/models/featured'
import { portraitSrc } from '../../lib/media'
import type { RosterModel } from '../../lib/types'

type ModelCardProps = {
  model: RosterModel
  // Duplicate copies in the marquee loop are hidden from assistive tech and the tab order.
  duplicate?: boolean
  // Fill the grid cell instead of the fixed marquee width.
  fluid?: boolean
}

export function ModelCard({ model, duplicate = false, fluid = false }: ModelCardProps) {
  const alt = model.look ? `${model.name}, ${model.look}` : model.name
  const cardProps = {
    className: `card ${fluid ? 'is-fluid' : ''}`,
    'aria-hidden': duplicate || undefined,
    tabIndex: duplicate ? -1 : undefined,
  }

  const body = (
    <>
      <div className="card-tile">
        {model.portrait_path ? (
          <img
            src={portraitSrc({ href: model.href, portrait_path: model.portrait_path })}
            alt={duplicate ? '' : alt}
            loading="lazy"
          />
        ) : (
          <span className="card-pending label">Portrait pending</span>
        )}
        <div className="card-cover" />
      </div>
      <div className="card-meta">
        <span className="display card-name">{model.name}</span>
      </div>
      {/* Always rendered at a fixed two-line height, so cards with one specialty (or none) line up with the rest. */}
      <span className="label card-tags">{model.specialties.join(' · ') || ' '}</span>
      <span className="label card-look">
        {model.look ? `${model.look} · ${ORIGIN}` : ORIGIN}
      </span>
      <div className="card-bar" />
    </>
  )

  // Static model pages live outside the SPA, so they need a full page load, not a router transition.
  return model.href ? (
    <a href={model.href} {...cardProps}>
      {body}
    </a>
  ) : (
    <Link to={`/models/${model.slug}`} {...cardProps}>
      {body}
    </Link>
  )
}

export function ModelCardSkeleton({ fluid = false }: { fluid?: boolean }) {
  return (
    <div className={`card is-skeleton ${fluid ? 'is-fluid' : ''}`} aria-hidden="true">
      <div className="card-tile" />
      <div className="card-bar" />
    </div>
  )
}
