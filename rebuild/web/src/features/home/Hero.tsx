import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { mediaUrl } from '../../lib/media'
import type { RosterModel } from '../../lib/types'

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

// Wall order is models.wall_order when set, else display_order (the roster order). Lets a tile be
// placed away from a same-coloured neighbour without moving the model on the strip or /models.
function wallKey(m: RosterModel) {
  return m.wall_order ?? m.display_order
}

export function Hero({ models, metrics }: HeroProps) {
  const portraits = models
    .filter((m) => m.on_hero_wall && (m.wall_path ?? m.portrait_path))
    .sort((a, b) => wallKey(a) - wallKey(b) || a.display_order - b.display_order)

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

// Shortest column (at least PER_COLUMN) whose offset walk shows every portrait. The walk skips
// one index per column step, so some roster sizes (e.g. 10) would otherwise drop two faces.
function columnLength(count: number) {
  for (let per = PER_COLUMN; ; per++) {
    const seen = new Set<number>()
    for (let c = 0; c < DRIFT_COLUMNS; c++) for (let i = 0; i < per; i++) seen.add((c * per + c + i) % count)
    if (seen.size === count) return per
  }
}

// Drifting portrait columns behind the hero. Real published portraits only — never placeholders.
function HeroDrift({ portraits }: { portraits: RosterModel[] }) {
  const per = columnLength(portraits.length)
  const columns = Array.from({ length: DRIFT_COLUMNS }, (_, c) =>
    Array.from({ length: per }, (_, i) => portraits[(c * per + c + i) % portraits.length]),
  )

  return (
    <div className="hero-drift" aria-hidden="true">
      {columns.map((col, c) => (
        <div key={c} className={`hero-drift-col ${c % 2 ? 'is-down' : 'is-up'}`}>
          {[...col, ...col].map((m, i) => (
            <div key={i} className="hero-drift-tile">
              <img src={mediaUrl(m.wall_path ?? m.portrait_path!)} alt="" loading="lazy" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
