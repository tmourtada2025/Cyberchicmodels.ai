-- pipeline: accept image/png alongside image/webp.
--
-- fal returns PNG (fal-ai/flux-pulid has no output_format param), and the
-- Chunk 1 PLAY loop files fal's native format by approval (2026-09-22).
-- Without this, every PLAY upload fails: HTTP 400, "mime type image/png is
-- not supported" (InvalidMimeType).
--
-- PIPELINE ONLY. The media bucket keeps image/webp exclusively -- published
-- content stays WebP, and the pipeline -> media promotion at Stage 4 still
-- owes a WebP conversion. That debt is unchanged and still due at Chunk 2.

update storage.buckets
   set allowed_mime_types = array['image/webp','image/png']
 where id = 'pipeline';
