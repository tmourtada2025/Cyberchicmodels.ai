import { useState, type FormEvent } from 'react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { supabase } from '../lib/supabase'
import '../features/site-pages/site-pages.css'

const REQUIRED = ['company_name', 'contact_name', 'contact_email'] as const

type Status = { tone: 'info' | 'error'; text: string } | null

// Verbatim port of rebuild/docs/site-pages/cyberchic-site-pages/brief.html.
// The source form was preview-only; here it posts to the `submit-brief` Edge Function, which emails
// agent@cyberchicmodels.ai. Only the public anon key is used client-side.
export function BriefPage() {
  useDocumentTitle('Start a brief')
  const [status, setStatus] = useState<Status>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const bad: string[] = []
    for (const id of REQUIRED) {
      const el = form.elements.namedItem(id) as HTMLInputElement
      if (!el.value.trim() || !el.checkValidity()) bad.push(el.labels?.[0]?.childNodes[0]?.textContent?.trim() ?? id)
    }
    if (bad.length) {
      setStatus({ tone: 'error', text: 'Add ' + bad.join(', ') + ' to send the brief.' })
      return
    }

    setSending(true)
    setStatus({ tone: 'info', text: 'Sending your brief…' })
    const fields = Object.fromEntries(new FormData(form).entries())
    const { data, error } = await supabase.functions.invoke('submit-brief', { body: fields })
    setSending(false)
    if (error || !data?.ok) {
      setStatus({ tone: 'error', text: "The brief didn't send. Please try again, or email agent@cyberchicmodels.ai." })
      return
    }
    setSent(true)
    form.reset()
    setStatus({ tone: 'info', text: `Brief sent. The agent will reply to ${String(fields.contact_email)}.` })
  }

  return (
    <div className="sp sp-brief">
      <div className="wrap pagehead">
        <div className="sp-eyebrow">Licensing</div>
        <h1>Start a <span className="l">brief</span></h1>
        <p className="lead">Tell us what you're selling, where it runs and for how long. We reply with a suggested face, terms and a quote.</p>
      </div>

      <div className="wrap layout">
        <form id="brief" noValidate onSubmit={submit}>
          <fieldset>
            <legend>You</legend>
            <div className="row">
              <label htmlFor="company_name">Company <i>*</i><input id="company_name" name="company_name" autoComplete="organization" required placeholder=" " /></label>
              <label htmlFor="contact_name">Your name <i>*</i><input id="contact_name" name="contact_name" autoComplete="name" required placeholder=" " /></label>
            </div>
            <div className="row">
              <label htmlFor="contact_email">Work email <i>*</i><input id="contact_email" name="contact_email" type="email" autoComplete="email" required placeholder=" " /></label>
              <label htmlFor="contact_phone">Phone<input id="contact_phone" name="contact_phone" type="tel" autoComplete="tel" placeholder=" " /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>The face</legend>
            <label htmlFor="model">Model
              <select id="model" name="model" defaultValue="">
                <option value="">Help me choose</option>
                <option value="athena">Athena · AT01</option>
                <option value="dalia">Dalia · DL01</option>
                <option value="ariadne">Ariadne · AR01</option>
                <option value="beckie">Beckie · BC01</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>The use</legend>
            <div className="choices" role="radiogroup" aria-label="License level">
              <label className="choice"><input type="radio" name="license_tier" value="social" id="tier_social" /><span>Social<small>Organic channels, 6 months</small></span></label>
              <label className="choice"><input type="radio" name="license_tier" value="commercial" id="tier_commercial" /><span>Commercial<small>Paid, e-commerce, retail</small></span></label>
              <label className="choice"><input type="radio" name="license_tier" value="exclusive" id="tier_exclusive" /><span>Exclusive<small>Category lock, all media</small></span></label>
              <label className="choice"><input type="radio" name="license_tier" value="" id="tier_unsure" defaultChecked /><span>Not sure<small>We'll advise</small></span></label>
            </div>
            <label htmlFor="intended_use">Product and use<input id="intended_use" name="intended_use" placeholder="e.g. Face serum launch, paid social and product pages" /></label>
            <div className="row">
              <label htmlFor="territory">Territory<input id="territory" name="territory" placeholder="e.g. GCC, EU, worldwide" /></label>
              <label htmlFor="budget_range">Budget
                <select id="budget_range" name="budget_range" defaultValue="">
                  <option value="">Prefer to discuss</option>
                  <option>Under US$2,500</option>
                  <option>US$2,500–10,000</option>
                  <option>US$10,000–25,000</option>
                  <option>Over US$25,000</option>
                </select>
              </label>
            </div>
            <label htmlFor="message">Anything else<textarea id="message" name="message" placeholder="Timeline, references, number of images, launch date" /></label>
          </fieldset>

          {/* Spam trap: hidden from people, filled only by bots; the Edge Function drops those submissions. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }} />

          <div id="status" className="msg" hidden={!status} role={status?.tone === 'error' ? 'alert' : 'status'} aria-live="polite">{status?.text}</div>
          <div className="ctas"><button className="pill lime" type="submit" disabled={sending || sent}>{sent ? 'Brief sent' : 'Send brief'}</button></div>
        </form>

        <aside className="side">
          <div className="sp-card">
            <h3>What <span className="l">happens next</span></h3>
            <ol style={{ marginTop: 16 }}>
              <li>The agent reads your brief and checks the model's availability in your category.</li>
              <li>You get a reply with a suggested face, license level, term and a quote.</li>
              <li>On approval we produce, you review, and the license starts on delivery.</li>
            </ol>
          </div>
          <p className="muted small mail">Prefer email? <code>agent@cyberchicmodels.ai</code></p>
        </aside>
      </div>
    </div>
  )
}
