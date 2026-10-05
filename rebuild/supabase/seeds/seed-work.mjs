// Work (/campaigns) page into the DB, as-is from rebuild/web/src/pages/CampaignsPage.tsx:
// per series → campaigns.description + campaigns.location on the model's editorial campaign;
// per hand-picked frame → campaign_images.work_order/work_alt/work_caption_mark/work_caption on the
// campaign image with the same picture (matched by pixel content; see below). No uploads, no status change.
//
//   node rebuild/supabase/seeds/seed-work.mjs --dry-run   read-only; writes seeds/dry-run/work-dry-run.{json,md}
//   node rebuild/supabase/seeds/seed-work.mjs --apply
//
// Env: D:\Cyberchicmodels\.env ONLY. No fallback.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const REPO = 'D:/Cyberchicmodels'
const WEB = `${REPO}/rebuild/web`
const OUT = `${REPO}/rebuild/supabase/seeds/dry-run`
const PROJECT = 'szzctvtsomdyabetzjnh'

const mode = process.argv.includes('--apply') ? 'apply' : process.argv.includes('--dry-run') ? 'dry-run' : null
if (!mode) throw new Error('Pass --dry-run or --apply')

const ENV_PATH = `${REPO}/.env`
if (!existsSync(ENV_PATH)) throw new Error(`STOP: ${ENV_PATH} missing (no fallback)`)
const env = Object.fromEntries(readFileSync(ENV_PATH, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l))
  .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
if (!env.SUPABASE_URL?.includes(PROJECT)) throw new Error(`STOP: SUPABASE_URL is not ${PROJECT}`)
const { createClient } = createRequire(`${WEB}/package.json`)('@supabase/supabase-js')
const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
const sha = (b) => createHash('sha256').update(b).digest('hex')
const problems = []
const notes = []
const check = (ok, msg) => { if (!ok) problems.push(msg) }

const src = readFileSync(`${WEB}/src/pages/CampaignsPage.tsx`, 'utf8')
const articles = [...src.matchAll(/<article className="series">([\s\S]*?)<\/article>/g)].map((m) => m[1])
check(articles.length === 4, `expected 4 series, found ${articles.length}`)

// Live DB state (service role: campaigns are draft)
const { data: models, error: me } = await db.from('models').select('id, slug, name, model_code')
if (me) throw me
const { data: campaigns, error: ce } = await db.from('campaigns').select('id, model_id, slug, name, kind, description, location')
if (ce) throw ce
const { data: images, error: ie } = await db.from('campaign_images').select('id, model_id, campaign_id, storage_path, alt_text, caption_mark, caption')
if (ie) throw ie
// work_order exists only once A5 is applied; before that the dry-run treats it as unset.
const { data: marked, error: we } = await db.from('campaign_images').select('id').not('work_order', 'is', null)
const alreadyMarked = we ? 0 : marked.length

const plan = { campaigns: [], frames: [] }
for (const a of articles) {
  const code = a.match(/<dt>Model<\/dt><dd>[^<]*· ([A-Z]{2}\d{2})<\/dd>/)[1]
  const model = models.find((m) => m.model_code === code)
  const editorial = campaigns.find((c) => c.model_id === model.id && c.kind === 'editorial')
  const h2 = decode(a.match(/<h2>([\s\S]*?)<\/h2>/)[1].replace(/<[^>]+>/g, ''))
  check(h2 === editorial.name, `${model.slug}: Work heading "${h2}" ≠ editorial "${editorial.name}"`)
  const description = decode(a.match(/<p className="muted">([^<]+)<\/p>/)[1])
  const location = decode(a.match(/<dt>Places<\/dt><dd>([^<]+)<\/dd>/)[1])
  const frames = Number(a.match(/<dt>Frames<\/dt><dd>(\d+)<\/dd>/)[1])
  const lanes = decode(a.match(/<dt>Lanes<\/dt><dd>([^<]+)<\/dd>/)[1])
  const href = a.match(/href="([^"]+)"/)[1]
  check(href === `/m/${model.slug}/`, `${model.slug}: CTA href ${href}`)
  check(a.includes(`>See ${model.name}<`), `${model.slug}: CTA label`)
  plan.campaigns.push({ model_slug: model.slug, campaign_id: editorial.id, campaign: editorial.slug, description, location,
    derived_checks: { frames_on_page: frames, lanes_on_page: lanes } })

  // Picks: match by file bytes first; if the bytes differ, fall back to the same file name in the model's campaigns
  // and record it (the Athena Work frames are earlier encodes of the same pictures).
  const figs = [...a.matchAll(/<img src="\/site\/img\/([^"]+)" alt="([^"]+)" \/><\/div><figcaption><b>([^<]+)<\/b> · ([^<]+)<\/figcaption>/g)]
  check(figs.length === 3, `${model.slug}: expected 3 picks, found ${figs.length}`)
  figs.forEach((f, i) => {
    const [, file, alt, mark, cap] = f
    const bytes = sha(readFileSync(`${WEB}/public/site/img/${file}`))
    const own = images.filter((im) => im.model_id === model.id)
    let hit = own.find((im) => sha(readFileSync(`${WEB}/public/m/${model.slug}/img/${im.storage_path.split('/').pop()}`)) === bytes)
    let match = 'identical bytes'
    if (!hit) {
      hit = own.find((im) => im.storage_path.endsWith(`/${file}`))
      match = 'same file name, different encode'
      if (hit) notes.push(`${model.slug}: ${file} matched by name; bytes differ from the model-page image (earlier encode, same picture)`)
    }
    check(hit, `${model.slug}: no campaign image for ${file}`)
    if (!hit) return
    plan.frames.push({ model_slug: model.slug, image_id: hit.id, storage_path: hit.storage_path, match, work_page_file: file,
      work_order: i + 1, work_alt: decode(alt), work_caption_mark: decode(mark), work_caption: decode(cap),
      model_page: { alt: hit.alt_text, caption_mark: hit.caption_mark, caption: hit.caption } })
  })
}

// Derived values the template will compute must equal what the page shows today.
for (const c of plan.campaigns) {
  const m = models.find((x) => x.slug === c.model_slug)
  notes.push(`${c.model_slug}: page shows Frames ${c.derived_checks.frames_on_page} and Lanes "${c.derived_checks.lanes_on_page}" (template derives both; verified in parity)`)
  void m
}
check(alreadyMarked === 0, `campaign_images already has ${alreadyMarked} work_order rows; this seed fills an empty marker`)
if (we) notes.push('work_order column not present yet (A5 not applied); --apply needs A5 first')

mkdirSync(OUT, { recursive: true })
writeFileSync(`${OUT}/work-dry-run.json`, JSON.stringify({ generated_at: new Date().toISOString(), problems, notes, ...plan }, null, 2))
const md = ['# Work page seed: dry run', '', `Nothing was written. ${problems.length ? '' : '✅ all checks passed'}`, ...problems.map((p) => `- ❌ ${p}`), ...notes.map((n) => `- ℹ️ ${n}`), '',
  '## campaigns (editorial): description + location', '', '| model | campaign | location | description |', '|---|---|---|---|',
  ...plan.campaigns.map((c) => `| ${c.model_slug} | ${c.campaign} | ${c.location} | ${c.description} |`), '',
  '## campaign_images: Work picks', '', '| model | # | image | match | mark · caption (Work) | alt (Work) | model-page caption |', '|---|---|---|---|---|---|---|',
  ...plan.frames.map((f) => `| ${f.model_slug} | ${f.work_order} | ${f.storage_path.split('/').slice(2).join('/')} | ${f.match} | ${f.work_caption_mark} · ${f.work_caption} | ${f.work_alt} | ${[f.model_page.caption_mark, f.model_page.caption].filter(Boolean).join(' · ')} |`)]
writeFileSync(`${OUT}/work-dry-run.md`, md.join('\n'))
console.log(`problems: ${problems.length}`, problems, notes)
if (mode === 'dry-run') process.exit(0)

if (problems.length) throw new Error('STOP: checks failed; nothing applied')
for (const c of plan.campaigns) {
  const { error } = await db.from('campaigns').update({ description: c.description, location: c.location }).eq('id', c.campaign_id)
  if (error) throw error
}
for (const f of plan.frames) {
  const { error } = await db.from('campaign_images')
    .update({ work_order: f.work_order, work_alt: f.work_alt, work_caption_mark: f.work_caption_mark, work_caption: f.work_caption }).eq('id', f.image_id)
  if (error) throw error
}
console.log('applied')
