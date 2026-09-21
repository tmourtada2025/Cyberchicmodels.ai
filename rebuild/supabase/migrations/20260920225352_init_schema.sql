-- =====================================================================
-- CyberChicModels.ai — initial schema
--
-- TARGET: a NEW, EMPTY Supabase project.
-- DO NOT RUN THIS AGAINST THE EXISTING PRODUCTION PROJECT.
-- The old project stays live until cutover. This migration creates 12
-- tables, 3 functions and 13 enum types, strips anon/authenticated back
-- to zero privileges, and grants SELECT back only on the nine tables the
-- public site reads.
--
-- Identity-locked model licensing: models, bibles, campaigns, pipeline,
-- licensing. Clean build; supersedes all prior structure.
--
-- RLS: public SELECT of published content only. No write policy exists
-- on any table — service_role bypasses RLS, so the wizard needs none and
-- anon can never write.
--
-- NOT in this file, by design:
--   * seed data (license tiers/features) — separate, re-runnable step
--   * storage bucket creation (media, pipeline) — project setup
--   * the re-key of existing files — a later, supervised
--     COPY -> VERIFY -> DELETE task that this migration does not touch
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Helpers and enums
-- gen_random_uuid() is core Postgres 13+; no extension required.
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

comment on function public.set_updated_at() is
  'Row-level updated_at stamp. Attached to every table in this schema.';

-- identity
create type gender          as enum ('female','male','non_binary');
create type roster_status   as enum ('planned','in_progress','published','paused','archived');
create type lora_status     as enum ('not_started','dataset_ready','training','trained','retired');

-- publishing
create type campaign_status as enum ('draft','in_production','published','archived');
create type image_register  as enum ('editorial','beauty','campaign','lifestyle');
create type aspect_ratio    as enum ('2:3','4:3','1:1','16:9');
create type storage_bucket  as enum ('media','pipeline');

-- campaign props
create type accessory_category as enum
  ('jewelry','eyewear','bag','footwear','headwear','outerwear','other');

-- pipeline
create type isolated_asset_type as enum ('garment','accessory','face');
create type generation_status   as enum ('queued','running','succeeded','failed','discarded');
create type generation_category as enum
  ('campaign_image','identity_reference','isolated_garment','isolated_accessory','isolated_face');

-- commercial
create type license_tier_code as enum ('social','commercial','exclusive');
create type enquiry_status    as enum ('new','contacted','qualified','won','lost','archived');


-- ---------------------------------------------------------------------
-- 1. models — the licensable identity
-- ---------------------------------------------------------------------

create table models (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique
                          check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                  text not null,

  gender                gender not null,
  ethnicity             text,
  age_range_min         smallint check (age_range_min between 16 and 99),
  age_range_max         smallint check (age_range_max between 16 and 99),
  face_descriptor       text,
  skin_descriptor       text,
  eye_descriptor        text,
  hair_descriptor       text,
  defining_features     text,
  specialties           text[] not null default '{}',

  trigger_word          text unique,
  lora_status           lora_status not null default 'not_started',
  lora_version          text,

  is_consistency_locked boolean not null default false,
  consistency_locked_at timestamptz,

  roster_status         roster_status not null default 'planned',
  portrait_path         text
                          check (portrait_path ~ '^models/[a-z0-9]+(-[a-z0-9]+)*/portrait\.webp$'),
  vip_score             smallint check (vip_score between 0 and 100),
  market_gap            text,
  display_order         integer not null default 0,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint models_age_range_ordered
    check (age_range_min is null or age_range_max is null
           or age_range_min <= age_range_max),

  constraint models_lock_timestamped
    check (is_consistency_locked = (consistency_locked_at is not null)),

  constraint models_publish_requires_lock
    check (roster_status <> 'published' or is_consistency_locked),

  constraint models_publish_requires_portrait
    check (roster_status <> 'published' or portrait_path is not null)
);

alter table models enable row level security;

create policy models_public_select on models
  for select to anon, authenticated
  using (roster_status = 'published');

create index models_roster_status_idx on models (roster_status);
create index models_display_order_idx on models (display_order, name);
create index models_specialties_idx   on models using gin (specialties);

create trigger models_set_updated_at
  before update on models
  for each row execute function public.set_updated_at();

comment on table models is
  'One synthetic identity. Publishable only when consistency-locked (enforced by CHECK).';
comment on column models.specialties is
  'Filterable facets for the roster grid. Array, not a lookup table.';
comment on column models.defining_features is
  'Prose; feeds prompt construction. Distinct from specialties.';


-- ---------------------------------------------------------------------
-- 1a. RLS helper — answers "is this model public?" without nesting RLS
-- ---------------------------------------------------------------------

create function public.is_model_public(p_model_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.models m
    where m.id = p_model_id
      and m.roster_status = 'published'
  );
$$;

revoke execute on function public.is_model_public(uuid) from public;
grant  execute on function public.is_model_public(uuid) to anon, authenticated, service_role;


-- ---------------------------------------------------------------------
-- 2. model_bibles — the narrative tier, 1:1 with models
-- ---------------------------------------------------------------------

create table model_bibles (
  model_id              uuid primary key references models(id) on delete cascade,
  archetype             text,
  psychological_profile text,
  narrative             text,
  voice_and_tone        text,
  backstory_summary     text,
  is_published          boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table model_bibles enable row level security;

create policy model_bibles_public_select on model_bibles
  for select to anon, authenticated
  using (is_published and public.is_model_public(model_id));

create trigger model_bibles_set_updated_at
  before update on model_bibles
  for each row execute function public.set_updated_at();

comment on table model_bibles is
  'Long-form identity narrative. Separate table: own publish lifecycle, keeps the roster row narrow.';


-- ---------------------------------------------------------------------
-- 3. campaigns — the core licensable unit
-- ---------------------------------------------------------------------

create table campaigns (
  id                      uuid primary key default gen_random_uuid(),
  model_id                uuid not null references models(id) on delete cascade,
  slug                    text not null
                            check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name                    text not null,
  description             text,
  narrative               text,
  location                text,
  usage_scope             text,
  status                  campaign_status not null default 'draft',
  display_order           integer not null default 0,
  accessory_set_locked_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (model_id, slug),
  unique (id, model_id)   -- anchor for the composite FK from campaign_images
);

alter table campaigns enable row level security;

create policy campaigns_public_select on campaigns
  for select to anon, authenticated
  using (status = 'published' and public.is_model_public(model_id));

create index campaigns_model_order_idx on campaigns (model_id, display_order, name);
create index campaigns_status_idx      on campaigns (status);

create trigger campaigns_set_updated_at
  before update on campaigns
  for each row execute function public.set_updated_at();

comment on table campaigns is
  'What the site publishes and a brand licenses. One model per campaign; slug unique per model (nested URLs).';
comment on column campaigns.accessory_set_locked_at is
  'When the finite accessory set was frozen. NULL = still open.';


-- ---------------------------------------------------------------------
-- 3a. RLS helper — "is this campaign public?"
-- ---------------------------------------------------------------------

create function public.is_campaign_public(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaigns c
    join public.models    m on m.id = c.model_id
    where c.id = p_campaign_id
      and c.status = 'published'
      and m.roster_status = 'published'
  );
$$;

revoke execute on function public.is_campaign_public(uuid) from public;
grant  execute on function public.is_campaign_public(uuid) to anon, authenticated, service_role;


-- ---------------------------------------------------------------------
-- 4. generation_logs — append-only pipeline record (DARK: no public policy)
-- ---------------------------------------------------------------------

create table generation_logs (
  id               uuid primary key default gen_random_uuid(),
  model_id         uuid not null references models(id)    on delete cascade,
  campaign_id      uuid          references campaigns(id) on delete set null,
  batch_key        text not null
                     check (batch_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sequence_number  integer not null check (sequence_number >= 0),
  category         generation_category not null,
  prompt_text      text not null,
  negative_prompt  text,
  generation_model text,
  seed             bigint,
  status           generation_status not null default 'queued',
  output_path      text
                     check (output_path ~ '^generations/[a-z0-9]+(-[a-z0-9]+)*/[a-z0-9-]+/[0-9]+\.webp$'),
  error_message    text,
  started_at       timestamptz,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (batch_key, sequence_number),

  constraint generation_logs_succeeded_has_output
    check (status <> 'succeeded' or output_path is not null)
);

alter table generation_logs enable row level security;
-- No policy. RLS enabled with zero policies = deny all for non-bypass roles.

create index generation_logs_model_idx    on generation_logs (model_id, created_at desc);
create index generation_logs_campaign_idx on generation_logs (campaign_id);
create index generation_logs_status_idx   on generation_logs (status);

create trigger generation_logs_set_updated_at
  before update on generation_logs
  for each row execute function public.set_updated_at();

comment on table generation_logs is
  'Internal. One row per prompt. batch_key + sequence_number make a wizard run resumable and idempotent.';


-- ---------------------------------------------------------------------
-- 5. campaign_accessories — locked, finite set scoped per campaign
-- ---------------------------------------------------------------------

create table campaign_accessories (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references campaigns(id) on delete cascade,
  sku_code       text not null
                   check (sku_code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
  name           text not null,
  category       accessory_category not null default 'other',
  description    text,
  constraints    text,
  reference_path text
                   check (reference_path ~ '^campaigns/[a-z0-9]+(-[a-z0-9]+)*/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.webp$'),
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (campaign_id, sku_code)
);

alter table campaign_accessories enable row level security;

create policy campaign_accessories_public_select on campaign_accessories
  for select to anon, authenticated
  using (public.is_campaign_public(campaign_id));

create index campaign_accessories_campaign_idx
  on campaign_accessories (campaign_id, display_order);

create trigger campaign_accessories_set_updated_at
  before update on campaign_accessories
  for each row execute function public.set_updated_at();

comment on table campaign_accessories is
  'Per-campaign props. Deliberately not a global catalog — reuse across campaigns is the thing being sold against.';
comment on column campaign_accessories.constraints is
  'Styling rules, e.g. "left wrist only, never removed mid-campaign".';


-- ---------------------------------------------------------------------
-- 6. campaign_images — the deliverable
-- ---------------------------------------------------------------------

create table campaign_images (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null,
  model_id          uuid not null,
  storage_bucket    storage_bucket not null default 'media',
  storage_path      text not null
                      check (storage_path ~ '^campaigns/[a-z0-9]+(-[a-z0-9]+)*/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.webp$'),
  register          image_register not null,
  aspect_ratio      aspect_ratio not null,
  width_px          integer check (width_px  > 0),
  height_px         integer check (height_px > 0),
  alt_text          text,
  is_hero           boolean not null default false,
  display_order     integer not null default 0,
  generation_model  text,
  generation_log_id uuid references generation_logs(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  unique (storage_bucket, storage_path),

  -- model_id can never disagree with its campaign's model
  foreign key (campaign_id, model_id)
    references campaigns(id, model_id) on delete cascade
);

alter table campaign_images enable row level security;

create policy campaign_images_public_select on campaign_images
  for select to anon, authenticated
  using (public.is_campaign_public(campaign_id));

create index campaign_images_campaign_order_idx on campaign_images (campaign_id, display_order);
create index campaign_images_model_idx          on campaign_images (model_id);
create index campaign_images_register_idx       on campaign_images (register);
create index campaign_images_generation_log_idx on campaign_images (generation_log_id);

create unique index campaign_images_one_hero_idx
  on campaign_images (campaign_id) where is_hero;

create trigger campaign_images_set_updated_at
  before update on campaign_images
  for each row execute function public.set_updated_at();

comment on table campaign_images is
  'Published imagery. Composite FK guarantees model_id matches the campaign. One hero per campaign.';
comment on column campaign_images.generation_log_id is
  'Originating prompt. SET NULL on delete so pruning pipeline logs never damages published rows.';


-- ---------------------------------------------------------------------
-- 6a. RLS helper — "is this campaign image public?"
-- ---------------------------------------------------------------------

create function public.is_campaign_image_public(p_campaign_image_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.campaign_images ci
    join public.campaigns       c on c.id = ci.campaign_id
    join public.models          m on m.id = c.model_id
    where ci.id = p_campaign_image_id
      and c.status = 'published'
      and m.roster_status = 'published'
  );
$$;

revoke execute on function public.is_campaign_image_public(uuid) from public;
grant  execute on function public.is_campaign_image_public(uuid) to anon, authenticated, service_role;


-- ---------------------------------------------------------------------
-- 7. isolated_assets — stripped items (DARK: no public policy)
-- ---------------------------------------------------------------------

create table isolated_assets (
  id                    uuid primary key default gen_random_uuid(),
  model_id              uuid not null references models(id)    on delete cascade,
  campaign_id           uuid          references campaigns(id) on delete set null,
  campaign_accessory_id uuid          references campaign_accessories(id) on delete set null,
  source_image_id       uuid          references campaign_images(id)      on delete set null,
  generation_log_id     uuid          references generation_logs(id)      on delete set null,
  asset_type            isolated_asset_type not null,
  item_name             text not null,
  storage_bucket        storage_bucket not null default 'pipeline',
  storage_path          text not null
                          check (storage_path ~ '^isolated/[a-z0-9]+(-[a-z0-9]+)*/(_model|[a-z0-9]+(-[a-z0-9]+)*)/(garment|accessory|face)/[^/]+\.webp$'),
  display_order         integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  unique (storage_bucket, storage_path),

  -- the path's type segment must match the declared asset_type
  constraint isolated_assets_path_matches_type
    check (split_part(storage_path, '/', 4) = asset_type::text)
);

alter table isolated_assets enable row level security;
-- No policy. Internal working set.

create index isolated_assets_model_type_idx on isolated_assets (model_id, asset_type);
create index isolated_assets_campaign_idx   on isolated_assets (campaign_id);

create trigger isolated_assets_set_updated_at
  before update on isolated_assets
  for each row execute function public.set_updated_at();

comment on table isolated_assets is
  'Internal. Stripped garments/accessories/faces for the batch pipeline. Path segment 3 is the campaign slug, or _model when unscoped.';


-- ---------------------------------------------------------------------
-- 8. license_tiers — structure without published prices
-- ---------------------------------------------------------------------

create table license_tiers (
  id             uuid primary key default gen_random_uuid(),
  code           license_tier_code not null unique,
  name           text not null,
  summary        text,
  price_amount   numeric(10,2),
  price_currency char(3),
  price_display  text not null default 'On request',
  display_order  integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint license_tiers_price_needs_currency
    check (price_amount is null or price_currency is not null)
);

alter table license_tiers enable row level security;

create policy license_tiers_public_select on license_tiers
  for select to anon, authenticated
  using (is_active);

create trigger license_tiers_set_updated_at
  before update on license_tiers
  for each row execute function public.set_updated_at();

comment on column license_tiers.price_amount is
  'Intentionally NULL. The site renders price_display until prices are published; no code change needed then.';


-- ---------------------------------------------------------------------
-- 9. license_features + license_tier_features — aligned comparison matrix
-- ---------------------------------------------------------------------

create table license_features (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique
                  check (code ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
  label         text not null,
  feature_group text,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table license_features enable row level security;

create policy license_features_public_select on license_features
  for select to anon, authenticated
  using (true);

create trigger license_features_set_updated_at
  before update on license_features
  for each row execute function public.set_updated_at();

comment on table license_features is
  'Canonical feature rows, reused across tiers so the comparison table renders with aligned rows.';


create table license_tier_features (
  license_tier_id    uuid not null references license_tiers(id)    on delete cascade,
  license_feature_id uuid not null references license_features(id) on delete cascade,
  is_included        boolean not null default false,
  value_note         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  primary key (license_tier_id, license_feature_id)
);

alter table license_tier_features enable row level security;

create policy license_tier_features_public_select on license_tier_features
  for select to anon, authenticated
  using (true);

create index license_tier_features_feature_idx
  on license_tier_features (license_feature_id);

create trigger license_tier_features_set_updated_at
  before update on license_tier_features
  for each row execute function public.set_updated_at();

comment on column license_tier_features.value_note is
  'Scoped value where a boolean is not enough: "up to 3 channels", "12 months", "unlimited".';


-- ---------------------------------------------------------------------
-- 10. licensing_enquiries — leads (DARK: no public policy)
-- ---------------------------------------------------------------------

create table licensing_enquiries (
  id              uuid primary key default gen_random_uuid(),
  company_name    text not null,
  contact_name    text not null,
  contact_email   text not null
                    check (contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone   text,
  model_id        uuid references models(id)        on delete set null,
  campaign_id     uuid references campaigns(id)     on delete set null,
  license_tier_id uuid references license_tiers(id) on delete set null,
  intended_use    text,
  territory       text,
  budget_range    text,
  message         text,
  status          enquiry_status not null default 'new',
  source          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table licensing_enquiries enable row level security;
-- No policy. Inserts arrive via an Edge Function holding the service role;
-- the frontend stays strictly read-only and lead PII is never publicly readable.

create index licensing_enquiries_status_idx on licensing_enquiries (status, created_at desc);

create trigger licensing_enquiries_set_updated_at
  before update on licensing_enquiries
  for each row execute function public.set_updated_at();

comment on table licensing_enquiries is
  'Internal. Contains PII. Written only by the enquiry Edge Function via service_role.';


-- ---------------------------------------------------------------------
-- 11. homepage_slides — curation over existing campaign images
-- ---------------------------------------------------------------------

create table homepage_slides (
  id                uuid primary key default gen_random_uuid(),
  campaign_image_id uuid not null unique references campaign_images(id) on delete cascade,
  headline          text,
  subheadline       text,
  cta_label         text,
  cta_href          text,
  display_order     integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table homepage_slides enable row level security;

create policy homepage_slides_public_select on homepage_slides
  for select to anon, authenticated
  using (is_active and public.is_campaign_image_public(campaign_image_id));

create index homepage_slides_active_idx
  on homepage_slides (display_order) where is_active;

create trigger homepage_slides_set_updated_at
  before update on homepage_slides
  for each row execute function public.set_updated_at();

comment on table homepage_slides is
  'Curation only — points at an existing campaign image. No duplicate files, inherits publish state through the FK.';


-- ---------------------------------------------------------------------
-- 12. Privileges — allowlist, not denylist
--
-- The frontend roles start from zero and get SELECT back only on the
-- nine public-readable tables.
--
-- Enumerating privileges to revoke is NOT safe here. Supabase's default
-- privileges grant ALL on new public tables to anon/authenticated, and
-- ALL includes TRUNCATE — which is not subject to RLS. A role holding
-- TRUNCATE can empty a table with every policy still in place. Revoking
-- everything and granting back is the only form that cannot be defeated
-- by a privilege type this file forgot to name.
--
-- isolated_assets, generation_logs and licensing_enquiries are absent
-- from the grant list by construction, not by a separate revoke.
-- ---------------------------------------------------------------------

revoke all privileges on all tables in schema public
  from anon, authenticated;

grant select on
  models,
  model_bibles,
  campaigns,
  campaign_accessories,
  campaign_images,
  license_tiers,
  license_features,
  license_tier_features,
  homepage_slides
  to anon, authenticated;

alter default privileges in schema public
  revoke all privileges on tables from anon, authenticated;

commit;
