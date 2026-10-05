-- proof_scores: the /proof page as data.
--
--   reference: one model's reference frame plus scored frames, with images (media bucket, proof/<slug>/).
--   chart:     per-model face-match scores for the dot chart; is_side_profile marks the hollow dot.
--   benchmark: cross-model figures that belong to no single model (model_id NULL),
--              e.g. "different models, median 0.35" and the 95%-of-pairs band at 0.53.
--
-- Visibility follows the model: a row is public only while its model is published.

begin;

create type proof_panel as enum ('reference','chart','benchmark');

create table proof_scores (
  id              uuid primary key default gen_random_uuid(),
  model_id        uuid references models(id) on delete cascade,
  panel           proof_panel not null,
  frame_label     text,
  score           numeric(3,2) check (score >= 0 and score <= 1),
  is_reference    boolean not null default false,
  is_side_profile boolean not null default false,
  image_path      text check (image_path ~ '^proof/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.webp$'),
  alt_text        text,
  measured_on     date,
  display_order   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint proof_scores_benchmark_has_no_model check ((panel = 'benchmark') = (model_id is null)),
  constraint proof_scores_scored_unless_reference check (is_reference or score is not null),
  constraint proof_scores_reference_panel_has_image check (panel <> 'reference' or image_path is not null)
);

create index proof_scores_model_idx on proof_scores (model_id);

alter table proof_scores enable row level security;

create policy proof_scores_public_select on proof_scores
  for select to anon, authenticated
  using (model_id is null or public.is_model_public(model_id));

create trigger proof_scores_set_updated_at
  before update on proof_scores
  for each row execute function public.set_updated_at();

-- Allowlist grant, same form as init_schema §12 (default privileges already revoked).
revoke all privileges on proof_scores from anon, authenticated;
grant select on proof_scores to anon, authenticated;

comment on table proof_scores is
  'The /proof page as data. Rows are public only while their model is published; benchmark rows have no model.';

commit;
