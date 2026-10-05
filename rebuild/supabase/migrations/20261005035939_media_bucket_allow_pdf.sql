-- media: accept application/pdf alongside image/webp.
--
-- Each model page links its comp card PDF (models/<slug>/<slug>-compcard.pdf).
-- Images stay WebP-only; PDF is the one non-image type, for comp cards.

update storage.buckets
   set allowed_mime_types = array['image/webp','application/pdf']
 where id = 'media';
