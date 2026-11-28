// submit-brief: stores a /brief form submission in licensing_enquiries, then emails it to the agent.
// The insert decides success; the email is a notification whose outcome is kept on the row
// (email_status: sent / failed / not_configured). Logic lives in handler.ts.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  provided by Supabase. The service role bypasses RLS;
//                   licensing_enquiries has RLS on and no policies, so anon can neither read nor write it.
//   RESEND_API_KEY  for the email. If missing, the brief is still stored (email_status = not_configured).
//   BRIEF_FROM      optional. Default "CyberChic Briefs <briefs@cyberchicmodels.ai>".
//   BRIEF_TO        optional. Default "agent@cyberchicmodels.ai".
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { handleBrief, type Deps, type Mail } from './handler.ts'

const ALLOWED_ORIGINS = [/^https:\/\/(www\.)?cyberchicmodels\.ai$/, /^https:\/\/[a-z0-9-]+\.vercel\.app$/, /^http:\/\/localhost(:\d+)?$/]

function cors(origin: string | null): HeadersInit {
  const ok = origin && ALLOWED_ORIGINS.some((re) => re.test(origin))
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://www.cyberchicmodels.ai',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function sendWithResend(key: string, mail: Mail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: mail.from, to: [mail.to], reply_to: mail.replyTo, subject: mail.subject, html: mail.html, text: mail.text }),
  })
  return res.ok ? ({ ok: true } as const) : ({ ok: false, error: `Resend ${res.status}: ${await res.text()}` } as const)
}

const resendKey = Deno.env.get('RESEND_API_KEY')

const deps: Deps = {
  async findModel(slug) {
    const { data } = await db.from('models').select('id, name').eq('slug', slug).eq('roster_status', 'published').maybeSingle()
    return data
  },
  async findTier(code) {
    const { data } = await db.from('license_tiers').select('id, name').eq('code', code).eq('is_active', true).maybeSingle()
    return data
  },
  async insertEnquiry(row) {
    const { data, error } = await db.from('licensing_enquiries').insert(row).select('id').single()
    if (error) throw error
    return data
  },
  async updateEmailStatus(id, status, error) {
    const { error: e } = await db
      .from('licensing_enquiries')
      .update({ email_status: status, email_error: error, emailed_at: status === 'sent' ? new Date().toISOString() : null })
      .eq('id', id)
    if (e) throw e
  },
  sendEmail: resendKey ? (mail) => sendWithResend(resendKey, mail) : null,
  log: (...args) => console.error(...args),
}

const mailCfg = {
  from: Deno.env.get('BRIEF_FROM') ?? 'CyberChic Briefs <briefs@cyberchicmodels.ai>',
  to: Deno.env.get('BRIEF_TO') ?? 'agent@cyberchicmodels.ai',
}

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
  if (!input || typeof input !== 'object' || Array.isArray(input)) return reply(400, { ok: false, error: 'bad_json' })

  const result = await handleBrief(input, deps, mailCfg)
  return reply(result.status, result.body)
})
