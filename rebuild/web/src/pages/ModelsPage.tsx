import { useSearchParams } from 'react-router-dom'
import { ModelCard, ModelCardSkeleton } from '../components/model/ModelCard'
import { EmptyState } from '../components/ui/SectionHead'
import { withFeatured } from '../features/models/featured'
import { loadRoster } from '../features/models/loaders'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { RosterModel } from '../lib/types'
import '../features/models/models.css'

type FilterKey = 'register'

type FilterDef = {
  key: FilterKey
  label: string
  values: (m: RosterModel) => string[]
}

// Category chips come from models.specialties, so new categories appear as soon as rows carry them.
// Ethnicity and gender filters were dropped by owner decision (roster is currently all female);
// ethnicity still shows as a tag on every card.
const FILTERS: FilterDef[] = [{ key: 'register', label: 'Category', values: (m) => m.specialties }]

export function ModelsPage() {
  useDocumentTitle('Models')
  const roster = useAsync('roster', loadRoster)
  // Statically served models show regardless of roster state, so a Supabase outage never empties the page.
  const models = withFeatured(roster.status === 'ready' ? roster.data.models : [])

  return (
    <section className="section models-page">
      <div className="container is-wide">
        <header className="page-head">
          <span className="eyebrow label">Roster</span>
          <h1 className="display page-title">
            The <em>models</em>
          </h1>
          <p className="page-lede">
            Identity-locked digital models, each licensed as one consistent face across every scene.
            {roster.status === 'ready' && <> {models.length} published.</>}
          </p>
        </header>

        {roster.status === 'loading' ? (
          <div className="models-grid" aria-busy="true">
            {models.map((m) => (
              <ModelCard key={m.id} model={m} fluid />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <ModelCardSkeleton key={i} fluid />
            ))}
          </div>
        ) : (
          <RosterBrowser models={models} />
        )}
      </div>
    </section>
  )
}

function RosterBrowser({ models }: { models: RosterModel[] }) {
  const [params, setParams] = useSearchParams()

  if (models.length === 0) {
    return <EmptyState title="No published models yet">The roster appears here as each model is published.</EmptyState>
  }

  const active = Object.fromEntries(FILTERS.map((f) => [f.key, params.get(f.key)])) as Record<FilterKey, string | null>
  const matches = (m: RosterModel, skip?: FilterKey) =>
    FILTERS.every((f) => f.key === skip || !active[f.key] || f.values(m).includes(active[f.key]!))
  const visible = models.filter((m) => matches(m))
  const hasFilters = FILTERS.some((f) => active[f.key])

  const setFilter = (key: FilterKey, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      <div className="filters">
        {FILTERS.map((f) => {
          // Counts reflect the other active filters, so a chip never promises results it can't show.
          const counts = new Map<string, number>()
          for (const m of models.filter((m) => matches(m, f.key))) {
            for (const v of new Set(f.values(m))) counts.set(v, (counts.get(v) ?? 0) + 1)
          }
          const options = [...counts.keys()].sort((a, b) => a.localeCompare(b))
          if (options.length < 2 && !active[f.key]) return null

          return (
            <div key={f.key} className="filter-group" role="group" aria-label={f.label}>
              <div className="filter-chips">
                <button
                  type="button"
                  className="chip label"
                  aria-pressed={!active[f.key]}
                  onClick={() => setFilter(f.key, null)}
                >
                  All
                  <span className="chip-count">{models.filter((m) => matches(m, f.key)).length}</span>
                </button>
                {options.map((v) => {
                  const on = active[f.key] === v
                  return (
                    <button
                      key={v}
                      type="button"
                      className="chip label"
                      aria-pressed={on}
                      onClick={() => setFilter(f.key, on ? null : v)}
                    >
                      {v}
                      <span className="chip-count">{counts.get(v)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="results-bar">
        <span className="label results-count" aria-live="polite">
          {visible.length} of {models.length}
        </span>
        {hasFilters && (
          <button type="button" className="link-button label" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No models match these filters">Try removing a filter to widen the roster.</EmptyState>
      ) : (
        <div className="models-grid">
          {visible.map((m) => (
            <ModelCard key={m.id} model={m} fluid />
          ))}
        </div>
      )}
    </>
  )
}
