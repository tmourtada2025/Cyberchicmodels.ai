import { Link } from 'react-router-dom'
import { mediaUrl } from '../../lib/media'
import type { RosterModel } from '../../lib/types'

type ModelCardProps = {
  model: RosterModel
  // Duplicate copies in the marquee loop are hidden from assistive tech and the tab order.
  duplicate?: boolean
}

export function ModelCard({ model, duplicate = false }: ModelCardProps) {
  const register = model.specialties[0]
  const alt = model.ethnicity ? `${model.name}, ${model.ethnicity}` : model.name

  return (
    <Link
      to={`/models/${model.slug}`}
      className="card"
      aria-hidden={duplicate || undefined}
      tabIndex={duplicate ? -1 : undefined}
    >
      <div className="card-tile">
        {model.portrait_path ? (
          <img src={mediaUrl(model.portrait_path)} alt={duplicate ? '' : alt} loading="lazy" />
        ) : (
          <span className="card-pending label">Portrait pending</span>
        )}
        <div className="card-cover" />
      </div>
      <div className="card-meta">
        <span className="display card-name">{model.name}</span>
        {register && <span className="label card-register">{register}</span>}
      </div>
      {model.ethnicity && <span className="label card-ethnicity">{model.ethnicity}</span>}
      <div className="card-bar" />
    </Link>
  )
}

export function ModelCardSkeleton() {
  return (
    <div className="card is-skeleton" aria-hidden="true">
      <div className="card-tile" />
      <div className="card-bar" />
    </div>
  )
}
