-- Work (/campaigns) page as data.
--
-- Series copy goes in the existing campaigns.description and campaigns.location.
-- The hand-picked frames are marked on campaign_images with an explicit order; a pick can come
-- from any of the model's campaigns (Ariadne's Work page uses a range frame). The Work page shows
-- its own alt text and caption for a pick, which differ from the model page's, so they are stored
-- alongside rather than overwriting the model-page values.

begin;

alter table public.campaign_images
  add column work_order        smallint check (work_order between 1 and 9),
  add column work_alt          text,
  add column work_caption_mark text,
  add column work_caption      text;

create unique index campaign_images_one_work_order_per_model
  on public.campaign_images (model_id, work_order) where work_order is not null;

comment on column public.campaign_images.work_order is
  'Position among the model''s hand-picked frames on the Work page. NULL = not picked.';
comment on column public.campaign_images.work_alt is 'Alt text on the Work page, verbatim.';
comment on column public.campaign_images.work_caption_mark is 'Bold lead of the Work-page figcaption ("III", "Range"), verbatim.';
comment on column public.campaign_images.work_caption is 'Work-page figcaption text after the mark, verbatim.';

commit;
