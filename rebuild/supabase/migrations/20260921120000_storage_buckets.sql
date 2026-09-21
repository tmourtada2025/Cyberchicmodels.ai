-- =====================================================================
-- CyberChicModels.ai — storage buckets + pipeline guards
--
-- TARGET: szzctvtsomdyabetzjnh (cyberchicmodels, ap-southeast-1).
-- Follows 20260920225352_init_schema.sql.
--
-- 1. campaign_images.storage_bucket defaults to 'pipeline'. Drafts never
--    land in the public bucket by default; they promote to 'media' at
--    publish.
-- 2. generation_logs: failed requires error_message, succeeded requires
--    completed_at.
-- 3. Buckets: media (public, read by exact URL), pipeline (private).
-- 4. storage.objects: restrictive deny policies only. service_role
--    bypasses RLS, so the pipeline needs no permissive policy. These
--    stop any permissive policy added later from opening pipeline to
--    clients, or from letting clients write to media.
--    media has deliberately NO select policy: public URLs bypass RLS,
--    and omitting SELECT stops anon from listing the bucket.
--
-- DEFERRED — decide when the pipeline is built, not built here:
--   * generation_logs.output_path 3rd segment
--     (generations/{batch_key}/{?}/{seq}.webp) has no defined meaning,
--     and cannot hold a generation_category value (underscores).
--   * LoRA version / generation parameter capture on generation_logs
--     (only generation_model + seed today).
--   * generation_logs has no source_image_id: a failed extraction keeps
--     no record of its input image.
--   * Path-to-column invariants, none enforced:
--       - isolated_assets '_model' segment <-> campaign_id is null
--       - path model slug <-> model_id
--       - output_path filename digits <-> sequence_number
--       - generation_logs.category <-> isolated_assets.asset_type
--   * isolated_assets.storage_bucket permits 'media' (world-readable,
--     since media is public). Intended or not: undecided.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Drafts default to the private bucket
-- ---------------------------------------------------------------------

alter table public.campaign_images
  alter column storage_bucket set default 'pipeline'::public.storage_bucket;

-- ---------------------------------------------------------------------
-- 2. generation_logs terminal-state guards
-- ---------------------------------------------------------------------

alter table public.generation_logs
  add constraint generation_logs_failed_has_error
    check (status <> 'failed'::public.generation_status or error_message is not null),
  add constraint generation_logs_succeeded_has_completed_at
    check (status <> 'succeeded'::public.generation_status or completed_at is not null);

-- ---------------------------------------------------------------------
-- 3. Buckets (every path check in the schema requires .webp)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media',    'media',    true,  10485760, array['image/webp']),  -- 10 MiB
  ('pipeline', 'pipeline', false, 52428800, array['image/webp'])   -- 50 MiB
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. storage.objects — restrictive denies for client roles
-- ---------------------------------------------------------------------

-- pipeline: never reachable by anon/authenticated, any command
create policy pipeline_deny_clients on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'pipeline')
  with check (bucket_id <> 'pipeline');

-- media: public-URL read only; clients can never write
create policy media_deny_client_insert on storage.objects
  as restrictive for insert to anon, authenticated
  with check (bucket_id <> 'media');

create policy media_deny_client_update on storage.objects
  as restrictive for update to anon, authenticated
  using (bucket_id <> 'media')
  with check (bucket_id <> 'media');

create policy media_deny_client_delete on storage.objects
  as restrictive for delete to anon, authenticated
  using (bucket_id <> 'media');

commit;
