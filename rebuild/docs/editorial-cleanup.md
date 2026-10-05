# Editorial cleanup list

Known as-is inconsistencies carried into the DB by the roster migration (2026-10-05). Migrated unchanged on purpose; fix later as DB edits, not code.

- **Card specialties vs comp-card Lanes differ for some models.** `models.specialties` (cards) and the Lanes row in `models.comp_stats` (page) disagree, e.g. Dalia: 3 card specialties vs 4 page lanes.
- **Yuki: "First Snow" vs "First snow".** The static hero eyebrow said "First Snow"; the world heading says "First snow". The DB keeps the heading wording (`campaigns.name`). Both render uppercase.
- **Beckie: 18 orphaned objects under `models/beckie/` in the media bucket.** Her section images now live under `campaigns/beckie/<section>/`; the older copies (`beckie-dig-*`, `beckie-r*`, `beckie-t*`, `beckie-wall-*`, `beckie-portrait-960x1280.webp`) are unreferenced.
