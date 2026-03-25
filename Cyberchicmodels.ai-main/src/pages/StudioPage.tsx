import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ModelProfile {
  name?: string;
  age?: number | string;
  height?: string;
  skin_tone?: string;
  eye_color?: string;
  hair_base?: string;
  build?: string;
  nationality?: string;
  ethnicity?: string;
  signature_look?: string;
  [key: string]: string | number | undefined;
}

interface StudioOutput {
  image_prompt: string;
  storyboard: { scene: number; description: string }[];
  video_prompt: string;
  voice: { recommended: string; tone: string; sample_line: string };
  music: { suno_prompt: string; tags: string[] };
}

// ── Constants ────────────────────────────────────────────────────────────────

const POSES = [
  "Standing, neutral", "Standing, power stance", "Seated, editorial",
  "Seated, casual", "Lounging", "Walking, runway", "Walking, candid street",
  "In motion, dynamic", "Swimming", "Reclining",
  "Close-up, upper body", "Full silhouette",
];

const STYLES = [
  "Luxury / haute couture", "Streetwear", "Editorial / avant-garde",
  "Minimalist / clean", "Bohemian", "Athleisure", "Old money",
  "Dark romance", "Resort / vacation", "Corporate power",
  "Y2K revival", "Afrofuturism",
];

const HAIR_STYLES = [
  "Sleek straight, down", "Loose waves", "Tight curls, natural",
  "High bun, polished", "Low bun, textured", "Braids, elaborate",
  "Ponytail, sleek", "Bob, sharp cut", "Pixie cut",
  "Windswept, undone", "Updo, sculptural",
];

const MAKEUPS = [
  "No-makeup makeup", "Dewy, luminous skin", "Classic red lip",
  "Smoky eye, dramatic", "Bold graphic liner", "Glossy lip, minimal",
  "Monochromatic earth tones", "High-pigment editorial",
  "Bronzed, sun-kissed", "Glass skin, K-beauty", "Avant-garde, artistic",
];

const ACCESSORIES = [
  { label: "Handbag", value: "designer handbag" },
  { label: "Shoes", value: "statement shoes" },
  { label: "Jewelry", value: "fine jewelry" },
  { label: "Watch", value: "luxury watch" },
  { label: "Sunglasses", value: "sunglasses" },
  { label: "Belt", value: "belt" },
  { label: "Scarf", value: "silk scarf" },
  { label: "Hat", value: "hat" },
  { label: "Gloves", value: "gloves" },
];

const PLATFORMS = [
  { label: "Kling", value: "Kling AI" },
  { label: "Luma", value: "Luma Dream Machine" },
  { label: "Runway", value: "Runway ML Gen-3 Alpha" },
];

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  "Kling AI": "Format for Kling AI: open with subject + motion verb, add camera motion (push in, pan, slow orbit), specify duration (5s or 10s), close with cinematic mood. Kling responds best to concrete physical action verbs.",
  "Luma Dream Machine": "Format for Luma Dream Machine: lead with camera movement (slow dolly forward, gentle orbit, tracking shot), then describe subject, environment, and lighting quality. Luma excels at smooth continuous motion.",
  "Runway ML Gen-3 Alpha": "Format for Runway Gen-3 Alpha: structure as [camera movement]: [scene description]. Specify lens (85mm portrait, 24mm wide), lighting quality, motion intensity. Use cinematic and technical camera language.",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(
  model: ModelProfile,
  pose: string,
  style: string,
  hair: string,
  makeup: string,
  accessories: string[],
  platform: string
): string {
  const modelDesc = [
    model.name && `Model name: ${model.name}`,
    model.age && `Age: ${model.age}`,
    model.height && `Height: ${model.height}`,
    model.skin_tone && `Skin tone: ${model.skin_tone}`,
    model.eye_color && `Eye color: ${model.eye_color}`,
    model.hair_base && `Natural hair: ${model.hair_base}`,
    model.build && `Build: ${model.build}`,
    model.nationality && `Nationality: ${model.nationality}`,
    model.ethnicity && `Ethnicity: ${model.ethnicity}`,
    model.signature_look && `Signature look: ${model.signature_look}`,
  ]
    .filter(Boolean)
    .join("\n") || "No model profile — generate based on scene configuration only.";

  return `You are a senior fashion creative director generating production-ready prompts for AI creative tools.

MODEL PROFILE:
${modelDesc}

SHOOT CONFIGURATION:
- Pose: ${pose}
- Style direction: ${style}
- Hair: ${hair || "natural, as per model profile"}
- Makeup: ${makeup || "natural, as per model profile"}
- Accessories: ${accessories.length ? accessories.join(", ") : "minimal"}

VIDEO PLATFORM: ${platform}
${PLATFORM_INSTRUCTIONS[platform] || ""}

Return ONLY valid JSON. No markdown, no backticks, no explanation outside the JSON.

{
  "image_prompt": "Detailed DALL-E 3 / Midjourney prompt. Include: model physical description, pose, garment style, accessories, hair, makeup, background, lighting (e.g. golden hour, rim light), camera angle, lens (e.g. 85mm f/1.4), mood, color palette, aspect ratio. 80-120 words.",
  "storyboard": [
    {"scene": 1, "description": "Opening shot — atmosphere and location. 2 sentences."},
    {"scene": 2, "description": "Model reveal — full look at outfit and pose. 2 sentences."},
    {"scene": 3, "description": "Detail close-up — accessories, fabric, texture. 2 sentences."},
    {"scene": 4, "description": "Movement sequence — model in motion. 2 sentences."},
    {"scene": 5, "description": "Emotive close-up — face, expression, makeup. 2 sentences."},
    {"scene": 6, "description": "Closing hero shot — final iconic frame. 2 sentences."}
  ],
  "video_prompt": "Motion prompt for ${platform}. Follow the format instructions above. 60-90 words. Do not mention any platform or tool name inside the prompt.",
  "voice": {
    "recommended": "Voice character: tone, register, texture, accent if relevant.",
    "tone": "Narrative delivery direction.",
    "sample_line": "One polished narration line for the film opening or closing."
  },
  "music": {
    "suno_prompt": "Complete Suno.ai prompt: genre, sub-genre, BPM, key instruments, vocal style, mood, era reference, production style. 40-60 words.",
    "tags": ["genre", "mood", "instrument", "era", "energy"]
  }
}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [model, setModel] = useState<ModelProfile | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [jsonPasteOpen, setJsonPasteOpen] = useState(false);
  const [jsonPasteText, setJsonPasteText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const [pose, setPose] = useState("");
  const [style, setStyle] = useState("");
  const [hair, setHair] = useState("");
  const [makeup, setMakeup] = useState("");
  const [accessories, setAccessories] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState("Kling AI");

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<StudioOutput | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function loadModelJSON(text: string) {
    try {
      const parsed = JSON.parse(text);
      setModel(parsed);
      setJsonError("");
      return true;
    } catch {
      setJsonError("Invalid JSON — check formatting");
      return false;
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadModelJSON(ev.target?.result as string);
    reader.readAsText(file);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRefImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function toggleAccessory(val: string) {
    setAccessories((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  function handleSave() {
    if (!output) return;
    const session = {
      model: model || {},
      config: { pose, style, hair, makeup, accessories: [...accessories], platform },
      output,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studio-${(model?.name || 'session').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGenerate() {
    if (!pose || !style) {
      setError("Please select a Pose and Style direction.");
      return;
    }
    setError("");
    setLoading(true);
    setOutput(null);

    const prompt = buildPrompt(
      model || {},
      pose, style, hair, makeup,
      [...accessories], platform
    );

    try {
      const res = await fetch("/api/generate-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const clean = data.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed: StudioOutput = JSON.parse(clean);
      setOutput(parsed);
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const modelInitials = model?.name
    ? model.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans">

      {/* Header */}
      <div className="flex items-center justify-between px-6 h-14 bg-[#111] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <div>
            <div className="text-sm tracking-widest text-white">FRAME STUDIO</div>
            <div className="text-[10px] tracking-widest text-gray-500 uppercase">fashion creative dashboard</div>
          </div>
        </div>
        {model && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#222] border border-[#333]">
            <div className="w-7 h-7 rounded-full bg-[#333] overflow-hidden flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
              {refImage ? <img src={refImage} className="w-full h-full object-cover" alt="" /> : modelInitials}
            </div>
            <div>
              <div className="text-xs font-medium">{model.name || "Model"}</div>
              <div className="text-[10px] text-gray-500">
                {[model.nationality, model.age ? `${model.age}y` : null].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload bar */}
      <div className="flex items-center gap-3 flex-wrap px-6 py-2 bg-[#161616] border-b border-[#2a2a2a]">
        <a href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#333] bg-[#1f1f1f] text-xs text-gray-400 hover:text-amber-400 hover:border-amber-500/50 transition-colors no-underline">
          ← Admin
        </a>
        <div className="w-px h-4 bg-[#333]" />
        <label className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#333] bg-[#1f1f1f] text-xs text-gray-300 cursor-pointer hover:border-amber-500/50 transition-colors">
          ⊕ Model JSON
          <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
        </label>
        <button
          onClick={() => setJsonPasteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-dashed border-[#333] bg-[#1f1f1f] text-xs text-gray-300 cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          ✎ Paste JSON
        </button>
        <label className="flex items-center gap-2 px-3 py-1.5 rounded border border-[#333] bg-[#1f1f1f] text-xs text-gray-300 cursor-pointer hover:border-amber-500/50 transition-colors">
          ⊕ Reference image
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
        {model && <span className="text-xs text-green-400">✓ {model.name || "Model"} loaded</span>}
        {refImage && <span className="text-xs text-green-400">✓ Image loaded</span>}
        {jsonError && <span className="text-xs text-red-400">{jsonError}</span>}
        {output && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/10 text-xs text-amber-300 cursor-pointer hover:border-amber-500 transition-colors ml-auto"
          >
            ↓ Save session
          </button>
        )}
      </div>

      {/* Layout */}
      <div className="flex" style={{ minHeight: "calc(100vh - 96px)" }}>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-[#2a2a2a] bg-[#111] p-4 flex flex-col gap-4 overflow-y-auto">

          <div>
            <div className="text-[9px] tracking-widest text-gray-600 uppercase mb-2">Scene</div>
            <div className="text-[11px] text-gray-400 mb-1">Pose</div>
            <select
              value={pose} onChange={(e) => setPose(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">— select —</option>
              {POSES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <div className="text-[11px] text-gray-400 mb-1 mt-2">Style direction</div>
            <select
              value={style} onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">— select —</option>
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="h-px bg-[#2a2a2a]" />

          <div>
            <div className="text-[9px] tracking-widest text-gray-600 uppercase mb-2">Accessories</div>
            <div className="flex flex-wrap gap-1.5">
              {ACCESSORIES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => toggleAccessory(a.value)}
                  className={`px-2 py-1 rounded-full text-[11px] border transition-all ${
                    accessories.has(a.value)
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                      : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#444]"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#2a2a2a]" />

          <div>
            <div className="text-[9px] tracking-widest text-gray-600 uppercase mb-2">Appearance</div>
            <div className="text-[11px] text-gray-400 mb-1">Hair style</div>
            <select
              value={hair} onChange={(e) => setHair(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">— select —</option>
              {HAIR_STYLES.map((h) => <option key={h}>{h}</option>)}
            </select>
            <div className="text-[11px] text-gray-400 mb-1 mt-2">Make-up</div>
            <select
              value={makeup} onChange={(e) => setMakeup(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="">— select —</option>
              {MAKEUPS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div className="h-px bg-[#2a2a2a]" />

          <div>
            <div className="text-[9px] tracking-widest text-gray-600 uppercase mb-2">Video platform</div>
            <div className="flex gap-1.5">
              {PLATFORMS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`flex-1 py-1.5 rounded text-[11px] border transition-all ${
                    platform === p.value
                      ? "bg-blue-500/20 border-blue-500/60 text-blue-300 font-medium"
                      : "bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:border-[#444]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-xs text-red-400 bg-red-400/10 rounded p-2">{error}</div>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-[#2a2a2a] disabled:text-gray-600 text-white text-sm font-medium transition-colors mt-auto"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Generating…
              </span>
            ) : "Generate all outputs"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 bg-[#161616] overflow-y-auto flex flex-col gap-4">

          {/* Model card */}
          {model && (
            <OutputCard badge="MODEL" badgeColor="gray" title={model.name || "Profile"}>
              <div className="grid grid-cols-2 gap-1.5">
                {(["name","age","height","skin_tone","eye_color","hair_base","build","nationality","ethnicity","signature_look"] as const)
                  .filter((k) => model[k])
                  .map((k) => (
                    <div key={k} className="px-2 py-1 bg-[#1a1a1a] rounded border border-[#2a2a2a] text-[11px] text-gray-400">
                      <span className="text-white font-medium capitalize">{k.replace(/_/g," ")}:</span> {String(model[k])}
                    </div>
                  ))}
              </div>
            </OutputCard>
          )}

          {/* Empty state */}
          {!model && !loading && !output && (
            <div className="flex flex-col items-center justify-center h-80 text-gray-600 gap-3">
              <div className="w-14 h-14 rounded-full border-2 border-[#2a2a2a] flex items-center justify-center text-2xl">◎</div>
              <div className="text-sm">Load a model JSON or select a pose to begin</div>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && ["Image prompt","Storyboard","Video prompt","Voice","Music"].map((l) => (
            <div key={l} className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 flex items-center gap-3">
              <div className="w-3.5 h-3.5 border-2 border-[#333] border-t-amber-500 rounded-full animate-spin flex-shrink-0" />
              <span className="text-xs text-gray-500">Generating {l.toLowerCase()}…</span>
            </div>
          ))}

          {/* Outputs */}
          {output && <>
            <OutputCard badge="IMAGE" badgeColor="amber" title="Generation prompt — DALL-E 3 / Midjourney"
              onCopy={() => copyText(output.image_prompt, "img")} copied={copied === "img"}>
              <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-mono bg-[#111] p-3 rounded border border-[#2a2a2a] leading-relaxed">{output.image_prompt}</pre>
            </OutputCard>

            <OutputCard badge="STORYBOARD" badgeColor="green" title="6-scene short film"
              onCopy={() => copyText(output.storyboard.map(s => `Scene ${s.scene}: ${s.description}`).join("\n\n"), "sb")} copied={copied === "sb"} copyLabel="Copy all">
              <div className="grid grid-cols-3 gap-2">
                {output.storyboard.map((s) => (
                  <div key={s.scene} className="bg-[#111] border border-[#2a2a2a] rounded p-2.5">
                    <div className="text-[9px] tracking-widest text-gray-600 uppercase mb-1">Scene {s.scene}</div>
                    <div className="text-[11px] text-gray-300 leading-relaxed">{s.description}</div>
                  </div>
                ))}
              </div>
            </OutputCard>

            <OutputCard badge="VIDEO" badgeColor="blue" title={`${platform} — motion prompt`}
              onCopy={() => copyText(output.video_prompt, "vid")} copied={copied === "vid"}>
              <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-mono bg-[#111] p-3 rounded border border-[#2a2a2a] leading-relaxed">{output.video_prompt}</pre>
            </OutputCard>

            <OutputCard badge="VOICE" badgeColor="pink" title="Recommended voice & narration"
              onCopy={() => copyText(output.voice.sample_line, "vo")} copied={copied === "vo"} copyLabel="Copy line">
              <div className="flex gap-2 flex-wrap mb-3">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-[11px] text-pink-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />{output.voice.recommended}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-[11px] text-green-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />{output.voice.tone}
                </span>
              </div>
              <div className="text-sm italic text-gray-300 bg-[#111] p-3 rounded border border-[#2a2a2a] leading-relaxed">
                "{output.voice.sample_line}"
              </div>
            </OutputCard>

            <OutputCard badge="MUSIC" badgeColor="amber" title="Suno.ai generation prompt"
              onCopy={() => copyText(output.music.suno_prompt, "mu")} copied={copied === "mu"}>
              <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-mono bg-[#111] p-3 rounded border border-[#2a2a2a] leading-relaxed mb-3">{output.music.suno_prompt}</pre>
              <div className="flex flex-wrap gap-1.5">
                {output.music.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">{t}</span>
                ))}
              </div>
            </OutputCard>
          </>}
        </div>
      </div>

      {/* Paste JSON Modal */}
      {jsonPasteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 w-[500px] max-w-[95vw] flex flex-col gap-4">
            <div className="text-sm font-medium">Paste model JSON</div>
            <div className="text-xs text-gray-400 leading-relaxed">Paste your model profile JSON below. All fields optional:</div>
            <pre className="text-[10px] text-gray-500 bg-[#111] p-3 rounded border border-[#2a2a2a] leading-relaxed">{`{
  "name": "Aisha Ndiaye",
  "age": 26,
  "height": "5'10\\"",
  "skin_tone": "deep ebony",
  "eye_color": "dark brown",
  "hair_base": "natural 4C coils",
  "build": "athletic, lean",
  "nationality": "Senegalese-French",
  "signature_look": "high cheekbones, strong jawline"
}`}</pre>
            <textarea
              value={jsonPasteText}
              onChange={(e) => setJsonPasteText(e.target.value)}
              placeholder='{ "name": "...", "skin_tone": "...", ... }'
              className="w-full h-36 bg-[#111] border border-[#2a2a2a] rounded p-3 text-xs text-white font-mono resize-y focus:outline-none focus:border-amber-500/50"
            />
            {jsonError && <div className="text-xs text-red-400">{jsonError}</div>}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setJsonPasteOpen(false); setJsonError(""); }}
                className="px-4 py-2 text-xs rounded border border-[#333] text-gray-400 hover:bg-[#222]">
                Cancel
              </button>
              <button onClick={() => {
                if (loadModelJSON(jsonPasteText)) {
                  setJsonPasteOpen(false);
                  setJsonPasteText("");
                }
              }} className="px-4 py-2 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white">
                Load model
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── OutputCard ───────────────────────────────────────────────────────────────

type BadgeColor = "amber" | "green" | "blue" | "pink" | "gray";

const BADGE_COLORS: Record<BadgeColor, string> = {
  amber: "bg-amber-500/20 text-amber-300",
  green: "bg-green-500/20 text-green-300",
  blue:  "bg-blue-500/20 text-blue-300",
  pink:  "bg-pink-500/20 text-pink-300",
  gray:  "bg-gray-500/20 text-gray-300",
};

function OutputCard({
  badge, badgeColor, title, children, onCopy, copied, copyLabel = "Copy"
}: {
  badge: string;
  badgeColor: BadgeColor;
  title: string;
  children: React.ReactNode;
  onCopy?: () => void;
  copied?: boolean;
  copyLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-widest uppercase ${BADGE_COLORS[badgeColor]}`}>
            {badge}
          </span>
          <span className="text-xs text-white">{title}</span>
        </div>
        {onCopy && (
          <button
            onClick={onCopy}
            className={`text-[11px] px-3 py-1 rounded border transition-all ${
              copied ? "border-green-500/60 text-green-400" : "border-[#333] text-gray-400 hover:border-[#555]"
            }`}
          >
            {copied ? "Copied ✓" : copyLabel}
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
