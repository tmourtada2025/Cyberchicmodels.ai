import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui/SectionHead'
import { BOOKING_EMAIL, ORIGIN } from '../config/site'
import { loadModelPage } from '../features/models/loaders'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { mediaUrl } from '../lib/media'
import type { LayoutRow, ModelPage, ModelSection, SectionImage } from '../lib/types'
import { PlaceholderPage } from './PlaceholderPage'
import '../features/models/model-page.css'

// /models/:slug — the model page template. Every value on the page comes from the model's rows;
// layout (hero crop/align/scale, world grid, stat rows) is per model, as stored.
export function ModelProfilePage() {
  const { slug = '' } = useParams()
  const page = useAsync(`model-page:${slug}`, () => loadModelPage(slug))

  if (page.status === 'loading') return <div className="mp" aria-busy="true" style={{ minHeight: '100vh' }} />

  if (page.status === 'error') {
    return (
      <section className="section">
        <div className="container">
          <EmptyState title="Page unavailable">This page couldn&rsquo;t be loaded right now. Please try again shortly.</EmptyState>
        </div>
      </section>
    )
  }

  if (!page.data) {
    return <PlaceholderPage eyebrow="404" title="Model not found" body="This model isn't on the published roster." />
  }

  return <ModelPageView model={page.data} />
}

// Heading with its trailing accent in lime: "The Acqui" + <span class="l">sition</span>.
function Heading({ section }: { section: Pick<ModelSection, 'name' | 'heading_accent'> }) {
  const { name, heading_accent: accent } = section
  if (!accent || !name.endsWith(accent)) return <h2>{name}</h2>
  return (
    <h2>
      {name.slice(0, name.length - accent.length)}
      <span className="l">{accent}</span>
    </h2>
  )
}

function SectionHead({ section }: { section: ModelSection }) {
  return (
    <div className="head">
      <Heading section={section} />
      {section.intro && <p>{section.intro}</p>}
    </div>
  )
}

function Caption({ image }: { image: SectionImage }) {
  if (!image.caption_mark && !image.caption) return null
  return (
    <figcaption>
      {image.caption_mark ? (
        <>
          <b>{image.caption_mark}</b>
          {image.caption ? ` · ${image.caption}` : ''}
        </>
      ) : (
        image.caption
      )}
    </figcaption>
  )
}

// "position:absolute;inset:0;object-position:50% 12%" → { position: 'absolute', inset: '0', objectPosition: '50% 12%' }
function inlineStyle(css?: string): CSSProperties | undefined {
  if (!css) return undefined
  return Object.fromEntries(
    css.split(';').map((d) => d.split(':')).filter((p) => p.length === 2)
      .map(([k, v]) => [k.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v.trim()]),
  ) as CSSProperties
}

function Figure({ image, ph, figure, img }: { image: SectionImage; ph?: string; figure?: string; img?: string }) {
  return (
    <figure className={figure}>
      <div className={`ph ${ph ?? ''}`}>
        <img src={mediaUrl(image.storage_path)} alt={image.alt_text ?? ''} loading="lazy" style={inlineStyle(img)} />
      </div>
      <Caption image={image} />
    </figure>
  )
}

// Renders a section's stored grid rows. "full" is a bare full-width figure in the stack.
function Rows({ section, figures = true }: { section: ModelSection; figures?: boolean }) {
  const byOrder = new Map(section.images.map((i) => [i.display_order, i]))
  const cell = (item: LayoutRow['items'][number]) => {
    const image = byOrder.get(item.order)
    if (!image) return null
    return figures ? (
      <Figure key={item.order} image={image} ph={item.ph} figure={item.figure} img={item.img} />
    ) : (
      <div key={item.order} className={`ph ${item.ph ?? ''}`}>
        <img src={mediaUrl(image.storage_path)} alt={image.alt_text ?? ''} loading="lazy" style={inlineStyle(item.img)} />
      </div>
    )
  }
  return (
    <>
      {(section.layout ?? []).map((row, i) =>
        row.grid === 'full' ? row.items.map(cell) : <div key={i} className={row.grid}>{row.items.map(cell)}</div>,
      )}
    </>
  )
}

function ModelPageView({ model }: { model: ModelPage }) {
  useDocumentTitle(model.name)
  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]')
    const previous = meta?.getAttribute('content')
    if (meta && model.meta_description) meta.setAttribute('content', model.meta_description)
    return () => {
      if (meta && previous != null) meta.setAttribute('content', previous)
    }
  }, [model.meta_description])

  const world = model.sections.find((s) => s.kind === 'editorial')
  const range = model.sections.find((s) => s.kind === 'range')
  const digitals = model.sections.find((s) => s.kind === 'digitals')

  const heroStyle = {
    '--focus': model.hero_focus ?? undefined,
    '--focus-m': model.hero_focus_mobile ?? model.hero_focus ?? undefined,
  } as CSSProperties
  const heroClass = ['mp-hero', model.hero_title_scale === 'l' && 'is-l', model.hero_align === 'right' && 'is-right'].filter(Boolean).join(' ')
  const subject = encodeURIComponent(`Brief: ${model.name} (${model.model_code})`)

  return (
    <div className="mp">
      <section className={heroClass} aria-label={model.name} style={heroStyle}>
        <div className="ph">
          <picture>
            {model.hero_mobile_path && <source media="(max-width:700px)" srcSet={mediaUrl(model.hero_mobile_path)} />}
            {model.hero_desktop_path && <img src={mediaUrl(model.hero_desktop_path)} alt={model.hero_alt ?? ''} />}
          </picture>
        </div>
        <div className="wrap">
          <div className="mp-eyebrow">
            {model.model_code}
            {world && ` · ${world.name}`}
          </div>
          <h1>{model.name}</h1>
          <div className="facts">
            {model.hero_facts.map((f) => (
              <span key={f.label}>
                {f.label} <b>{f.value}</b>
              </span>
            ))}
          </div>
          <div className="ctas">
            <a className="pill lime" href="#book">Book {model.name}</a>
            {digitals && <a className="pill" href={`#${digitals.anchor ?? 'digitals'}`}>See digitals</a>}
          </div>
        </div>
      </section>

      {model.strip_items.length > 0 && (
        <div className="strip" aria-hidden="true">
          <div>
            {[...model.strip_items, ...model.strip_items].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>
      )}

      {(model.story_lead || model.story_body) && (
        <section className="block">
          <div className="wrap story">
            <div className="mp-eyebrow">Her world</div>
            <div>
              {model.story_lead && <p className="big">{model.story_lead}</p>}
              {model.story_body && <p className="small">{model.story_body}</p>}
            </div>
          </div>
        </section>
      )}

      {world && (
        <section className="block" id={world.anchor ?? undefined}>
          <div className="wrap">
            <SectionHead section={world} />
            <div className="stack">
              <Rows section={world} />
            </div>
          </div>
        </section>
      )}

      {range && (
        <section className="block">
          <div className="wrap">
            <SectionHead section={range} />
            <Rows section={range} />
          </div>
        </section>
      )}

      {digitals && (
        <section className="block" id={digitals.anchor ?? undefined}>
          <div className="wrap">
            <SectionHead section={digitals} />
            <Rows section={digitals} figures={false} />
          </div>
        </section>
      )}

      <section className="block" id="book">
        <div className="wrap">
          <div className="head">
            <h2>
              Book <span className="l">{model.name}</span>
            </h2>
            <p>Send your brief. We reply with availability, usage terms and a quote.</p>
          </div>
          <div className="book">
            {model.compcard_path && (
              <div className="ph" style={{ borderRadius: 16 }}>
                <img src={mediaUrl(model.compcard_path)} alt={`${model.name} comp card`} style={{ height: 'auto' }} />
              </div>
            )}
            <div className="stack" style={{ gap: 20 }}>
              <div className="mp-card">
                <dl className="stats">
                  <dt>Code</dt>
                  <dd className="lime">{model.model_code}</dd>
                  <dt>Look</dt>
                  <dd>{model.look}</dd>
                  <dt>Origin</dt>
                  <dd>{ORIGIN}</dd>
                  {model.comp_stats.map((s) => (
                    <StatRow key={s.label} label={s.label} value={s.value} />
                  ))}
                </dl>
              </div>
              <div className="ctas">
                <a className="pill lime" href={`mailto:${BOOKING_EMAIL}?subject=${subject}`}>Request booking</a>
                {model.compcard_pdf_path && (
                  <a className="pill" href={mediaUrl(model.compcard_pdf_path)} target="_blank" rel="noopener">Comp card (PDF)</a>
                )}
              </div>
              <BookingEmail />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  )
}

// Copy the address, or select it where the clipboard is unavailable (same behaviour as the static pages).
function BookingEmail() {
  const mail = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
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
    <div className="mail">
      Booking: <code ref={mail}>{BOOKING_EMAIL}</code>
      <button className="pill" type="button" style={{ minHeight: 36, padding: '0 14px' }} onClick={copy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}
