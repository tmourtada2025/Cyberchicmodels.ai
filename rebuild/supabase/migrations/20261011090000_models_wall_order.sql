-- models.wall_order: hero-wall position independent of display_order.
--
-- The homepage drift wall and the roster strip both ordered by display_order, so a model who
-- must be last on the strip was pinned to the last wall slot whatever colour sat beside her.
-- Null keeps the roster order (every existing row); set it only to move a tile on the wall.

alter table public.models
  add column if not exists wall_order smallint;

comment on column public.models.wall_order is
  'Hero-wall position when it differs from display_order; null means the roster order.';
