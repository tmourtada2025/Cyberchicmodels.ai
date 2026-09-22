# CyberChic: Current State & Build Spec (Casting Protocol Summary)

Recorded 2026-09-22 as read-only project context. Nothing in this document has been executed. A future session builds against it.

> **Missing source:** the full 45-slot board (each slot: heritage · age · body · register · specialty) lives in `CyberChic_Casting_Protocol.md`. That file is **not in this repo** as of 2026-09-22. Get it from the user before starting Next Move #1.

---

## What's built (done, verified, locked)

- **New Supabase project `szzctvtsomdyabetzjnh`:** 12-table schema, RLS-locked, 19/19 verify checks green.
- **Storage:** `media` (public) and `pipeline` (private) buckets, both locked. Drafts go to `pipeline` by default and are promoted to `media` at publish.
- **Migrations were applied as raw SQL.** They are *not* recorded in `supabase_migrations`, so reconcile the history before any `supabase db push` from the CLI. The files are committed on branch `rebuild/supabase-schema`.
- **Old project `iqoifrsavdreyiixuksd`** is still live and untouched until cutover.

## Strategy

- B2B licensing agency.
- **Moat:** distinctive, hard-to-generate identities, each one a persistent identity a brand can license. The moat is **not** price: self-serve tools already make generic faces for about $3.
- **Compete on range that real agencies underserve:** mature, plus-size, natural-Afro, ethnicities from untapped regions, and "question-mark" faces.
- Balance commercial work with luxury/editorial work.
- **Bridal/events is the luxury tier.** Asian, Gulf and Indian clients spend heavily here.

## The Casting Protocol (the build target)

- **45 female models, released in phases.**
- **Litmus test for every model:** "Would a brand license this because they can't get it elsewhere?"
- Each of the 45 slots is defined by: **heritage · age · body · register · specialty** (full board in `CyberChic_Casting_Protocol.md`).
- **Hard rules:**
  - Female only for now. Male models come later. No non-binary models.
  - Every model must read as **25+** (brand safety).
  - Ethnicity is tagged at **high resolution**: "Peruvian", not "Latina".
  - Editorial leads. Glamour is walled off.
  - Brand-neutral: no Pride content in the catalogue.
- **Every model ships 5 versatile looks.**
- **Phase 1:** the 15 most distinctive faces. They lead the homepage.

## Trained inventory (LoRA-locked, reproducible): about 11

| Name | Heritage |
|---|---|
| Trang | Vietnamese |
| Yuki | Japanese |
| Akira | Japanese |
| Priya | South Asian |
| Amara | West African |
| Asha | West African, deep skin |
| Yasmin | Afro-Brazilian |
| Athena | French-Italian |
| Matilde | Mediterranean/Levantine |
| Vanessa | European |
| Camilla | Peruvian/mestiza-Latina |

**New builds from other sessions (status unconfirmed):**
- Andean (slot 20)
- Kazakh (slot 44)
- Amazigh/Berber (slot 27)

Some existing tags are coarser than the high-resolution rule allows ("South Asian", "European", "West African"). Re-tag them during the mapping step.

## Next moves (for the executing session, in order)

1. **Map inventory to slots.** Match the trained inventory and the new builds against the 45 slots, and produce the concrete **build list** (covered vs empty).
2. **Build the Andean pilot** to spec as proof of method.
3. **Build the generation wizard.** 45 models × 5 looks is impossible by hand, so it is semi-automated: a script generates a batch, a human reviews and approves, and approved images are named and written to Supabase through the service role.
4. **Build the roster manager / admin** so every model is tracked (name, slug, slot, trigger word, samples, status). This fixes the problem of models being scattered across chats.
