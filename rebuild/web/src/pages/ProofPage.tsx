import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/SectionHead'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { mediaUrl } from '../lib/media'
import { supabase } from '../lib/supabase'
import { numberWord } from '../lib/words'
import '../features/site-pages/site-pages.css'

type ProofRow = {
  panel: 'reference' | 'chart' | 'benchmark'
  frame_label: string | null
  score: number | null
  is_reference: boolean
  is_side_profile: boolean
  image_path: string | null
  alt_text: string | null
  display_order: number
  model: { name: string; slug: string } | null
}

type ChartRow = { name: string; scores: { v: number; side: boolean }[] }

// Rows are public only while their model is published (RLS); benchmark rows have no model.
async function loadProof(): Promise<ProofRow[]> {
  const { data, error } = await supabase
    .from('proof_scores')
    .select('panel, frame_label, score, is_reference, is_side_profile, image_path, alt_text, display_order, model:models(name, slug)')
    .order('display_order', { ascending: true })
  if (error) throw error
  return (data as unknown as ProofRow[]).map((r) => ({ ...r, score: r.score == null ? null : Number(r.score) }))
}

const fmt = (v: number) => v.toFixed(2)
const median = (vs: number[]) => {
  const s = [...vs].sort((a, b) => a - b), m = s.length
  return m % 2 ? s[(m - 1) / 2] : (s[m / 2 - 1] + s[m / 2]) / 2
}
const list = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`)

// Draws the dot chart exactly as the source page's script did; rows, band and median line come from the data.
function drawDots(svg: SVGSVGElement, rows: ChartRow[], diffMedian: number | null, band: number | null) {
  const NS = 'http://www.w3.org/2000/svg'
  const L = 96, R = 740, T = 20, rowH = 58, lo = 0, hi = 1
  const x = (v: number) => L + ((v - lo) / (hi - lo)) * (R - L)
  const el = (n: string, a: Record<string, string | number>, t?: string) => {
    const e = document.createElementNS(NS, n)
    for (const k in a) e.setAttribute(k, String(a[k]))
    if (t != null) e.textContent = t
    svg.appendChild(e)
    return e
  }
  svg.replaceChildren()
  const bottom = T + rowH * rows.length
  if (band != null) el('rect', { x: x(0), y: T - 6, width: x(band) - x(0), height: bottom - T + 6, fill: '#1E1E24' })
  if (diffMedian != null) {
    el('line', { x1: x(diffMedian), x2: x(diffMedian), y1: T - 6, y2: bottom, stroke: '#3A3A42', 'stroke-dasharray': '3 4' })
    el('text', { x: x(diffMedian) + 6, y: T + 6, fill: '#9A97A2', 'font-size': 11, 'font-family': 'Inter, sans-serif' }, `different models, median ${fmt(diffMedian)}`)
  }
  for (let t = 0; t <= 10; t += 2) {
    const v = t / 10
    el('line', { x1: x(v), x2: x(v), y1: bottom, y2: bottom + 6, stroke: '#3A3A42' })
    el('text', { x: x(v), y: bottom + 22, fill: '#9A97A2', 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif' }, v.toFixed(1))
  }
  el('line', { x1: L, x2: R, y1: bottom, y2: bottom, stroke: '#3A3A42' })
  el('text', { x: (L + R) / 2, y: bottom + 42, fill: '#9A97A2', 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif' }, 'Face-match score against her reference (0 to 1)')
  rows.forEach((row, i) => {
    const cy = T + rowH * i + rowH / 2
    el('text', { x: L - 14, y: cy + 4, fill: '#F7F5F1', 'font-size': 13, 'text-anchor': 'end', 'font-family': 'Inter, sans-serif', 'font-weight': 600 }, row.name)
    el('line', { x1: x(0), x2: R, y1: cy, y2: cy, stroke: '#26262C' })
    const med = median(row.scores.map((s) => s.v))
    row.scores.forEach(({ v, side }, j) => {
      const jitter = (((j * 37) % 9) - 4) * 2.2
      if (side) el('circle', { cx: x(v), cy: cy + jitter, r: 5, fill: 'none', stroke: '#C6FF3A', 'stroke-width': 2 })
      else el('circle', { cx: x(v), cy: cy + jitter, r: 5, fill: '#C6FF3A', 'fill-opacity': 0.85 })
    })
    el('line', { x1: x(med), x2: x(med), y1: cy - 16, y2: cy + 16, stroke: '#F7F5F1', 'stroke-width': 2 })
    el('text', { x: x(med), y: cy - 20, fill: '#F7F5F1', 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif' }, 'median ' + fmt(med))
  })
}

export function ProofPage() {
  useDocumentTitle('Proof')
  const proof = useAsync('proof', loadProof)

  if (proof.status === 'loading') return <div className="sp sp-proof" aria-busy="true" style={{ minHeight: '100vh' }} />
  if (proof.status === 'error') {
    return (
      <section className="section">
        <div className="container">
          <EmptyState title="Proof unavailable">The proof page couldn&rsquo;t be loaded right now. Please try again shortly.</EmptyState>
        </div>
      </section>
    )
  }
  return <ProofView rows={proof.data} />
}

function ProofView({ rows }: { rows: ProofRow[] }) {
  const dots = useRef<SVGSVGElement>(null)

  const reference = rows.filter((r) => r.panel === 'reference')
  const refFrame = reference.find((r) => r.is_reference)
  const scored = reference.filter((r) => !r.is_reference)
  const refModel = refFrame?.model

  // Chart rows grouped by model, in stored order.
  const chart: ChartRow[] = []
  for (const r of rows.filter((r) => r.panel === 'chart' && r.model && r.score != null)) {
    let row = chart.find((c) => c.name === r.model!.name)
    if (!row) chart.push((row = { name: r.model!.name, scores: [] }))
    row.scores.push({ v: r.score!, side: r.is_side_profile })
  }
  const all = chart.flatMap((c) => c.scores)
  const values = all.map((s) => s.v)
  const lowest = all.length ? all.reduce((a, b) => (b.v < a.v ? b : a)) : null
  const highest = values.length ? Math.max(...values) : null
  const [diffMedian, band] = rows.filter((r) => r.panel === 'benchmark').sort((a, b) => a.display_order - b.display_order)
  const bandPct = band?.frame_label?.match(/(\d+)%/)?.[1]

  useEffect(() => {
    if (dots.current) drawDots(dots.current, chart, diffMedian?.score ?? null, band?.score ?? null)
  })

  return (
    <div className="sp sp-proof">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">Proof</div>
        <h1>Same face. <span className="l">Measured.</span></h1>
        <p className="lead">A brand licenses a face, so the face has to hold in every image. We check every frame against the model's reference before it is released, and we publish the numbers.</p>
      </div>

      {refFrame && refModel && (
        <section className="wrap" aria-label="One reference, many scenes">
          <div className="head"><h2>One <span className="l">reference</span></h2><p>{refModel.name}'s {refFrame.frame_label?.toLowerCase()} is the reference. Each frame below is scored against it: 1.00 is the same photo, and photos of one person usually score above 0.50.</p></div>
          <div className="pair">
            <figure className="ref"><div className="ph r45"><img src={mediaUrl(refFrame.image_path!)} alt={refFrame.alt_text ?? ''} /></div><figcaption><b>Reference</b> · {refFrame.frame_label}</figcaption></figure>
            <div className="g3">
              {scored.map((r) => (
                <figure key={r.display_order}><div className="ph r45"><img src={mediaUrl(r.image_path!)} alt={r.alt_text ?? ''} /></div><figcaption>{r.frame_label} · <span className="score">{fmt(r.score!)}</span></figcaption></figure>
              ))}
            </div>
          </div>
          <div className="ctas" style={{ marginTop: 24 }}><Link className="pill lime" to={`/models/${refModel.slug}`}>See {refModel.name}</Link></div>
        </section>
      )}

      {chart.length > 0 && lowest && highest != null && (
        <section className="block">
          <div className="wrap">
            <div className="head"><h2>Every <span className="l">frame</span></h2><p>{all.length} published frames across {numberWord(chart.length).toLowerCase()} models, each scored against that model's own reference.</p></div>
            <div className="facts">
              <div className="fact"><b className="l">{fmt(median(values))}</b><span>Median score, same model across all {all.length} frames</span></div>
              {diffMedian?.score != null && <div className="fact"><b>{fmt(diffMedian.score)}</b><span>{diffMedian.frame_label}</span></div>}
              <div className="fact"><b>{fmt(lowest.v)}</b><span>Lowest same-model score{lowest.side ? ': a side profile, which face recognition reads least reliably' : ''}</span></div>
            </div>
            <div className="chart" role="img" aria-label={`Dot chart of face-match scores for ${list(chart.map((c) => c.name))}. Same-model frames score between ${fmt(lowest.v)} and ${fmt(highest)}.${band?.score != null ? ` Different models score below ${fmt(band.score)}${bandPct ? ` in ${bandPct} percent of pairs` : ''}.` : ''}`}>
              <svg ref={dots} id="dots" viewBox={`0 0 760 ${20 + 58 * chart.length + 48}`} aria-hidden="true" />
              <div className="legend"><span><i className="sw" />Frame scored against her reference</span><span><i className="sw o" />Side profile</span>{band?.frame_label && <span><i className="sw b" />{band.frame_label}</span>}</div>
            </div>
            <p className="method">Method: faces are detected and compared with an open face-recognition model (SFace, via OpenCV). Scores are cosine similarity between face signatures. Frames without a full face (lips-only crops, backs) are left out. Scores are a quality check, not a biometric identification.</p>
          </div>
        </section>
      )}

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>How a face <span className="l">stays locked</span></h2><p>The same five steps for every model on the roster.</p></div>
          <ol className="steps">
            <li><b>Face spec</b><p>An eight-part spec: face shape, cheekbones, chin, eyes, brows, nose, lips, one mark. No two models in a category share more than three.</p></li>
            <li><b>Master face</b><p>One approved close-up becomes her reference. It goes into every image she is ever generated in.</p></li>
            <li><b>Six digitals</b><p>Front, smile, three-quarter, profile, full length and back, in a plain studio. Buyers see these before anything styled.</p></li>
            <li><b>Frame check</b><p>Every new frame is scored against the reference and checked by eye. A frame that drifts is regenerated, not retouched.</p></li>
            <li><b>Rejects retired</b><p>A drifted frame is never used as a reference again, so errors cannot compound.</p></li>
          </ol>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>What your <span className="l">license</span> gets</h2><p>The same face in every image you license, the digitals and comp card with every booking, and new scenes on request.</p></div>
          <div className="ctas"><Link className="pill lime" to="/brief">Start a brief</Link><Link className="pill" to="/about">How licensing works</Link></div>
        </div>
      </section>
    </div>
  )
}
