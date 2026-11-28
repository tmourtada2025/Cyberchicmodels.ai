import { supabase } from '../../lib/supabase'

export type FilmIntro = {
  slug: string
  name: string
  model_code: string | null
  intro_video_path: string
  intro_poster_path: string
}

// Published models with an intro film (both paths set), in roster order. RLS enforces published-only;
// the filter restates it. Adding an intro to the homepage is a data change, never a code change.
export async function loadFilmIntros(): Promise<FilmIntro[]> {
  const { data, error } = await supabase
    .from('models')
    .select('slug, name, model_code, intro_video_path, intro_poster_path')
    .eq('roster_status', 'published')
    .not('intro_video_path', 'is', null)
    .not('intro_poster_path', 'is', null)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw error
  return data as FilmIntro[]
}
