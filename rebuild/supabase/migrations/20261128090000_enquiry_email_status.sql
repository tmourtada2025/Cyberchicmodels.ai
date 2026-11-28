-- licensing_enquiries.email_status: the /brief form now stores every brief before emailing it.
--
-- The submit-brief Edge Function inserts the brief (service role) and only then sends the notification
-- email through Resend, recording the outcome here. A brief is never lost because the email failed or
-- RESEND_API_KEY is missing: the row is the record, the email is a notification.
--
--   pending         row stored, email not attempted yet
--   sent            Resend accepted the email (emailed_at set)
--   failed          Resend rejected it or was unreachable (email_error holds the reason)
--   not_configured  RESEND_API_KEY is not set; nothing was sent
--
-- Access is unchanged: RLS on, no policies, so anon and authenticated can neither read nor write.
-- Only the service role (the Edge Function) touches this table.

create type enquiry_email_status as enum ('pending', 'sent', 'failed', 'not_configured');

alter table public.licensing_enquiries
  add column if not exists email_status enquiry_email_status not null default 'pending',
  add column if not exists email_error text,
  add column if not exists emailed_at timestamptz;

alter table public.licensing_enquiries enable row level security;
revoke all on table public.licensing_enquiries from anon, authenticated;

comment on column public.licensing_enquiries.email_status is
  'Notification email outcome for this brief: pending, sent, failed or not_configured (no RESEND_API_KEY).';
comment on column public.licensing_enquiries.email_error is
  'Why the notification email failed (Resend status and message), when email_status = failed.';
comment on column public.licensing_enquiries.emailed_at is
  'When Resend accepted the notification email.';
