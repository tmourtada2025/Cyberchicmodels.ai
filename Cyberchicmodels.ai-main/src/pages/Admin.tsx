/**
 * CyberChicModels Admin Panel — Phase 1 Update
 * Added: LoRA fields, Prompt Library, Collections Tracker, Client Requests
 * Added: Affogato FaceLock Session Generator (Phase 2)
 * Drop this file into: src/pages/Admin.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { ClientsPanel } from "../components/admin/ClientsPanel";

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
  lora_url: string;
  trigger_word: string;
  training_status: string;
  training_run_id: string;
  dalle_prompt_pack: string;
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

interface Prompt {
  id: string;
  model_id: string;
  label: string;
  prompt_text: string;
  platform: string;
  works_well: boolean;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  model_ids: string[];
  cover_image: string;
  created_at: string;
  updated_at: string;
}

interface ClientRequest {
  id: string;
  client_name: string;
  client_email: string;
  model_id: string;
  request_type: string;
  message: string;
  budget: string;
  status: string;
  created_at: string;
}

type Tab = "models" | "styles" | "hero" | "prompts" | "campaigns" | "requests" | "clients";

// FIXED: was recursive, calling itself instead of navigator.clipboard.writeText
function copyToClipboard(text: string): void {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

// ─── Affogato Session Builder ─────────────────────────────────────────────────
interface AffogatoPersona {
  model_name: string;
  identity?: { ethnicity?: string; nationality?: string };
  visual_traits?: {
    skin_tone?: string; eye_color?: string; hair_color?: string;
    hair_texture?: string; face_shape?: string; distinctive_features?: string;
  };
  prompts?: { negative?: string; affogato_facelock?: string };
}

function buildAffogatoShots(persona: AffogatoPersona) {
  const firstName = (persona.model_name || "MODEL").split(" ")[0];
  const v = persona.visual_traits || {};
  const traits = [
    persona.identity?.ethnicity || persona.identity?.nationality || "",
    v.skin_tone ? `${v.skin_tone} skin` : "",
    v.eye_color ? `${v.eye_color} eyes` : "",
    v.hair_color && v.hair_texture ? `${v.hair_texture} ${v.hair_color} hair` : "",
    v.face_shape ? `${v.face_shape} face` : "",
    v.distinctive_features || "",
  ].filter(Boolean).join(", ");

  const base = `^${firstName}^ ${traits}`;
  const suffix = `photorealistic, 85mm portrait lens, sharp focus on eyes <lora:better_hands:0.8>`;

  const defs = [
    { label: "SHOT 01 — Front Facing Neutral (ANCHOR)", shot: "front-facing headshot, neutral expression, eyes directly at camera", light: "studio soft lighting, flat even illumination", bg: "neutral grey seamless backdrop" },
    { label: "SHOT 02 — Front Facing Soft Smile", shot: "front-facing headshot, soft natural smile, eyes directly at camera", light: "studio soft lighting", bg: "neutral grey background" },
    { label: "SHOT 03 — 3/4 Turn Right", shot: "nose pointing toward right edge of frame, right cheek and right ear visible, left cheek partially hidden, eyes looking back at camera, 45-degree head turn", light: "studio soft lighting", bg: "grey background" },
    { label: "SHOT 04 — 3/4 Turn Left", shot: "nose pointing toward left edge of frame, left cheek and left ear visible, right cheek partially hidden, eyes looking back at camera, 45-degree head turn", light: "studio soft lighting", bg: "grey background" },
    { label: "SHOT 05 — Profile Right", shot: "full side profile, nose pointing right edge of frame, only one eye visible, jawline in full silhouette, body facing right", light: "studio lighting", bg: "grey background" },
    { label: "SHOT 06 — Profile Left", shot: "full side profile, nose pointing left edge of frame, only one eye visible, jawline in full silhouette, body facing left", light: "studio lighting", bg: "grey background" },
    { label: "SHOT 07 — Chin Up", shot: "face tilted upward 20 degrees, eyes looking downward toward camera, camera positioned slightly above subject", light: "dramatic side lighting", bg: "grey background" },
    { label: "SHOT 08 — Chin Down", shot: "face tilted downward 15 degrees, eyes looking upward at camera, camera positioned slightly below subject", light: "studio soft lighting", bg: "grey background" },
    { label: "SHOT 09 — Eyes Left", shot: "head facing forward, eyes shifted to subject's left, NOT looking at camera, contemplative expression", light: "dramatic side lighting", bg: "grey background" },
    { label: "SHOT 10 — Eyes Right", shot: "head facing forward, eyes shifted to subject's right, NOT looking at camera, neutral expression", light: "natural daylight", bg: "grey background" },
    { label: "SHOT 11 — Eyes Down", shot: "head facing forward, eyes cast downward toward chest level, thoughtful introspective expression", light: "soft natural indoor light", bg: "warm neutral background" },
    { label: "SHOT 12 — Eyes Up", shot: "head facing forward, eyes looking upward above frame, open serene expression", light: "golden hour lighting", bg: "soft background" },
    { label: "SHOT 13 — Bust Front", shot: "bust shot shoulders to crown, front-facing, neutral expression, eyes at camera, simple fitted top", light: "studio soft lighting", bg: "grey background" },
    { label: "SHOT 14 — Bust 3/4 Right Eyes Off", shot: "bust shot, nose pointing toward right edge of frame, eyes looking off into space to subject's left NOT at camera, simple fitted top", light: "dramatic side lighting", bg: "off-white background" },
    { label: "SHOT 15 — Bust 3/4 Left Eyes On", shot: "bust shot, nose pointing toward left edge of frame, eyes directly at camera, simple fitted top", light: "natural soft indoor light", bg: "warm neutral background" },
    { label: "SHOT 16 — Candid Bust", shot: "candid bust shot, slight natural head tilt, relaxed expression, eyes at camera, minimal makeup, simple top", light: "ambient natural window light", bg: "soft indoor background" },
    { label: "SHOT 17 — Full Body Front", shot: "full body, front-facing, standing neutral, hands relaxed at sides, simple fitted jeans and white top", light: "studio soft lighting", bg: "white seamless background" },
    { label: "SHOT 18 — Full Body 3/4 Right", shot: "full body, body and face angled toward right edge of frame, weight shifted onto one leg, natural relaxed stance, simple outfit", light: "studio lighting", bg: "white background" },
    { label: "SHOT 19 — Full Body 3/4 Left", shot: "full body, body and face angled toward left edge of frame, slight implied movement, one foot stepping forward, simple outfit", light: "studio lighting", bg: "white background" },
    { label: "SHOT 20 — Walking Toward Camera", shot: "full body, walking directly toward camera, confident stride, one foot forward, natural arm movement, simple outfit", light: "studio lighting", bg: "white background" },
    { label: "SHOT 21 — Back Turned Head Right", shot: "full body, body facing away from camera, chin near right shoulder, right eye visible looking back at camera making direct eye contact, simple outfit", light: "studio lighting", bg: "white background" },
    { label: "SHOT 22 — Seated Relaxed", shot: "full body, seated casually on simple stool, relaxed posture, front-facing, eyes at camera, simple outfit", light: "soft studio lighting", bg: "neutral background" },
    { label: "SHOT 23 — Genuine Laugh", shot: "tight face crop, genuine laugh, eyes crinkled with joy, mouth open naturally, no forced smile", light: "soft natural light", bg: "" },
    { label: "SHOT 24 — Serious Intense", shot: "tight face crop, serious intense expression, lips slightly parted, direct unwavering eye contact with camera", light: "dramatic side lighting, one side in slight shadow", bg: "" },
  ];

  return defs.map((d, i) => ({
    id: i + 1,
    label: d.label,
    prompt: `${base},\n${d.shot},\n${d.light}${d.bg ? `, ${d.bg}` : ""},\n${suffix}`,
  }));
}

function buildAffogatoMarkdown(persona: AffogatoPersona): string {
  const shots = buildAffogatoShots(persona);
  const firstName = (persona.model_name || "MODEL").split(" ")[0];
  const date = new Date().toISOString().split("T")[0];
  const neg = persona.prompts?.negative || "deformed, ugly, blurry, low quality, watermark, text, logo, different person";
  const lines = [
    `# ${persona.model_name} — Affogato FaceLock Training Session`,
    `**Date:** ${date}  |  **Trigger:** ^${firstName}^  |  **Shots:** 24`,
    ``,
    `---`,
    ``,
    `## Negative Prompt (apply to all shots)`,
    `\`\`\``,
    neg,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## Shot-by-Shot Prompts`,
    `> Paste each into Affogato sequentially. Generate 2 variants per shot, pick the best.`,
    ``,
    ...shots.flatMap(s => [
      `### ${s.label}`,
      `\`\`\``,
      s.prompt,
      `\`\`\``,
      `- [ ] Generated  - [ ] Approved`,
      ``,
      `---`,
      ``,
    ]),
    `## Curation Checklist`,
    `- [ ] 24 approved images downloaded`,
    `- [ ] No repeated angles`,
    `- [ ] Anchor features consistent across all shots`,
    `- [ ] No skin tone / identity drift`,
    `- [ ] Ready to upload to Fal.ai LoRA trainer`,
  ];
  return lines.join("\n");
}

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
  "Cambodian": { skin_tone: "Medium golden brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Round", height_range: "155-163cm", build: "Petite", ethnicity: "Khmer", distinctive: "Soft features, wide eyes, golden undertone" },
  "Cameroonian": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-172cm", build: "Athletic", ethnicity: "Central African", distinctive: "Defined bone structure, full lips" },
  "Canadian": { skin_tone: "Fair to medium", eye_color: "Blue to brown", hair_color: "Blonde to brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "166-175cm", build: "Athletic", ethnicity: "Mixed European / Indigenous", distinctive: "Healthy outdoorsy complexion, diverse features" },
  "Chilean": { skin_tone: "Light olive", eye_color: "Brown", hair_color: "Dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim to medium", ethnicity: "Mixed European/Indigenous", distinctive: "European-influenced features with warm undertone" },
  "Chinese": { skin_tone: "Fair to light golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "160-170cm", build: "Slim, petite", ethnicity: "Han Chinese", distinctive: "Monolid or double eyelid, porcelain skin, delicate features" },
  "Colombian": { skin_tone: "Golden olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Heart", height_range: "164-173cm", build: "Curvaceous", ethnicity: "Mixed European/Indigenous/African", distinctive: "Full lips, expressive eyes, natural warmth" },
  "Congolese": { skin_tone: "Deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "162-172cm", build: "Tall, lean", ethnicity: "Bantu Central African", distinctive: "Elongated features, regal bone structure" },
  "Croatian": { skin_tone: "Light olive", eye_color: "Brown to blue", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "168-177cm", build: "Tall, athletic", ethnicity: "South Slavic", distinctive: "Tall stature, defined jaw, Mediterranean-Slavic mix" },
  "Cuban": { skin_tone: "Light to medium brown", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy to curly", face_shape: "Oval", height_range: "163-172cm", build: "Curvaceous", ethnicity: "Mixed European/African", distinctive: "Warm mixed heritage features, full hair" },
  "Czech": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "167-176cm", build: "Lean", ethnicity: "West Slavic", distinctive: "High cheekbones, fair skin, light eyes" },
  "Danish": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "168-177cm", build: "Tall, lean", ethnicity: "Scandinavian", distinctive: "Golden blonde hair, blue eyes, tall frame" },
  "Dominican": { skin_tone: "Medium to caramel", eye_color: "Brown", hair_color: "Dark brown to black", hair_texture: "Curly", face_shape: "Oval", height_range: "163-172cm", build: "Curvaceous", ethnicity: "Mixed African/European/Taino", distinctive: "Rich mixed heritage, expressive features" },
  "Dutch": { skin_tone: "Fair", eye_color: "Blue to green", hair_color: "Blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "170-180cm", build: "Tall, lean", ethnicity: "Northwestern European", distinctive: "Very tall, fair features, angular face" },
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
  "Kenyan": { skin_tone: "Medium to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Narrow oval", height_range: "165-175cm", build: "Lean, tall", ethnicity: "Nilotic / Bantu East African", distinctive: "Long limbs, defined features, runner's physique" },
  "Korean": { skin_tone: "Fair to light ivory", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Heart to oval", height_range: "162-170cm", build: "Slim, petite", ethnicity: "Korean", distinctive: "Glass skin complexion, delicate features, defined jaw" },
  "Latvian": { skin_tone: "Very fair", eye_color: "Blue to grey", hair_color: "Blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "168-177cm", build: "Lean, tall", ethnicity: "Baltic", distinctive: "Platinum blonde hair, icy blue eyes, tall and lean" },
  "Lebanese": { skin_tone: "Light olive", eye_color: "Green to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Heart", height_range: "163-172cm", build: "Slim to medium", ethnicity: "Levantine Arab / Phoenician", distinctive: "High cheekbones, green or hazel eyes, defined nose, lush hair" },
  "Malaysian": { skin_tone: "Medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-166cm", build: "Slim", ethnicity: "Malay", distinctive: "Warm golden skin, soft features, glossy hair" },
  "Malian": { skin_tone: "Deep brown to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Lean, statuesque", ethnicity: "West African / Mande", distinctive: "Elongated neck, fine bone structure, radiant deep skin" },
  "Mexican": { skin_tone: "Warm golden to medium brown", eye_color: "Dark brown", hair_color: "Black to dark brown", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "160-168cm", build: "Curvaceous", ethnicity: "Mestizo / Indigenous", distinctive: "Rich heritage blend, warm glow, expressive dark eyes" },
  "Moroccan": { skin_tone: "Warm olive to medium", eye_color: "Amber to dark brown", hair_color: "Dark brown to black", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Arab / Amazigh / Berber", distinctive: "Amber eyes, sculpted features, warm golden undertone" },
  "Nigerian": { skin_tone: "Rich chocolate to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Curvaceous", ethnicity: "Yoruba / Igbo / Hausa West African", distinctive: "Radiant deep skin, bold features, full figure" },
  "Norwegian": { skin_tone: "Very fair", eye_color: "Blue", hair_color: "Blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "168-177cm", build: "Tall, athletic", ethnicity: "Nordic / Scandinavian", distinctive: "Ice-blue eyes, very fair skin, naturally blonde" },
  "Pakistani": { skin_tone: "Warm medium", eye_color: "Dark brown to hazel", hair_color: "Black", hair_texture: "Wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim to medium", ethnicity: "South Asian / Indus", distinctive: "Expressive large eyes, strong brows, graceful features" },
  "Palestinian": { skin_tone: "Light to warm olive", eye_color: "Dark brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim", ethnicity: "Levantine Arab", distinctive: "Defined features, olive warmth, expressive eyes" },
  "Peruvian": { skin_tone: "Medium copper", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-166cm", build: "Compact, curvaceous", ethnicity: "Mestizo / Quechua", distinctive: "Strong indigenous features, warm copper tone" },
  "Filipino": { skin_tone: "Light to medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "158-165cm", build: "Petite to slim", ethnicity: "Austronesian / Malay", distinctive: "Golden skin, soft features, expressive eyes" },
  "Polish": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Ash blonde to light brown", hair_texture: "Straight", face_shape: "Oval", height_range: "167-176cm", build: "Lean", ethnicity: "West Slavic", distinctive: "High cheekbones, pale skin, often striking pale eyes" },
  "Portuguese": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "164-172cm", build: "Medium", ethnicity: "Iberian / Atlantic", distinctive: "Darker Iberian features, soulful eyes" },
  "Romanian": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-174cm", build: "Lean", ethnicity: "Latin / Dacian European", distinctive: "Defined features, dark expressive eyes, warm olive tone" },
  "Russian": { skin_tone: "Fair to porcelain", eye_color: "Blue to grey", hair_color: "Blonde to ash", hair_texture: "Straight", face_shape: "Oval", height_range: "168-176cm", build: "Lean, tall", ethnicity: "East Slavic", distinctive: "High cheekbones, pale skin, light eyes, angular features" },
  "Saudi": { skin_tone: "Warm olive to medium", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "162-170cm", build: "Slim to medium", ethnicity: "Arab / Hijazi", distinctive: "Classic Arabian features, kohl-dark eyes, dignified bearing" },
  "Senegalese": { skin_tone: "Deep brown to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "165-175cm", build: "Lean, statuesque", ethnicity: "Wolof / West African", distinctive: "Exceptional skin clarity, refined bone structure, tall elegant frame" },
  "Serbian": { skin_tone: "Light olive", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "168-177cm", build: "Tall, athletic", ethnicity: "South Slavic", distinctive: "Tall frame, defined features, Mediterranean-Slavic blend" },
  "Somali": { skin_tone: "Medium brown to deep", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily to wavy", face_shape: "Narrow oval", height_range: "165-175cm", build: "Lean, tall", ethnicity: "Cushitic East African", distinctive: "Sharp angular features, long limbs, elegant stature" },
  "South African": { skin_tone: "Varies – golden to deep brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Oval", height_range: "163-173cm", build: "Athletic", ethnicity: "Zulu / Xhosa / Mixed", distinctive: "Vibrant diverse features, strong bone structure" },
  "South Korean": { skin_tone: "Fair ivory", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "V-shaped / heart", height_range: "162-170cm", build: "Slim, petite", ethnicity: "Korean", distinctive: "Glass skin, v-shaped jaw, monolid or large double-eyelid" },
  "Spanish": { skin_tone: "Light to warm olive", eye_color: "Brown to dark brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-173cm", build: "Medium, curvaceous", ethnicity: "Iberian / Mediterranean", distinctive: "Warm expressive eyes, olive skin, passionate features" },
  "Sri Lankan": { skin_tone: "Medium warm brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "158-166cm", build: "Slim", ethnicity: "Sinhalese / Tamil South Asian", distinctive: "Rich warm skin, large expressive eyes, delicate features" },
  "Sudanese": { skin_tone: "Deep brown to ebony", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Coily", face_shape: "Narrow oval", height_range: "168-178cm", build: "Tall, lean", ethnicity: "Nilotic / Nubian", distinctive: "Very tall and lean, extraordinarily fine features, deep blue-black skin" },
  "Swedish": { skin_tone: "Very fair", eye_color: "Blue", hair_color: "Pale blonde", hair_texture: "Straight", face_shape: "Oval", height_range: "169-178cm", build: "Tall, lean", ethnicity: "Nordic", distinctive: "Platinum blonde, sky-blue eyes, naturally tall and lean" },
  "Syrian": { skin_tone: "Light to warm olive", eye_color: "Hazel to dark brown", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "163-172cm", build: "Slim to medium", ethnicity: "Levantine Arab", distinctive: "Often hazel or light eyes, defined features, warm olive skin" },
  "Thai": { skin_tone: "Light golden brown", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval to round", height_range: "158-165cm", build: "Petite, slim", ethnicity: "Tai / Southeast Asian", distinctive: "Golden warm skin, soft features, graceful posture" },
  "Turkish": { skin_tone: "Light olive to warm", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Oval", height_range: "165-173cm", build: "Medium", ethnicity: "Turkic / Anatolian", distinctive: "Strong cheekbones, deep eyes, Eurasian blend" },
  "Ukrainian": { skin_tone: "Fair", eye_color: "Blue to grey", hair_color: "Blonde", hair_texture: "Straight to wavy", face_shape: "Oval", height_range: "168-177cm", build: "Tall, feminine", ethnicity: "East Slavic", distinctive: "Bright blue eyes, blonde hair, high cheekbones, tall and graceful" },
  "Venezuelan": { skin_tone: "Golden to medium brown", eye_color: "Brown to hazel", hair_color: "Dark brown", hair_texture: "Wavy", face_shape: "Heart to oval", height_range: "165-174cm", build: "Curvaceous, tall", ethnicity: "Mixed European/Indigenous/African", distinctive: "Pageant-quality features, tall frame, expressive eyes" },
  "Vietnamese": { skin_tone: "Light to medium golden", eye_color: "Dark brown", hair_color: "Black", hair_texture: "Straight", face_shape: "Oval", height_range: "158-165cm", build: "Petite, slim", ethnicity: "Kinh Vietnamese", distinctive: "Delicate refined features, silky straight hair, warm glow" },
};

const ALL_COUNTRIES = Object.keys(ARCHETYPES).sort();

// ─── Wizard Options ──────────────────────────────────────────────────────────
const GENDERS = ["Female", "Male"];
const AGE_GROUPS = ["18-22", "23-27", "28-34", "35-42", "43-50", "50+"];
const SPECIALTIES = [
  "High fashion / editorial", "Luxury lifestyle", "Commercial / catalogue",
  "Sportswear & activewear", "Swimwear & lingerie", "Beauty & cosmetics",
  "Streetwear & urban", "Bridal & formal wear", "Fitness & wellness",
  "E-commerce", "Art & avant-garde",
];
const BODY_TYPES = ["Petite", "Slim", "Athletic", "Curvaceous", "Plus-size", "Tall & lean", "Muscular", "Androgynous"];
const HAIR_COLORS = ["Black", "Dark brown", "Medium brown", "Auburn / red", "Blonde", "Platinum blonde", "Grey / silver", "Highlighted", "Coloured / unnatural"];
const HAIR_TEXTURES = ["Straight", "Wavy", "Curly", "Coily / afro", "Locs / braids"];
const EYE_COLORS = ["Dark brown", "Medium brown", "Hazel", "Amber", "Green", "Blue", "Grey", "Mixed / heterochromia"];
const SKIN_TONES = ["Very fair / porcelain", "Fair", "Light olive", "Warm olive / medium", "Golden / tan", "Medium brown", "Rich brown", "Deep brown", "Ebony"];
const POSE_STYLES = ["Editorial high fashion", "Natural / candid", "Sporty / dynamic", "Glamour", "Minimalist", "Streetstyle", "Fine art / conceptual"];
const WARDROBE_STYLES = ["Luxury couture", "Streetwear", "Minimalist clean", "Bohemian", "Sportswear", "Lingerie / swimwear", "Bridal", "Avant-garde"];
const LIGHTING_STYLES = ["Studio soft-box", "Natural daylight", "Golden hour", "Dramatic side-light", "High-key white", "Low-key dark / moody", "Neon / coloured"];
const TRAINING_STATUSES = ["untrained", "dataset_ready", "training", "completed", "failed"];
const CAMPAIGN_STATUSES = ["draft", "generating", "ready", "published", "archived"];
const REQUEST_STATUSES = ["new", "reviewing", "quoted", "accepted", "declined", "completed"];
const PLATFORMS = ["fal.ai", "Tensor.Art", "Replicate", "Astria", "Civitai", "ComfyUI", "Affogato", "Other"];

// ─── Wizard Step Config ──────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { key: "step1", title: "Identity", fields: ["gender", "age_group", "nationality"] },
  { key: "step2", title: "Physical", fields: ["skin_tone", "eye_color", "hair_color", "hair_texture", "body_type"] },
  { key: "step3", title: "Specialty", fields: ["specialty"] },
  { key: "step4", title: "Style", fields: ["wardrobe_style", "pose_style", "lighting"] },
];

interface WizardData {
  gender: string; age_group: string; nationality: string;
  skin_tone: string; eye_color: string; hair_color: string;
  hair_texture: string; body_type: string; specialty: string;
  wardrobe_style: string; pose_style: string; lighting: string;
}

const emptyWizard = (): WizardData => ({
  gender: "", age_group: "", nationality: "", skin_tone: "", eye_color: "",
  hair_color: "", hair_texture: "", body_type: "", specialty: "",
  wardrobe_style: "", pose_style: "", lighting: "",
});

// ─── Style helpers ────────────────────────────────────────────────────────────
const colors = {
  bg: "#0d0d0d", surface: "#161616", border: "#2a2a2a",
  accent: "#c9a96e", accentDim: "rgba(201,169,110,0.15)",
  text: "#f0ece4", muted: "#888", danger: "#ef4444", success: "#4ade80",
};

function btnStyle(variant: "primary" | "secondary" | "danger" | "ghost"): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 6, cursor: "pointer",
    fontSize: 13, fontFamily: "inherit", fontWeight: 500,
    transition: "all 0.15s", border: "1px solid transparent", whiteSpace: "nowrap",
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
      <div onClick={() => onChange(!checked)} style={{
        width: 36, height: 20, borderRadius: 10, position: "relative",
        background: checked ? colors.accent : colors.border, transition: "background 0.2s", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: "50%",
          background: checked ? "#0d0d0d" : colors.muted, transition: "left 0.2s",
        }} />
      </div>
      <span style={{ fontSize: 13, color: colors.text }}>{label}</span>
    </label>
  );
}

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

function StatusBadge({ status, type }: { status: string; type: "training" | "campaign" | "request" }) {
  const statusColors: Record<string, { bg: string; color: string }> = {
    untrained: { bg: "rgba(136,136,136,0.15)", color: "#888" },
    dataset_ready: { bg: "rgba(250,204,21,0.15)", color: "#facc15" },
    training: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    completed: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
    failed: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    draft: { bg: "rgba(136,136,136,0.15)", color: "#888" },
    generating: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    ready: { bg: "rgba(250,204,21,0.15)", color: "#facc15" },
    published: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
    archived: { bg: "rgba(136,136,136,0.15)", color: "#555" },
    new: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    reviewing: { bg: "rgba(250,204,21,0.15)", color: "#facc15" },
    quoted: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    accepted: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
    declined: { bg: "rgba(136,136,136,0.15)", color: "#888" },
    completed_req: { bg: "rgba(201,169,110,0.15)", color: "#c9a96e" },
  };
  const key = status === "completed" && type === "request" ? "completed_req" : status;
  const sc = statusColors[key] || statusColors.draft;
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: sc.bg, color: sc.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
      {status.replace("_", " ")}
    </span>
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── ImageUploader ────────────────────────────────────────────────────────────
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

// ─── MultiImageUploader ───────────────────────────────────────────────────────
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
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", color: "#fff", cursor: "pointer", fontSize: 12, lineHeight: "20px", padding: 0 }}>×</button>
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

// ─── ModelWizard ──────────────────────────────────────────────────────────────
function ModelWizard({ onComplete, onCancel }: {
  onComplete: (name: string, json: string, specialty: string, nationality: string) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(emptyWizard());
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ name: string; json: string; prompts: Record<string, string> } | null>(null);
  const [error, setError] = useState("");
  const [sessionExpanded, setSessionExpanded] = useState(false);
  const [copiedShot, setCopiedShot] = useState<number | null>(null);

  const set = (key: keyof WizardData, val: string) => setData(prev => ({ ...prev, [key]: val }));

  const applyArchetype = () => {
    const arch = ARCHETYPES[data.nationality];
    if (!arch) return;
    setData(prev => ({ ...prev, skin_tone: arch.skin_tone, eye_color: arch.eye_color, hair_color: arch.hair_color, hair_texture: arch.hair_texture, body_type: arch.build }));
  };

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
  "trigger_word": "<firstname_lastname_abbreviated e.g. vanessa_rv>",
  "prompts": {
    "dalle_training": "Generate 24 consistent portrait photos of [full description]: [skin tone] skin, [eye color] eyes, [hair color] [hair texture] hair, [body type] build, [distinctive features]. Angles: front face, 3/4 left, 3/4 right, profile left, profile right, slight up, slight down, close-up eyes, close-up lips, chest up, waist up, full body. Lighting variations: studio soft, natural daylight, golden hour, dramatic side. Expression: neutral, slight smile, serious. DALL-E 4 consistent character sheet.",
    "fal_inference": "portrait of [trigger_word] woman, [specialty] editorial, [wardrobe_style], [lighting], hyperrealistic, fashion photography, 8K",
    "kling": "photorealistic, [model description], ${data.specialty}, ${data.wardrobe_style} outfit, ${data.lighting} lighting, ${data.pose_style} pose, professional model photography, 8K, detailed",
    "affogato_facelock": "^[model_first_name]^ [ethnicity] woman, [skin_tone] skin, [eye_color] eyes, [hair_texture] [hair_color] hair, [face_shape] face, [distinctive_features], [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>",
    "negative": "deformed, ugly, blurry, low quality, bad anatomy, extra limbs, watermark, text, logo, different person"
  }
}

IMPORTANT for affogato_facelock field: wrap the model's first name in carets ^Name^, list all physical identity traits comma-separated and densely, leave the literal placeholder text [SHOT DESCRIPTION] and [LIGHTING] exactly as written — do NOT fill these in, end with: photorealistic, 85mm portrait lens <lora:better_hands:0.8>`;

      const response = await fetch("/api/generate-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`API error ${response.status}: ${errData.error || "unknown"}`);
      }

      const { text } = await response.json();
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setResult({ name: parsed.model_name, json: JSON.stringify(parsed, null, 2), prompts: parsed.prompts });
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

  const ddStyle: React.CSSProperties = {
    width: "100%", padding: "9px 36px 9px 12px", borderRadius: 6,
    background: "#1e1e1e", border: `1px solid ${colors.border}`,
    color: colors.text, fontSize: 13, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box" as const, cursor: "pointer",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C%2Fsvg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  };

  const DD = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) => (
    <Field label={label}>
      <select value={value} onChange={e => onChange(e.target.value)} style={ddStyle}>
        <option value="" disabled>Select {label.toLowerCase()}...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );

  if (result) {
    const parsedPersona: AffogatoPersona | null = (() => { try { return JSON.parse(result.json); } catch { return null; } })();
    const affogatoShots = parsedPersona ? buildAffogatoShots(parsedPersona) : [];
    const firstName = parsedPersona ? (parsedPersona.model_name || "MODEL").split(" ")[0] : "MODEL";
    const basePrompt = parsedPersona?.prompts?.affogato_facelock ||
      `^${firstName}^ [traits], [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>`;

    const handleDownloadMd = () => {
      if (!parsedPersona) return;
      const md = buildAffogatoMarkdown(parsedPersona);
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(parsedPersona.model_name || "model").replace(/\s+/g, "_")}_affogato_session.md`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", maxHeight: "calc(100vh - 140px)" }}>
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
                <span style={{ fontSize: 11, color: colors.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>{platform.replace(/_/g, " ")}</span>
                <button type="button" onClick={() => copyToClipboard(prompt as string)}
                  style={{ ...btnStyle("ghost"), padding: "3px 8px", fontSize: 11 }}>Copy</button>
              </div>
              <div style={{ fontSize: 12, color: colors.muted, lineHeight: 1.6 }}>{prompt as string}</div>
            </div>
          ))}
        </div>

        {/* ── Affogato FaceLock Session Panel ── */}
        {parsedPersona && (
          <div style={{ border: `1px solid rgba(201,169,110,0.3)`, borderRadius: 10, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "14px 16px", background: "rgba(201,169,110,0.08)", borderBottom: `1px solid rgba(201,169,110,0.2)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: colors.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>✦ Affogato FaceLock Session</div>
                <div style={{ fontSize: 12, color: colors.muted }}>24-shot training dataset · ^{firstName}^</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={handleDownloadMd}
                  style={{ ...btnStyle("primary"), fontSize: 12, padding: "7px 14px" }}>
                  ⬇ Download .md
                </button>
                <button type="button" onClick={() => setSessionExpanded(e => !e)}
                  style={{ ...btnStyle("secondary"), fontSize: 12, padding: "7px 14px" }}>
                  {sessionExpanded ? "▲ Collapse" : "▼ All 24 Shots"}
                </button>
              </div>
            </div>

            {/* Base prompt */}
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Base FaceLock Prompt</div>
              <div style={{ position: "relative" }}>
                <pre style={{ margin: 0, fontSize: 11, color: "#4ade80", background: "rgba(0,0,0,0.4)", borderRadius: 6, padding: 12, overflow: "auto", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.6 }}>
                  {basePrompt}
                </pre>
                <button type="button" onClick={() => copyToClipboard(basePrompt)}
                  style={{ position: "absolute", top: 8, right: 8, ...btnStyle("ghost"), fontSize: 11, padding: "3px 8px", border: `1px solid ${colors.border}` }}>
                  Copy
                </button>
              </div>
            </div>

            {/* Expanded shot list */}
            {sessionExpanded && (
              <div style={{ maxHeight: 520, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                  Generate 2 variants per shot in Affogato. Pick the best. Check off as you go.
                </div>
                {affogatoShots.map(shot => (
                  <div key={shot.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: "hidden" }}>
                    <div style={{ padding: "8px 12px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: colors.text, fontWeight: 500 }}>{shot.label}</span>
                      <button type="button"
                        onClick={() => { copyToClipboard(shot.prompt); setCopiedShot(shot.id); setTimeout(() => setCopiedShot(null), 1500); }}
                        style={{ ...btnStyle("ghost"), fontSize: 11, padding: "3px 8px", border: `1px solid ${colors.border}` }}>
                        {copiedShot === shot.id ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <pre style={{ margin: 0, fontSize: 11, color: "#4ade80", background: "rgba(0,0,0,0.3)", padding: "10px 12px", overflow: "auto", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.6 }}>
                      {shot.prompt}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: "10px 16px", borderTop: `1px solid ${colors.border}`, background: "#0f0f0f" }}>
              <div style={{ fontSize: 11, color: colors.muted }}>
                Negative: {parsedPersona.prompts?.negative || "deformed, ugly, blurry, low quality, watermark, text, logo, different person"}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 12, marginTop: 16, borderTop: `1px solid ${colors.border}`, position: "sticky", bottom: 0, background: colors.bg, zIndex: 10 }}>
          <button type="button" onClick={onCancel} style={btnStyle("ghost")}>Discard</button>
          <button type="button" onClick={handleSave} style={{ ...btnStyle("primary"), minWidth: 160, fontSize: 14, padding: "10px 20px" }}>💾 Save to Database</button>
        </div>
      </div>
    );
  }

  const stepTitles = ["Identity", "Physical", "Specialty", "Style & Lighting"];
  const totalSteps = stepTitles.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, minHeight: 480 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>✦ AI Model Wizard</h2>
          <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Step {step + 1} of {totalSteps} — {stepTitles[step]}</div>
        </div>
        <button type="button" onClick={() => { setStep(0); setData(emptyWizard()); setError(""); }}
          style={{ background: "none", border: `1px solid ${colors.border}`, color: colors.muted, cursor: "pointer", fontSize: 12, padding: "4px 12px", borderRadius: 6, whiteSpace: "nowrap" }}>↺ Reset</button>
      </div>

      <div style={{ height: 3, background: colors.border, borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${((step + 1) / totalSteps) * 100}%`, background: colors.accent, borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DD label="Gender" value={data.gender} options={GENDERS} onChange={v => set("gender", v)} />
          <DD label="Age Group" value={data.age_group} options={AGE_GROUPS} onChange={v => set("age_group", v)} />
          <Field label="Nationality">
            <div style={{ display: "flex", gap: 8 }}>
              <select value={data.nationality} onChange={e => set("nationality", e.target.value)} style={ddStyle}>
                <option value="" disabled>Select nationality...</option>
                {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {data.nationality && (
                <button type="button" onClick={applyArchetype} style={{ ...btnStyle("primary"), whiteSpace: "nowrap", fontSize: 12, flexShrink: 0 }}>✦ Archetype</button>
              )}
            </div>
            {data.nationality && ARCHETYPES[data.nationality] && (
              <div style={{ fontSize: 12, color: colors.accent, marginTop: 8, padding: "6px 10px", background: colors.accentDim, borderRadius: 6 }}>
                {ARCHETYPES[data.nationality].distinctive}
              </div>
            )}
          </Field>
        </div>
      )}

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data.nationality && ARCHETYPES[data.nationality] && (
            <div style={{ padding: "10px 14px", background: colors.accentDim, borderRadius: 8, fontSize: 12, color: colors.accent }}>
              <strong>Archetype active:</strong> {data.nationality} — fields pre-filled. Edit below if needed.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <DD label="Skin Tone" value={data.skin_tone} options={SKIN_TONES} onChange={v => set("skin_tone", v)} />
            <DD label="Eye Color" value={data.eye_color} options={EYE_COLORS} onChange={v => set("eye_color", v)} />
            <DD label="Hair Color" value={data.hair_color} options={HAIR_COLORS} onChange={v => set("hair_color", v)} />
            <DD label="Hair Texture" value={data.hair_texture} options={HAIR_TEXTURES} onChange={v => set("hair_texture", v)} />
          </div>
          <DD label="Body Type" value={data.body_type} options={BODY_TYPES} onChange={v => set("body_type", v)} />
        </div>
      )}

      {step === 2 && (
        <DD label="Specialty / Market" value={data.specialty} options={SPECIALTIES} onChange={v => set("specialty", v)} />
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <DD label="Wardrobe Style" value={data.wardrobe_style} options={WARDROBE_STYLES} onChange={v => set("wardrobe_style", v)} />
          <DD label="Pose Style" value={data.pose_style} options={POSE_STYLES} onChange={v => set("pose_style", v)} />
          <DD label="Lighting" value={data.lighting} options={LIGHTING_STYLES} onChange={v => set("lighting", v)} />
        </div>
      )}

      {error && <div style={{ fontSize: 12, color: colors.danger, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: "auto", paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
        <button type="button" onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()} style={btnStyle("ghost")}>
          {step === 0 ? "Cancel" : "← Back"}
        </button>
        {step < totalSteps - 1 ? (
          <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={btnStyle("primary")}>Next →</button>
        ) : (
          <button type="button" onClick={generatePersona} disabled={!canAdvance() || generating} style={btnStyle("primary")}>
            {generating ? "Generating..." : "✦ Generate Persona"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Collections Editor ───────────────────────────────────────────────────────
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

// ─── Model Form ───────────────────────────────────────────────────────────────
const emptyModel = (): Partial<Model> => ({
  name: "", slug: "", nationality: "", ethnicity: "", gender: "female",
  age_group: "", height: "", weight: "", specialty: "", hobbies: "",
  bio: "", thumbnail_path: "", price_usd: 0,
  is_published: false, is_featured: false, is_new: false, is_popular: false, is_coming_soon: false,
  social_media: "", measurements: "",
  lora_url: "", trigger_word: "", training_status: "untrained",
  training_run_id: "", dalle_prompt_pack: "",
});

function ModelForm({ initial, onSaved, onCancel }: { initial?: Partial<Model>; onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<Partial<Model>>(initial || emptyModel());
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"details" | "lora" | "collections">("details");
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

  const ddStyle: React.CSSProperties = {
    ...inputStyle(), appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C%2Fsvg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 36,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>
      <div style={{ display: "flex", borderBottom: `1px solid ${colors.border}`, marginBottom: 24 }}>
        {(["details", "lora", "collections"] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            padding: "10px 20px", background: "none", border: "none",
            borderBottom: `2px solid ${tab === t ? colors.accent : "transparent"}`,
            color: tab === t ? colors.accent : colors.muted,
            cursor: "pointer", fontSize: 13, fontWeight: 500, textTransform: "capitalize", transition: "all 0.15s",
          }}>{t === "lora" ? "✦ LoRA / AI" : t}</button>
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
              <select value={form.gender || "female"} onChange={e => set("gender", e.target.value)} style={ddStyle}>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <Field label="Age Group"><input value={form.age_group || ""} onChange={e => set("age_group", e.target.value)} style={inputStyle()} placeholder="e.g. 18-25" /></Field>
            <Field label="Height"><input value={form.height || ""} onChange={e => set("height", e.target.value)} style={inputStyle()} placeholder="e.g. 172cm" /></Field>
            <Field label="Weight"><input value={form.weight || ""} onChange={e => set("weight", e.target.value)} style={inputStyle()} placeholder="e.g. 54kg" /></Field>
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
              <input value={form.social_media || ""} onChange={e => set("social_media", e.target.value)} style={inputStyle()} placeholder="@handle" />
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

      {tab === "lora" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, overflowY: "auto", flex: 1 }}>
          <div style={{ padding: "14px 16px", background: "#1a1a1a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Training Status</div>
              <StatusBadge status={form.training_status || "untrained"} type="training" />
            </div>
            <select value={form.training_status || "untrained"} onChange={e => set("training_status", e.target.value)}
              style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
              {TRAINING_STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </select>
          </div>

          <Field label="Trigger Word">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input value={form.trigger_word || ""} onChange={e => set("trigger_word", e.target.value)} style={{ ...inputStyle(), flex: 1 }} placeholder="e.g. vanessa_rv" />
              {form.trigger_word && (
                <button type="button" onClick={() => copyToClipboard(form.trigger_word!)}
                  style={{ ...btnStyle("ghost"), padding: "8px 12px", fontSize: 12, flexShrink: 0, border: `1px solid ${colors.border}` }}>
                  Copy
                </button>
              )}
            </div>
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Use this word in every generation prompt to activate the LoRA</div>
          </Field>

          <Field label="LoRA URL (fal.ai safetensors)">
            <div style={{ display: "flex", gap: 8 }}>
              <input value={form.lora_url || ""} onChange={e => set("lora_url", e.target.value)}
                style={{ ...inputStyle(), flex: 1 }} placeholder="https://v3b.fal.media/files/..." />
              {form.lora_url && (
                <button type="button" onClick={() => copyToClipboard(form.lora_url!)}
                  style={{ ...btnStyle("secondary"), flexShrink: 0, fontSize: 12 }}>Copy URL</button>
              )}
            </div>
            <div style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>Paste the diffusers_lora_file URL from fal.ai → Training history → Show files</div>
          </Field>

          <Field label="Training Run ID">
            <input value={form.training_run_id || ""} onChange={e => set("training_run_id", e.target.value)}
              style={inputStyle()} placeholder="e.g. 019d208f-8e27-76c3-9f77-e27121654b4f" />
          </Field>

          {form.lora_url && form.trigger_word && (
            <div style={{ padding: "12px 16px", background: colors.accentDim, borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: colors.accent, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Quick Generate Links</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`https://fal.ai/models/fal-ai/flux-lora?lora=${encodeURIComponent(form.lora_url)}`} target="_blank" rel="noopener"
                  style={{ ...btnStyle("secondary"), fontSize: 12, textDecoration: "none" }}>Open in fal.ai ↗</a>
              </div>
            </div>
          )}

          <Field label="DALL-E Training Prompt Pack">
            <textarea
              value={form.dalle_prompt_pack || ""}
              onChange={e => set("dalle_prompt_pack", e.target.value)}
              style={{ ...inputStyle(), minHeight: 140, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
              placeholder="Paste your DALL-E 24-image training prompt here for reference…"
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <div style={{ fontSize: 11, color: colors.muted }}>Store your working DALL-E prompt for regenerating training sets</div>
              {form.dalle_prompt_pack && (
                <button type="button" onClick={() => copyToClipboard(form.dalle_prompt_pack!)}
                  style={{ ...btnStyle("ghost"), fontSize: 11, padding: "4px 10px", border: `1px solid ${colors.border}` }}>Copy Prompt</button>
              )}
            </div>
          </Field>
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
        {tab !== "collections" && (
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
        <ImageUploader bucket={BUCKETS.STYLES} folder={form.slug || "styles"} currentPath={form.thumbnail_path}
          onUploaded={path => set("thumbnail_path", path)} label="Upload Thumbnail" />
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
        <textarea value={form.description || ""} onChange={e => set("description", e.target.value)}
          style={{ ...inputStyle(), minHeight: 80, resize: "vertical" }} />
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
  const [search, setSearch] = useState("");
  const [filterNationality, setFilterNationality] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("");

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

  const handleWizardComplete = useCallback(async (name: string, json: string, specialty: string, nationality: string) => {
    try {
      const parsed = JSON.parse(json);
      const v = parsed.visual_traits || {};
      const m = parsed.measurements || {};
      const baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const slug = baseSlug + "-" + Date.now().toString(36);
      const { error } = await supabase.from("models").insert({
        name, slug, nationality, specialty,
        ethnicity: parsed.identity?.ethnicity || nationality,
        gender: (parsed.identity?.gender || "Female").toLowerCase(),
        height: m.height_cm ? `${m.height_cm}cm` : "",
        bio: Array.isArray(parsed.identity?.personality) ? parsed.identity.personality.join(", ") : "",
        measurements: JSON.stringify(m),
        hobbies: v.distinctive_features || "",
        age_group: parsed.identity?.age_group || "",
        trigger_word: parsed.trigger_word || "",
        dalle_prompt_pack: parsed.prompts?.dalle_training || "",
        training_status: "dataset_ready",
        is_published: false, is_new: true,
      });
      if (error) throw error;
      setWizarding(false);
      await load();
      showToast(`${name} added — LoRA tab ready for training details`);
    } catch (e: any) {
      showToast("Failed to save: " + (e?.message || "unknown error"), "error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => { load(); }, [load]);

  const deleteModel = async (m: Model) => {
    if (!confirm(`Delete "${m.name}"? This cannot be undone.`)) return;
    await supabase.from("model_collection_images").delete().eq("model_id", m.id);
    await supabase.from("model_collections").delete().eq("model_id", m.id);
    await supabase.from("models").delete().eq("id", m.id);
    showToast(`${m.name} deleted`);
    load();
  };

  const filteredModels = models.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.nationality || "").toLowerCase().includes(search.toLowerCase());
    const matchNat = !filterNationality || m.nationality === filterNationality;
    const matchSpec = !filterSpecialty || (m.specialty || "").includes(filterSpecialty);
    return matchSearch && matchNat && matchSpec;
  });

  if (wizarding) {
    return (
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 120px)", paddingBottom: 40 }}>
        <ModelWizard onComplete={handleWizardComplete} onCancel={() => setWizarding(false)} />
      </div>
    );
  }

  if (creating || editing) {
    return (
      <div style={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setCreating(false); setEditing(null); }}
            style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>
          Models <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({models.length})</span>
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setWizarding(true)} style={btnStyle("secondary")}>✦ AI Wizard</button>
          <button type="button" onClick={() => setCreating(true)} style={btnStyle("primary")}>+ New Model</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or nationality…"
          style={{ ...inputStyle(), flex: 1, minWidth: 160, fontSize: 12 }} />
        <select value={filterNationality} onChange={e => setFilterNationality(e.target.value)}
          style={{ ...inputStyle(), width: "auto", fontSize: 12, paddingRight: 28 }}>
          <option value="">All nationalities</option>
          {[...new Set(models.map(m => m.nationality).filter(Boolean))].sort().map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}
          style={{ ...inputStyle(), width: "auto", fontSize: 12, paddingRight: 28 }}>
          <option value="">All specialties</option>
          {[...new Set(models.map(m => m.specialty).filter(Boolean))].sort().map(s => <option key={s} value={s.slice(0, 40)}>{s.slice(0, 40)}</option>)}
        </select>
        {(search || filterNationality || filterSpecialty) && (
          <button type="button" onClick={() => { setSearch(""); setFilterNationality(""); setFilterSpecialty(""); }}
            style={{ ...btnStyle("ghost"), fontSize: 12, padding: "6px 10px" }}>✕ Clear</button>
        )}
      </div>

      {loading ? (
        <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredModels.length === 0 && (
            <div style={{ color: colors.muted, textAlign: "center", padding: 40, fontSize: 13 }}>No models match your filters.</div>
          )}
          {filteredModels.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <img
                src={publicUrl(BUCKETS.MODELS, m.thumbnail_path) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23333'/%3E%3C/svg%3E"}
                alt={m.name} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{m.name}</span>
                  {m.is_published && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(74,222,128,0.15)", color: colors.success, borderRadius: 4 }}>LIVE</span>}
                  {m.is_coming_soon && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(250,204,21,0.15)", color: "#facc15", borderRadius: 4 }}>SOON</span>}
                  {m.is_new && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(201,169,110,0.15)", color: colors.accent, borderRadius: 4 }}>NEW</span>}
                  {m.is_popular && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(239,68,68,0.15)", color: colors.danger, borderRadius: 4 }}>POPULAR</span>}
                  {m.training_status && m.training_status !== "untrained" && (
                    <StatusBadge status={m.training_status} type="training" />
                  )}
                </div>
                <div style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                  {m.nationality} · {m.specialty || "No specialty set"}
                  {m.trigger_word && <span style={{ color: colors.accent, marginLeft: 8, fontFamily: "monospace" }}>#{m.trigger_word}</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button type="button" onClick={() => {
                  const studioData = { name: m.name, age: m.age_group, height: m.height, skin_tone: "", eye_color: "", hair_base: "", build: "", nationality: m.nationality, ethnicity: m.ethnicity, signature_look: m.specialty || "" };
                  sessionStorage.setItem("studioModel", JSON.stringify(studioData));
                  window.location.href = "/admin/studio";
                }} style={{ ...btnStyle("secondary"), color: "#c9a96e", borderColor: "#c9a96e", fontSize: 12 }}>✦ Studio</button>
                <button type="button" onClick={() => setEditing(m)} style={btnStyle("secondary")}>Edit</button>
                <button type="button" onClick={() => deleteModel(m)} style={btnStyle("danger")}>Delete</button>
              </div>
            </div>
          ))}
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

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = useCallback(async () => { setLoading(true); const { data } = await supabase.from("styles").select("*").order("name"); setStyles(data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const deleteStyle = async (s: Style) => {
    if (!confirm(`Delete style "${s.name}"?`)) return;
    await supabase.from("styles").delete().eq("id", s.id);
    showToast(`${s.name} deleted`); load();
  };

  if (creating || editing) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => { setCreating(false); setEditing(null); }} style={{ background: "none", border: "none", color: colors.muted, cursor: "pointer", fontSize: 18 }}>←</button>
          <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>{editing ? `Edit: ${editing.name}` : "New Style"}</h2>
        </div>
        <StyleForm initial={editing || undefined} onSaved={() => { setCreating(false); setEditing(null); load(); showToast("Style saved"); }} onCancel={() => { setCreating(false); setEditing(null); }} />
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

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const load = useCallback(async () => { setLoading(true); const { data } = await supabase.from("hero_images").select("*").order("display_order"); setImages(data || []); setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const addImage = async (path: string) => { const maxOrder = Math.max(0, ...images.map(i => i.display_order)); await supabase.from("hero_images").insert({ path, display_order: maxOrder + 1 }); showToast("Hero image added"); load(); };
  const deleteImage = async (id: string) => { await supabase.from("hero_images").delete().eq("id", id); showToast("Image removed"); load(); };
  const moveUp = async (idx: number) => { if (idx === 0) return; const a = images[idx], b = images[idx - 1]; await supabase.from("hero_images").update({ display_order: b.display_order }).eq("id", a.id); await supabase.from("hero_images").update({ display_order: a.display_order }).eq("id", b.id); load(); };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>Hero Images <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({images.length})</span></h2>
        <ImageUploader bucket={BUCKETS.HERO} folder="hero" onUploaded={addImage} label="+ Upload Hero Image" />
      </div>
      {loading ? <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div> : (
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

// ─── Prompt Library Panel ─────────────────────────────────────────────────────
function PromptsPanel() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({ model_id: "", label: "", prompt_text: "", platform: "fal.ai", works_well: true });

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: m }] = await Promise.all([
      supabase.from("prompts").select("*").order("created_at", { ascending: false }),
      supabase.from("models").select("id, name, trigger_word").order("name"),
    ]);
    setPrompts(p || []);
    setModels(m || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.label.trim() || !form.prompt_text.trim()) return alert("Label and prompt are required");
    await supabase.from("prompts").insert({ ...form });
    setForm({ model_id: "", label: "", prompt_text: "", platform: "fal.ai", works_well: true });
    setCreating(false);
    load();
    showToast("Prompt saved");
  };

  const deletePrompt = async (id: string) => {
    await supabase.from("prompts").delete().eq("id", id);
    showToast("Prompt deleted");
    load();
  };

  const toggleWorks = async (p: Prompt) => {
    await supabase.from("prompts").update({ works_well: !p.works_well }).eq("id", p.id);
    load();
  };

  const filtered = prompts.filter(p =>
    (!filterModel || p.model_id === filterModel) &&
    (!filterPlatform || p.platform === filterPlatform)
  );

  const modelName = (id: string) => models.find(m => m.id === id)?.name || "—";

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>
          Prompt Library <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({prompts.length})</span>
        </h2>
        <button type="button" onClick={() => setCreating(!creating)} style={btnStyle("primary")}>+ Save Prompt</button>
      </div>

      {creating && (
        <div style={{ background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 13, color: colors.accent, fontWeight: 600 }}>New Prompt</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Field label="Model">
              <select value={form.model_id} onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))} style={inputStyle()}>
                <option value="">— Any model —</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Platform">
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} style={inputStyle()}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Label">
              <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} style={inputStyle()} placeholder="e.g. Studio portrait v2" />
            </Field>
          </div>
          <Field label="Prompt Text">
            <textarea value={form.prompt_text} onChange={e => setForm(f => ({ ...f, prompt_text: e.target.value }))}
              style={{ ...inputStyle(), minHeight: 80, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
              placeholder="Enter the full prompt…" />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
            <Toggle label="Works well" checked={form.works_well} onChange={v => setForm(f => ({ ...f, works_well: v }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setCreating(false)} style={btnStyle("ghost")}>Cancel</button>
              <button type="button" onClick={save} style={btnStyle("primary")}>Save Prompt</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select value={filterModel} onChange={e => setFilterModel(e.target.value)} style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
          <option value="">All models</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ ...inputStyle(), width: "auto", fontSize: 12 }}>
          <option value="">All platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterModel || filterPlatform) && (
          <button type="button" onClick={() => { setFilterModel(""); setFilterPlatform(""); }} style={{ ...btnStyle("ghost"), fontSize: 12 }}>✕ Clear</button>
        )}
      </div>

      {loading ? <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && <div style={{ color: colors.muted, textAlign: "center", padding: 40, fontSize: 13 }}>No prompts saved yet. Hit "+ Save Prompt" to start building your library.</div>}
          {filtered.map(p => (
            <div key={p.id} style={{ background: colors.surface, borderRadius: 10, border: `1px solid ${p.works_well ? colors.border : "rgba(239,68,68,0.3)"}`, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{p.label}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: colors.accentDim, color: colors.accent, borderRadius: 4 }}>{p.platform}</span>
                    {p.model_id && <span style={{ fontSize: 10, color: colors.muted }}>{modelName(p.model_id)}</span>}
                    {!p.works_well && <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(239,68,68,0.15)", color: colors.danger, borderRadius: 4 }}>NOT WORKING</span>}
                  </div>
                  <div style={{ fontSize: 12, color: colors.muted, lineHeight: 1.5, fontFamily: "monospace" }}>{p.prompt_text}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button type="button" onClick={() => copyToClipboard(p.prompt_text)} style={{ ...btnStyle("secondary"), padding: "6px 12px", fontSize: 12 }}>Copy</button>
                  <button type="button" onClick={() => toggleWorks(p)} style={{ ...btnStyle("ghost"), padding: "6px 12px", fontSize: 11, border: `1px solid ${colors.border}` }}>
                    {p.works_well ? "Mark bad" : "Mark good"}
                  </button>
                  <button type="button" onClick={() => deletePrompt(p.id)} style={{ ...btnStyle("danger"), padding: "6px 12px", fontSize: 12 }}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: colors.muted }}>{formatDate(p.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Campaigns Panel ──────────────────────────────────────────────────────────
function CampaignsPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [form, setForm] = useState({ name: "", description: "", status: "draft", model_ids: [] as string[] });

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("collections").select("*").order("created_at", { ascending: false }),
      supabase.from("models").select("id, name, thumbnail_path").order("name"),
    ]);
    setCampaigns(c || []);
    setModels(m || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name.trim()) return alert("Campaign name required");
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (editing) { await supabase.from("collections").update(payload).eq("id", editing.id); }
    else { await supabase.from("collections").insert(payload); }
    setCreating(false); setEditing(null);
    setForm({ name: "", description: "", status: "draft", model_ids: [] });
    load(); showToast("Campaign saved");
  };

  const deleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"?`)) return;
    await supabase.from("collections").delete().eq("id", id);
    showToast("Campaign deleted"); load();
  };

  const toggleModel = (id: string) => {
    setForm(f => ({
      ...f,
      model_ids: f.model_ids.includes(id) ? f.model_ids.filter(m => m !== id) : [...f.model_ids, id],
    }));
  };

  const startEdit = (c: Campaign) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "", status: c.status, model_ids: c.model_ids || [] });
    setCreating(true);
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>
          Campaigns <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({campaigns.length})</span>
        </h2>
        <button type="button" onClick={() => { setEditing(null); setForm({ name: "", description: "", status: "draft", model_ids: [] }); setCreating(!creating); }} style={btnStyle("primary")}>+ New Campaign</button>
      </div>

      {creating && (
        <div style={{ background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 20, marginBottom: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, color: colors.accent, fontWeight: 600 }}>{editing ? "Edit Campaign" : "New Campaign"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <Field label="Campaign Name">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle()} placeholder="e.g. Twist & Cascade Spring 2026" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle()}>
                {CAMPAIGN_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description / Brief">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ ...inputStyle(), minHeight: 60, resize: "vertical" }} placeholder="Campaign brief, client notes, mood direction…" />
          </Field>
          <Field label="Assign Models">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {models.map(m => (
                <button key={m.id} type="button" onClick={() => toggleModel(m.id)}
                  style={{
                    padding: "6px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
                    background: form.model_ids.includes(m.id) ? colors.accent : "#1e1e1e",
                    color: form.model_ids.includes(m.id) ? "#0d0d0d" : colors.muted,
                    border: `1px solid ${form.model_ids.includes(m.id) ? colors.accent : colors.border}`,
                    transition: "all 0.15s",
                  }}>{m.name}</button>
              ))}
            </div>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => { setCreating(false); setEditing(null); }} style={btnStyle("ghost")}>Cancel</button>
            <button type="button" onClick={save} style={btnStyle("primary")}>Save Campaign</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {campaigns.length === 0 && <div style={{ color: colors.muted, textAlign: "center", padding: 40, fontSize: 13 }}>No campaigns yet. Create one to start tracking your production pipeline.</div>}
          {campaigns.map(c => {
            const assignedModels = models.filter(m => (c.model_ids || []).includes(m.id));
            return (
              <div key={c.id} style={{ background: colors.surface, borderRadius: 10, border: `1px solid ${colors.border}`, padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{c.name}</span>
                      <StatusBadge status={c.status} type="campaign" />
                    </div>
                    {c.description && <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>{c.description}</div>}
                    {assignedModels.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {assignedModels.map(m => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#1a1a1a", borderRadius: 20, border: `1px solid ${colors.border}` }}>
                            <img src={publicUrl(BUCKETS.MODELS, m.thumbnail_path)} alt="" style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover" }} />
                            <span style={{ fontSize: 11, color: colors.muted }}>{m.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>{formatDate(c.created_at)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button type="button" onClick={() => startEdit(c)} style={btnStyle("secondary")}>Edit</button>
                    <button type="button" onClick={() => deleteCampaign(c.id, c.name)} style={btnStyle("danger")}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Client Requests Panel ────────────────────────────────────────────────────
function RequestsPanel() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: m }] = await Promise.all([
      supabase.from("client_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("models").select("id, name").order("name"),
    ]);
    setRequests(r || []);
    setModels(m || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("client_requests").update({ status }).eq("id", id);
    showToast("Status updated"); load();
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    await supabase.from("client_requests").delete().eq("id", id);
    showToast("Request deleted"); load();
  };

  const filtered = requests.filter(r => !filterStatus || r.status === filterStatus);
  const modelName = (id: string) => models.find(m => m.id === id)?.name || "—";

  const statusCounts = REQUEST_STATUSES.reduce((acc, s) => {
    acc[s] = requests.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: colors.text }}>
          Client Requests <span style={{ color: colors.muted, fontSize: 14, fontWeight: 400 }}>({requests.length})</span>
        </h2>
        {requests.filter(r => r.status === "new").length > 0 && (
          <span style={{ fontSize: 12, padding: "4px 12px", background: "rgba(239,68,68,0.15)", color: colors.danger, borderRadius: 20, fontWeight: 600 }}>
            {requests.filter(r => r.status === "new").length} new
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {REQUEST_STATUSES.map(s => (
          <button key={s} type="button" onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            style={{
              padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontFamily: "inherit",
              border: `1px solid ${filterStatus === s ? colors.accent : colors.border}`,
              background: filterStatus === s ? colors.accentDim : "transparent",
              color: filterStatus === s ? colors.accent : colors.muted,
              transition: "all 0.15s",
            }}>
            {s.replace("_", " ")} {statusCounts[s] > 0 && `(${statusCounts[s]})`}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: colors.muted, textAlign: "center", padding: 40 }}>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ color: colors.muted, textAlign: "center", padding: 40, fontSize: 13 }}>
              No requests yet. They'll appear here when clients submit quote requests from the website.
            </div>
          )}
          {filtered.map(r => (
            <div key={r.id} style={{ background: colors.surface, borderRadius: 10, border: `1px solid ${r.status === "new" ? colors.danger : colors.border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{r.client_name}</span>
                    <StatusBadge status={r.status} type="request" />
                    <span style={{ fontSize: 11, color: colors.muted }}>{r.request_type}</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.muted }}>
                    {r.client_email} · {r.model_id ? modelName(r.model_id) : "Any model"}
                    {r.budget && <span style={{ color: colors.accent, marginLeft: 8 }}>{r.budget}</span>}
                    <span style={{ marginLeft: 8 }}>{formatDate(r.created_at)}</span>
                  </div>
                </div>
                <span style={{ color: colors.muted, fontSize: 16 }}>{expanded === r.id ? "▲" : "▼"}</span>
              </div>

              {expanded === r.id && (
                <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${colors.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 14 }}>
                  {r.message && (
                    <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Message</div>
                      <div style={{ fontSize: 13, color: colors.text, lineHeight: 1.6 }}>{r.message}</div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, color: colors.muted }}>Update status:</div>
                    {REQUEST_STATUSES.map(s => (
                      <button key={s} type="button" onClick={() => updateStatus(r.id, s)}
                        style={{
                          padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                          border: `1px solid ${r.status === s ? colors.accent : colors.border}`,
                          background: r.status === s ? colors.accentDim : "transparent",
                          color: r.status === s ? colors.accent : colors.muted,
                          transition: "all 0.15s",
                        }}>{s.replace("_", " ")}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
                    <a href={`mailto:${r.client_email}?subject=Re: Your CyberChic Models request`}
                      style={{ ...btnStyle("secondary"), textDecoration: "none", fontSize: 12 }}>✉ Reply by Email</a>
                    <button type="button" onClick={() => deleteRequest(r.id)} style={{ ...btnStyle("danger"), fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
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
    setLoading(true); setError("");
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
          <button type="button" onClick={login} disabled={loading}
            style={{ ...btnStyle("primary"), width: "100%", padding: "10px", marginTop: 8, fontSize: 14 }}>
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
    { key: "prompts", label: "Prompts" },
    { key: "campaigns", label: "Campaigns" },
    { key: "requests", label: "Requests" },
    { key: "clients", label: "Clients" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.text, fontFamily: "'Georgia', serif" }}>
      <div style={{ position: "fixed", left: 0, top: 64, bottom: 0, width: 220, background: colors.surface, borderRight: `1px solid ${colors.border}`, display: "flex", flexDirection: "column", zIndex: 100 }}>
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: colors.accent, textTransform: "uppercase", marginBottom: 4 }}>CyberChic</div>
          <a href="/admin" style={{ fontSize: 15, color: colors.text, textDecoration: "none", cursor: "pointer", display: "block" }}>Admin</a>
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
          <a href="/admin/studio" style={{ display: "block", padding: "10px 12px", borderRadius: 8, color: colors.muted, fontSize: 13, textDecoration: "none", fontFamily: "inherit", marginBottom: 2 }}>✦ Frame Studio</a>
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: 11, color: colors.muted, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          <button type="button" onClick={() => supabase.auth.signOut()} style={{ ...btnStyle("ghost"), width: "100%", textAlign: "left", padding: "6px 0", fontSize: 12 }}>Sign out</button>
        </div>
      </div>

      <div style={{ marginLeft: 220, padding: "40px", paddingTop: 80, maxWidth: 960 }}>
        {activeTab === "models" && <ModelsPanel />}
        {activeTab === "styles" && <StylesPanel />}
        {activeTab === "hero" && <HeroPanel />}
        {activeTab === "prompts" && <PromptsPanel />}
        {activeTab === "campaigns" && <CampaignsPanel />}
        {activeTab === "requests" && <RequestsPanel />}
        {activeTab === "clients" && <ClientsPanel />}
      </div>
    </div>
  );
}
