-- generation_category: add the Stage-1 LoRA dataset shot categories
-- (engine brief §4). The 24-shot template is 4 groups of 6.
--
--   dataset_identity_anchor — the 6 identity-category dataset shots derived
--                             from the input anchor
--   dataset_environment     — the 6 environment-variation dataset shots
--   dataset_styling         — the 6 styling-variation dataset shots
--   dataset_expression      — the 6 expression-variation dataset shots
--
-- Distinct from the value already shipped in init_schema:
--   identity_reference      — the single clean input anchor. One image, the
--                             input to the whole pipeline, not a dataset shot.
--                             dataset_identity_anchor images are DERIVED FROM it.
--
-- Enum values are permanent and cannot be removed; nothing used these labels
-- at the time they were added (generation_logs was empty, no defaults, no
-- policies, no functions).
--
-- APPLIED OUT OF BAND: these ran as four separate execute_sql statements, not
-- through the migration tool, to keep each ADD VALUE out of any wrapping
-- transaction. The history row for this version was inserted manually and
-- carries these four statements. The database already has all four values --
-- re-running this file is a no-op thanks to IF NOT EXISTS.
--
-- No transaction wrapper here, by design. Do not add begin/commit.

alter type generation_category add value if not exists 'dataset_identity_anchor';
alter type generation_category add value if not exists 'dataset_environment';
alter type generation_category add value if not exists 'dataset_styling';
alter type generation_category add value if not exists 'dataset_expression';
