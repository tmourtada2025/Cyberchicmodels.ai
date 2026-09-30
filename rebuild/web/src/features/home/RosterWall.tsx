import type { RosterModel } from '../../lib/types'
import { ModelCard, ModelCardSkeleton } from '../../components/model/ModelCard'
import { EmptyState, SectionHead } from '../../components/ui/SectionHead'
import { withFeatured } from '../models/featured'

// Below this many published models a marquee looks sparse and repetitive; show a static row instead.
const MARQUEE_MIN = 8

type RosterWallProps =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; models: RosterModel[] }

export function RosterWall(props: RosterWallProps) {
  // Statically served models show regardless of roster state, so a Supabase outage never empties the wall.
  const models = withFeatured(props.status === 'ready' ? props.models : [])
  const isMarquee = props.status === 'ready' && models.length >= MARQUEE_MIN

  return (
    <section className="section" id="roster">
      <div className="container">
        <SectionHead
          title={
            <>
              The <em>roster</em>
            </>
          }
          side={`Identity-locked digital faces, each one licensed as a consistent identity.${isMarquee ? ' Hover to hold the wall.' : ''}`}
        />
      </div>
      <WallBody models={models} loading={props.status === 'loading'} />
    </section>
  )
}

function WallBody({ models, loading }: { models: RosterModel[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="container wall-static">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
        {Array.from({ length: 3 }, (_, i) => (
          <ModelCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (models.length === 0) {
    return (
      <div className="container">
        <EmptyState title="No published models yet">The roster appears here as each model is published.</EmptyState>
      </div>
    )
  }

  if (models.length < MARQUEE_MIN) {
    return (
      <div className="container wall-static">
        {models.map((m) => (
          <ModelCard key={m.id} model={m} />
        ))}
      </div>
    )
  }

  const half = Math.floor(models.length / 2)
  const rowB = [...models.slice(half), ...models.slice(0, half)]

  return (
    <div className="wall">
      <MarqueeRow models={models} direction="left" />
      <MarqueeRow models={rowB} direction="right" />
    </div>
  )
}

function MarqueeRow({ models, direction }: { models: RosterModel[]; direction: 'left' | 'right' }) {
  return (
    <div className={`marq marq-${direction}`}>
      {models.map((m) => (
        <ModelCard key={m.id} model={m} />
      ))}
      {models.map((m) => (
        <ModelCard key={`dup-${m.id}`} model={m} duplicate />
      ))}
    </div>
  )
}
