-- models.hero_mobile_top: on phones, show the hero photo in the top band instead of full-bleed.
--
-- Some mobile heroes put the face exactly where the eyebrow and name sit, and no crop fixes it
-- because the portrait image already fits the hero by height. With this on, the photo stops at
-- 64% of the hero and fades out, so the text sits on the dark band below. Default false keeps
-- every existing page as it is.

alter table public.models
  add column if not exists hero_mobile_top boolean not null default false;

comment on column public.models.hero_mobile_top is
  'Mobile hero: photo in the top 64% with a bottom fade, text below it. False = full-bleed.';
