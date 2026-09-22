-- pipeline: accept application/x-ndjson alongside image/webp and image/png.
--
-- PLAY mode writes no generation_logs row (brief 3/4); its only record is
-- session.jsonl filed beside the images on the scratch path. Without this the
-- log upload fails: HTTP 400, "mime type application/x-ndjson is not
-- supported" (InvalidMimeType), and PLAY runs leave no filed record at all.
--
-- PIPELINE ONLY. media keeps image/webp exclusively -- no log file, and no
-- non-image content, ever enters the public bucket.

update storage.buckets
   set allowed_mime_types = array['image/webp','image/png','application/x-ndjson']
 where id = 'pipeline';
