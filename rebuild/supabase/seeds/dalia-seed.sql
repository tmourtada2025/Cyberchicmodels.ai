-- Dalia (DL01) for the rebuild Supabase project szzctvtsomdyabetzjnh.
-- Run only after models/dalia/portrait.webp is in the public `media` bucket (CHECK requires portrait_path when published).
-- `ethnicity` holds the Look value; the site reads it as `look` and labels it "Look", with Origin "AI-generated".
insert into public.models
  (slug, name, gender, ethnicity, age_range_min, age_range_max, specialties,
   is_consistency_locked, consistency_locked_at, roster_status, portrait_path, display_order)
values
  ('dalia', 'Dalia', 'female', 'Lebanese', 50, 55, array['Fine jewellery','Pro-age beauty','Haircare','Luxury fashion'],
   true, now(), 'published', 'models/dalia/portrait.webp', 2)
on conflict (slug) do update set
  roster_status = excluded.roster_status, portrait_path = excluded.portrait_path, ethnicity = excluded.ethnicity,
  specialties = excluded.specialties, age_range_min = excluded.age_range_min, age_range_max = excluded.age_range_max;
