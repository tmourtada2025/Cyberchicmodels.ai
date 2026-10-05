-- Roster into the DB: columns the /models/<slug> template needs to reproduce each
-- static page (public/m/<slug>/) as-is, plus the 25+ publish floor.
--
-- Layout is per page, not standardised: hero crop/align/title scale, the world
-- grid (campaigns.layout) and the stat rows (comp_stats) are stored per model.
-- Text columns hold the page wording verbatim.

begin;

-- ---------------------------------------------------------------------
-- 1. Enum additions (not used in this transaction)
-- ---------------------------------------------------------------------

-- The static pages frame images at 4:5 and 3:2; studio digitals get their own register.
alter type aspect_ratio   add value if not exists '4:5';
alter type aspect_ratio   add value if not exists '3:2';
alter type image_register add value if not exists 'digital';

create type campaign_kind as enum ('editorial','range','digitals');

-- ---------------------------------------------------------------------
-- 2. models
-- ---------------------------------------------------------------------

alter table public.models
  add column model_code        text unique check (model_code ~ '^[A-Z]{2}[0-9]{2}$'),
  add column age_label         text,
  add column on_roster_cards   boolean not null default true,
  add column on_hero_wall      boolean not null default true,
  add column wall_path         text check (wall_path ~ '^models/[a-z0-9]+(-[a-z0-9]+)*/wall\.webp$'),
  add column hero_desktop_path text check (hero_desktop_path ~ '^models/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.webp$'),
  add column hero_mobile_path  text check (hero_mobile_path  ~ '^models/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.webp$'),
  add column hero_alt          text,
  add column hero_focus        text check (hero_focus        ~ '^[0-9]{1,3}% [0-9]{1,3}%$'),
  add column hero_focus_mobile text check (hero_focus_mobile ~ '^[0-9]{1,3}% [0-9]{1,3}%$'),
  add column hero_align        text not null default 'left' check (hero_align in ('left','right')),
  add column hero_title_scale  text not null default 'xl'   check (hero_title_scale in ('xl','l')),
  add column hero_facts        jsonb not null default '[]' check (jsonb_typeof(hero_facts) = 'array'),
  add column og_path           text check (og_path           ~ '^models/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.webp$'),
  add column compcard_path     text check (compcard_path     ~ '^models/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.webp$'),
  add column compcard_pdf_path text check (compcard_pdf_path ~ '^models/[a-z0-9]+(-[a-z0-9]+)*/[^/]+\.pdf$'),
  add column story_lead        text,
  add column story_body        text,
  add column strip_items       text[] not null default '{}',
  add column meta_description  text,
  add column comp_stats        jsonb not null default '[]' check (jsonb_typeof(comp_stats) = 'array');

-- Brand-safety floor: nobody is published unless their set minimum age is 25+.
alter table public.models
  add constraint models_publish_requires_age_25
  check (roster_status <> 'published' or age_range_min >= 25);

comment on column public.models.age_label is
  'Age exactly as the page words it ("28", "Mid 20s"). age_range_min is the deliberately set floor value.';
comment on column public.models.on_roster_cards is 'Shown on the homepage roster cards.';
comment on column public.models.on_hero_wall is 'Shown on the homepage hero drift wall.';
comment on column public.models.wall_path is 'Hero-wall tile when it differs from the portrait (card).';
comment on column public.models.hero_focus is 'CSS object-position of the desktop hero image.';
comment on column public.models.hero_focus_mobile is 'CSS object-position of the phone hero image; NULL = same as hero_focus.';
comment on column public.models.hero_title_scale is 'xl = clamp(84px,17vw,220px); l = clamp(84px,11vw,168px) with the phone override.';
comment on column public.models.hero_facts is 'Ordered [{label,value}] shown under the hero name, verbatim.';
comment on column public.models.strip_items is 'Marquee items, verbatim, in order.';
comment on column public.models.comp_stats is
  'Ordered [{label,value}] for the stats card after Code/Look/Origin, verbatim (row set varies by model).';

-- ---------------------------------------------------------------------
-- 3. campaigns: one per page section (editorial world, range, digitals)
-- ---------------------------------------------------------------------

alter table public.campaigns
  add column kind           campaign_kind not null default 'editorial',
  add column intro          text,
  add column heading_accent text,
  add column anchor         text check (anchor ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  add column layout         jsonb check (layout is null or jsonb_typeof(layout) = 'array');

-- One range and one digitals section per model; editorial campaigns may be many.
create unique index campaigns_one_range_digitals_per_model
  on public.campaigns (model_id, kind) where kind <> 'editorial';

comment on column public.campaigns.kind is 'editorial = the world story; range = buyer lines; digitals = studio identity proof.';
comment on column public.campaigns.heading_accent is 'Trailing part of name rendered in lime ("Thread" of "The Thread").';
comment on column public.campaigns.anchor is 'Section id on the model page, verbatim from the static page.';
comment on column public.campaigns.layout is
  'World grid as rows: [{grid, cols?, items:[{order, span?, tall?, fill?, ratio}]}], verbatim per page.';

-- ---------------------------------------------------------------------
-- 4. campaign_images: figcaptions
-- ---------------------------------------------------------------------

alter table public.campaign_images
  add column caption_mark text,
  add column caption      text;

comment on column public.campaign_images.caption_mark is 'Bold lead of the figcaption ("I", "II"), verbatim.';
comment on column public.campaign_images.caption is 'Figcaption text after the mark, verbatim.';

commit;
