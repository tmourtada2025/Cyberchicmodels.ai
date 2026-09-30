// Asset manifest: every image/PDF under public/, with its model or page, slot and where it's referenced.
// Writes rebuild/docs/asset-manifest.csv. Rerun after any image change: `npm run manifest`.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB = fileURLToPath(new URL('..', import.meta.url))
const PUBLIC = join(WEB, 'public')
const SRC = join(WEB, 'src')
const OUT = join(WEB, '..', 'docs', 'asset-manifest.csv')
const ASSET = /\.(webp|png|pdf)$/i

// Files that can reference assets, and the route each one serves.
const ROUTE_OF_SRC = {
  'pages/CampaignsPage.tsx': '/campaigns',
  'pages/ProofPage.tsx': '/proof',
  'pages/AboutPage.tsx': '/about',
  'pages/BriefPage.tsx': '/brief',
  'features/models/featured.ts': '/models + / (roster wall, hero drift)',
}

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const posix = (p) => p.split(sep).join('/')

// Every asset URL a document points at, resolved against the document's own URL, so a relative
// "img/x.webp" in /m/dalia/index.html counts for /m/dalia/img/x.webp and nothing else.
const assetRefs = (text, base) =>
  new Set([...text.matchAll(/["'(]([^"'()\s]+\.(?:webp|png|pdf))(?=["')\s])/gi)].map((m) => new URL(m[1], `https://site${base}`).pathname))

// Referencing documents: static pages in public/ and source files in src/.
const docs = [
  ...walk(PUBLIC).filter((p) => p.endsWith('.html')).map((p) => {
    const route = '/' + posix(relative(PUBLIC, p)).replace(/index\.html$/, '')
    return { route, refs: assetRefs(readFileSync(p, 'utf8'), route) }
  }),
  ...walk(SRC).filter((p) => /\.(tsx?|css)$/.test(p)).map((p) => {
    const rel = posix(relative(SRC, p))
    return { route: ROUTE_OF_SRC[rel] ?? `src/${rel}`, refs: assetRefs(readFileSync(p, 'utf8'), '/') }
  }),
]

// Slot/role from the file name, e.g. beckie-t3-kitchen-1024x1280.webp -> "t3".
function slotOf(file, model) {
  const base = file.replace(/\.(webp|png|pdf)$/i, '').replace(new RegExp(`^${model}-`), '').replace(/-\d+x\d+$/, '')
  let m
  if (/^h1-hero|hero-desktop/.test(base)) return { slot: 'hero', detail: 'desktop' + (base.includes('interim') ? ' (interim)' : '') }
  if (/^h2-hero|hero-mobile/.test(base)) return { slot: 'hero', detail: 'mobile' + (base.includes('interim') ? ' (interim)' : '') }
  if ((m = base.match(/^(?:interim-)?t(\d)\b/))) return { slot: `t${m[1]}`, detail: base.startsWith('interim') ? 'interim' : base.replace(/^t\d-?/, '') }
  if ((m = base.match(/^r(\d)\b/))) return { slot: `r${m[1]}`, detail: base.replace(/^r\d-?/, '') }
  if ((m = base.match(/^interim-range-(.+)$/))) return { slot: 'r', detail: `interim range: ${m[1]}` }
  if ((m = base.match(/^dig-a(\d)\b/))) return { slot: `dig a${m[1]}`, detail: '' }
  if (/^digitals-sheet/.test(base)) return { slot: 'dig sheet', detail: '' }
  if (/^compcard/.test(base)) return { slot: 'compcard', detail: file.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image' }
  if (/^og\b/.test(base)) return { slot: 'og', detail: '' }
  if (/^(card|portrait)\b/.test(base)) return { slot: 'card', detail: base }
  if (/^wall\b/.test(base)) return { slot: 'wall', detail: '' }
  return { slot: 'other', detail: base }
}

const SLOT_ORDER = ['hero', 'card', 'og', 'wall', 't1', 't2', 't3', 't4', 't5', 't6', 't7', 'r', 'r1', 'r2', 'r3', 'r4',
  'dig a1', 'dig a2', 'dig a3', 'dig a4', 'dig a5', 'dig a6', 'dig sheet', 'compcard', 'other']

const rows = walk(PUBLIC)
  .filter((p) => ASSET.test(p))
  .map((p) => {
    const rel = posix(relative(PUBLIC, p))
    const file = rel.split('/').pop()
    let owner, role, model, slot
    if (rel.startsWith('m/')) {
      model = owner = rel.split('/')[1]
      const s = slotOf(file, model)
      role = [s.slot, s.detail].filter(Boolean).join(' - ')
      slot = s.slot
    } else if (rel.startsWith('site/')) {
      owner = 'site-pages'
      model = file.split('-')[0]
      const s = slotOf(file, model)
      slot = s.slot
      role = `site-page image - ${model} ${[s.slot, s.detail].filter(Boolean).join(' ')}`
    } else {
      owner = 'site'
      slot = 'other'
      role = 'other'
    }
    const refs = docs.filter((d) => d.refs.has('/' + rel)).map((d) => d.route)
    return { path: '/' + rel, owner, slot, role, refs: [...new Set(refs)].sort().join(' | ') || '(unreferenced)', model }
  })
  .sort((a, b) =>
    a.owner.localeCompare(b.owner) ||
    (a.owner === 'site-pages' ? a.model.localeCompare(b.model) : 0) ||
    SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot) ||
    a.path.localeCompare(b.path),
  )

const csv = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const lines = ['path,model_or_page,slot_role,referenced_by', ...rows.map((r) => [r.path, r.owner, r.role, r.refs].map(csv).join(','))]
writeFileSync(OUT, lines.join('\n') + '\n')
console.log(`asset-manifest.csv: ${rows.length} assets, ${rows.filter((r) => r.refs === '(unreferenced)').length} unreferenced`)
