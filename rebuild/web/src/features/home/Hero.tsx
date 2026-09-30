import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { portraitSrc } from '../../lib/media'
import type { RosterModel } from '../../lib/types'
import { withFeatured } from '../models/featured'

const PHRASES = ['Careers that do.', 'Campaigns that sell.', 'Faces you license.']
const CYCLE_MS = 2600
const FADE_MS = 300
const DRIFT_COLUMNS = 3
const PER_COLUMN = 4
// Two faces are enough: columns are offset so neighbours never show the same face side by side.
const DRIFT_MIN = 2

type Metric = { value: number; label: string }

type HeroProps = {
  models: RosterModel[]
  metrics: Metric[]
}

export function Hero({ models, metrics }: HeroProps) {
  const portraits = withFeatured(models).filter((m) => m.portrait_path)

  return (
    <section className="hero">
      {portraits.length >= DRIFT_MIN && <HeroDrift portraits={portraits} />}
      <div className="container hero-inner">
        <span className="eyebrow label">AI model agency · Licensed digital talent</span>
        <h1 className="display hero-title">
          Faces that
          <br />
          don&rsquo;t exist.
          <CyclingLine />
        </h1>
        <p className="hero-sub">
          A roster of identity-locked digital models — one consistent face across every scene and every
          campaign, licensed to your brand.
        </p>
        <div className="cta-row">
          <Link to="/models" className="btn btn-primary">
            Explore the models →
          </Link>
          <Link to="/brief" className="btn btn-ghost">
            Start a brief
          </Link>
        </div>
        {metrics.length > 0 && (
          <dl className="metrics">
            {metrics.map((m) => (
              <div key={m.label} className="metric">
                <dd className="display metric-value">{m.value}</dd>
                <dt className="label metric-label">{m.label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}

function CyclingLine() {
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (reduced) return
    let fade: number | undefined
    const tick = window.setInterval(() => {
      setLeaving(true)
      fade = window.setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length)
        setLeaving(false)
      }, FADE_MS)
    }, CYCLE_MS)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(fade)
    }
  }, [reduced])

  return (
    <span className="hero-cycle" aria-live="off">
      <span className={leaving ? 'is-leaving' : undefined}>{PHRASES[reduced ? 0 : index]}</span>
    </span>
  )
}

// Drifting portrait columns behind the hero. Real published portraits only — never placeholders.
function HeroDrift({ portraits }: { portraits: RosterModel[] }) {
  const columns = Array.from({ length: DRIFT_COLUMNS }, (_, c) =>
    Array.from({ length: PER_COLUMN }, (_, i) => portraits[(c * PER_COLUMN + c + i) % portraits.length]),
  )

  return (
    <div className="hero-drift" aria-hidden="true">
      {columns.map((col, c) => (
        <div key={c} className={`hero-drift-col ${c % 2 ? 'is-down' : 'is-up'}`}>
          {[...col, ...col].map((m, i) => (
            <div key={i} className="hero-drift-tile">
              <img src={portraitSrc({ href: m.href, portrait_path: m.portrait_path! })} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
