// submit-brief: emails a /brief form submission to the agent. Nothing is written to the database.
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  required. Resend API key; the sending domain must be verified in Resend.
//   BRIEF_FROM      optional. Default "CyberChic Briefs <briefs@cyberchicmodels.ai>".
//   BRIEF_TO        optional. Default "agent@cyberchicmodels.ai".
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?cyberchicmodels\.ai$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/]

const FIELDS = {
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

const MAX_LEN = 4000
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function cors(origin: string | null): HeadersInit {
  const ok = origin && ALLOWED_ORIGINS.some((re) => re.test(origin))
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://www.cyberchicmodels.ai',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get('origin')), 'Content-Type': 'application/json' }
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers })

  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'method_not_allowed' })

  let input: Record<string, unknown>
  try {
    input = await req.json()
  } catch {
    return reply(400, { ok: false, error: 'bad_json' })
  }

  // Spam trap: the form's hidden "website" field is only ever filled by bots. Pretend success.
  if (typeof input.website === 'string' && input.website.trim()) return reply(200, { ok: true })

  const brief: Record<string, string> = {}
  for (const key of Object.keys(FIELDS)) {
    const v = input[key]
    brief[key] = typeof v === 'string' ? v.trim().slice(0, MAX_LEN) : ''
  }
  if (!brief.company_name || !brief.contact_name || !EMAIL.test(brief.contact_email)) {
    return reply(422, { ok: false, error: 'missing_required' })
  }

  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) {
    console.error('submit-brief: RESEND_API_KEY is not set')
    return reply(503, { ok: false, error: 'not_configured' })
  }

  const rows = (Object.entries(FIELDS) as [keyof typeof FIELDS, string][])
    .filter(([k]) => brief[k])
    .map(([k, label]) => `<tr><th align="left" style="padding:4px 16px 4px 0;color:#666">${label}</th><td style="padding:4px 0">${escape(brief[k]).replace(/\n/g, '<br>')}</td></tr>`)
    .join('')
  const text = (Object.entries(FIELDS) as [keyof typeof FIELDS, string][])
    .filter(([k]) => brief[k])
    .map(([k, label]) => `${label}: ${brief[k]}`)
    .join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('BRIEF_FROM') ?? 'CyberChic Briefs <briefs@cyberchicmodels.ai>',
      to: [Deno.env.get('BRIEF_TO') ?? 'agent@cyberchicmodels.ai'],
      reply_to: brief.contact_email,
      subject: `Brief: ${brief.company_name}${brief.model ? ` · ${brief.model}` : ''}`,
      html: `<h2 style="font-family:sans-serif">New brief from cyberchicmodels.ai/brief</h2><table style="font-family:sans-serif;font-size:14px">${rows}</table>`,
      text,
    }),
  })

  if (!res.ok) {
    console.error('submit-brief: Resend error', res.status, await res.text())
    return reply(502, { ok: false, error: 'send_failed' })
  }
  return reply(200, { ok: true })
})
