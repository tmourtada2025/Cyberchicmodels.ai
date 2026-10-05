// Roster into the DB (szzctvtsomdyabetzjnh): models, campaigns, campaign_images, proof_scores, license_tiers,
// plus the media-bucket uploads they reference. Source of truth is the live static build, migrated as-is:
//   rebuild/web/public/m/<slug>/index.html + img/   (pages, verbatim copy, layout, stats, images)
//   rebuild/web/src/features/models/featured.ts     (card order, specialties, card/wall images, roster/wall flags)
//   rebuild/web/src/pages/ProofPage.tsx + public/site/img/  (proof scores, reference panel, benchmarks)
// Ages and license tiers are the owner's decisions (2026-10-05) and are listed below.
//
//   node rebuild/supabase/seeds/seed-roster.mjs --dry-run   read-only; writes seeds/dry-run/roster-dry-run.{json,md}
//   node rebuild/supabase/seeds/seed-roster.mjs --apply     uploads + upserts; refuses to overwrite differing objects
//
// Env: D:\Cyberchicmodels\.env ONLY (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). No fallback.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'

const REPO = 'D:/Cyberchicmodels'
const WEB = `${REPO}/rebuild/web`
const PAGES = `${WEB}/public/m`
const MIRROR = 'D:/CyberChic-MASTER-remotion-template-freestyle/out/web'
const OUT = `${REPO}/rebuild/supabase/seeds/dry-run`
const PROJECT = 'szzctvtsomdyabetzjnh'
const GIT = 'D:/Program Files/Git/cmd/git.exe'

const mode = process.argv.includes('--apply') ? 'apply' : process.argv.includes('--dry-run') ? 'dry-run' : null
if (!mode) throw new Error('Pass --dry-run or --apply')

// ---------------------------------------------------------------------------------------------
// Owner decisions
// ---------------------------------------------------------------------------------------------

// age_range_min as set by the owner. age_label stays the page wording; age_range_max = min only where the page is exact.
const AGES = { ariadne: 28, beckie: 29, dalia: 52, michelle: 25, athena: 27, aruzhan: 27, amara: 25, priya: 25, yuki: 25, yasmin: 25, trang: 25 }

const LICENSE_TIERS = [
  { code: 'campaign', name: 'Campaign', price_amount: 6000, price_display: 'From $6,000', display_order: 1 },
  { code: 'flagship', name: 'Flagship', price_amount: 18000, price_display: 'From $18,000', display_order: 2 },
  { code: 'exclusive', name: 'Exclusive', price_amount: 50000, price_display: 'From $50,000', display_order: 3 },
  { code: 'retainer', name: 'Retainer', price_amount: 2000, price_display: 'From $2,000/mo', display_order: 4 },
].map((t) => ({ ...t, price_currency: 'USD', is_active: true }))

// ---------------------------------------------------------------------------------------------
// Env + client
// ---------------------------------------------------------------------------------------------

const ENV_PATH = `${REPO}/.env`
if (!existsSync(ENV_PATH)) throw new Error(`STOP: ${ENV_PATH} missing (no fallback)`)
const env = Object.fromEntries(
  readFileSync(ENV_PATH, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => {
    const i = l.indexOf('=')
    return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
  }),
)
if (!env.SUPABASE_URL?.includes(PROJECT)) throw new Error(`STOP: SUPABASE_URL is not ${PROJECT}`)
if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('STOP: SUPABASE_SERVICE_ROLE_KEY missing')
const { createClient } = createRequire(`${WEB}/package.json`)('@supabase/supabase-js')
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ---------------------------------------------------------------------------------------------
// Small HTML tree parser (the static pages are hand-written, well-formed HTML)
// ---------------------------------------------------------------------------------------------

const VOID = new Set(['img', 'source', 'meta', 'link', 'br', 'hr', 'input'])
const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&rsquo;/g, '\u2019').replace(/&lsquo;/g, '\u2018')
    .replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013').replace(/&nbsp;/g, '\u00a0').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] }
  const stack = [root]
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z0-9]+)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*\/?>|([^<]+)/g
  for (const m of html.matchAll(re)) {
    if (m[0].startsWith('<!--')) continue
    if (m[4] !== undefined) { stack.at(-1).children.push({ text: m[4] }); continue }
    const tag = m[2].toLowerCase()
    if (m[1]) {
      const i = stack.findLastIndex((n) => n.tag === tag)
      if (i > 0) stack.length = i
      continue
    }
    const attrs = Object.fromEntries([...m[3].matchAll(/([^\s=]+)(?:="([^"]*)")?/g)].map((a) => [a[1], a[2] === undefined ? true : decode(a[2])]))
    const node = { tag, attrs, children: [] }
    stack.at(-1).children.push(node)
    if (!VOID.has(tag)) stack.push(node)
  }
  return root
}
const els = (n) => n.children.filter((c) => c.tag)
const cls = (n) => (typeof n.attrs?.class === 'string' ? n.attrs.class.split(/\s+/) : [])
const has = (n, c) => cls(n).includes(c)
function findAll(n, pred, out = []) {
  for (const c of n.children ?? []) if (c.tag) { if (pred(c)) out.push(c); findAll(c, pred, out) }
  return out
}
const find = (n, pred) => findAll(n, pred)[0]
const text = (n) => decode((n.text ?? '') + (n.children ?? []).map(text).join(''))
const inner = (n) => text(n).replace(/\s+/g, ' ').trim()

// ---------------------------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------------------------

const sha = (buf) => createHash('sha256').update(buf).digest('hex')

// WebP pixel size from the RIFF header (VP8 / VP8L / VP8X).
function webpSize(buf) {
  const fourcc = buf.toString('ascii', 12, 16)
  if (fourcc === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
  if (fourcc === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 } }
  if (fourcc === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
  throw new Error('not a webp')
}

function loadFeatured() {
  const src = readFileSync(`${WEB}/src/features/models/featured.ts`, 'utf8')
  const arr = src.slice(src.indexOf('FEATURED_MODELS: RosterModel[] = [') + 'FEATURED_MODELS: RosterModel[] = '.length)
  const end = arr.search(/\r?\n\]\r?\n/)
  const body = arr.slice(0, arr.indexOf(']', end) + 1)
  return new Function(`return ${body}`)()
}

function firstCommit(slug) {
  const out = execFileSync(GIT, ['-C', REPO, 'log', '--diff-filter=A', '--format=%cI', '--', `rebuild/web/public/m/${slug}/index.html`], { encoding: 'utf8' })
  return out.trim().split('\n').at(-1)
}

const problems = []
const notes = []
const check = (ok, msg) => { if (!ok) problems.push(msg) }

// ---------------------------------------------------------------------------------------------
// Page → rows
// ---------------------------------------------------------------------------------------------

const RATIO = { r45: '4:5', r32: '3:2', r23: '2:3', wide: '3:2' }
const kebab = (s) => s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function heading(h2) {
  const accent = find(h2, (n) => has(n, 'l'))
  const name = inner(h2)
  const heading_accent = accent ? inner(accent) : null
  check(!heading_accent || name.endsWith(heading_accent), `heading accent "${heading_accent}" is not a suffix of "${name}"`)
  return { name, heading_accent }
}

function figureItem(fig, order) {
  const ph = find(fig, (n) => has(n, 'ph'))
  const img = find(ph, (n) => n.tag === 'img')
  const cap = find(fig, (n) => n.tag === 'figcaption')
  let caption_mark = null, caption = cap ? inner(cap) : null
  const b = cap && els(cap).find((n) => n.tag === 'b')
  if (b) { caption_mark = inner(b); caption = inner(cap).slice(caption_mark.length).replace(/^\s*·\s*/, '') }
  const phCls = cls(ph).filter((c) => c !== 'ph')
  const ratioCls = phCls.find((c) => RATIO[c])
  return {
    file: img.attrs.src.replace(/^img\//, ''), alt: img.attrs.alt ?? null, caption_mark, caption,
    aspect_ratio: RATIO[ratioCls], layout: { order, ph: phCls.join(' ') || undefined, figure: cls(fig).join(' ') || undefined },
  }
}

function parsePage(slug) {
  const raw = readFileSync(`${PAGES}/${slug}/index.html`, 'utf8')
  const css = (raw.match(/<style>([\s\S]*?)<\/style>/) || [])[1] ?? ''
  const doc = parse(raw.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/g, ''))
  const meta = (name) => find(doc, (n) => n.tag === 'meta' && (n.attrs.name === name || n.attrs.property === name))?.attrs.content ?? null

  // hero
  const hero = find(doc, (n) => n.tag === 'section' && has(n, 'hero'))
  const heroImg = find(hero, (n) => n.tag === 'img')
  const heroSrc = find(hero, (n) => n.tag === 'source')
  const name = inner(find(hero, (n) => n.tag === 'h1'))
  const eyebrow = inner(find(hero, (n) => has(n, 'eyebrow')))
  const hero_facts = els(find(hero, (n) => has(n, 'facts'))).map((s) => {
    const b = els(s).find((n) => n.tag === 'b')
    return { label: inner(s).slice(0, inner(s).length - inner(b).length).trim(), value: inner(b) }
  })
  const heroCtas = findAll(find(hero, (n) => has(n, 'ctas')), (n) => n.tag === 'a').map((a) => ({ label: inner(a), href: a.attrs.href }))

  // css-derived presentation (per page, verbatim)
  const cssLines = css.split('\n').map((l) => l.trim())
  const focusDesk = cssLines.filter((l) => l.startsWith('.hero .ph img{object-position:')).map((l) => l.match(/object-position:([^}]+)\}/)[1])
  const focusMob = cssLines.filter((l) => l.startsWith('@media (max-width:700px){.hero .ph img{object-position:')).map((l) => l.match(/object-position:([^}]+)\}/)[1])
  const hero_title_scale = cssLines.some((l) => l.startsWith('.hero h1{font-size:clamp(84px,11vw,168px)')) ? 'l' : 'xl'
  const hero_align = cssLines.includes('.hero .wrap{text-align:right}') ? 'right' : 'left'

  // strip (written twice for the marquee loop)
  const stripSpans = findAll(find(doc, (n) => has(n, 'strip')), (n) => n.tag === 'span').map(inner)
  const half = stripSpans.length / 2
  check(stripSpans.slice(0, half).join('|') === stripSpans.slice(half).join('|'), `${slug}: strip halves differ`)

  // sections
  const sections = findAll(doc, (n) => n.tag === 'section' && has(n, 'block'))
  const story = sections.find((s) => find(s, (n) => has(n, 'story')))
  const world = sections.find((s) => s.attrs.id && !['digitals', 'book'].includes(s.attrs.id))
  const range = sections.find((s) => !s.attrs.id && find(s, (n) => n.tag === 'h2'))
  const digitals = sections.find((s) => s.attrs.id === 'digitals')
  const book = sections.find((s) => s.attrs.id === 'book')
  check(sections.length === 5 && story && world && range && digitals && book, `${slug}: expected story/world/range/digitals/book sections, got ${sections.length}`)

  const head = (sec) => {
    const h = find(sec, (n) => has(n, 'head'))
    return { ...heading(find(h, (n) => n.tag === 'h2')), intro: inner(find(h, (n) => n.tag === 'p')) }
  }

  // world: rows of the .stack, verbatim (bare figure = full-width row)
  let order = 0
  const worldItems = []
  const worldLayout = els(find(world, (n) => has(n, 'stack'))).map((row) => {
    const figs = row.tag === 'figure' ? [row] : els(row).filter((n) => n.tag === 'figure')
    const items = figs.map((f) => { const it = figureItem(f, ++order); worldItems.push(it); return it.layout })
    return { grid: row.tag === 'figure' ? 'full' : cls(row).join(' '), items }
  })

  const rangeGrid = find(range, (n) => has(n, 'g4') || has(n, 'g3') || has(n, 'g2'))
  const rangeItems = els(rangeGrid).map((f, i) => figureItem(f, i + 1))
  const digGrid = find(digitals, (n) => has(n, 'g6'))
  const digItems = els(digGrid).map((ph, i) => {
    const img = find(ph, (n) => n.tag === 'img')
    const phCls = cls(ph).filter((c) => c !== 'ph')
    return { file: img.attrs.src.replace(/^img\//, ''), alt: img.attrs.alt ?? null, caption_mark: null, caption: null,
      aspect_ratio: RATIO[phCls.find((c) => RATIO[c])], layout: { order: i + 1, ph: phCls.join(' ') } }
  })

  // book
  const stats = []
  const dl = find(book, (n) => n.tag === 'dl')
  const kids = els(dl)
  for (let i = 0; i < kids.length; i += 2) stats.push({ label: inner(kids[i]), value: inner(kids[i + 1]) })
  const compImg = find(book, (n) => n.tag === 'img')
  const pdf = findAll(book, (n) => n.tag === 'a' && /\.pdf$/.test(n.attrs.href ?? ''))[0]
  const mailto = findAll(book, (n) => n.tag === 'a' && /^mailto:/.test(n.attrs.href ?? ''))[0]

  return {
    slug, name, eyebrow, meta_description: meta('description'), og: (meta('og:image') ?? '').split('/').pop(),
    hero: { desktop: heroImg.attrs.src.replace(/^img\//, ''), mobile: heroSrc?.attrs.srcset.replace(/^img\//, '') ?? null, alt: heroImg.attrs.alt,
      focus: focusDesk.at(-1) ?? null, focus_mobile: focusMob.at(-1) ?? null, title_scale: hero_title_scale, align: hero_align },
    hero_facts, heroCtas, strip_items: stripSpans.slice(0, half),
    story_lead: inner(find(story, (n) => n.tag === 'p' && has(n, 'big'))), story_body: inner(find(story, (n) => n.tag === 'p' && has(n, 'small'))),
    story_eyebrow: inner(find(story, (n) => has(n, 'eyebrow'))),
    world: { ...head(world), anchor: world.attrs.id, layout: worldLayout, items: worldItems },
    range: { ...head(range), layout: [{ grid: cls(rangeGrid).join(' '), items: rangeItems.map((i) => i.layout) }], items: rangeItems },
    digitals: { ...head(digitals), layout: [{ grid: cls(digGrid).join(' '), items: digItems.map((i) => i.layout) }], items: digItems },
    book: { ...head(book), stats, compcard: compImg.attrs.src.replace(/^img\//, ''), compcard_alt: compImg.attrs.alt, pdf: pdf?.attrs.href.replace(/^img\//, ''),
      mailto: mailto?.attrs.href ?? null, ctas: findAll(book, (n) => n.tag === 'a').map((a) => ({ label: inner(a), href: a.attrs.href })) },
    css_lines: cssLines,
  }
}

// ---------------------------------------------------------------------------------------------
// Build the plan
// ---------------------------------------------------------------------------------------------

const featured = loadFeatured()
const slugs = readdirSync(PAGES).filter((s) => existsSync(`${PAGES}/${s}/index.html`)).sort()
check(slugs.length === 11, `expected 11 pages, found ${slugs.length}`)
check(featured.length === 11 && featured.every((f) => slugs.includes(f.slug)), 'featured.ts and public/m disagree')

const uploads = [] // { local, path, contentType }
const addUpload = (local, path) => {
  const ct = path.endsWith('.pdf') ? 'application/pdf' : 'image/webp'
  if (!uploads.some((u) => u.path === path)) uploads.push({ local, path, contentType: ct })
  return path
}

const pages = {}
const models = []
const campaigns = []
const images = []
const ariadneCss = new Set(parsePage('ariadne').css_lines)
const cssReport = {}

for (const slug of slugs) {
  const p = parsePage(slug)
  pages[slug] = p
  const f = featured.find((x) => x.slug === slug)
  const img = (file) => `${PAGES}/${slug}/img/${file}`
  const stat = (label) => p.book.stats.find((s) => s.label === label)?.value

  // as-is consistency checks: card = page
  check(stat('Code') && p.eyebrow.startsWith(`${stat('Code')} · `), `${slug}: eyebrow "${p.eyebrow}" vs code ${stat('Code')}`)
  // The eyebrow renders as code · world name; both are text-transform:uppercase, so case alone is not a visual change.
  check(p.eyebrow.toUpperCase() === `${stat('Code')} · ${p.world.name}`.toUpperCase(), `${slug}: eyebrow "${p.eyebrow}" ≠ code · world name "${p.world.name}"`)
  if (p.eyebrow !== `${stat('Code')} · ${p.world.name}`) notes.push(`${slug}: eyebrow "${p.eyebrow}" vs world heading "${p.world.name}" differ in case only (both render uppercase); heading wording kept`)
  check(stat('Look') === f.look, `${slug}: Look card "${f.look}" vs page "${stat('Look')}"`)
  check(p.hero_facts.find((x) => x.label === 'Look')?.value === stat('Look'), `${slug}: hero Look ≠ stats Look`)
  check(p.hero_facts.find((x) => x.label === 'Age')?.value === stat('Age'), `${slug}: hero Age ≠ stats Age`)
  check(stat('Origin') === 'AI-generated', `${slug}: Origin is "${stat('Origin')}"`)
  check(p.name === f.name, `${slug}: name card "${f.name}" vs page "${p.name}"`)
  const ageLabel = stat('Age')
  const exact = /^\d+$/.test(ageLabel)
  check(!exact || +ageLabel === AGES[slug], `${slug}: page age ${ageLabel} ≠ owner age ${AGES[slug]}`)
  check(AGES[slug] >= 25, `${slug}: age below floor`)
  check(p.book.stats.slice(0, 3).map((s) => s.label).join() === 'Code,Look,Origin', `${slug}: stats do not start Code/Look/Origin`)
  check(p.hero.focus, `${slug}: no desktop hero focus in CSS`)
  check(p.book.pdf, `${slug}: no comp card PDF link`)
  check(p.heroCtas.map((c) => c.label).join('|') === `Book ${p.name}|See digitals`, `${slug}: hero CTAs "${p.heroCtas.map((c) => c.label).join('|')}"`)
  check(p.story_eyebrow === 'Her world', `${slug}: story eyebrow "${p.story_eyebrow}"`)
  check(p.book.name === `Book ${p.name}`, `${slug}: book heading "${p.book.name}"`)

  // CSS lines this page has beyond the Ariadne reference: shown for review, mapped into the template union
  cssReport[slug] = p.css_lines.filter((l) => l && !ariadneCss.has(l))

  // storage: model-level
  const cardFile = f.portrait_path.split('/').pop()
  const portrait = addUpload(img(cardFile), `models/${slug}/portrait.webp`)
  const wall = f.drift_path ? addUpload(img(f.drift_path.split('/').pop()), `models/${slug}/wall.webp`) : null
  const m = (file) => (file ? addUpload(img(file), `models/${slug}/${file}`) : null)

  models.push({
    slug, name: p.name, gender: 'female', ethnicity: stat('Look'),
    age_range_min: AGES[slug], age_range_max: exact ? AGES[slug] : null, age_label: ageLabel,
    specialties: f.specialties, model_code: stat('Code'),
    is_consistency_locked: true, consistency_locked_at: firstCommit(slug),
    roster_status: 'published', portrait_path: portrait, display_order: f.display_order,
    on_roster_cards: f.roster !== false, on_hero_wall: f.drift !== false, wall_path: wall,
    hero_desktop_path: m(p.hero.desktop), hero_mobile_path: m(p.hero.mobile), hero_alt: p.hero.alt,
    hero_focus: p.hero.focus, hero_focus_mobile: p.hero.focus_mobile, hero_align: p.hero.align, hero_title_scale: p.hero.title_scale,
    hero_facts: p.hero_facts, og_path: m(p.og), compcard_path: m(p.book.compcard), compcard_pdf_path: m(p.book.pdf),
    story_lead: p.story_lead, story_body: p.story_body, strip_items: p.strip_items, meta_description: p.meta_description,
    comp_stats: p.book.stats.slice(3),
  })

  const sections = [
    { kind: 'editorial', slug: kebab(p.world.name), register: 'editorial', s: p.world, anchor: p.world.anchor, order: 1 },
    { kind: 'range', slug: 'range', register: 'campaign', s: p.range, anchor: null, order: 2 },
    { kind: 'digitals', slug: 'digitals', register: 'digital', s: p.digitals, anchor: 'digitals', order: 3 },
  ]
  for (const sec of sections) {
    campaigns.push({ model_slug: slug, slug: sec.slug, name: sec.s.name, heading_accent: sec.s.heading_accent, intro: sec.s.intro,
      kind: sec.kind, anchor: sec.anchor, layout: sec.s.layout, status: 'published', display_order: sec.order })
    sec.s.items.forEach((it, i) => {
      const buf = readFileSync(img(it.file))
      const { w, h } = webpSize(buf)
      const nameWH = it.file.match(/-(\d+)x(\d+)\.webp$/)
      check(!nameWH || (+nameWH[1] === w && +nameWH[2] === h), `${slug}/${it.file}: filename says ${nameWH?.[1]}x${nameWH?.[2]}, file is ${w}x${h}`)
      check(it.aspect_ratio, `${slug}/${it.file}: no ratio class`)
      images.push({ model_slug: slug, campaign_slug: sec.slug, storage_bucket: 'media',
        storage_path: addUpload(img(it.file), `campaigns/${slug}/${sec.slug}/${it.file}`),
        register: sec.register, aspect_ratio: it.aspect_ratio, width_px: w, height_px: h, alt_text: it.alt,
        caption_mark: it.caption_mark, caption: it.caption, is_hero: false, display_order: i + 1 })
    })
  }
}

// ---------------------------------------------------------------------------------------------
// Proof
// ---------------------------------------------------------------------------------------------

const proofSrc = readFileSync(`${WEB}/src/pages/ProofPage.tsx`, 'utf8')
const measured_on = proofSrc.match(/measured (\d{4}-\d{2}-\d{2})/)[1]
const chartRows = [...proofSrc.matchAll(/\['(\w+)', \[([\d., ]+)\]\]/g)].map((m) => ({ slug: m[1].toLowerCase(), scores: m[2].split(',').map(Number) }))
const proof = []
chartRows.forEach((r, ri) => r.scores.forEach((score, j) => proof.push({
  model_slug: r.slug, panel: 'chart', frame_label: null, score, is_reference: false,
  is_side_profile: j === 2, image_path: null, alt_text: null, measured_on, display_order: (ri + 1) * 100 + j,
})))
const all = chartRows.flatMap((r) => r.scores).sort((a, b) => a - b)
const med = all.length % 2 ? all[(all.length - 1) / 2] : (all[all.length / 2 - 1] + all[all.length / 2]) / 2
check(proofSrc.includes(`${all.length} published frames`), `proof: page frame count ≠ ${all.length}`)
check(proofSrc.includes(`<b className="l">${med.toFixed(2)}</b>`), `proof: page median ≠ computed ${med.toFixed(2)}`)
check(proofSrc.includes(`<b>${all[0].toFixed(2)}</b><span>Lowest same-model score`), `proof: page lowest ≠ computed ${all[0].toFixed(2)}`)

const refFigs = [...proofSrc.matchAll(/<img src="\/site\/img\/([^"]+)" alt="([^"]+)" \/><\/div><figcaption>(.*?)<\/figcaption>/g)]
refFigs.forEach((m, i) => {
  const [, file, alt, cap] = m
  const isRef = cap.startsWith('<b>Reference</b>')
  const slug = file.split('-')[0]
  const local = `${WEB}/public/site/img/${file}`
  proof.push({
    model_slug: slug, panel: 'reference', is_reference: isRef, is_side_profile: false,
    frame_label: decode(isRef ? cap.replace(/^<b>Reference<\/b> · /, '') : cap.replace(/ · <span.*$/, '')),
    score: isRef ? null : Number(cap.match(/score">([\d.]+)</)[1]),
    image_path: addUpload(local, `proof/${slug}/${file}`), alt_text: decode(alt), measured_on, display_order: i,
  })
})
check(refFigs.length === 7, `proof: expected 7 reference-panel figures, found ${refFigs.length}`)
const medianDiff = proofSrc.match(/<b>(0\.\d+)<\/b><span>(Median score between two different models[^<]*)<\/span>/)
const band = proofSrc.match(/x\((0\.\d+)\) - x\(0\)/)
const bandLabel = proofSrc.match(/<i className="sw b" \/>([^<]+)<\/span>/)
proof.push({ model_slug: null, panel: 'benchmark', frame_label: medianDiff[2], score: Number(medianDiff[1]), is_reference: false, is_side_profile: false, image_path: null, alt_text: null, measured_on, display_order: 1 })
proof.push({ model_slug: null, panel: 'benchmark', frame_label: bandLabel[1], score: Number(band[1]), is_reference: false, is_side_profile: false, image_path: null, alt_text: null, measured_on, display_order: 2 })

// ---------------------------------------------------------------------------------------------
// Verify local files: hash vs the out/web review mirror, and vs anything already in the bucket
// ---------------------------------------------------------------------------------------------

for (const u of uploads) {
  const buf = readFileSync(u.local)
  u.sha256 = sha(buf)
  u.bytes = buf.length
  const m = u.local.match(/public\/m\/([^/]+)\/img\/(.+)$/)
  if (m) {
    const mirror = `${MIRROR}/${m[1]}/site/img/${m[2]}`
    u.mirror = existsSync(mirror) ? (sha(readFileSync(mirror)) === u.sha256 ? 'identical' : 'DIFFERS') : 'no mirror copy'
    check(u.mirror !== 'DIFFERS', `${u.local}: differs from ${mirror}`)
  }
}

const remote = new Map()
for (const prefix of [...new Set(uploads.map((u) => u.path.slice(0, u.path.lastIndexOf('/'))))]) {
  const { data, error } = await db.storage.from('media').list(prefix, { limit: 1000 })
  if (error) throw error
  for (const o of data) if (o.id) remote.set(`${prefix}/${o.name}`, o)
}
for (const u of uploads) {
  if (!remote.has(u.path)) { u.action = 'upload'; continue }
  const { data, error } = await db.storage.from('media').download(u.path)
  if (error) throw error
  u.action = sha(Buffer.from(await data.arrayBuffer())) === u.sha256 ? 'exists, identical (skip)' : 'CONFLICT: exists with different bytes'
  check(!u.action.startsWith('CONFLICT'), `${u.path}: already in bucket with different bytes`)
}

// existing DB state
const { data: existingModels } = await db.from('models').select('slug, consistency_locked_at')
for (const m of models) {
  const ex = existingModels.find((e) => e.slug === m.slug)
  m._db = ex ? 'update' : 'insert'
  if (ex?.consistency_locked_at) m.consistency_locked_at = ex.consistency_locked_at // keep an existing lock time
}
const { count: proofCount } = await db.from('proof_scores').select('*', { count: 'exact', head: true })
check(proofCount === 0, `proof_scores already has ${proofCount} rows; this seed only fills an empty table`)

// ---------------------------------------------------------------------------------------------
// Dry-run report
// ---------------------------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true })
const plan = { generated_at: new Date().toISOString(), project: PROJECT, problems, license_tiers: LICENSE_TIERS, models, campaigns, campaign_images: images, proof_scores: proof, uploads, css_beyond_ariadne: cssReport }
writeFileSync(`${OUT}/roster-dry-run.json`, JSON.stringify(plan, null, 2))

const md = []
md.push(`# Roster seed: dry run`, '', `Generated ${plan.generated_at} against ${PROJECT}. Nothing was written.`, '')
md.push(`## Checks`, '', problems.length ? problems.map((p) => `- ❌ ${p}`).join('\n') : '- ✅ all as-is checks passed', ...notes.map((n) => `- ℹ️ ${n}`), '')
md.push(`## Totals`, '', `| What | Count |`, `|---|---|`,
  `| models | ${models.length} (${models.filter((m) => m._db === 'insert').length} insert, ${models.filter((m) => m._db === 'update').length} update) |`,
  `| campaigns | ${campaigns.length} |`, `| campaign_images | ${images.length} |`,
  `| proof_scores | ${proof.length} (${proof.filter((p) => p.panel === 'chart').length} chart, ${proof.filter((p) => p.panel === 'reference').length} reference, ${proof.filter((p) => p.panel === 'benchmark').length} benchmark) |`,
  `| license_tiers | ${LICENSE_TIERS.length} |`,
  `| uploads | ${uploads.filter((u) => u.action === 'upload').length} new, ${uploads.filter((u) => u.action.startsWith('exists')).length} already identical, ${uploads.filter((u) => u.action.startsWith('CONFLICT')).length} conflicts; ${(uploads.reduce((a, u) => a + u.bytes, 0) / 1e6).toFixed(1)} MB |`, '')
md.push(`## Models`, '', `| # | slug | code | name | Look | age_label | min/max | cards | wall | hero align / scale / focus (mobile) | world | stats rows |`, `|---|---|---|---|---|---|---|---|---|---|---|---|`)
for (const m of [...models].sort((a, b) => a.display_order - b.display_order)) {
  const w = campaigns.find((c) => c.model_slug === m.slug && c.kind === 'editorial')
  md.push(`| ${m.display_order} | ${m.slug} | ${m.model_code} | ${m.name} | ${m.ethnicity} | ${m.age_label} | ${m.age_range_min}/${m.age_range_max ?? '—'} | ${m.on_roster_cards ? 'yes' : 'no'} | ${m.on_hero_wall ? 'yes' : 'no'} | ${m.hero_align} / ${m.hero_title_scale} / ${m.hero_focus} (${m.hero_focus_mobile ?? 'same'}) | ${w.name}: ${w.layout.map((r) => `${r.grid}×${r.items.length}`).join(' / ')} | ${m.comp_stats.map((s) => s.label).join(', ')} |`)
}
md.push('', `## Per-model detail`, '')
for (const m of models) {
  md.push(`### ${m.name} (${m.model_code}) — ${m._db}`, '',
    `- consistency_locked_at: ${m.consistency_locked_at}`, `- specialties (card): ${m.specialties.join(' · ')}`,
    `- hero_facts: ${m.hero_facts.map((x) => `${x.label} **${x.value}**`).join(' · ')}`,
    `- strip: ${m.strip_items.join(' + ')}`, `- story_lead: ${m.story_lead}`, `- story_body: ${m.story_body}`,
    `- meta_description: ${m.meta_description ?? '—'}`,
    `- comp_stats: ${m.comp_stats.map((s) => `${s.label}=${s.value}`).join(' | ')}`,
    `- images: portrait ${m.portrait_path}${m.wall_path ? `, wall ${m.wall_path}` : ''}, hero ${m.hero_desktop_path} / ${m.hero_mobile_path}, og ${m.og_path}, comp card ${m.compcard_path} + ${m.compcard_pdf_path}`)
  for (const c of campaigns.filter((c) => c.model_slug === m.slug)) {
    md.push(`- **${c.kind}** \`${c.slug}\` "${c.name}" (accent "${c.heading_accent}", anchor ${c.anchor ?? '—'}): ${c.intro}`)
    md.push(`  - layout: \`${JSON.stringify(c.layout)}\``)
    for (const i of images.filter((i) => i.model_slug === m.slug && i.campaign_slug === c.slug))
      md.push(`  - ${i.display_order}. ${i.storage_path.split('/').pop()} ${i.aspect_ratio} ${i.width_px}×${i.height_px}${i.caption_mark ? ` · ${i.caption_mark}` : ''}${i.caption ? ` · ${i.caption}` : ''} — alt: ${i.alt_text}`)
  }
  const extra = cssReport[m.slug]
  md.push(`- page CSS beyond Ariadne (${extra.length} lines)${extra.length ? ':' : ''}`, ...extra.map((l) => `  - \`${l.slice(0, 160)}\``), '')
}
md.push(`## Proof`, '', `measured_on ${measured_on}; chart: ${chartRows.map((r) => `${r.slug} ${r.scores.length}`).join(', ')} = ${all.length} frames, median ${med.toFixed(2)}, lowest ${all[0].toFixed(2)}`, '')
for (const p of proof.filter((p) => p.panel !== 'chart')) md.push(`- ${p.panel}: ${p.model_slug ?? '(no model)'} · ${p.frame_label} · ${p.score ?? 'reference'}${p.image_path ? ` · ${p.image_path}` : ''}`)
md.push('', `## License tiers`, '', ...LICENSE_TIERS.map((t) => `- ${t.code}: ${t.name} · ${t.price_display} (${t.price_amount} ${t.price_currency}) · summary: none yet · features: none yet`), '')
md.push(`## Uploads`, '', `| path | bytes | mirror | action |`, `|---|---|---|---|`, ...uploads.map((u) => `| ${u.path} | ${u.bytes} | ${u.mirror ?? '—'} | ${u.action} |`))
writeFileSync(`${OUT}/roster-dry-run.md`, md.join('\n'))

console.log(`dry-run written: ${OUT}/roster-dry-run.{json,md}`)
console.log(`problems: ${problems.length}`)
for (const p of problems) console.log(`  - ${p}`)

if (mode === 'dry-run') process.exit(0)

// ---------------------------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------------------------

if (problems.length) throw new Error('STOP: dry-run checks failed; nothing applied')

for (const u of uploads.filter((u) => u.action === 'upload')) {
  const { error } = await db.storage.from('media').upload(u.path, readFileSync(u.local), { contentType: u.contentType, upsert: false })
  if (error) throw new Error(`upload ${u.path}: ${error.message}`)
}
console.log(`uploaded ${uploads.filter((u) => u.action === 'upload').length}`)

{
  const { error } = await db.from('license_tiers').upsert(LICENSE_TIERS, { onConflict: 'code' })
  if (error) throw error
}

const modelId = {}
for (const { _db, ...m } of models) {
  const { data, error } = await db.from('models').upsert(m, { onConflict: 'slug' }).select('id, slug').single()
  if (error) throw new Error(`models ${m.slug}: ${error.message}`)
  modelId[data.slug] = data.id
}

const campaignId = {}
for (const { model_slug, ...c } of campaigns) {
  const { data, error } = await db.from('campaigns').upsert({ ...c, model_id: modelId[model_slug] }, { onConflict: 'model_id,slug' }).select('id').single()
  if (error) throw new Error(`campaigns ${model_slug}/${c.slug}: ${error.message}`)
  campaignId[`${model_slug}/${c.slug}`] = data.id
}

{
  const rows = images.map(({ model_slug, campaign_slug, ...i }) => ({ ...i, model_id: modelId[model_slug], campaign_id: campaignId[`${model_slug}/${campaign_slug}`] }))
  const { error } = await db.from('campaign_images').upsert(rows, { onConflict: 'storage_bucket,storage_path' })
  if (error) throw error
}

{
  const rows = proof.map(({ model_slug, ...p }) => ({ ...p, model_id: model_slug ? modelId[model_slug] : null }))
  const { error } = await db.from('proof_scores').insert(rows)
  if (error) throw error
}

console.log('applied')
