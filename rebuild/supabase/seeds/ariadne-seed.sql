-- Ariadne (AR01) for the rebuild Supabase project szzctvtsomdyabetzjnh.
-- Run only after models/ariadne/portrait.webp is in the public `media` bucket (CHECK requires portrait_path when published).
-- `ethnicity` holds the Look value; the site reads it as `look` and labels it "Look", with Origin "AI-generated".
insert into public.models
  (slug, name, gender, ethnicity, age_range_min, age_range_max, specialties,
   is_consistency_locked, consistency_locked_at, roster_status, portrait_path, display_order)
values
  ('ariadne', 'Ariadne', 'female', 'Greek', 28, 28, array['Wine','Hospitality','Resortwear','Jewellery'],
   true, now(), 'published', 'models/ariadne/portrait.webp', 1)
on conflict (slug) do update set
  roster_status = excluded.roster_status, portrait_path = excluded.portrait_path, ethnicity = excluded.ethnicity,
  specialties = excluded.specialties, age_range_min = excluded.age_range_min, age_range_max = excluded.age_range_max;
