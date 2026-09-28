import type { RosterModel } from '../../lib/types'
import { ModelCard, ModelCardSkeleton } from '../../components/model/ModelCard'
import { EmptyState, SectionHead } from '../../components/ui/SectionHead'

// Below this many published models a marquee looks sparse and repetitive; show a static row instead.
const MARQUEE_MIN = 8

type RosterWallProps =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; models: RosterModel[] }

export function RosterWall(props: RosterWallProps) {
  const isMarquee = props.status === 'ready' && props.models.length >= MARQUEE_MIN

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
      <WallBody {...props} />
    </section>
  )
}

function WallBody(props: RosterWallProps) {
  if (props.status === 'loading') {
    return (
      <div className="container wall-static">
        {Array.from({ length: 5 }, (_, i) => (
          <ModelCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (props.status === 'error') {
    return (
      <div className="container">
        <EmptyState title="Roster unavailable">The roster couldn&rsquo;t be loaded right now. Please try again shortly.</EmptyState>
      </div>
    )
  }

  const { models } = props

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
