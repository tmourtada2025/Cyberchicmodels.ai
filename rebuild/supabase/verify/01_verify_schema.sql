-- =====================================================================
-- CyberChicModels.ai — post-migration verification
--
-- Run AFTER 20260920225352_init_schema.sql.
-- Read-only except PART 2, which inserts fixtures inside a transaction
-- it always ROLLS BACK. Nothing here persists.
--
-- 19 checks. Any FAIL means stop and investigate before pointing the
-- app at this project.
--
-- History: an earlier version of this script checked only INSERT/UPDATE/
-- DELETE grants and reported PASS while anon still held TRUNCATE on all
-- nine public tables. TRUNCATE is NOT subject to RLS. C2/C4/C5 below are
-- written to catch that class of hole, not just the three obvious verbs.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PART 1 — structural checks (14 rows, every result must read PASS)
-- ---------------------------------------------------------------------

with t as (
  select c.relname, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
dark as (select unnest(array['isolated_assets','generation_logs','licensing_enquiries']) as tbl),
pub  as (select unnest(array['models','model_bibles','campaigns','campaign_accessories',
                             'campaign_images','license_tiers','license_features',
                             'license_tier_features','homepage_slides']) as tbl)
select 'A1. tables in public' as check_name, '12' as expected,
       count(*)::text as actual,
       case when count(*)=12 then 'PASS' else 'FAIL' end as result
from t
union all
select 'A2. tables with RLS enabled', '12',
       count(*) filter (where relrowsecurity)::text,
       case when count(*) filter (where relrowsecurity)=12 then 'PASS' else 'FAIL' end
from t
union all
select 'A3. tables MISSING RLS (names)', '(none)',
       coalesce(nullif(string_agg(relname, ', ') filter (where not relrowsecurity), ''), '(none)'),
       case when count(*) filter (where not relrowsecurity)=0 then 'PASS' else 'FAIL' end
from t
union all
select 'B1. dark tables: anon has SELECT', 'false x3',
       string_agg(has_table_privilege('anon','public.'||tbl,'SELECT')::text, ', ' order by tbl),
       case when bool_or(has_table_privilege('anon','public.'||tbl,'SELECT')) then 'FAIL' else 'PASS' end
from dark
union all
select 'B2. dark tables: any privilege at all', '0',
       (select count(*)::text from information_schema.role_table_grants g join dark d on d.tbl=g.table_name
         where g.table_schema='public' and g.grantee in ('anon','authenticated')),
       case when (select count(*) from information_schema.role_table_grants g join dark d on d.tbl=g.table_name
                   where g.table_schema='public' and g.grantee in ('anon','authenticated'))=0
            then 'PASS' else 'FAIL' end
union all
select 'B3. dark tables: policy count', '0',
       (select count(*)::text from pg_policies p join dark d on d.tbl=p.tablename where p.schemaname='public'),
       case when (select count(*) from pg_policies p join dark d on d.tbl=p.tablename where p.schemaname='public')=0
            then 'PASS' else 'FAIL' end
union all
select 'C1. non-SELECT policies anywhere', '0',
       (select count(*)::text from pg_policies where schemaname='public' and cmd <> 'SELECT'),
       case when (select count(*) from pg_policies where schemaname='public' and cmd <> 'SELECT')=0
            then 'PASS' else 'FAIL' end
union all
-- Deliberately "<> SELECT" rather than a list of verbs: any privilege
-- type that is not SELECT is a failure, including ones not yet imagined.
select 'C2. anon/auth NON-SELECT grants (incl TRUNCATE)', '0',
       (select count(*)::text from information_schema.role_table_grants
         where table_schema='public' and grantee in ('anon','authenticated')
           and privilege_type <> 'SELECT'),
       case when (select count(*) from information_schema.role_table_grants
                   where table_schema='public' and grantee in ('anon','authenticated')
                     and privilege_type <> 'SELECT')=0
            then 'PASS' else 'FAIL' end
union all
select 'C3. public tables anon CAN select', '9',
       (select count(*)::text from pub where has_table_privilege('anon','public.'||tbl,'SELECT')),
       case when (select count(*) from pub where has_table_privilege('anon','public.'||tbl,'SELECT'))=9
            then 'PASS' else 'FAIL' end
union all
select 'C4. anon TRUNCATE on any table', 'false',
       (select coalesce(bool_or(has_table_privilege('anon','public.'||relname,'TRUNCATE')),false)::text from t),
       case when (select coalesce(bool_or(has_table_privilege('anon','public.'||relname,'TRUNCATE')),false) from t)
            then 'FAIL' else 'PASS' end
union all
-- Future tables must not inherit anything for anon/authenticated either.
select 'C5. future-table default privs for anon', 'none',
       coalesce((select d.defaclacl::text from pg_default_acl d join pg_namespace n on n.oid=d.defaclnamespace
                  where n.nspname='public' and d.defaclobjtype='r'
                    and pg_get_userbyid(d.defaclrole)='postgres'), '(no entry)'),
       case when coalesce((select d.defaclacl::text from pg_default_acl d join pg_namespace n on n.oid=d.defaclnamespace
                            where n.nspname='public' and d.defaclobjtype='r'
                              and pg_get_userbyid(d.defaclrole)='postgres'), '') like '%anon=%'
            then 'FAIL' else 'PASS' end
union all
select 'D0. total SELECT policies', '9',
       (select count(*)::text from pg_policies where schemaname='public'),
       case when (select count(*) from pg_policies where schemaname='public')=9 then 'PASS' else 'FAIL' end
union all
select 'D1. enum types', '13',
       (select count(*)::text from pg_type ty join pg_namespace n on n.oid=ty.typnamespace
         where n.nspname='public' and ty.typtype='e'),
       case when (select count(*) from pg_type ty join pg_namespace n on n.oid=ty.typnamespace
                   where n.nspname='public' and ty.typtype='e')=13 then 'PASS' else 'FAIL' end
union all
select 'D2. functions', '4',
       (select count(*)::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace
         where n.nspname='public'),
       case when (select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                   where n.nspname='public')=4 then 'PASS' else 'FAIL' end;


-- ---------------------------------------------------------------------
-- PART 2 — published-only visibility, tested live (5 rows, all PASS)
--
-- Inserts fixtures, switches to the anon role, counts what anon can see,
-- then ROLLS BACK. Run the whole block in one go.
--
-- Fixtures:
--   models:    verify-pub   (published, locked)
--              verify-draft (in_progress)
--   campaigns: verify-pub  / verify-pub-campaign    published  -> VISIBLE
--              verify-pub  / verify-draft-campaign  draft      -> hidden (campaign state)
--              verify-draft/ verify-pub-campaign    published  -> hidden (model state)
--   images:    one per campaign                                -> 1 visible
-- ---------------------------------------------------------------------

begin;

insert into models
  (slug, name, gender, roster_status, is_consistency_locked, consistency_locked_at, portrait_path)
values
  ('verify-pub',   'Verify Published', 'female'::gender, 'published'::roster_status,   true,  now(),
   'models/verify-pub/portrait.webp'),
  ('verify-draft', 'Verify Draft',     'female'::gender, 'in_progress'::roster_status, false, null, null);

-- NOTE: the enum casts are required. In an INSERT ... SELECT with UNION
-- ALL, Postgres resolves the literals across branches to `text` before
-- coercing to the target column, and the insert fails with "column
-- status is of type campaign_status but expression is of type text".
insert into campaigns (model_id, slug, name, status)
select id, 'verify-pub-campaign',   'Visible',         'published'::campaign_status from models where slug = 'verify-pub'
union all
select id, 'verify-draft-campaign', 'Hidden by draft', 'draft'::campaign_status     from models where slug = 'verify-pub'
union all
select id, 'verify-pub-campaign',   'Hidden by model', 'published'::campaign_status from models where slug = 'verify-draft';

insert into campaign_images (campaign_id, model_id, storage_path, register, aspect_ratio)
select c.id, c.model_id,
       'campaigns/' || m.slug || '/' || c.slug || '/01.webp',
       'editorial'::image_register, '2:3'::aspect_ratio
from campaigns c join models m on m.id = c.model_id
where c.slug like 'verify-%';

-- Everything above ran as the migration role (RLS bypassed). Now look at
-- the same data through the frontend's eyes.
set local role anon;

select 'E1. anon sees only published models' as check_name, '1' as expected,
       (select count(*) from models where slug like 'verify-%')::text as actual,
       case when (select count(*) from models where slug like 'verify-%')=1
            then 'PASS' else 'FAIL' end as result
union all
select 'E2. anon sees only published campaigns of published models', '1',
       (select count(*) from campaigns where slug like 'verify-%')::text,
       case when (select count(*) from campaigns where slug like 'verify-%')=1
            then 'PASS' else 'FAIL' end
union all
select 'E3. anon sees only images of visible campaigns', '1',
       (select count(*) from campaign_images where storage_path like 'campaigns/verify-%')::text,
       case when (select count(*) from campaign_images where storage_path like 'campaigns/verify-%')=1
            then 'PASS' else 'FAIL' end
union all
select 'E4. the one visible model is verify-pub', 'verify-pub',
       coalesce((select slug from models where slug like 'verify-%'), '(none)'),
       case when (select slug from models where slug like 'verify-%')='verify-pub'
            then 'PASS' else 'FAIL' end
union all
select 'E5. the one visible campaign is the published one', 'Visible',
       coalesce((select name from campaigns where slug like 'verify-%'), '(none)'),
       case when (select name from campaigns where slug like 'verify-%')='Visible'
            then 'PASS' else 'FAIL' end;

reset role;
rollback;


-- ---------------------------------------------------------------------
-- PART 3 — confirm the rollback took. Expect zeroes and 12 tables.
-- ---------------------------------------------------------------------

select (select count(*) from models)          as models_rows,
       (select count(*) from campaigns)       as campaign_rows,
       (select count(*) from campaign_images) as image_rows,
       (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
          where n.nspname='public' and c.relkind='r') as tables_present;


-- ---------------------------------------------------------------------
-- NOT covered here, by design:
--   * model_bibles / campaign_accessories / homepage_slides visibility —
--     they route through the same helper functions Part 2 exercises
--   * storage bucket policies — buckets are created separately
--   * seed data — separate, re-runnable step
-- ---------------------------------------------------------------------
