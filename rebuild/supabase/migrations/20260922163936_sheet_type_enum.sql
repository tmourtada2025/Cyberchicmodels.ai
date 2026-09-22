-- sheet_type: model-book sheet taxonomy (engine brief §5).
--   identity sheets:     headshots_angles, hairstyles, makeup
--   presentation sheets: standing, seated, wardrobe
-- Enum only; no column references it yet.

begin;

create type sheet_type as enum
  ('headshots_angles','hairstyles','makeup','standing','seated','wardrobe');

commit;
