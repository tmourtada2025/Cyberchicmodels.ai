// submit-brief request handling, kept free of Deno and Supabase imports so it can be tested with fakes
// (handler.test.ts). index.ts wires in the real database (service role) and Resend.
//
// Order matters: the brief is stored first and that insert decides success. The email to the agent is
// a notification sent afterwards; its outcome is recorded on the row (email_status) and never turns a
// stored brief into an error for the sender.

export const FIELDS = {
  company_name: 'Company',
  contact_name: 'Name',
  contact_email: 'Email',
  contact_phone: 'Phone',
  model: 'Model',
  license_tier: 'License level',
  intended_use: 'Product and use',
  territory: 'Territory',
  budget_range: 'Budget',
  message: 'Anything else',
} as const

export type FieldKey = keyof typeof FIELDS
export type Brief = Record<FieldKey, string>
export type EmailStatus = 'sent' | 'failed' | 'not_configured'

export type EnquiryRow = {
  company_name: string
  contact_name: string
  contact_email: string
  contact_phone: string | null
  model_id: string | null
  license_tier_id: string | null
  intended_use: string | null
  territory: string | null
  budget_range: string | null
  message: string | null
  source: string
}

export type Deps = {
  // Published model by slug / active tier by code, for the row's foreign keys and the email.
  findModel(slug: string): Promise<{ id: string; name: string } | null>
  findTier(code: string): Promise<{ id: string; name: string } | null>
  // Throws if the row could not be stored.
  insertEnquiry(row: EnquiryRow): Promise<{ id: string }>
  updateEmailStatus(id: string, status: EmailStatus, error: string | null): Promise<void>
  // null = RESEND_API_KEY missing.
  sendEmail: ((mail: Mail) => Promise<{ ok: true } | { ok: false; error: string }>) | null
  log(...args: unknown[]): void
}

export type Mail = { to: string; from: string; replyTo: string; subject: string; html: string; text: string }

export const SOURCE = 'website:/brief'
const MAX_LEN = 4000
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export type Result = { status: number; body: Record<string, unknown> }

export async function handleBrief(
  input: Record<string, unknown>,
  deps: Deps,
  mailCfg: { from: string; to: string },
): Promise<Result> {
  // Spam trap: the form's hidden "website" field is only ever filled by bots. Pretend success, store nothing.
  if (typeof input.website === 'string' && input.website.trim()) return { status: 200, body: { ok: true } }

  const brief = {} as Brief
  for (const key of Object.keys(FIELDS) as FieldKey[]) {
    const v = input[key]
    brief[key] = typeof v === 'string' ? v.trim().slice(0, MAX_LEN) : ''
  }
  if (!brief.company_name || !brief.contact_name || !EMAIL.test(brief.contact_email)) {
    return { status: 422, body: { ok: false, error: 'missing_required' } }
  }

  // Unknown slugs or codes are kept as text in the email but not linked on the row.
  const [model, tier] = await Promise.all([
    brief.model ? deps.findModel(brief.model).catch(() => null) : null,
    brief.license_tier ? deps.findTier(brief.license_tier).catch(() => null) : null,
  ])

  let id: string
  try {
    ;({ id } = await deps.insertEnquiry({
      company_name: brief.company_name,
      contact_name: brief.contact_name,
      contact_email: brief.contact_email,
      contact_phone: brief.contact_phone || null,
      model_id: model?.id ?? null,
      license_tier_id: tier?.id ?? null,
      intended_use: brief.intended_use || null,
      territory: brief.territory || null,
      budget_range: brief.budget_range || null,
      message: brief.message || null,
      source: SOURCE,
    }))
  } catch (e) {
    deps.log('submit-brief: insert failed', e)
    return { status: 500, body: { ok: false, error: 'store_failed' } }
  }

  // From here on the brief is safe: every outcome below returns ok.
  const shown: Brief = { ...brief, model: model?.name ?? brief.model, license_tier: tier?.name ?? brief.license_tier }
  const entries = (Object.entries(FIELDS) as [FieldKey, string][]).filter(([k]) => shown[k])
  const mail: Mail = {
    from: mailCfg.from,
    to: mailCfg.to,
    replyTo: brief.contact_email,
    subject: `Brief: ${brief.company_name}${shown.model ? ` · ${shown.model}` : ''}`,
    html:
      `<h2 style="font-family:sans-serif">New brief from cyberchicmodels.ai/brief</h2>` +
      `<table style="font-family:sans-serif;font-size:14px">` +
      entries
        .map(([k, label]) => `<tr><th align="left" style="padding:4px 16px 4px 0;color:#666">${label}</th><td style="padding:4px 0">${escape(shown[k]).replace(/\n/g, '<br>')}</td></tr>`)
        .join('') +
      `</table><p style="font-family:sans-serif;font-size:12px;color:#666">Stored as enquiry ${id}.</p>`,
    text: entries.map(([k, label]) => `${label}: ${shown[k]}`).join('\n') + `\n\nStored as enquiry ${id}.`,
  }

  let status: EmailStatus
  let error: string | null = null
  if (!deps.sendEmail) {
    status = 'not_configured'
    deps.log('submit-brief: RESEND_API_KEY is not set; brief stored, no email sent', id)
  } else {
    try {
      const res = await deps.sendEmail(mail)
      if (res.ok) status = 'sent'
      else {
        status = 'failed'
        error = res.error
      }
    } catch (e) {
      status = 'failed'
      error = e instanceof Error ? e.message : String(e)
    }
    if (status === 'failed') deps.log('submit-brief: email failed; brief stored', id, error)
  }

  try {
    await deps.updateEmailStatus(id, status, error ? error.slice(0, 1000) : null)
  } catch (e) {
    deps.log('submit-brief: could not record email status', id, status, e)
  }
  return { status: 200, body: { ok: true } }
}
