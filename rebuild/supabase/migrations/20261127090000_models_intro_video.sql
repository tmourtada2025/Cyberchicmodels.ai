-- models.intro_video_path / intro_poster_path: a short 9:16 intro film shown in the model page hero.
--
-- Paths are in the public `media` bucket (e.g. films/intros/Saba_Intro_20s_9x16_music.mp4). The page
-- shows the intro only when both are set; null keeps every existing page as it is. Adding an intro to
-- a model is a data change (row + upload), never a code change.

alter table public.models
  add column if not exists intro_video_path text,
  add column if not exists intro_poster_path text;

comment on column public.models.intro_video_path is
  'Model page hero intro: 9:16 MP4 path in the media bucket. Null = no intro.';
comment on column public.models.intro_poster_path is
  'Poster (first frame) for intro_video_path, path in the media bucket.';
