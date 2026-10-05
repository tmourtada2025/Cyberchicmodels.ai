-- campaign_kind: add 'client' for brand campaigns licensed by a client.
--
-- The 11 editorial series are concept work, not client campaigns. The homepage "In campaign"
-- section and its "Published campaigns" metric read only kind = 'client', so concept editorials
-- are never counted as client traction. Adds a value only; no existing row changes.

alter type campaign_kind add value if not exists 'client';
