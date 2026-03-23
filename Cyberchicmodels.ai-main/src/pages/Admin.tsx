/**
 * CyberChicModels Admin Panel
 * Drop this file into: src/pages/Admin.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

const BUCKETS = {
  MODELS: "model-thumbnails",
  COLLECTIONS: "model-collections",
  STYLES: "styles",
  HERO: "hero",
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface Model {
  id: string;
  name: string;
  slug: string;
  nationality: string;
  ethnicity: string;
  gender: string;
  age_group: string;
  height: string;
  weight: string;
  specialty: string;
  hobbies: string;
  bio: string;
  thumbnail_path: string;
  price_usd: number;
  is_published: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_popular: boolean;
  is_coming_soon: boolean;
  social_media: string;
  measurements: string;
}

interface Collection {
  id: string;
  model_id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface CollectionImage {
  id: string;
  model_id: string;
  collection_id: string;
  path: string;
  display_order: number;
}

interface Style {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_path: string;
}

type Tab = "models" | "styles" | "hero";

// ─── Archetype Data ──────────────────────────────────────────────────────────
interface Archetype {
  skin_tone: string;
  eye_color: string;
  hair_color: string;
  hair_texture: string;
  face_shape: string;
  height_range: string;
  build: string;
  ethnicity: string;
  distinctive: string;
}

const ARCHETYPES: Record<string, Archetype> = {
  "Afghan": { skin_tone: "Medium olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "160-170cm", build: "Slim", ethnicity: "South Asian", distinctive: "Strong brows, prominent nose" },
  "Albanian": { skin_tone: "Light olive", eye_color: "Brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-175cm", build: "Athletic", ethnicity: "Southeast European", distinctive: "High cheekbones, sharp jaw" },
  "Algerian": { skin_tone: "Medium olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Wavy to curly", face_shape: "Oval", height_range: "162-172cm", build: "Slim to medium", ethnicity: "North African / Amazigh", distinctive: "Deep-set eyes, prominent brows" },
  "Angolan": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Round", height_range: "160-170cm", build: "Curvaceous", ethnicity: "Bantu African", distinctive: "Full lips, wide cheekbones" },
  "Argentine": { skin_tone: "Light to medium", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-175cm", build: "Lean", ethnicity: "European descent / mixed", distinctive: "Mixed European features, expressive eyes" },
  "Armenian": { skin_tone: "Light olive", eye_color: "Dark brown", hair_color: "Dark brown to black", hair_texture: "Wavy", face_shape: "Strong oval", height_range: "163-172cm", build: "Medium", ethnicity: "Caucasian", distinctive: "Defined nose, thick brows, almond eyes" },
  "Australian": { skin_tone: "Fair to medium", eye_color: "Blue to green", hair_color: "Blonde to brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "167-177cm", build: "Athletic", ethnicity: "Anglo-Celtic", distinctive: "Sun-kissed skin, natural highlights" },
  "Austrian": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "167-176cm", build: "Lean", ethnicity: "Central European", distinctive: "Fair coloring, classic European features" },
  "Azerbaijani": { skin_tone: "Light olive", eye_color: "Dark brown", hair_color: "Dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Caucasian Turkic", distinctive: "Almond eyes, defined cheekbones" },
  "Bahraini": { skin_tone: "Medium olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "160-168cm", build: "Slim", ethnicity: "Arab", distinctive: "Refined features, kohl-dark eyes" },
  "Bangladeshi": { skin_tone: "Medium brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "155-165cm", build: "Petite to slim", ethnicity: "Bengali", distinctive: "Large eyes, delicate features" },
  "Belarusian": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Ash blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "166-175cm", build: "Lean", ethnicity: "East Slavic", distinctive: "Pale skin, high cheekbones, light eyes" },
  "Belgian": { skin_tone: "Fair", eye_color: "Blue to green", hair_color: "Blonde to brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "166-175cm", build: "Medium", ethnicity: "Western European", distinctive: "Classic Northern European features" },
  "Bolivian": { skin_tone: "Medium to copper", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round", height_range: "155-163cm", build: "Compact", ethnicity: "Indigenous / mixed", distinctive: "Strong indigenous features, prominent cheekbones" },
  "Bosnian": { skin_tone: "Fair to light olive", eye_color: "Green to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "168-177cm", build: "Tall, lean", ethnicity: "South Slavic", distinctive: "Striking green eyes common, tall stature" },
  "Brazilian": { skin_tone: "Golden brown", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy to curly", face_shape: "Heart", height_range: "165-173cm", build: "Curvaceous", ethnicity: "Mixed European/African/Indigenous", distinctive: "Full lips, expressive eyes, natural curves" },
  "British": { skin_tone: "Fair to light", eye_color: "Blue to green", hair_color: "Brown to blonde", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "165-174cm", build: "Lean", ethnicity: "Anglo-Celtic", distinctive: "Fair English complexion, understated features" },
  "Bulgarian": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-174cm", build: "Medium", ethnicity: "South Slavic / Thracian", distinctive: "Prominent brow ridge, strong cheekbones" },
  "Burkinabe": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Round", height_range: "160-170cm", build: "Slim", ethnicity: "West African", distinctive: "Symmetrical features, smooth deep skin" },
  "Cambodian": { skin_tone: "Medium golden brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round", height_range: "155-163cm", build: "Petite", ethnicity: "Khmer", distinctive: "Soft features, wide eyes, golden undertone" },
  "Cameroonian": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-172cm", build: "Athletic", ethnicity: "Central African", distinctive: "Defined bone structure, full lips" },
  "Canadian": { skin_tone: "Fair to medium", eye_color: "Blue to brown", hair_color: "Blonde to brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "166-175cm", build: "Athletic", ethnicity: "Mixed European / Indigenous", distinctive: "Healthy outdoorsy complexion, diverse features" },
  "Chilean": { skin_tone: "Light olive", eye_color: "Brown", hair_color: "Dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim to medium", ethnicity: "Mixed European/Indigenous", distinctive: "European-influenced features with warm undertone" },
  "Chinese": { skin_tone: "Fair to light golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "160-170cm", build: "Slim, petite", ethnicity: "Han Chinese", distinctive: "Monolid or double eyelid, porcelain skin, delicate features" },
  "Colombian": { skin_tone: "Golden olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Heart", height_range: "164-173cm", build: "Curvaceous", ethnicity: "Mixed European/Indigenous/African", distinctive: "Full lips, expressive eyes, natural warmth" },
  "Congolese": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "162-172cm", build: "Tall, lean", ethnicity: "Bantu Central African", distinctive: "Elongated features, regal bone structure" },
  "Costa Rican": { skin_tone: "Light to medium", eye_color: "Brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim", ethnicity: "Mixed European/Indigenous", distinctive: "Warm complexion, soft features" },
  "Croatian": { skin_tone: "Light olive", eye_color: "Brown to blue", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "168-177cm", build: "Tall, athletic", ethnicity: "South Slavic", distinctive: "Tall stature, defined jaw, Mediterranean-Slavic mix" },
  "Cuban": { skin_tone: "Light to medium brown", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy to curly", face_shape: "Oval", height_range: "163-172cm", build: "Curvaceous", ethnicity: "Mixed European/African", distinctive: "Warm mixed heritage features, full hair" },
  "Czech": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "167-176cm", build: "Lean", ethnicity: "West Slavic", distinctive: "High cheekbones, fair skin, light eyes" },
  "Danish": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "168-177cm", build: "Tall, lean", ethnicity: "Scandinavian", distinctive: "Golden blonde hair, blue eyes, tall frame" },
  "Dominican": { skin_tone: "Medium to caramel", eye_color: "Brown", hair_color: "Dark brown to black", hair_texture: "Curly", face_shape: "Oval", height_range: "163-172cm", build: "Curvaceous", ethnicity: "Mixed African/European/Taino", distinctive: "Rich mixed heritage, expressive features" },
  "Dutch": { skin_tone: "Fair", eye_color: "Blue to green", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "170-180cm", build: "Tall, lean", ethnicity: "Northwestern European", distinctive: "Very tall, fair features, angular face" },
  "Ecuadorian": { skin_tone: "Medium olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round", height_range: "158-166cm", build: "Compact", ethnicity: "Indigenous / Mestizo", distinctive: "Strong indigenous features, warm complexion" },
  "Egyptian": { skin_tone: "Warm olive", eye_color: "Dark brown", hair_color: "Black to dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim to medium", ethnicity: "North African Arab", distinctive: "Almond-shaped eyes, prominent nose, regal features" },
  "Emirati": { skin_tone: "Warm olive to medium", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "162-170cm", build: "Slim", ethnicity: "Gulf Arab", distinctive: "Refined features, deep kohl eyes, graceful presence" },
  "Ethiopian": { skin_tone: "Medium brown to dark", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily to curly", face_shape: "Narrow oval", height_range: "165-175cm", build: "Lean, statuesque", ethnicity: "Cushitic / Semitic East African", distinctive: "Narrow features, high forehead, elegant bone structure" },
  "Finnish": { skin_tone: "Very fair", eye_color: "Blue to grey", hair_color: "Blonde", hair_texture: "Straight", face_shape: "Broad oval", height_range: "167-176cm", build: "Medium to athletic", ethnicity: "Finno-Ugric", distinctive: "Very fair skin, pale eyes, broad bone structure" },
  "French": { skin_tone: "Light to ivory", eye_color: "Grey to hazel", hair_color: "Brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "165-173cm", build: "Slim, refined", ethnicity: "Western European", distinctive: "Chic bone structure, subtle features, effortless elegance" },
  "Gambian": { skin_tone: "Deep ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "162-172cm", build: "Lean", ethnicity: "West African", distinctive: "Very dark smooth skin, symmetrical features" },
  "Georgian": { skin_tone: "Light olive", eye_color: "Dark brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-174cm", build: "Medium", ethnicity: "Caucasian", distinctive: "Soft but defined features, warm complexion" },
  "German": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Square to oval", height_range: "168-177cm", build: "Athletic, strong", ethnicity: "Germanic / Central European", distinctive: "Strong jaw, fair coloring, tall frame" },
  "Ghanaian": { skin_tone: "Rich chocolate brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Round", height_range: "162-172cm", build: "Medium to athletic", ethnicity: "Akan / West African", distinctive: "Full lips, wide nose, glowing deep complexion" },
  "Greek": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown to black", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-173cm", build: "Medium, curvaceous", ethnicity: "Mediterranean", distinctive: "Olive skin, strong nose, expressive dark eyes" },
  "Guatemalan": { skin_tone: "Medium copper", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round", height_range: "155-163cm", build: "Compact", ethnicity: "Mayan / Mestizo", distinctive: "Strong indigenous bone structure, warm skin" },
  "Guinean": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "162-172cm", build: "Lean to athletic", ethnicity: "West African", distinctive: "Smooth dark skin, graceful features" },
  "Haitian": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "162-172cm", build: "Slim to curvaceous", ethnicity: "Afro-Caribbean", distinctive: "Rich heritage features, full lips, strong presence" },
  "Honduran": { skin_tone: "Medium olive", eye_color: "Dark brown", hair_color: "Dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "160-168cm", build: "Medium", ethnicity: "Mestizo / Indigenous", distinctive: "Warm mixed features, soft eyes" },
  "Hungarian": { skin_tone: "Fair to light", eye_color: "Brown to grey", hair_color: "Dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "166-175cm", build: "Lean", ethnicity: "Central European / Uralic", distinctive: "High cheekbones, slightly exotic Eastern European look" },
  "Indian": { skin_tone: "Medium to warm brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "160-168cm", build: "Slim to curvaceous", ethnicity: "South Asian", distinctive: "Rich complexion, expressive large eyes, lustrous hair" },
  "Indonesian": { skin_tone: "Medium golden brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round to oval", height_range: "158-165cm", build: "Petite to slim", ethnicity: "Austronesian / Malay", distinctive: "Warm golden skin, soft round features" },
  "Iranian": { skin_tone: "Light olive to medium", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim to medium", ethnicity: "Persian", distinctive: "Defined nose, high cheekbones, intense eyes" },
  "Iraqi": { skin_tone: "Warm olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Wavy", face_shape: "Oval", height_range: "162-170cm", build: "Medium", ethnicity: "Arab / Mesopotamian", distinctive: "Strong features, deep-set eyes, olive warmth" },
  "Irish": { skin_tone: "Fair to very fair", eye_color: "Green to blue", hair_color: "Red to auburn", hair_texture: "Wavy to curly", face_shape: "Oval", height_range: "165-173cm", build: "Medium", ethnicity: "Celtic", distinctive: "Freckles, pale skin, green eyes, auburn hair" },
  "Italian": { skin_tone: "Light to warm olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-173cm", build: "Medium, curvaceous", ethnicity: "Mediterranean / Latin", distinctive: "Warm complexion, expressive eyes, animated features" },
  "Ivorian": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-173cm", build: "Athletic", ethnicity: "West African / Mande", distinctive: "Sculptural features, deep even skin tone" },
  "Jamaican": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Athletic, lean", ethnicity: "Afro-Caribbean", distinctive: "Athletic build, vibrant skin, strong presence" },
  "Japanese": { skin_tone: "Fair to light golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-167cm", build: "Slim, petite", ethnicity: "Yamato Japanese", distinctive: "Porcelain skin, symmetrical refined features, monolid eyes" },
  "Jordanian": { skin_tone: "Warm olive", eye_color: "Dark brown", hair_color: "Dark brown to black", hair_texture: "Wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim to medium", ethnicity: "Levantine Arab", distinctive: "Defined brow, almond eyes, graceful features" },
  "Kazakhstani": { skin_tone: "Light to medium", eye_color: "Dark brown", hair_color: "Black to dark brown", hair_texture: "Straight", face_shape: "Broad oval", height_range: "162-170cm", build: "Medium", ethnicity: "Kazakh / Turkic", distinctive: "Eurasian features, high broad cheekbones, almond eyes" },
  "Kenyan": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Narrow oval", height_range: "165-175cm", build: "Lean, tall", ethnicity: "Nilotic / Bantu East African", distinctive: "Long limbs, defined features, runner's physique" },
  "Korean": { skin_tone: "Fair to light ivory", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Heart to oval", height_range: "162-170cm", build: "Slim, petite", ethnicity: "Korean", distinctive: "Glass skin complexion, delicate features, defined jaw" },
  "Kuwaiti": { skin_tone: "Warm olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "160-168cm", build: "Slim", ethnicity: "Gulf Arab", distinctive: "Elegant refined features, kohl eyes" },
  "Kyrgyz": { skin_tone: "Medium with golden tone", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Broad oval", height_range: "160-168cm", build: "Medium", ethnicity: "Turkic / Mongolic", distinctive: "Broad face, high cheekbones, Eurasian blend" },
  "Lao": { skin_tone: "Medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round", height_range: "155-163cm", build: "Petite", ethnicity: "Lao / Tai", distinctive: "Soft round features, golden warmth" },
  "Latvian": { skin_tone: "Very fair", eye_color: "Blue to grey", hair_color: "Blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "168-177cm", build: "Lean, tall", ethnicity: "Baltic", distinctive: "Platinum blonde hair, icy blue eyes, tall and lean" },
  "Lebanese": { skin_tone: "Light olive", eye_color: "Green to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Heart", height_range: "163-172cm", build: "Slim to medium", ethnicity: "Levantine Arab / Phoenician", distinctive: "High cheekbones, green or hazel eyes, defined nose, lush hair" },
  "Libyan": { skin_tone: "Warm olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Arab / Berber", distinctive: "Strong features, olive glow, expressive dark eyes" },
  "Lithuanian": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "167-176cm", build: "Lean", ethnicity: "Baltic", distinctive: "Fair skin, light eyes, straight bone structure" },
  "Malagasy": { skin_tone: "Medium golden brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Wavy to coily", face_shape: "Oval", height_range: "160-168cm", build: "Slim", ethnicity: "Austronesian / Bantu mixed", distinctive: "Unique mixed island features, warm tone" },
  "Malaysian": { skin_tone: "Medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-166cm", build: "Slim", ethnicity: "Malay", distinctive: "Warm golden skin, soft features, glossy hair" },
  "Malian": { skin_tone: "Deep brown to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Lean, statuesque", ethnicity: "West African / Mande", distinctive: "Elongated neck, fine bone structure, radiant deep skin" },
  "Mauritanian": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Arab-Berber / West African", distinctive: "Refined features, deep tone, expressive eyes" },
  "Mexican": { skin_tone: "Warm golden to medium brown", eye_color: "Dark brown", hair_color: "Black to dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "160-168cm", build: "Curvaceous", ethnicity: "Mestizo / Indigenous", distinctive: "Rich heritage blend, warm glow, expressive dark eyes" },
  "Mongolian": { skin_tone: "Light to medium with golden tone", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Broad round", height_range: "160-168cm", build: "Medium, sturdy", ethnicity: "Mongolic", distinctive: "Broad face, pronounced cheekbones, strong build" },
  "Moroccan": { skin_tone: "Warm olive to medium", eye_color: "Amber to dark brown", hair_color: "Dark brown to black", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Arab / Amazigh / Berber", distinctive: "Amber eyes, sculpted features, warm golden undertone" },
  "Mozambican": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-172cm", build: "Slim to athletic", ethnicity: "Bantu East African", distinctive: "High forehead, symmetrical features, smooth tone" },
  "Myanmar": { skin_tone: "Medium golden brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round to oval", height_range: "157-165cm", build: "Petite", ethnicity: "Bamar / Tibeto-Burman", distinctive: "Golden warm skin, soft round face" },
  "Namibian": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Lean, tall", ethnicity: "San / Bantu Southern African", distinctive: "High cheekbones, statuesque frame" },
  "Nepalese": { skin_tone: "Medium warm brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-165cm", build: "Petite", ethnicity: "Tibeto-Burman / South Asian", distinctive: "Soft Himalayan features, almond eyes" },
  "New Zealand": { skin_tone: "Fair to medium", eye_color: "Blue to green", hair_color: "Brown to blonde", hair_texture: "Wavy", face_shape: "Oval", height_range: "166-174cm", build: "Athletic", ethnicity: "Anglo / Maori mixed", distinctive: "Outdoor-healthy glow, strong mixed heritage" },
  "Nicaraguan": { skin_tone: "Medium olive", eye_color: "Dark brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "160-168cm", build: "Medium", ethnicity: "Mestizo", distinctive: "Warm Latin features, soft expression" },
  "Nigerian": { skin_tone: "Rich chocolate to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Curvaceous", ethnicity: "Yoruba / Igbo / Hausa West African", distinctive: "Radiant deep skin, bold features, full figure" },
  "Norwegian": { skin_tone: "Very fair", eye_color: "Blue", hair_color: "Blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "168-177cm", build: "Tall, athletic", ethnicity: "Nordic / Scandinavian", distinctive: "Ice-blue eyes, very fair skin, naturally blonde" },
  "Omani": { skin_tone: "Warm olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim to medium", ethnicity: "Arab / South Asian mixed", distinctive: "Distinctive mixed Gulf-South Asian features" },
  "Pakistani": { skin_tone: "Warm medium", eye_color: "Dark brown to hazel", hair_color: "Black", hair_texture: "Wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim to medium", ethnicity: "South Asian / Indus", distinctive: "Expressive large eyes, strong brows, graceful features" },
  "Palestinian": { skin_tone: "Light to warm olive", eye_color: "Dark brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Levantine Arab", distinctive: "Defined features, olive warmth, expressive eyes" },
  "Panamanian": { skin_tone: "Light to medium brown", eye_color: "Brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "162-170cm", build: "Medium", ethnicity: "Mestizo / mixed Caribbean", distinctive: "Vibrant mixed heritage features" },
  "Paraguayan": { skin_tone: "Medium olive", eye_color: "Dark brown", hair_color: "Dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "160-168cm", build: "Medium", ethnicity: "Mestizo / Guarani", distinctive: "Indigenous-influenced features, warm tone" },
  "Peruvian": { skin_tone: "Medium copper", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-166cm", build: "Compact, curvaceous", ethnicity: "Mestizo / Quechua", distinctive: "Strong indigenous features, warm copper tone" },
  "Filipino": { skin_tone: "Light to medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "158-165cm", build: "Petite to slim", ethnicity: "Austronesian / Malay", distinctive: "Golden skin, soft features, expressive eyes" },
  "Polish": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Ash blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "167-176cm", build: "Lean", ethnicity: "West Slavic", distinctive: "High cheekbones, pale skin, often striking pale eyes" },
  "Portuguese": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "164-172cm", build: "Medium", ethnicity: "Iberian / Atlantic", distinctive: "Darker Iberian features, soulful eyes" },
  "Puerto Rican": { skin_tone: "Warm caramel", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy to curly", face_shape: "Oval", height_range: "163-172cm", build: "Curvaceous", ethnicity: "Mixed European/African/Taino", distinctive: "Rich Caribbean blend, warm tone, lush hair" },
  "Qatari": { skin_tone: "Warm olive", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "162-170cm", build: "Slim", ethnicity: "Gulf Arab", distinctive: "Refined desert Arab features, elegant bearing" },
  "Romanian": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-174cm", build: "Lean", ethnicity: "Latin / Dacian European", distinctive: "Defined features, dark expressive eyes, warm olive tone" },
  "Russian": { skin_tone: "Fair to porcelain", eye_color: "Blue to grey", hair_color: "Blonde to ash", hair_texture: "Straight", face_shape: "Oval", height_range: "168-176cm", build: "Lean, tall", ethnicity: "East Slavic", distinctive: "High cheekbones, pale skin, light eyes, angular features" },
  "Rwandan": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Narrow oval", height_range: "165-175cm", build: "Lean, tall", ethnicity: "Tutsi / Hutu / Central African", distinctive: "Long elegant features, lean tall frame" },
  "Saudi": { skin_tone: "Warm olive to medium", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim to medium", ethnicity: "Arab / Hijazi", distinctive: "Classic Arabian features, kohl-dark eyes, dignified bearing" },
  "Senegalese": { skin_tone: "Deep brown to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Lean, statuesque", ethnicity: "Wolof / West African", distinctive: "Exceptional skin clarity, refined bone structure, tall elegant frame" },
  "Serbian": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "168-177cm", build: "Tall, athletic", ethnicity: "South Slavic", distinctive: "Tall frame, defined features, Mediterranean-Slavic blend" },
  "Sierra Leonean": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Round", height_range: "160-170cm", build: "Medium", ethnicity: "West African / Mende", distinctive: "Round face, warm glow, strong features" },
  "Singaporean": { skin_tone: "Light to medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "160-168cm", build: "Slim", ethnicity: "Chinese / Malay / Indian mixed", distinctive: "Diverse mixed Asian features, well-groomed look" },
  "Slovak": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "166-175cm", build: "Lean", ethnicity: "West Slavic", distinctive: "Pale skin, high cheekbones, light features" },
  "Slovenian": { skin_tone: "Fair", eye_color: "Blue to green", hair_color: "Blonde to brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "167-176cm", build: "Athletic", ethnicity: "South Slavic / Alpine", distinctive: "Alpine-Slavic features, tall, fair coloring" },
  "Somali": { skin_tone: "Medium brown to deep", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily to wavy", face_shape: "Narrow oval", height_range: "165-175cm", build: "Lean, tall", ethnicity: "Cushitic East African", distinctive: "Sharp angular features, long limbs, elegant stature" },
  "South African": { skin_tone: "Varies – golden to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-173cm", build: "Athletic", ethnicity: "Zulu / Xhosa / Mixed", distinctive: "Vibrant diverse features, strong bone structure" },
  "South Korean": { skin_tone: "Fair ivory", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "V-shaped / heart", height_range: "162-170cm", build: "Slim, petite", ethnicity: "Korean", distinctive: "Glass skin, v-shaped jaw, monolid or large double-eyelid" },
  "Spanish": { skin_tone: "Light to warm olive", eye_color: "Brown to dark brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-173cm", build: "Medium, curvaceous", ethnicity: "Iberian / Mediterranean", distinctive: "Warm expressive eyes, olive skin, passionate features" },
  "Sri Lankan": { skin_tone: "Medium warm brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "158-166cm", build: "Slim", ethnicity: "Sinhalese / Tamil South Asian", distinctive: "Rich warm skin, large expressive eyes, delicate features" },
  "Sudanese": { skin_tone: "Deep brown to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Narrow oval", height_range: "168-178cm", build: "Tall, lean", ethnicity: "Nilotic / Nubian", distinctive: "Very tall and lean, extraordinarily fine features, deep blue-black skin" },
  "Swedish": { skin_tone: "Very fair", eye_color: "Blue", hair_color: "Pale blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "169-178cm", build: "Tall, lean", ethnicity: "Nordic", distinctive: "Platinum blonde, sky-blue eyes, naturally tall and lean" },
  "Swiss": { skin_tone: "Fair", eye_color: "Blue to green", hair_color: "Blonde to brown", hair_texture: "Straight", face_shape: "Oval", height_range: "166-175cm", build: "Athletic", ethnicity: "Central European", distinctive: "Clean classic European features, healthy complexion" },
  "Syrian": { skin_tone: "Light to warm olive", eye_color: "Hazel to dark brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim to medium", ethnicity: "Levantine Arab", distinctive: "Often hazel or light eyes, defined features, warm olive skin" },
  "Taiwanese": { skin_tone: "Fair to light golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "160-168cm", build: "Slim", ethnicity: "Han Chinese / Austronesian", distinctive: "Delicate features, bright clear skin" },
  "Tajik": { skin_tone: "Light to medium olive", eye_color: "Dark brown to hazel", hair_color: "Dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim", ethnicity: "Iranic Central Asian", distinctive: "Persian-influenced features, defined brow, hazel eyes possible" },
  "Tanzanian": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-173cm", build: "Lean", ethnicity: "Bantu / Nilotic East African", distinctive: "Smooth deep tone, graceful features" },
  "Thai": { skin_tone: "Light golden brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-165cm", build: "Petite, slim", ethnicity: "Tai / Southeast Asian", distinctive: "Golden warm skin, soft features, graceful posture" },
  "Togolese": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "162-172cm", build: "Lean", ethnicity: "Ewe / West African", distinctive: "Smooth deep tone, symmetrical features" },
  "Trinidadian": { skin_tone: "Warm caramel to medium brown", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy to curly", face_shape: "Oval", height_range: "163-172cm", build: "Curvaceous", ethnicity: "Mixed Afro-Caribbean / South Asian", distinctive: "Vibrant mixed heritage, warm island glow" },
  "Tunisian": { skin_tone: "Light to medium olive", eye_color: "Dark brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Arab / Amazigh", distinctive: "Mediterranean fineness, hazel eyes possible" },
  "Turkish": { skin_tone: "Light olive to warm", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-173cm", build: "Medium", ethnicity: "Turkic / Anatolian", distinctive: "Strong cheekbones, deep eyes, Eurasian blend" },
  "Turkmen": { skin_tone: "Light to medium", eye_color: "Dark brown", hair_color: "Black to dark brown", hair_texture: "Straight", face_shape: "Broad oval", height_range: "162-170cm", build: "Medium", ethnicity: "Turkic Central Asian", distinctive: "Broad face, prominent cheekbones, almond eyes" },
  "Ugandan": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-173cm", build: "Athletic", ethnicity: "Bantu / Nilotic East African", distinctive: "Strong athletic build, smooth deep tone" },
  "Ukrainian": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "168-177cm", build: "Tall, feminine", ethnicity: "East Slavic", distinctive: "Bright blue eyes, blonde hair, high cheekbones, tall and graceful" },
  "Uruguayan": { skin_tone: "Fair to light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-173cm", build: "Medium", ethnicity: "South American European descent", distinctive: "European-descended features, warm undertone" },
  "Uzbek": { skin_tone: "Light olive to medium", eye_color: "Dark brown", hair_color: "Black to dark brown", hair_texture: "Straight", face_shape: "Broad oval", height_range: "162-170cm", build: "Medium", ethnicity: "Turkic / Persian Central Asian", distinctive: "Eurasian blend, high cheekbones, almond eyes" },
  "Venezuelan": { skin_tone: "Golden to medium brown", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Heart to oval", height_range: "165-174cm", build: "Curvaceous, tall", ethnicity: "Mixed European/Indigenous/African", distinctive: "Pageant-quality features, tall frame, expressive eyes" },
  "Vietnamese": { skin_tone: "Light to medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "158-165cm", build: "Petite, slim", ethnicity: "Kinh Vietnamese", distinctive: "Delicate refined features, silky straight hair, warm glow" },
  "Yemeni": { skin_tone: "Warm olive to medium brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Wavy to curly", face_shape: "Oval", height_range: "162-170cm", build: "Slim", ethnicity: "Arab / Semitic", distinctive: "Intense dark features, prominent eyes, ancient Semitic lineage" },
  "Zambian": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "162-172cm", build: "Medium", ethnicity: "Bantu Southern African", distinctive: "Smooth even tone, rounded soft features" },
  "Zimbabwean": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-173cm", build: "Athletic", ethnicity: "Shona / Ndebele Southern African", distinctive: "Defined bone structure, warm even complexion" },
};

const ALL_COUNTRIES = Object.keys(ARCHETYPES).sort();

// ─── Wizard Options ──────────────────────────────────────────────────────────
const GENDERS = ["Female", "Male", "Non-binary"];
const AGE_GROUPS = ["18-22", "23-27", "28-34", "35-42", "43-50", "50+"];
const SPECIALTIES = [
  "High fashion / editorial",
  "Luxury lifestyle",
  "Commercial / catalogue",
  "Sportswear & activewear",
  "Swimwear & lingerie",
  "Beauty & cosmetics",
  "Streetwear & urban",
  "Bridal & formal wear",
  "Fitness & wellness",
  "E-commerce",
  "Art & avant-garde",
];
const BODY_TYPES = ["Petite", "Slim", "Athletic", "Curvaceous", "Plus-size", "Tall & lean", "Muscular", "Androgynous"];
const HAIR_COLORS = ["Black", "Dark brown", "Medium brown", "Auburn / red", "Blonde", "Platinum blonde", "Grey / silver", "Highlighted", "Coloured / unnatural"];
const HAIR_TEXTURES = ["Straight", "Wavy", "Curly", "Coily / afro", "Locs / braids"];
const EYE_COLORS = ["Dark brown", "Medium brown", "Hazel", "Amber", "Green", "Blue", "Grey", "Mixed / heterochromia"];
const SKIN_TONES = ["Very fair / porcelain", "Fair", "Light olive", "Warm olive / medium", "Golden / tan", "Medium brown", "Rich brown", "Deep brown", "Ebony"];
const POSE_STYLES = ["Editorial high fashion", "Natural / candid", "Sporty / dynamic", "Glamour", "Minimalist", "Streetstyle", "Fine art / conceptual"];
const WARDROBE_STYLES = ["Luxury couture", "Streetwear", "Minimalist clean", "Bohemian", "Sportswear", "Lingerie / swimwear", "Bridal", "Avant-garde"];
const LIGHTING_STYLES = ["Studio soft-box", "Natural daylight", "Golden hour", "Dramatic side-light", "High-key white", "Low-key dark / moody", "Neon / coloured"];

// ─── Wizard Step Config ──────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { key: "step1", title: "Identity", fields: ["gender", "age_group", "nationality"] },
  { key: "step2", title: "Physical", fields: ["skin_tone", "eye_color", "hair_color", "hair_texture", "body_type"] },
  { key: "step3", title: "Specialty", fields: ["specialty"] },
  { key: "step4", title: "Style", fields: ["wardrobe_style", "pose_style", "lighting"] },
];

interface WizardData {
  gender: string;
  age_group: string;
  nationality: string;
  skin_tone: string;
  eye_color: string;
  hair_color: string;
  hair_texture: string;
  body_type: string;
  specialty: string;
  wardrobe_style: string;
  pose_style: string;
  lighting: string;
}

const emptyWizard = (): WizardData => ({
  gender: "",
  age_group: "",
  nationality: "",
  skin_tone: "",
  eye_color: "",
  hair_color: "",
  hair_texture: "",
  body_type: "",
  specialty: "",
  wardrobe_style: "",
  pose_style: "",
  lighting: "",
});

// ─── ModelWizard Component ───────────────────────────────────────────────────
function ModelWizard({
  onComplete,
  onCancel,
}: {
  onComplete: (name: string, json: string, specialty: string, nationality: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(emptyWizard());
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ name: string; json: string; prompts: Record<string, string> } | null>(null);
  const [error, setError] = useState("");
  const [countrySearch, setCountrySearch] = useState("");

  const set = (key: keyof WizardData, val: string) => setData(prev => ({ ...prev, [key]: val }));

  const applyArchetype = () => {
    const arch = ARCHETYPES[data.nationality];
    if (!arch) return;
    setData(prev => ({
      ...prev,
      skin_tone: arch.skin_tone,
      eye_color: arch.eye_color,
      hair_color: arch.hair_color,
      hair_texture: arch.hair_texture,
      body_type: arch.build,
    }));
  };

  const filteredCountries = ALL_COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const canAdvance = () => {
    if (step === 0) return !!(data.gender && data.age_group && data.nationality);
    if (step === 1) return !!(data.skin_tone && data.eye_color && data.hair_color && data.hair_texture && data.body_type);
    if (step === 2) return !!data.specialty;
    if (step === 3) return !!(data.wardrobe_style && data.pose_style && data.lighting);
    return true;
  };

  const generatePersona = async () => {
    setGenerating(true);
    setError("");
    try {
      const arch = ARCHETYPES[data.nationality];
      const prompt = `You are CyberChicModels AI. Generate a complete AI model persona based on these selections:

Nationality: ${data.nationality}
Ethnicity: ${arch?.ethnicity || data.nationality}
Gender: ${data.gender}
Age Group: ${data.age_group}
Skin Tone: ${data.skin_tone}
Eye Color: ${data.eye_color}
Hair Color: ${data.hair_color}
Hair Texture: ${data.hair_texture}
Body Type: ${data.body_type}
Specialty: ${data.specialty}
Wardrobe Style: ${data.wardrobe_style}
Pose Style: ${data.pose_style}
Lighting Style: ${data.lighting}
Distinctive features: ${arch?.distinctive || ""}

Respond ONLY with valid JSON, no preamble, no markdown, exactly this structure:
{
  "model_name": "First Last (nationality-appropriate name)",
  "identity": {
    "gender": "${data.gender}",
    "age_group": "${data.age_group}",
    "nationality": "${data.nationality}",
    "ethnicity": "${arch?.ethnicity || data.nationality}",
    "personality": ["trait1", "trait2", "trait3"]
  },
  "visual_traits": {
    "skin_tone": "${data.skin_tone}",
    "eye_color": "${data.eye_color}",
    "hair_color": "${data.hair_color}",
    "hair_texture": "${data.hair_texture}",
    "face_shape": "${arch?.face_shape || "oval"}",
    "distinctive_features": "${arch?.distinctive || ""}"
  },
  "measurements": {
    "height_cm": <number based on height range ${arch?.height_range || "165-172cm"}>,
    "body_type": "${data.body_type}",
    "size_preset": "appropriate size"
  },
  "creative_profile": {
    "specialty": "${data.specialty}",
    "wardrobe_style": "${data.wardrobe_style}",
    "pose_style": "${data.pose_style}",
    "lighting_preference": "${data.lighting}"
  },
  "prompts": {
    "kling": "photorealistic, [model description], ${data.specialty}, ${data.wardrobe_style} outfit, ${data.lighting} lighting, ${data.pose_style} pose, professional model photography, 8K, detailed",
    "fal_ai": "portrait of [model description], ${data.specialty} editorial, ${data.wardrobe_style}, ${data.lighting}, hyperrealistic, fashion photography",
    "astria": "[model description], consistent face, LoRA training reference, ${data.specialty}, neutral expression, multiple angles",
    "negative": "deformed, ugly, blurry, low quality, bad anatomy, extra limbs, watermark, text, logo"
  }
}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const apiData = await response.json();
      const text = apiData.content?.map((b: { type: string; text?: string }) => b.type === "text" ? b.text : "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setResult({
        name: parsed.model_name,
        json: JSON.stringify(parsed, null, 2),
        prompts: parsed.prompts,
      });
    } catch (e) {
      setError("Generation failed. Check API connection and try again.");
      console.error(e);
    }
    setGenerating(false);
  };

  const handleSave = () => {
    if (!result) return;
    onComplete(result.name, result.json, data.specialty, data.nationality);
  };

  const selectStyle = (selected: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    borderRadius: 6,
    border: `1px solid ${selected ? colors.accent : colors.border}`,
    background: selected ? colors.accentDim : "transparent",
    color: selected ? colors.accent : colors.muted,
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "inherit",
    transition: "all 0.15s",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
  });

  // ── Result screen ──
  if (result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" onClick={() => setResult(null)} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>✦ {result.name}</h2>
        </div>

        <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 11, color: colors.accent, letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>Persona JSON</div>
          <pre style={{ margin: 0, fontSize: 11, color: colors.text, overflow: "auto", maxHeight: 200, fontFamily: "monospace", lineHeight: 1.6 }}>{result.json}</pre>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(result.prompts).map(([platform, prompt]) => (
            <div key={platform} style={{ background: "#1a1a1a", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: colors.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>{platform.replace("_", ".")}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(prompt)}
                  style={{ ...btnStyle("ghost"), padding: "3px 8px", fontSize: 11 }}
                >Copy</button>
              </div>
              <div style={{ fontSize: 12, color: colors.muted, lineHeight: 1.6 }}>{prompt}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 10, borderTop: `1px solid ${colors.border}` }}>
          <button type="button" onClick={onCancel} style={btnStyle("ghost")}>Discard</button>
          <button type="button" onClick={handleSave} style={btnStyle("primary")}>Save to Database</button>
        </div>
      </div>
    );
  }

  // ── Step screens ──
  const stepTitles = ["Identity", "Physical", "Specialty", "Style & Lighting"];
  const totalSteps = stepTitles.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, minHeight: 480 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>✦ AI Model Wizard</h2>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Step {step + 1} of {totalSteps} — {stepTitles[step]}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: colors.border, borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${((step + 1) / totalSteps) * 100}%`, background: colors.accent, borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      {/* Step 0 — Identity */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Field label="Gender">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {GENDERS.map(g => (
                <button key={g} type="button" onClick={() => set("gender", g)} style={selectStyle(data.gender === g)}>{g}</button>
              ))}
            </div>
          </Field>

          <Field label="Age Group">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AGE_GROUPS.map(a => (
                <button key={a} type="button" onClick={() => set("age_group", a)} style={selectStyle(data.age_group === a)}>{a}</button>
              ))}
            </div>
          </Field>

          <Field label="Nationality">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                style={{ ...inputStyle(), flex: 1 }}
              />
              {data.nationality && (
                <button
                  type="button"
                  onClick={applyArchetype}
                  style={{ ...btnStyle("primary"), whiteSpace: "nowrap", fontSize: 12 }}
                >✦ Archetype</button>
              )}
            </div>
            {data.nationality && (
              <div style={{ fontSize: 12, color: colors.accent, marginBottom: 8, padding: "6px 10px", background: colors.accentDim, borderRadius: 6 }}>
                Selected: {data.nationality}
              </div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 220, overflowY: "auto", padding: 4 }}>
              {filteredCountries.map(c => (
                <button key={c} type="button" onClick={() => set("nationality", c)} style={selectStyle(data.nationality === c)}>{c}</button>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* Step 1 — Physical */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.nationality && ARCHETYPES[data.nationality] && (
            <div style={{ padding: "10px 14px", background: colors.accentDim, borderRadius: 8, fontSize: 12, color: colors.accent }}>
              <strong>Archetype active:</strong> {data.nationality} — {ARCHETYPES[data.nationality].distinctive}
            </div>
          )}
          <Field label="Skin Tone">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SKIN_TONES.map(s => <button key={s} type="button" onClick={() => set("skin_tone", s)} style={selectStyle(data.skin_tone === s)}>{s}</button>)}
            </div>
          </Field>
          <Field label="Eye Color">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {EYE_COLORS.map(e => <button key={e} type="button" onClick={() => set("eye_color", e)} style={selectStyle(data.eye_color === e)}>{e}</button>)}
            </div>
          </Field>
          <Field label="Hair Color">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {HAIR_COLORS.map(h => <button key={h} type="button" onClick={() => set("hair_color", h)} style={selectStyle(data.hair_color === h)}>{h}</button>)}
            </div>
          </Field>
          <Field label="Hair Texture">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {HAIR_TEXTURES.map(h => <button key={h} type="button" onClick={() => set("hair_texture", h)} style={selectStyle(data.hair_texture === h)}>{h}</button>)}
            </div>
          </Field>
          <Field label="Body Type">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {BODY_TYPES.map(b => <button key={b} type="button" onClick={() => set("body_type", b)} style={selectStyle(data.body_type === b)}>{b}</button>)}
            </div>
          </Field>
        </div>
      )}

      {/* Step 2 — Specialty */}
      {step === 2 && (
        <Field label="Specialty / Market">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SPECIALTIES.map(s => <button key={s} type="button" onClick={() => set("specialty", s)} style={selectStyle(data.specialty === s)}>{s}</button>)}
          </div>
        </Field>
      )}

      {/* Step 3 — Style */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Wardrobe Style">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {WARDROBE_STYLES.map(w => <button key={w} type="button" onClick={() => set("wardrobe_style", w)} style={selectStyle(data.wardrobe_style === w)}>{w}</button>)}
            </div>
          </Field>
          <Field label="Pose Style">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {POSE_STYLES.map(p => <button key={p} type="button" onClick={() => set("pose_style", p)} style={selectStyle(data.pose_style === p)}>{p}</button>)}
            </div>
          </Field>
          <Field label="Lighting">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {LIGHTING_STYLES.map(l => <button key={l} type="button" onClick={() => set("lighting", l)} style={selectStyle(data.lighting === l)}>{l}</button>)}
            </div>
          </Field>
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: colors.danger, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>{error}</div>}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
        <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()} style={btnStyle("ghost")}>
          {step === 0 ? "Cancel" : "← Back"}
        </button>
        {step < totalSteps - 1 ? (
          <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={btnStyle("primary")}>
            Next →
          </button>
        ) : (
          <button type="button" onClick={generatePersona} disabled={!canAdvance() || generating} style={btnStyle("primary")}>
            {generating ? "Generating..." : "✦ Generate Persona"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function publicUrl(bucket: string, path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const colors = {
  bg: "#0d0d0d",
  surface: "#161616",
  border: "#2a2a2a",
  accent: "#c9a96e",
  accentDim: "rgba(201,169,110,0.15)",
  text: "#f0ece4",
  muted: "#888",
  danger: "#ef4444",
  success: "#4ade80",
};

function btnStyle(variant: "primary" | "secondary" | "danger" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 6, cursor: "pointer",
    fontSize: 13, fontFamily: "inherit", fontWeight: 500,
    transition: "all 0.15s", border: "1px solid transparent",
    whiteSpace: "nowrap",
  };
  if (variant === "primary") return { ...base, background: colors.accent, color: "#0d0d0d", borderColor: colors.accent };
  if (variant === "secondary") return { ...base, background: "transparent", color: colors.accent, borderColor: colors.accent };
  if (variant === "danger") return { ...base, background: "transparent", color: colors.danger, borderColor: colors.danger };
  return { ...base, background: "transparent", color: colors.muted, borderColor: "transparent" };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%", padding: "8px 12px", borderRadius: 6,
    background: "#1e1e1e", border: `1px solid ${colors.border}`,
    color: colors.text, fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };
}

function labelStyle(): React.CSSProperties {
  return { fontSize: 11, fontWeight: 600, color: colors.muted, letterSpacing: "0.08em", textTransform: "uppercase" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={labelStyle()}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10, position: "relative",
          background: checked ? colors.accent : colors.border,
          transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: checked ? "#0d0d0d" : colors.muted,
          transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 13, color: colors.text }}>{label}</span>
    </label>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      padding: "12px 20px", borderRadius: 8,
      background: type === "success" ? "#1a1a2e" : "#2d0a0a",
      border: `1px solid ${type === "success" ? "#4ade80" : "#f87171"}`,
      color: type === "success" ? "#4ade80" : "#f87171",
      fontSize: 14, fontFamily: "monospace",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)", maxWidth: 320,
    }}>
      {type === "success" ? "✓ " : "✗ "}{message}
    </div>
  );
}

function ImageUploader({ bucket, folder, currentPath, onUploaded, label = "Upload Image" }: {
  bucket: string; folder: string; currentPath?: string | null;
  onUploaded: (path: string) => void; label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    setUploading(false);
    if (!error) onUploaded(path);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {currentPath && (
        <img src={publicUrl(bucket, currentPath)} alt="preview"
          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 6, border: "1px solid #333" }} />
      )}
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={btnStyle("secondary")}>
        {uploading ? "Uploading…" : label}
      </button>
      <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleUpload} style={{ display: "none" }} />
    </div>
  );
}

function MultiImageUploader({ bucket, folder, images, onAdded, onDeleted }: {
  bucket: string; folder: string; images: CollectionImage[];
  onAdded: (path: string) => void; onDeleted: (img: CollectionImage) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (!error) onAdded(path);
    }
    setUploading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {images.map(img => (
          <div key={img.id} style={{ position: "relative" }}>
            <img src={publicUrl(bucket, img.path)} alt=""
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #333" }} />
            <button type="button" onClick={() => onDeleted(img)}
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: "20px", padding: 0 }}>
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} style={btnStyle("secondary")}>
        {uploading ? "Uploading…" : "+ Add Images"}
      </button>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple onChange={handleUpload} style={{ display: "none" }} />
    </div>
  );
}

// ─── Model Form ───────────────────────────────────────────────────────────────
const emptyModel = (): Partial<Model> => ({
  name: "", slug: "", nationality: "", ethnicity: "", gender: "female",
  age_group: "", height: "", weight: "", specialty: "", hobbies: "",
  bio: "", thumbnail_path: "", price_usd: 0,
  is_published: false, is_featured: false, is_new: false, is_popular: false, is_coming_soon: false,
  social_media: "", measurements: "",
});

function CollectionsEditor({ modelId, modelSlug }: { modelId: string; modelSlug: string }) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [images, setImages] = useState<Record<string, CollectionImage[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newCollName, setNewCollName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("model_collections").select("*").eq("model_id", modelId).order("display_order");
    setCollections(data || []);
    setLoading(false);
  }, [modelId]);

  useEffect(() => { loadCollections(); }, [loadCollections]);

  const loadImages = async (collId: string) => {
    const { data } = await supabase.from("model_collection_images").select("*").eq("collection_id", collId).order("display_order");
    setImages(prev => ({ ...prev, [collId]: data || [] }));
  };

  const addCollection = async () => {
    if (!newCollName.trim()) return;
    const maxOrder = Math.max(0, ...collections.map(c => c.display_order || 0));
    await supabase.from("model_collections").insert({
      model_id: modelId, name: newCollName.trim(),
      slug: slugify(newCollName.trim()), display_order: maxOrder + 1,
    });
    setNewCollName("");
    loadCollections();
  };

  const deleteCollection = async (coll: Collection) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    if (!confirm(`Delete collection "${coll.name}" and all its images?`)) return;
    await supabase.from("model_collection_images").delete().eq("collection_id", coll.id);
    await supabase.from("model_collections").delete().eq("id", coll.id);
    loadCollections();
  };

  const addImage = async (collId: string, path: string) => {
    const existing = images[collId] || [];
    await supabase.from("model_collection_images").insert({
      model_id: modelId, collection_id: collId, path, display_order: existing.length,
    });
    loadImages(collId);
  };

  const deleteImage = async (img: CollectionImage) => {
    await supabase.from("model_collection_images").delete().eq("id", img.id);
    loadImages(img.collection_id);
  };

  if (loading) return <div style={{ color: colors.muted, fontSize: 13 }}>Loading collections…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newCollName} onChange={e => setNewCollName(e.target.value)}
          placeholder="New collection name (e.g. Editorial)" style={{ ...inputStyle(), flex: 1 }}
          onKeyDown={e => e.key === "Enter" && addCollection()} />
        <button type="button" onClick={addCollection} style={btnStyle("primary")}>Add</button>
      </div>
      {collections.map(coll => (
        <div key={coll.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#1a1a1a", cursor: "pointer" }}
            onClick={() => { setExpanded(expanded === coll.id ? null : coll.id); if (expanded !== coll.id) loadImages(coll.id); }}>
            <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{coll.name}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: colors.muted }}>{images[coll.id]?.length ?? "?"} images</span>
              <button type="button" onClick={e => { e.stopPropagation(); deleteCollection(coll); }} style={{ ...btnStyle("danger"), padding: "4px 10px", fontSize: 12 }}>Delete</button>
              <span style={{ color: colors.muted, fontSize: 16 }}>{expanded === coll.id ? "▲" : "▼"}</span>
            </div>
          </div>
          {expanded === coll.id && (
            <div style={{ padding: 14, background: colors.surface }}>
              <MultiImageUploader bucket={BUCKETS.COLLECTIONS} folder={`${modelSlug}/${coll.slug}`}
                images={images[coll.id] || []} onAdded={path => addImage(coll.id, path)} onDeleted={deleteImage} />
            </div>
          )}
        </div>
      ))}
      {collections.length === 0 && (
        <div style={{ color: colors.muted, fontSize: 13, textAlign: "center", padding: 20 }}>No collections yet. Add one above.</div>
      )}
    </div>
  );
}

function ModelForm({ initial, onSaved, onCancel }: { initial?: Partial<Model>; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Model>>(initial || emptyModel());
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"details" | "collections">("details");
  const isEdit = !!initial?.id;

  const set = (key: keyof Model, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    if (!form.name?.trim()) return alert("Name is required");
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name!), updated_at: new Date().toISOString() };
    if (isEdit) { await supabase.from("models").update(payload).eq("id", form.id!); }
    else { await supabase.from("models").insert(payload); }
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, marginBottom: 24 }}>
        {(["details", "collections"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            padding: "10px 20px", background: "none", border: "none",
            borderBottom: `2px solid ${tab === t ? colors.accent : "transparent"}`,
            color: tab === t ? colors.accent : colors.muted,
            cursor: "pointer", fontSize: 13, fontWeight: 500, textTransform: "capitalize", transition: "all 0.15s",
          }}>{t}</button>
        ))}
      </div>

      {tab === "details" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
          <Field label="Thumbnail Photo">
            <ImageUploader bucket={BUCKETS.MODELS} folder={form.slug || "models"}
              currentPath={form.thumbnail_path} onUploaded={path => set("thumbnail_path", path)} label="Upload Thumbnail" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name *">
              <input value={form.name || ""} onChange={e => { set("name", e.target.value); set("slug", slugify(e.target.value)); }} style={inputStyle()} placeholder="e.g. Layal N" />
            </Field>
            <Field label="Slug">
              <input value={form.slug || ""} onChange={e => set("slug", e.target.value)} style={inputStyle()} placeholder="auto-generated" />
            </Field>
          </div>
          <Field label="Specialty / Tagline">
            <input value={form.specialty || ""} onChange={e => set("specialty", e.target.value)} style={inputStyle()} placeholder="e.g. Editorial fashion, luxury lifestyle campaigns" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Nationality">
              <input value={form.nationality || ""} onChange={e => set("nationality", e.target.value)} style={inputStyle()} />
            </Field>
            <Field label="Ethnicity">
              <input value={form.ethnicity || ""} onChange={e => set("ethnicity", e.target.value)} style={inputStyle()} />
            </Field>
            <Field label="Gender">
              <select value={form.gender || "female"} onChange={e => set("gender", e.target.value)} style={inputStyle()}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Age Group">
              <input value={form.age_group || ""} onChange={e => set("age_group", e.target.value)} style={inputStyle()} placeholder="e.g. 18-25" />
            </Field>
            <Field label="Height">
              <input value={form.height || ""} onChange={e => set("height", e.target.value)} style={inputStyle()} placeholder="e.g. 172cm" />
            </Field>
            <Field label="Weight">
              <input value={form.weight || ""} onChange={e => set("weight", e.target.value)} style={inputStyle()} placeholder="e.g. 54kg" />
            </Field>
          </div>
          <Field label="Measurements">
            <input value={form.measurements || ""} onChange={e => set("measurements", e.target.value)} style={inputStyle()} placeholder="e.g. 34-24-35" />
          </Field>
          <Field label="Hobbies / Interests">
            <input value={form.hobbies || ""} onChange={e => set("hobbies", e.target.value)} style={inputStyle()} />
          </Field>
          <Field label="Bio">
            <textarea value={form.bio || ""} onChange={e => set("bio", e.target.value)}
              style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }} placeholder="Short model biography…" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Social Media">
              <input value={form.social_media || ""} onChange={e => set("social_media", e.target.value)} style={inputStyle()} placeholder='@handle' />
            </Field>
            <Field label="Price (USD)">
              <input type="number" value={form.price_usd || 0} onChange={e => set("price_usd", parseFloat(e.target.value))} style={inputStyle()} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 16px", background: "#1a1a1a", borderRadius: 8 }}>
            <Toggle label="Published" checked={!!form.is_published} onChange={v => set("is_published", v)} />
            <Toggle label="Featured" checked={!!form.is_featured} onChange={v => set("is_featured", v)} />
            <Toggle label="New" checked={!!form.is_new} onChange={v => set("is_new", v)} />
            <Toggle label="Popular" checked={!!form.is_popular} onChange={v => set("is_popular", v)} />
            <Toggle label="Coming Soon" checked={!!form.is_coming_soon} onChange={v => set("is_coming_soon", v)} />
          </div>
        </div>
      )}

      {tab === "collections" && isEdit && <CollectionsEditor modelId={form.id!} modelSlug={form.slug || "model"} />}
      {tab === "collections" && !isEdit && (
        <div style={{ color: colors.muted, fontSize: 13, textAlign: "center", padding: 40 }}>
          Save the model first, then manage its photo collections here.
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 20, marginTop: "auto", borderTop: `1px solid ${colors.border}` }}>
        <button type="button" onClick={onCancel} style={btnStyle("ghost")}>Cancel</button>
        {tab === "details" && (
          <button type="button" onClick={save} disabled={saving} style={btnStyle("primary")}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Model"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Style Form ───────────────────────────────────────────────────────────────
const emptyStyle = (): Partial<Style> => ({ name: "", slug: "", description: "", thumbnail_path: "" });

function StyleForm({ initial, onSaved, onCancel }: { initial?: Partial<Style>; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Style>>(initial || emptyStyle());
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;
  const set = (key: keyof Style, val: unknown) => setForm(prev => ({ ...prev, [key]: val }));

  const save = async () => {
    if (!form.name?.trim()) return alert("Name is required");
    setSaving(true);
    const payload = { ...form, slug: form.slug || slugify(form.name!) };
    if (isEdit) { await supabase.from("styles").update(payload).eq("id", form.id!); }
    else { await supabase.from("styles").insert(payload); }
    setSaving(false);
    onSaved();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field label="Thumbnail">
        <ImageUploader bucket={BUCKETS.STYLES} folder={form.slug || "styles"} currentPath={form.thumbnail_path} onUploaded={path => set("thumbnail_path", path)} label="Upload Thumbnail" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Style Name *">
          <input value={form.name || ""} onChange={e => { set("name", e.target.value); set("slug", slugify(e.target.value)); }} style={inputStyle()} />
        </Field>
        <Field label="Slug">
          <input value={form.slug || ""} onChange={e => set("slug", e.target.value)} style={inputStyle()} />
        </Field>
      </div>
      <Field label="Description">
        <textarea value={form.description || ""} onChange={e => set("description", e.target.value)} style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }} />
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
        <button type="button" onClick={onCancel} style={btnStyle("ghost")}>Cancel</button>
        <button type="button" onClick={save} disabled={saving} style={btnStyle("primary")}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Style"}
        </button>
      </div>
    </div>
  );
}

// ─── Models Panel ─────────────────────────────────────────────────────────────
function ModelsPanel() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Model> | null>(null);
  const [creating, setCreating] = useState(false);
  const [wizarding, setWizarding] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("models").select("*").order("created_at", { ascending: false });
    setModels(data || []);
    setLoading(false);
  }, []);

  const handleWizardComplete = async (name: string, json: string, specialty: string, nationality: string) => {
    try {
      const parsed = JSON.parse(json);
      const v = parsed.visual_traits || {};
      const m = parsed.measurements || {};
      const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await supabase.from("models").insert({
        name, slug, nationality, specialty,
        ethnicity: parsed.identity?.ethnicity || nationality,
        gender: (parsed.identity?.gender || "Female").toLowerCase(),
        height: m.height_cm ? `${m.height_cm}cm` : "",
        bio: Array.isArray(parsed.identity?.personality) ? parsed.identity.personality.join(", ") : "",
        measurements: JSON.stringify(m),
        hobbies: v.distinctive_features || "",
        is_published: false,
        is_new: true,
      });
      setWizarding(false);
      load();
      showToast(`${name} created!`);
    } catch {
      showToast("Failed to save model", "error");
    }
  };

  useEffect(() => { load(); }, [load]);

  const deleteModel = async (m: Model) => {
    if (!confirm(`Delete "${m.name}"? This cannot be undone.`)) return;
    await supabase.from("model_collection_images").delete().eq("model_id", m.id);
    await supabase.from("model_collections").delete().eq("model_id", m.id);
    await supabase.from("models").delete().eq("id", m.id);
    showToast(`${m.name} deleted`);
    load();
  };

  if (wizarding) {
    return <ModelWizard onComplete={handleWizardComplete} onCancel={() => setWizarding(false)} />;
  }

  if (creating || editing) {
    return (
      <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setCreating(false); setEditing(null); }} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>{editing ? `Edit: ${editing.name}` : "New Model"}</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ModelForm
            initial={editing || undefined}
            onSaved={() => { setCreating(false); setEditing(null); load(); showToast("Model saved"); }}
            onCancel={() => { setCreating(false); setEditing(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>
          Models <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({models.length})</span>
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setWizarding(true)} style={btnStyle("secondary")}>✦ AI Wizard</button>
          <button type="button" onClick={() => setCreating(true)} style={btnStyle("primary")}>+ New Model</button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {models.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <img
                src={publicUrl(BUCKETS.MODELS, m.thumbnail_path) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23333'/%3E%3C/svg%3E"}
                alt={m.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{m.name}</span>
                  {m.is_published && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(74,222,128,0.15)", color: colors.success, borderRadius: 4 }}>LIVE</span>}
                  {m.is_coming_soon && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(250,204,21,0.15)", color: "#facc15", borderRadius: 4 }}>SOON</span>}
                  {m.is_new && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(201,169,110,0.15)", color: colors.accent, borderRadius: 4 }}>NEW</span>}
                  {m.is_popular && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(239,68,68,0.15)", color: colors.danger, borderRadius: 4 }}>POPULAR</span>}
                </div>
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{m.nationality} · {m.specialty || "No specialty set"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => setEditing(m)} style={btnStyle("secondary")}>Edit</button>
                <button type="button" onClick={() => deleteModel(m)} style={btnStyle("danger")}>Delete</button>
              </div>
            </div>
          ))}
          {models.length === 0 && (
            <div style={{ color: colors.muted, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
              <div>No models yet. Use the AI Wizard or add manually.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles Panel ─────────────────────────────────────────────────────────────
function StylesPanel() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Style> | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("styles").select("*").order("name");
    setStyles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteStyle = async (s: Style) => {
    if (!confirm(`Delete style "${s.name}"?`)) return;
    await supabase.from("styles").delete().eq("id", s.id);
    showToast(`${s.name} deleted`);
    load();
  };

  if (creating || editing) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setCreating(false); setEditing(null); }} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>{editing ? `Edit: ${editing.name}` : "New Style"}</h2>
        </div>
        <StyleForm
          initial={editing || undefined}
          onSaved={() => { setCreating(false); setEditing(null); load(); showToast("Style saved"); }}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      </div>
    );
  }

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>Styles <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({styles.length})</span></h2>
        <button type="button" onClick={() => setCreating(true)} style={btnStyle("primary")}>+ New Style</button>
      </div>
      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {styles.map(s => (
            <div key={s.id} style={{ background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}`, overflow: "hidden" }}>
              <img src={publicUrl(BUCKETS.STYLES, s.thumbnail_path) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect width='200' height='120' fill='%23333'/%3E%3C/svg%3E"}
                alt={s.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: colors.muted, marginBottom: 10 }}>{s.description?.slice(0, 60) || "No description"}{(s.description?.length || 0) > 60 ? "…" : ""}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => setEditing(s)} style={{ ...btnStyle("secondary"), flex: 1 }}>Edit</button>
                  <button type="button" onClick={() => deleteStyle(s)} style={btnStyle("danger")}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hero Panel ───────────────────────────────────────────────────────────────
function HeroPanel() {
  const [images, setImages] = useState<{ id: string; path: string; display_order: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("hero_images").select("*").order("display_order");
    setImages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addImage = async (path: string) => {
    const maxOrder = Math.max(0, ...images.map(i => i.display_order));
    await supabase.from("hero_images").insert({ path, display_order: maxOrder + 1 });
    showToast("Hero image added");
    load();
  };

  const deleteImage = async (id: string) => {
    await supabase.from("hero_images").delete().eq("id", id);
    showToast("Image removed");
    load();
  };

  const moveUp = async (idx: number) => {
    if (idx === 0) return;
    const a = images[idx], b = images[idx - 1];
    await supabase.from("hero_images").update({ display_order: b.display_order }).eq("id", a.id);
    await supabase.from("hero_images").update({ display_order: a.display_order }).eq("id", b.id);
    load();
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>Hero Images <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({images.length})</span></h2>
        <ImageUploader bucket={BUCKETS.HERO} folder="hero" onUploaded={addImage} label="+ Upload Hero Image" />
      </div>
      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {images.map((img, idx) => (
            <div key={img.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <img src={publicUrl(BUCKETS.HERO, img.path)} alt="" style={{ width: 120, height: 60, objectFit: "cover", borderRadius: 6 }} />
              <div style={{ flex: 1, fontSize: 12, color: colors.muted, fontFamily: "monospace" }}>{img.path}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} style={{ ...btnStyle("ghost"), padding: "6px 10px" }}>↑</button>
                <button type="button" onClick={() => deleteImage(img.id)} style={btnStyle("danger")}>Remove</button>
              </div>
            </div>
          ))}
          {images.length === 0 && <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>No hero images. Upload one above.</div>}
        </div>
      )}
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onLogin();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg, fontFamily: "'Georgia', serif" }}>
      <div style={{ width: 360, padding: 40, background: colors.surface, borderRadius: 12, border: `1px solid ${colors.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, letterSpacing: "0.3em", color: colors.accent, textTransform: "uppercase", marginBottom: 8 }}>CyberChic</div>
          <div style={{ fontSize: 22, color: colors.text, fontWeight: 400 }}>Admin Access</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle()} placeholder="admin@example.com" onKeyDown={e => e.key === "Enter" && login()} />
          </Field>
          <Field label="Password">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle()} onKeyDown={e => e.key === "Enter" && login()} />
          </Field>
          {error && <div style={{ fontSize: 12, color: colors.danger, textAlign: "center" }}>{error}</div>}
          <button type="button" onClick={login} disabled={loading} style={{ ...btnStyle("primary"), width: "100%", padding: "10px", marginTop: 8, fontSize: 14 }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Shell ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("models");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return <div style={{ minHeight: "100vh", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", color: colors.muted, fontFamily: "monospace" }}>Loading…</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "models", label: "Models" },
    { key: "styles", label: "Styles" },
    { key: "hero", label: "Hero" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "'Georgia', serif" }}>
      {/* Sidebar */}
      <div style={{ position: "fixed", left: 0, top: 64, bottom: 0, width: 220, background: colors.surface, borderRight: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: colors.accent, textTransform: "uppercase", marginBottom: 4 }}>CyberChic</div>
          <div style={{ fontSize: 15, color: colors.text }}>Admin</div>
        </div>
        <nav style={{ padding: "0 12px", flex: 1 }}>
          {tabs.map(t => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              background: activeTab === t.key ? colors.accentDim : "transparent",
              border: "none", color: activeTab === t.key ? colors.accent : colors.muted,
              cursor: "pointer", fontSize: 13, textAlign: "left",
              fontFamily: "inherit", transition: "all 0.15s", marginBottom: 2,
            }}>{t.label}</button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          <button type="button" onClick={() => supabase.auth.signOut()} style={{ ...btnStyle("ghost"), width: "100%", textAlign: "left", padding: "6px 0", fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, padding: "40px", paddingTop: 40, maxWidth: 960 }}>
        {activeTab === "models" && <ModelsPanel />}
        {activeTab === "styles" && <StylesPanel />}
        {activeTab === "hero" && <HeroPanel />}
      </div>
    </div>
  );
}
