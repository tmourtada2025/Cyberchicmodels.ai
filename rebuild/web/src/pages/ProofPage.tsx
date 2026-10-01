import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import '../features/site-pages/site-pages.css'

// Real scores, measured 2026-09-30. Index 2 in each list is the side-profile digital.
const DATA: [string, number[]][] = [
  ['Athena', [0.82, 0.83, 0.52, 0.84, 0.93, 0.9, 0.57, 0.69, 0.78, 0.8, 0.62, 0.8, 0.9]],
  ['Dalia', [0.91, 0.83, 0.6, 0.89, 0.86, 0.86, 0.87, 0.85, 0.78, 0.77, 0.74, 0.67, 0.76, 0.59]],
  ['Ariadne', [0.87, 0.77, 0.5, 0.72, 0.58, 0.64, 0.72, 0.72, 0.66]],
  ['Beckie', [0.89, 0.84, 0.55, 0.78, 0.86, 0.83, 0.88, 0.87, 0.81, 0.77, 0.73, 0.76, 0.82, 0.82, 0.63, 0.76]],
]

// Draws the dot chart exactly as the source page's script did.
function drawDots(svg: SVGSVGElement) {
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
  const bottom = T + rowH * DATA.length
  // band: different models, 95% of pairs below 0.53
  el('rect', { x: x(0), y: T - 6, width: x(0.53) - x(0), height: bottom - T + 6, fill: '#1E1E24' })
  el('line', { x1: x(0.35), x2: x(0.35), y1: T - 6, y2: bottom, stroke: '#3A3A42', 'stroke-dasharray': '3 4' })
  el('text', { x: x(0.35) + 6, y: T + 6, fill: '#9A97A2', 'font-size': 11, 'font-family': 'Inter, sans-serif' }, 'different models, median 0.35')
  // grid + axis
  for (let t = 0; t <= 10; t += 2) {
    const v = t / 10
    el('line', { x1: x(v), x2: x(v), y1: bottom, y2: bottom + 6, stroke: '#3A3A42' })
    el('text', { x: x(v), y: bottom + 22, fill: '#9A97A2', 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif' }, v.toFixed(1))
  }
  el('line', { x1: L, x2: R, y1: bottom, y2: bottom, stroke: '#3A3A42' })
  el('text', { x: (L + R) / 2, y: bottom + 42, fill: '#9A97A2', 'font-size': 12, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif' }, 'Face-match score against her reference (0 to 1)')
  DATA.forEach((row, i) => {
    const cy = T + rowH * i + rowH / 2
    el('text', { x: L - 14, y: cy + 4, fill: '#F7F5F1', 'font-size': 13, 'text-anchor': 'end', 'font-family': 'Inter, sans-serif', 'font-weight': 600 }, row[0])
    el('line', { x1: x(0), x2: R, y1: cy, y2: cy, stroke: '#26262C' })
    const sorted = row[1].slice().sort((a, b) => a - b), m = sorted.length
    const med = m % 2 ? sorted[(m - 1) / 2] : (sorted[m / 2 - 1] + sorted[m / 2]) / 2
    row[1].forEach((v, j) => {
      const jitter = (((j * 37) % 9) - 4) * 2.2
      if (j === 2) el('circle', { cx: x(v), cy: cy + jitter, r: 5, fill: 'none', stroke: '#C6FF3A', 'stroke-width': 2 })
      else el('circle', { cx: x(v), cy: cy + jitter, r: 5, fill: '#C6FF3A', 'fill-opacity': 0.85 })
    })
    el('line', { x1: x(med), x2: x(med), y1: cy - 16, y2: cy + 16, stroke: '#F7F5F1', 'stroke-width': 2 })
    el('text', { x: x(med), y: cy - 20, fill: '#F7F5F1', 'font-size': 11, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif' }, 'median ' + med.toFixed(2))
  })
}

// Verbatim port of rebuild/docs/site-pages/cyberchic-site-pages/proof.html.
export function ProofPage() {
  useDocumentTitle('Proof')
  const dots = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (dots.current) drawDots(dots.current)
  }, [])

  return (
    <div className="sp sp-proof">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">Proof</div>
        <h1>Same face. <span className="l">Measured.</span></h1>
        <p className="lead">A brand licenses a face, so the face has to hold in every image. We check every frame against the model's reference before it is released, and we publish the numbers.</p>
      </div>

      <section className="wrap" aria-label="One reference, many scenes">
        <div className="head"><h2>One <span className="l">reference</span></h2><p>Yasmin's front digital is the reference. Each frame below is scored against it: 1.00 is the same photo, and photos of one person usually score above 0.50.</p></div>
        <div className="pair">
          <figure className="ref"><div className="ph r45"><img src="/site/img/yasmin-dig-a1-1120x1400.webp" alt="Yasmin, front studio digital used as the reference" /></div><figcaption><b>Reference</b> · Front digital</figcaption></figure>
          <div className="g3">
            <figure><div className="ph r45"><img src="/site/img/yasmin-studio-cobalt-1024x1280.webp" alt="Yasmin beauty portrait on a cobalt studio backdrop" /></div><figcaption>Beauty, studio · <span className="score">0.90</span></figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/yasmin-midday-wall-1024x1280.webp" alt="Yasmin leaning on a teal wall in midday sun" /></div><figcaption>Midday sun · <span className="score">0.84</span></figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/yasmin-evening-street-1024x1280.webp" alt="Yasmin in a camel coat on a city street at evening" /></div><figcaption>Evening street · <span className="score">0.82</span></figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/yasmin-open-smile-1024x1280.webp" alt="Yasmin with a wide open smile on a peach backdrop" /></div><figcaption>Open smile · <span className="score">0.80</span></figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/yasmin-morning-cafe-1024x1280.webp" alt="Yasmin at a street cafe holding a white cup" /></div><figcaption>Morning café · <span className="score">0.80</span></figcaption></figure>
            <figure><div className="ph r45"><img src="/site/img/yasmin-golden-hour-steps-1024x1280.webp" alt="Yasmin in a cobalt dress on tiled steps at golden hour" /></div><figcaption>Golden hour · <span className="score">0.78</span></figcaption></figure>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>Every <span className="l">frame</span></h2><p>52 published frames across four models, each scored against that model's own reference.</p></div>
          <div className="facts">
            <div className="fact"><b className="l">0.78</b><span>Median score, same model across all 52 frames</span></div>
            <div className="fact"><b>0.35</b><span>Median score between two different models on our roster</span></div>
            <div className="fact"><b>0.50</b><span>Lowest same-model score: a side profile, which face recognition reads least reliably</span></div>
          </div>
          <div className="chart" role="img" aria-label="Dot chart of face-match scores for Athena, Dalia, Ariadne and Beckie. Same-model frames score between 0.50 and 0.93. Different models score below 0.53 in 95 percent of pairs.">
            <svg ref={dots} id="dots" viewBox="0 0 760 300" aria-hidden="true" />
            <div className="legend"><span><i className="sw" />Frame scored against her reference</span><span><i className="sw o" />Side profile</span><span><i className="sw b" />Where two different models land (95% of pairs)</span></div>
          </div>
          <p className="method">Method: faces are detected and compared with an open face-recognition model (SFace, via OpenCV). Scores are cosine similarity between face signatures. Frames without a full face (lips-only crops, backs) are left out. Scores are a quality check, not a biometric identification.</p>
        </div>
      </section>

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
