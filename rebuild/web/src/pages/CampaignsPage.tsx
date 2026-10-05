import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/SectionHead'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { mediaUrl } from '../lib/media'
import { supabase } from '../lib/supabase'
import type { LabelValue, LayoutRow } from '../lib/types'
import { numberWord } from '../lib/words'
import '../features/site-pages/site-pages.css'

type Series = {
  id: string
  name: string
  heading_accent: string | null
  description: string
  location: string | null
  display_order: number
  layout: LayoutRow[] | null
  model: { id: string; name: string; slug: string; model_code: string | null; display_order: number; comp_stats: LabelValue[] }
}

type Pick = {
  model_id: string
  storage_path: string
  work_order: number
  work_alt: string | null
  work_caption_mark: string | null
  work_caption: string | null
}

// The Work page lists editorial series that have Work content (a description); others appear once it is written.
async function loadWork(): Promise<{ series: Series[]; picks: Pick[] }> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, heading_accent, description, location, display_order, layout, model:models(id, name, slug, model_code, display_order, comp_stats)')
    .eq('status', 'published')
    .eq('kind', 'editorial')
    .not('description', 'is', null)
  if (error) throw error
  const series = (data as unknown as Series[]).sort(
    (a, b) => a.display_order - b.display_order || a.model.display_order - b.model.display_order,
  )
  if (series.length === 0) return { series, picks: [] }

  const { data: picks, error: picksError } = await supabase
    .from('campaign_images')
    .select('model_id, storage_path, work_order, work_alt, work_caption_mark, work_caption')
    .not('work_order', 'is', null)
    .eq('storage_bucket', 'media')
    .in('model_id', series.map((s) => s.model.id))
    .order('work_order', { ascending: true })
  if (picksError) throw picksError
  return { series, picks: picks as Pick[] }
}

function Heading({ name, accent }: { name: string; accent: string | null }) {
  if (!accent || !name.endsWith(accent)) return <h2>{name}</h2>
  return <h2>{name.slice(0, name.length - accent.length)}<span className="l">{accent}</span></h2>
}

export function CampaignsPage() {
  useDocumentTitle('Campaigns')
  const work = useAsync('work', loadWork)
  const count = work.status === 'ready' ? work.data.series.length : 0
  const n = numberWord(count)

  return (
    <div className="sp sp-campaigns">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">Work</div>
        {work.status === 'ready' && count > 0 && <h1>{n} {count === 1 ? 'face' : 'faces'}. <span className="l">{n} {count === 1 ? 'world' : 'worlds'}.</span></h1>}
        <p className="lead">Each model gets one editorial series: one concept, one place, six or seven frames, shot in-house to show the face holding across light, wardrobe and distance.</p>
        <p className="muted small" style={{ maxWidth: '62ch' }}>These series are our own concept work, not client campaigns. Brand campaigns appear here once a client approves publication.</p>
      </div>

      <section className="wrap" aria-label="Editorial series" aria-busy={work.status === 'loading'}>
        {work.status === 'error' && <EmptyState title="Work unavailable">The series couldn&rsquo;t be loaded right now. Please try again shortly.</EmptyState>}
        {work.status === 'ready' &&
          work.data.series.map((s) => {
            const lanes = s.model.comp_stats.find((x) => x.label === 'Lanes')?.value
            const frames = (s.layout ?? []).reduce((total, row) => total + row.items.length, 0)
            return (
              <article key={s.id} className="series">
                <div className="meta">
                  <span className="sp-chip">Concept work</span>
                  <Heading name={s.name} accent={s.heading_accent} />
                  <p className="muted">{s.description}</p>
                  <dl>
                    <dt>Model</dt><dd>{s.model.name} · {s.model.model_code}</dd>
                    <dt>Frames</dt><dd>{frames}</dd>
                    {s.location && <><dt>Places</dt><dd>{s.location}</dd></>}
                    {lanes && <><dt>Lanes</dt><dd>{lanes}</dd></>}
                  </dl>
                  <div className="ctas"><Link className="pill lime" to={`/models/${s.model.slug}`}>See {s.model.name}</Link></div>
                </div>
                <div className="g3">
                  {work.data.picks.filter((p) => p.model_id === s.model.id).map((p) => (
                    <figure key={p.work_order}>
                      <div className="ph r45"><img src={mediaUrl(p.storage_path)} alt={p.work_alt ?? ''} /></div>
                      <figcaption>{p.work_caption_mark && <b>{p.work_caption_mark}</b>}{p.work_caption_mark && p.work_caption ? ' · ' : ''}{p.work_caption}</figcaption>
                    </figure>
                  ))}
                </div>
              </article>
            )
          })}
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>Your brand, <span className="l">her world</span></h2><p>Send the product, the audience and where it will run. We place the face in a world built for it and license the result.</p></div>
          <div className="ctas"><Link className="pill lime" to="/brief">Start a brief</Link><Link className="pill" to="/proof">How we keep the face</Link></div>
        </div>
      </section>
    </div>
  )
}
