# CyberChic Generation Engine — V1 Design & Build Brief

**Owner:** Toufic Mourtada · +961 3 422 498
**Repo destination:** `rebuild/docs/engine-build-brief.md`
**Status:** design-to-approve. No code, migration, or DB write authorized by this document. CC implements chunk-by-chunk, human-gated, after Toufic approves this brief.

---

## 0. The grade (read this first)

The engine is graded on exactly one outcome:

> **One clean anchor image goes in one end. A reproducible, seed-consistent, published model comes out the other end.**

Anything less is a fail, including "makes pretty images faster." Faster generation with no reproducible identity is the same deferred proof the index note has carried for months, in a new coat. The acceptance test is the **Andean pilot (slot 20)** completing the full loop: anchor → dataset → LoRA → seed-consistent regeneration → published row. Until that happens, the engine is unproven regardless of how much it generates.

---

## 1. Architecture fork — RESOLVED

**Decision: image-anchored identity. Descriptors are parallel metadata, never the identity path.**

| | Identity spine (load-bearing) | Descriptor metadata (parallel) |
|---|---|---|
| Source of truth | The anchor image → 24-shot dataset → **LoRA weights + trigger** | Structured face descriptors parsed into `model_bibles` |
| Buys | Deterministic, reproducible identity — the moat | Roster searchable by exact ethnicity + feature — the product's discoverability |
| If it fails | Whole pipeline blocks (acceptable — it's the core) | Model still trains and publishes (must never block the spine) |

Rationale: the only reproducibility mechanism this shop has proven is LoRA, and LoRA trains on **images**, not descriptor fields. Data-first prompting does not hold an identity across seeds — it drifts. Descriptors are worth building because searchability by precise ethnicity *is* the product, but they are a parallel writer. **A parser bug must never stop a model from training.**

Override path: if Toufic says "data-first," the fork flips — but the acceptance test then demands prompt-from-fields hold an identity a LoRA would hold, and that is a harder, weaker bet. Not recommended.

---

## 2. Scope

**In scope (V1):** the PRODUCTION loop as a repo script calling fal.ai → Supabase, plus a PLAY mode sharing the same stage-1 engine. Human gate at every write.

**Out of scope (V1):** wizard UI pages (wrap later, once the script logic is proven); descriptor-extraction parser (parallel, deferred — see §9); roster manager admin page; Stripe; video.

---

## 3. Two modes, one engine

- **PLAY** — stage 1 only. Generate freely from an anchor. Writes to a **scratch path in the pipeline bucket**. No roster row, no LoRA, nothing ever reaches `media`. **No `generation_logs` row either** — PLAY logs locally, as a session JSONL file alongside the images on the scratch path. `generation_logs.model_id` is `NOT NULL` and PLAY has no model row, so the DB log starts at Chunk 2 where the slug is real. `model_id` stays `NOT NULL`. Purpose: Toufic operates it for taste/play. Nothing published.
- **PRODUCTION** — full 4-stage loop, tied to a model slug, human-gated at every DB/storage write, ending in a published row + promotion to `media`.

Same stage-1 code path for both; the only differences are the write target and whether a roster row exists.

---

## 4. The PRODUCTION loop — 4 stages

Each stage is a separate CC chunk. Each write is human-approved. No stage auto-advances.

**Stage 1 — Dataset generation**
fal FLUX loop over the 24-shot template, seeded from one clean anchor. Categories (from master spec): `identity_anchor` (6), `environment` (6), `styling` (6), `expression` (6) — in the DB these are the `generation_category` values `dataset_identity_anchor`, `dataset_environment`, `dataset_styling`, `dataset_expression`. Per image: download → rename `{slug}_{category}_{nnn}.webp` → upload to **pipeline** bucket → write a draft `generation_logs` row. Human approves / regenerates per image before it counts toward the dataset.

**In PLAY, the `generation_logs` write is skipped** — session JSONL on the scratch path instead. The DB log begins in PRODUCTION (Chunk 2), which is the first mode with a real `model_id`.

**Stage 2 — LoRA training**
fal training call on the approved dataset only. Store weights URL + trigger word on the model row. Default scale 0.75 (fallback 0.65 on skin-tone drift); confirm final per-model value post-training.

**Stage 3 — Regeneration check**
Fixed 4–6 seed diagnostic grid at trigger. Human pass/fail. Record the passing seeds — they do not persist across fal sessions, so this reruns at the start of each future session for that model. This stage is non-negotiable: Amara's controlled grid ran 7/12 pass, and the fix was seed selection, not retrain. Skipping it ships drift.

**Stage 4 — Publish**
Promote approved images `pipeline → media`. Flip the model/campaign row to published. Only approved, seed-checked images move. Unpublished content never enters `media`.

PLAY = Stage 1 only, scratch path, stop.

---

## 5. Storage & DB contract

**Target project:** `szzctvtsomdyabetzjnh` ("cyberchicmodels", ap-southeast-1). **Confirm the client points here before any write.** Old project `iqoifrsavdreyiixuksd` stays live and untouched until cutover.

**Buckets:**
- `pipeline` (private) — all drafts, all PLAY output, every dataset before publish. Default for anything unpublished.
- `media` (public) — published only. Content enters *only* at Stage 4 promotion.

**Naming:** `{slug}_{category}_{nnn}.webp`. PLAY uses a scratch prefix (e.g. `_play/{session}/…`) so nothing collides with a real slug.

**OPEN CONFLICT — resolve at Chunk 2, do not change now.** `generation_logs.output_path` carries a CHECK constraint requiring `generations/{batch_key}/[a-z0-9-]+/{n}.webp`. The storage naming above does not satisfy it: `{slug}_{category}_{nnn}.webp` uses underscores, and the PLAY prefix starts with `_`. The `storage_buckets` migration already flagged the 3rd path segment as undefined. Two options, pick one at Chunk 2: **(a)** relax the CHECK to admit the real filenames, or **(b)** decouple them — `output_path` stays a DB-side canonical path and the storage filename is tracked separately. PLAY is unaffected either way, since it writes no `generation_logs` row.

**Writes are logical intent here — do not hardcode columns.** Before any INSERT, CC runs `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='[table]' ORDER BY ordinal_position` and matches the real schema. Parent row first, `RETURNING id`, then children. Never pre-generate downstream UUIDs. "Success. No rows returned" = it did not write; re-execute.

**Schema change needed:** add a `sheet_type` enum for the model-book taxonomy (identity sheets: headshots+angles, hairstyles, makeup; presentation sheets: standing, seated, wardrobe). Ships as a **new, reconciled migration** — see §6.

---

## 6. Guardrails CC must honor (paste into the CC session)

1. Chunk-by-chunk. Approve each step. Not autonomous. Approve every DB/storage write. Never auto-mode.
2. All writes service-role/manual. Frontend read-only.
3. Drafts default to `pipeline`. Promote to `media` only at publish. Unpublished never in `media`.
4. **Do not run `supabase db push` / `link` until migration history is reconciled** — the new schema's migrations were applied as raw SQL and are unrecorded. Reconcile first, then add `sheet_type` as a recorded migration.
5. Images live in Supabase, never the repo. `.gitignore` already covers `Lora Models/`, `.env*`.
6. Rotate the fal key pasted earlier — treat as exposed. Load from env, never inline.
7. Confirm the client targets `szzctvtsomdyabetzjnh` before any write.
8. No NSFW, ever. Full-body kinetic prompts strip garments — double-anchor the garment in caps at prompt open and close. Keep per-model locks (e.g. Amara hair: "natural coil worn loose, no braids/updo/ponytail"; explicit direct gaze).
9. Feed the engine one image at a time. Never a composite/contact sheet — engines don't read layout.

---

## 7. Failure modes the design must survive

- **Chat-window drift** — state decays, face drifts across a chat. This is *why* the engine is a script, not a conversation. Do not "just prompt it in chat."
- **Seed variance** — mitigated by Stage 3, not by retraining. Passing seeds are per-session.
- **NSFW strip / undertone shift / jaw softening / passive gaze** — prompt-level locks per model; garment double-anchor.
- **Parser failure** — must degrade gracefully; identity path continues.
- **Migration drift** — unrecorded raw-SQL migrations; reconcile before CLI. *(Reconciled in Chunk 0: the history table now records all five migrations.)*
- **Path-contract drift** — the `output_path` CHECK and the storage filename disagree. See the OPEN CONFLICT note in §5; resolve at Chunk 2 before the first PRODUCTION `generation_logs` write.

---

## 8. Build order (CC chunks)

| Chunk | Deliverable | Gate |
|---|---|---|
| 0 | Config + schema verify: env-loaded fal key (rotated), project-target guard, `information_schema` check, `sheet_type` reconciled migration | Approve before any generation |
| 1 | **Stage 1, PLAY** — one anchor → dataset loop → rename → pipeline scratch → session JSONL log (no `generation_logs` row). Approve/regen per image | Relay loop code + first filed image path |
| 2 | Stage 1, PRODUCTION — same, tied to a slug + draft roster row | — |
| 3 | Stage 2 — LoRA train on approved dataset → weights + trigger on model row | — |
| 4 | Stage 3 — seed diagnostic grid → human pass/fail | — |
| 5 | Stage 4 — promote pipeline→media, flip published | — |
| later | Wrap stages in wizard UI (PLAY/PRODUCTION pages) | After script proven |

**Start now: Chunk 0 only. Chunk 1 does not begin until Chunk 0 is approved.** Then: one anchor, PLAY, scratch path, no roster row. Nothing trains or publishes until Stage 1 is clean.

---

## 9. Open decisions (still Toufic's, not resolved by this brief)

1. **The six new anchors** — are any reproducible from last night's trial tool, or reference-only? Reproducibility of the *tool* doesn't matter; a clean anchor file rebuilt inside fal.ai is all the engine needs. But confirm before treating them as anchors vs. reference.
2. **Descriptor parser** — which vision model, and the `model_bibles` field schema. Deferred, parallel, non-blocking.
3. **fal LoRA training params** — steps / LR / default scale confirmation against the current fal API.
4. **PLAY scratch location** — prefix inside `pipeline`, or a dedicated scratch bucket.

---

## 10. What this brief does and doesn't prove

It unblocks the build and fixes the architecture. It moves **no model forward.** The engine is real only when the Andean anchor exits Stage 4 as a published, seed-consistent model. Grade it there, nowhere else.
