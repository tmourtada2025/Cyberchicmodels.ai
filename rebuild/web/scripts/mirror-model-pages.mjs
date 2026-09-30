// Review mirror: copy each live model page (public/m/<slug>/) to out/web/<slug>/site/ in the
// CyberChic master folder, as <slug>.html + img/, the layout Dalia and Ariadne already use there.
// Run after any model page is built or changed:  npm run mirror  [slug ...]   (--check: report only)
// Copies over existing files; never deletes. Set CYBERCHIC_MIRROR to override the mirror root.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODELS = fileURLToPath(new URL('../public/m', import.meta.url))
const MIRROR = process.env.CYBERCHIC_MIRROR ?? 'D:/CyberChic-MASTER-remotion-template-freestyle/out/web'
const args = process.argv.slice(2)
const check = args.includes('--check')
const only = args.filter((a) => !a.startsWith('--'))

if (!existsSync(MIRROR)) {
  console.error(`mirror: ${MIRROR} not found (set CYBERCHIC_MIRROR). Nothing copied.`)
  process.exit(1)
}

const same = (a, b) => existsSync(b) && statSync(a).size === statSync(b).size && readFileSync(a).equals(readFileSync(b))

const slugs = readdirSync(MODELS).filter((s) => statSync(join(MODELS, s)).isDirectory() && (!only.length || only.includes(s)))
for (const slug of slugs) {
  const site = join(MIRROR, slug, 'site')
  const pairs = [[join(MODELS, slug, 'index.html'), join(site, `${slug}.html`)]]
  const img = join(MODELS, slug, 'img')
  if (existsSync(img)) for (const f of readdirSync(img)) pairs.push([join(img, f), join(site, 'img', f)])

  const changed = pairs.filter(([src, dst]) => !same(src, dst))
  const extra = existsSync(join(site, 'img'))
    ? readdirSync(join(site, 'img')).filter((f) => !existsSync(join(img, f)))
    : []
  if (!check) {
    mkdirSync(join(site, 'img'), { recursive: true })
    for (const [src, dst] of changed) copyFileSync(src, dst)
  }
  console.log(
    `${slug.padEnd(10)} ${check ? 'differs' : 'copied '}: ${changed.length}/${pairs.length} files` +
      (changed.length && check ? ` (${changed.map(([, d]) => d.split(/[\\/]/).pop()).slice(0, 6).join(', ')}${changed.length > 6 ? ', …' : ''})` : '') +
      (extra.length ? ` | only in mirror: ${extra.length} (${extra.slice(0, 4).join(', ')}${extra.length > 4 ? ', …' : ''})` : ''),
  )
}
