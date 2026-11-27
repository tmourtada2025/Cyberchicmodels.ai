// Run: node --test rebuild/supabase/functions/submit-brief/handler.test.ts   (Node 23.6+ strips the types)
// Fakes stand in for the database and Resend, so nothing touches production.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleBrief, SOURCE, type Deps, type EmailStatus, type EnquiryRow, type Mail } from './handler.ts'

const cfg = { from: 'CyberChic Briefs <briefs@cyberchicmodels.ai>', to: 'agent@cyberchicmodels.ai' }
const valid = {
  company_name: 'Acme',
  contact_name: 'Rana',
  contact_email: 'rana@acme.test',
  contact_phone: '',
  model: 'saba',
  license_tier: 'campaign',
  intended_use: 'Serum launch',
  territory: 'GCC',
  budget_range: '',
  message: 'Line one\nLine two <b>',
}

function fakes(opts: { insertFails?: boolean; email?: 'ok' | 'reject' | 'throw' | 'missing'; updateFails?: boolean } = {}) {
  const calls = { inserted: [] as EnquiryRow[], updates: [] as [string, EmailStatus, string | null][], mails: [] as Mail[], logs: [] as unknown[][] }
  const deps: Deps = {
    findModel: async (slug) => (slug === 'saba' ? { id: 'model-saba', name: 'Saba' } : null),
    findTier: async (code) => (code === 'campaign' ? { id: 'tier-campaign', name: 'Campaign' } : null),
    insertEnquiry: async (row) => {
      if (opts.insertFails) throw new Error('db down')
      calls.inserted.push(row)
      return { id: 'enq-1' }
    },
    updateEmailStatus: async (id, status, error) => {
      if (opts.updateFails) throw new Error('update failed')
      calls.updates.push([id, status, error])
    },
    sendEmail:
      opts.email === 'missing'
        ? null
        : async (mail) => {
            calls.mails.push(mail)
            if (opts.email === 'throw') throw new Error('network')
            return opts.email === 'reject' ? { ok: false, error: 'Resend 403: domain not verified' } : { ok: true }
          },
    log: (...a) => calls.logs.push(a),
  }
  return { deps, calls }
}

test('stores the brief, then emails it; success once stored', async () => {
  const { deps, calls } = fakes({ email: 'ok' })
  const r = await handleBrief(valid, deps, cfg)
  assert.deepEqual(r, { status: 200, body: { ok: true } })
  assert.equal(calls.inserted.length, 1)
  assert.deepEqual(calls.inserted[0], {
    company_name: 'Acme', contact_name: 'Rana', contact_email: 'rana@acme.test', contact_phone: null,
    model_id: 'model-saba', license_tier_id: 'tier-campaign', intended_use: 'Serum launch', territory: 'GCC',
    budget_range: null, message: 'Line one\nLine two <b>', source: SOURCE,
  })
  assert.deepEqual(calls.updates, [['enq-1', 'sent', null]])
  const m = calls.mails[0]
  assert.equal(m.to, 'agent@cyberchicmodels.ai')
  assert.equal(m.replyTo, 'rana@acme.test')
  assert.equal(m.subject, 'Brief: Acme · Saba')
  assert.match(m.html, /Line one<br>Line two &lt;b&gt;/)
  assert.match(m.text, /License level: Campaign/)
  assert.match(m.text, /Stored as enquiry enq-1/)
})

test('missing RESEND_API_KEY: brief stored, not_configured, still ok', async () => {
  const { deps, calls } = fakes({ email: 'missing' })
  const r = await handleBrief(valid, deps, cfg)
  assert.equal(r.status, 200)
  assert.equal(calls.inserted.length, 1)
  assert.deepEqual(calls.updates, [['enq-1', 'not_configured', null]])
})

test('Resend rejects: brief stored, failed + reason, still ok', async () => {
  const { deps, calls } = fakes({ email: 'reject' })
  const r = await handleBrief(valid, deps, cfg)
  assert.equal(r.status, 200)
  assert.deepEqual(calls.updates, [['enq-1', 'failed', 'Resend 403: domain not verified']])
})

test('Resend unreachable (throws): brief stored, failed, still ok', async () => {
  const { deps, calls } = fakes({ email: 'throw' })
  const r = await handleBrief(valid, deps, cfg)
  assert.equal(r.status, 200)
  assert.deepEqual(calls.updates, [['enq-1', 'failed', 'network']])
})

test('insert fails: error returned and no email sent', async () => {
  const { deps, calls } = fakes({ insertFails: true, email: 'ok' })
  const r = await handleBrief(valid, deps, cfg)
  assert.deepEqual(r, { status: 500, body: { ok: false, error: 'store_failed' } })
  assert.equal(calls.mails.length, 0)
  assert.equal(calls.updates.length, 0)
})

test('status update fails after a stored brief: still ok (logged)', async () => {
  const { deps, calls } = fakes({ email: 'ok', updateFails: true })
  const r = await handleBrief(valid, deps, cfg)
  assert.equal(r.status, 200)
  assert.ok(calls.logs.some((l) => String(l[0]).includes('could not record email status')))
})

test('unknown model slug / tier code: stored without links, shown as text in the email', async () => {
  const { deps, calls } = fakes({ email: 'ok' })
  await handleBrief({ ...valid, model: 'nobody', license_tier: 'social' }, deps, cfg)
  assert.equal(calls.inserted[0].model_id, null)
  assert.equal(calls.inserted[0].license_tier_id, null)
  assert.match(calls.mails[0].text, /Model: nobody/)
})

test('missing required fields: 422, nothing stored', async () => {
  const { deps, calls } = fakes({ email: 'ok' })
  for (const bad of [{ ...valid, company_name: ' ' }, { ...valid, contact_name: '' }, { ...valid, contact_email: 'no-at-sign' }]) {
    const r = await handleBrief(bad, deps, cfg)
    assert.equal(r.status, 422)
  }
  assert.equal(calls.inserted.length, 0)
})

test('spam trap: pretends success, stores and sends nothing', async () => {
  const { deps, calls } = fakes({ email: 'ok' })
  const r = await handleBrief({ ...valid, website: 'http://spam' }, deps, cfg)
  assert.deepEqual(r, { status: 200, body: { ok: true } })
  assert.equal(calls.inserted.length + calls.mails.length, 0)
})
