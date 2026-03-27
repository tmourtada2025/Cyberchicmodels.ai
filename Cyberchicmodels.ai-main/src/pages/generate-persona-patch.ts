// ============================================================
// PATCH: generate-persona.ts
// Add affogato_facelock to your existing system prompt JSON schema
// Find your system prompt string and add this field to the
// "prompts" object instructions:
// ============================================================

// FIND this section in your existing system prompt (approximate):
// "prompts": {
//   "dalle_training": "...",
//   "fal_inference": "...",
//   "kling": "...",
//   "negative": "..."
// }

// ADD this field to the prompts object in the schema description:

const AFFOGATO_FIELD_INSTRUCTION = `
"affogato_facelock": "^[model_first_name]^ [ethnicity] woman, [skin_tone] skin, [eye_color] [eye_shape if distinctive] eyes, [hair_texture] [hair_color] hair, [face_shape] face, [distinctive_features if any], [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>"

Rules for affogato_facelock:
- Wrap the model's first name in carets: ^Name^
- List physical traits densely, comma-separated, NO adjectives beyond what's in the visual_traits
- End with the literal placeholder text [SHOT DESCRIPTION] and [LIGHTING] — do NOT fill these in
- Always end with: photorealistic, 85mm portrait lens <lora:better_hands:0.8>
- Keep under 200 characters before the placeholders
`;

// ── Full example output for Akira ────────────────────────────
const EXAMPLE_AFFOGATO = `^Akira^ Yamato Japanese woman, fair golden porcelain skin, dark brown monolid eyes, straight black hair, oval face, symmetrical refined features, [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>`;

// ── Full example output for Siobhan ─────────────────────────
const EXAMPLE_SIOBHAN = `^Siobhan^ Irish woman, fair freckled skin, green eyes, straight auburn hair, oval face, prominent freckles across nose and cheeks, [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>`;

// ── Full example output for Elara ────────────────────────────
const EXAMPLE_ELARA = `^Elara^ Mediterranean woman, olive warm skin, dark brown eyes, wavy dark brown hair, oval face, small mole above upper lip right side, [SHOT DESCRIPTION], [LIGHTING], photorealistic, 85mm portrait lens <lora:better_hands:0.8>`;

export { AFFOGATO_FIELD_INSTRUCTION, EXAMPLE_AFFOGATO, EXAMPLE_SIOBHAN, EXAMPLE_ELARA };

// ============================================================
// HOW TO INTEGRATE
// ============================================================
//
// In your generate-persona.ts, find the system prompt string.
// It likely looks something like:
//
//   const systemPrompt = `You are an expert AI model persona creator...
//   Return a JSON object with this structure:
//   {
//     "model_name": "...",
//     "identity": {...},
//     "visual_traits": {...},
//     "prompts": {
//       "dalle_training": "...",
//       "fal_inference": "...",
//       "kling": "...",
//       "negative": "..."
//     }
//   }`
//
// ADD "affogato_facelock" to the prompts object description
// with the instruction from AFFOGATO_FIELD_INSTRUCTION above.
//
// The AffogatoSessionGenerator component will also auto-build
// the base prompt from the persona JSON fields directly,
// so even if the AI generates a slightly different format,
// the component corrects it.
