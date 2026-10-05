import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BOOKING_EMAIL } from '../config/site'
import { loadLicensing } from '../features/licensing/loaders'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { numberWord } from '../lib/words'
import '../features/site-pages/site-pages.css'

// Licensing comparison from license_tiers + license_features: one column per active tier, one row per feature,
// then the tier's "from" price. Renders whatever rows exist; nothing is filled in when a value is missing.
function LicensingSection() {
  const licensing = useAsync('licensing', loadLicensing)
  if (licensing.status !== 'ready' || licensing.data.tiers.length === 0) return null
  const { tiers, features } = licensing.data

  return (
    <section className="block" id="licensing">
      <div className="wrap">
        <div className="head"><h2>Licen<span className="l">sing</span></h2><p>{numberWord(tiers.length)} levels. Every license names the model, the images, the media, the term and the territory. Fees are quoted per brief.</p></div>
        <div className="tiers-wrap">
          <table>
            <thead><tr><th scope="col">Level</th>{tiers.map((t) => <th key={t.id} scope="col">{t.name}</th>)}</tr></thead>
            <tbody>
              {features.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{f.label}</th>
                  {tiers.map((t) => {
                    const v = f.values.find((x) => x.license_tier_id === t.id)
                    return <td key={t.id}>{v ? (v.value_note ?? (v.is_included ? 'Included' : 'Not included')) : ''}</td>
                  })}
                </tr>
              ))}
              <tr><th scope="row">Fee</th>{tiers.map((t) => <td key={t.id}>{t.price_display}</td>)}</tr>
            </tbody>
          </table>
        </div>
        <p className="muted small" style={{ marginTop: 16 }}>Motion: animated stills are available on request with any level.</p>
      </div>
    </section>
  )
}

// Verbatim port of rebuild/docs/site-pages/cyberchic-site-pages/about.html.
export function AboutPage() {
  useDocumentTitle('About')
  const mail = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)

  // Same behaviour as the source script: copy, or select the address if the clipboard is unavailable.
  const copy = () => {
    const node = mail.current
    if (!node) return
    const select = () => {
      const r = document.createRange()
      r.selectNodeContents(node)
      const s = getSelection()
      s?.removeAllRanges()
      s?.addRange(r)
    }
    const done = () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
    try {
      navigator.clipboard.writeText(node.textContent ?? '').then(done, select)
    } catch {
      select()
    }
  }

  return (
    <div className="sp sp-about">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">About</div>
        <h1>A model agency for <span className="l">faces that don't exist.</span></h1>
      </div>

      <section className="wrap two" aria-label="What we are">
        <p className="lead">CyberChic represents AI-generated models. Each one is a single, locked face that a brand can license like talent: booked for a brief, used on agreed terms, the same in every image.</p>
        <div className="muted">
          <p>No real person is photographed, copied or depicted. Every face on the roster is built from a written spec and checked against the rest of the roster so no two look alike.</p>
          <p>What we sell is reliability: the face a brand approves on day one is the face in the last image of the campaign. The <Link to="/proof">Proof</Link> page shows how we measure that.</p>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>How a <span className="l">booking</span> works</h2><p>From brief to licensed images, run by one agent.</p></div>
          <ol className="flow">
            <li><b>Brief</b><p>You send the product, the audience, where the images will run and for how long.</p></li>
            <li><b>Match</b><p>We propose one or two faces from the roster, with digitals and comp cards.</p></li>
            <li><b>Produce</b><p>We create the frames in her world, built around your product. You review and request changes.</p></li>
            <li><b>License</b><p>You receive final files and a license for the agreed use, term and territory.</p></li>
          </ol>
        </div>
      </section>

      <LicensingSection />

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>Rules we <span className="l">keep</span></h2><p>They apply to every model and every license.</p></div>
          <ul className="rules">
            <li><b>No real person</b><span>No face is built from, or made to resemble, a real person.</span></li>
            <li><b>Disclosed as AI</b><span>Every model is presented as AI-generated. Licensees keep that disclosure where the law requires it.</span></li>
            <li><b>Adults only</b><span>Every model is an adult and reads as one; models shown with alcohol read 25 or older.</span></li>
            <li><b>No false testimony</b><span>A model cannot be presented as a real customer, a real review or a before-and-after result.</span></li>
            <li><b>Excluded uses</b><span>No political, adult, tobacco or weapons advertising, and no use that demeans a group.</span></li>
            <li><b>Your brand only</b><span>We add no third-party logos or products to your images.</span></li>
          </ul>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="head"><h2>Talk to the <span className="l">agent</span></h2><p>Send a brief or ask a question. We reply with availability, terms and a quote.</p></div>
          <div className="ctas" style={{ marginBottom: 20 }}><Link className="pill lime" to="/brief">Start a brief</Link></div>
          <div className="mail">Email: <code ref={mail} id="mail">{BOOKING_EMAIL}</code><button className="pill" id="copy" type="button" style={{ minHeight: 36, padding: '0 14px' }} onClick={copy}>{copied ? 'Copied' : 'Copy'}</button></div>
        </div>
      </section>
    </div>
  )
}
