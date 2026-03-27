// ============================================================
// AffogatoSessionGenerator.tsx
// Drop this component into your Admin.tsx wizard output section
// It reads the generated persona JSON and adds:
// 1. Affogato FaceLock base prompt field
// 2. "Generate Full Session" button (all 24 shots)
// 3. "Download .md" button
// ============================================================

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────
interface PersonaJSON {
  model_name: string;
  identity?: {
    nationality?: string;
    ethnicity?: string;
    age_group?: string;
  };
  visual_traits?: {
    skin_tone?: string;
    eye_color?: string;
    hair_color?: string;
    hair_texture?: string;
    face_shape?: string;
    distinctive_features?: string;
  };
  prompts?: {
    negative?: string;
    affogato_facelock?: string;
  };
}

interface AffogatoSessionGeneratorProps {
  persona: PersonaJSON; // pass your generated persona object here
}

// ── Shot list ────────────────────────────────────────────────
function buildShotList(persona: PersonaJSON): { id: number; label: string; prompt: string }[] {
  const name = persona.model_name || "MODEL";
  const triggerName = name.split(" ")[0]; // first name only for ^caret^ syntax

  const traits = [
    persona.identity?.ethnicity || persona.identity?.nationality || "",
    persona.visual_traits?.skin_tone ? `${persona.visual_traits.skin_tone} skin` : "",
    persona.visual_traits?.eye_color ? `${persona.visual_traits.eye_color} eyes` : "",
    persona.visual_traits?.hair_color && persona.visual_traits?.hair_texture
      ? `${persona.visual_traits.hair_texture} ${persona.visual_traits.hair_color} hair`
      : "",
    persona.visual_traits?.face_shape ? `${persona.visual_traits.face_shape} face` : "",
    persona.visual_traits?.distinctive_features || "",
  ]
    .filter(Boolean)
    .join(", ");

  const base = `^${triggerName}^ ${traits}`;
  const suffix = `photorealistic, 85mm portrait lens, sharp focus on eyes <lora:better_hands:0.8>`;
  const neg = persona.prompts?.negative || "deformed, ugly, blurry, low quality, watermark, text, logo, different person";

  const shots = [
    {
      label: "SHOT 01 — Front Facing Neutral (ANCHOR)",
      shot: "front-facing headshot, neutral expression, eyes directly at camera",
      light: "studio soft lighting, flat even illumination",
      bg: "neutral grey seamless studio backdrop",
    },
    {
      label: "SHOT 02 — Front Facing Soft Smile",
      shot: "front-facing headshot, soft natural smile, eyes directly at camera",
      light: "studio soft lighting",
      bg: "neutral grey background",
    },
    {
      label: "SHOT 03 — 3/4 Turn Right",
      shot: "face rotated 45 degrees so nose points toward right edge of frame, right cheek and ear visible, left cheek partially hidden, eyes looking back at camera",
      light: "studio soft lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 04 — 3/4 Turn Left",
      shot: "face rotated 45 degrees so nose points toward left edge of frame, left cheek and ear visible, right cheek partially hidden, eyes looking back at camera",
      light: "studio soft lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 05 — Profile Right",
      shot: "full side profile, nose pointing right edge of frame, only right side of face visible, both eyes NOT visible, one eye only showing, jawline in full profile silhouette",
      light: "studio lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 06 — Profile Left",
      shot: "full side profile, nose pointing left edge of frame, only left side of face visible, both eyes NOT visible, one eye only showing, jawline in full profile silhouette",
      light: "studio lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 07 — Chin Up",
      shot: "face tilted upward 20 degrees, eyes looking downward toward camera, camera positioned slightly above subject",
      light: "dramatic side lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 08 — Chin Down",
      shot: "face tilted downward 15 degrees, eyes looking upward at camera, camera positioned slightly below subject",
      light: "studio soft lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 09 — Eyes Left",
      shot: "head facing forward, eyes shifted to subject's left, NOT looking at camera, contemplative expression",
      light: "dramatic side lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 10 — Eyes Right",
      shot: "head facing forward, eyes shifted to subject's right, NOT looking at camera, neutral expression",
      light: "natural daylight",
      bg: "grey background",
    },
    {
      label: "SHOT 11 — Eyes Down",
      shot: "head facing forward, eyes cast downward toward chest level, thoughtful introspective expression",
      light: "soft natural indoor light",
      bg: "warm neutral background",
    },
    {
      label: "SHOT 12 — Eyes Up",
      shot: "head facing forward, eyes looking upward above frame, open serene expression",
      light: "golden hour lighting",
      bg: "soft background",
    },
    {
      label: "SHOT 13 — Bust Front",
      shot: "bust shot shoulders to crown, front-facing, neutral expression, eyes at camera, simple fitted top",
      light: "studio soft lighting",
      bg: "grey background",
    },
    {
      label: "SHOT 14 — Bust 3/4 Right Eyes Off",
      shot: "bust shot, face rotated toward right edge of frame, eyes looking off into space to subject's left, NOT at camera, simple fitted top",
      light: "dramatic side lighting",
      bg: "off-white background",
    },
    {
      label: "SHOT 15 — Bust 3/4 Left Eyes On",
      shot: "bust shot, face rotated toward left edge of frame, eyes directly at camera, simple fitted top",
      light: "natural soft indoor light",
      bg: "warm neutral background",
    },
    {
      label: "SHOT 16 — Candid Bust",
      shot: "candid bust shot, slight natural head tilt, relaxed expression, eyes at camera, minimal makeup, simple top",
      light: "ambient natural window light",
      bg: "soft indoor background",
    },
    {
      label: "SHOT 17 — Full Body Front",
      shot: "full body, front-facing, standing neutral, hands relaxed at sides, simple fitted jeans and white top",
      light: "studio soft lighting",
      bg: "white seamless background",
    },
    {
      label: "SHOT 18 — Full Body 3/4 Right",
      shot: "full body, face and body angled toward right edge of frame, weight shifted onto one leg, natural relaxed stance, simple outfit",
      light: "studio lighting",
      bg: "white background",
    },
    {
      label: "SHOT 19 — Full Body 3/4 Left",
      shot: "full body, face and body angled toward left edge of frame, slight implied movement, one foot stepping forward, simple outfit",
      light: "studio lighting",
      bg: "white background",
    },
    {
      label: "SHOT 20 — Walking Toward Camera",
      shot: "full body, walking directly toward camera, confident stride, one foot forward, natural arm movement, simple outfit",
      light: "studio lighting",
      bg: "white background",
    },
    {
      label: "SHOT 21 — Back Turned Head Right",
      shot: "full body, body facing away from camera, head turned sharply so chin is near right shoulder, right eye visible looking back at camera, direct eye contact, simple outfit",
      light: "studio lighting",
      bg: "white background",
    },
    {
      label: "SHOT 22 — Seated Relaxed",
      shot: "full body, seated casually on simple stool, relaxed posture, front-facing, eyes at camera, simple outfit",
      light: "soft studio lighting",
      bg: "neutral background",
    },
    {
      label: "SHOT 23 — Genuine Laugh",
      shot: "tight face crop, genuine laugh, eyes crinkled with joy, mouth open naturally, no forced smile",
      light: "soft natural light",
      bg: "",
    },
    {
      label: "SHOT 24 — Serious Intense",
      shot: "tight face crop, serious intense expression, lips slightly parted, direct unwavering eye contact with camera",
      light: "dramatic side lighting, one side in slight shadow",
      bg: "",
    },
  ];

  return shots.map((s, i) => ({
    id: i + 1,
    label: s.label,
    prompt: [
      `${base},`,
      `${s.shot},`,
      s.light + (s.bg ? `, ${s.bg},` : ","),
      suffix,
    ].join("\n"),
  }));
}

// ── Markdown builder ─────────────────────────────────────────
function buildMarkdown(persona: PersonaJSON, shots: ReturnType<typeof buildShotList>): string {
  const name = persona.model_name || "MODEL";
  const triggerName = name.split(" ")[0];
  const date = new Date().toISOString().split("T")[0];
  const basePrompt = persona.prompts?.affogato_facelock || `^${triggerName}^ [identity traits], [shot], [lighting], photorealistic, 85mm lens <lora:better_hands:0.8>`;
  const neg = persona.prompts?.negative || "deformed, ugly, blurry, low quality, watermark, text, logo, different person";

  const lines = [
    `# ${name} — Affogato FaceLock Training Session`,
    `**Date:** ${date}`,
    `**Trigger word:** ^${triggerName}^`,
    `**Total shots:** 24`,
    ``,
    `---`,
    ``,
    `## Base FaceLock Prompt`,
    `\`\`\``,
    basePrompt,
    `\`\`\``,
    ``,
    `## Negative Prompt (apply to all shots)`,
    `\`\`\``,
    neg,
    `\`\`\``,
    ``,
    `---`,
    ``,
    `## Shot-by-Shot Prompts`,
    `> Paste each prompt into Affogato sequentially. Generate 2 variants per shot, pick the best.`,
    `> Discard any image where identity anchor features drift.`,
    ``,
    ...shots.flatMap((s) => [
      `### ${s.label}`,
      `\`\`\``,
      s.prompt,
      `\`\`\``,
      ``,
      `- [ ] Generated`,
      `- [ ] Approved`,
      ``,
      `---`,
      ``,
    ]),
    `## Curation Checklist`,
    `- [ ] 24 approved images downloaded`,
    `- [ ] No repeated angles`,
    `- [ ] Distinctive anchor features consistent across all shots`,
    `- [ ] No skin tone drift`,
    `- [ ] Ready to upload to Fal.ai LoRA trainer`,
  ];

  return lines.join("\n");
}

// ── Component ────────────────────────────────────────────────
export function AffogatoSessionGenerator({ persona }: AffogatoSessionGeneratorProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const shots = buildShotList(persona);
  const triggerName = (persona.model_name || "MODEL").split(" ")[0];

  // Build base prompt for display in the JSON prompts field
  const traits = [
    persona.identity?.ethnicity || persona.identity?.nationality || "",
    persona.visual_traits?.skin_tone ? `${persona.visual_traits.skin_tone} skin` : "",
    persona.visual_traits?.eye_color ? `${persona.visual_traits.eye_color} eyes` : "",
    persona.visual_traits?.hair_color && persona.visual_traits?.hair_texture
      ? `${persona.visual_traits.hair_texture} ${persona.visual_traits.hair_color} hair`
      : "",
    persona.visual_traits?.face_shape ? `${persona.visual_traits.face_shape} face` : "",
    persona.visual_traits?.distinctive_features || "",
  ]
    .filter(Boolean)
    .join(", ");

  const baseFacelockPrompt = `^${triggerName}^ ${traits}, [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>`;

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleDownload = () => {
    const md = buildMarkdown(persona, shots);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(persona.model_name || "model").replace(/\s+/g, "_")}_affogato_session.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6 border border-purple-500/30 rounded-xl bg-gray-900/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-purple-900/20 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-purple-300 font-semibold text-sm tracking-wider uppercase">
              Affogato FaceLock Session
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              24-shot training dataset generator for {persona.model_name}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              ⬇ Download .md
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
            >
              {expanded ? "▲ Collapse" : "▼ Full Session"}
            </button>
          </div>
        </div>
      </div>

      {/* Base prompt */}
      <div className="px-5 py-4 border-b border-gray-800">
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Base FaceLock Prompt</p>
        <div className="relative">
          <pre className="text-xs text-green-300 bg-black/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
            {baseFacelockPrompt}
          </pre>
          <button
            onClick={() => handleCopy(baseFacelockPrompt, 0)}
            className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            {copied === 0 ? "✓" : "Copy"}
          </button>
        </div>
      </div>

      {/* Shot list */}
      {expanded && (
        <div className="px-5 py-4 space-y-4 max-h-[600px] overflow-y-auto">
          <p className="text-xs text-gray-500">
            Generate 2 variants per shot in Affogato. Pick the best. Check off as you go.
          </p>
          {shots.map((shot) => (
            <div key={shot.id} className="border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-800/50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">{shot.label}</span>
                <button
                  onClick={() => handleCopy(shot.prompt, shot.id)}
                  className="text-xs px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                >
                  {copied === shot.id ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre className="text-xs text-green-300/80 bg-black/30 p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {shot.prompt}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-900/30 border-t border-gray-800">
        <p className="text-xs text-gray-600">
          Negative prompt: {persona.prompts?.negative || "deformed, ugly, blurry, low quality, watermark, text, logo, different person"}
        </p>
      </div>
    </div>
  );
}

// ── How to integrate into Admin.tsx ─────────────────────────
//
// 1. Import at top of Admin.tsx:
//    import { AffogatoSessionGenerator } from "./AffogatoSessionGenerator";
//    (adjust path as needed)
//
// 2. Add affogato_facelock to your persona JSON generation prompt
//    in api/generate-persona.ts — add this field to the prompts object:
//
//    "affogato_facelock": "^[first_name]^ [ethnicity], [skin_tone] skin, [eye_color] eyes, [hair_texture] [hair_color] hair, [face_shape] face, [distinctive_features], [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>"
//
// 3. Render the component after your existing prompt output:
//    {generatedPersona && (
//      <AffogatoSessionGenerator persona={generatedPersona} />
//    )}
//
// That's it. The component is self-contained.
