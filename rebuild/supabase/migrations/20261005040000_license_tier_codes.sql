-- license_tier_code: the rate card is Campaign / Flagship / Exclusive / Retainer.
--
-- 'exclusive' is kept. 'social' and 'commercial' stay in the type (Postgres cannot
-- drop enum values in place) but no row uses them. Tier rows are seeded separately,
-- after this commits: a new enum value cannot be used in the transaction that adds it.

alter type license_tier_code add value if not exists 'campaign';
alter type license_tier_code add value if not exists 'flagship';
alter type license_tier_code add value if not exists 'retainer';
