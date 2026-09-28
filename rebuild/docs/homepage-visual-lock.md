# CyberChic Homepage — Visual Lock & Build Spec

**Owner:** Toufic Mourtada · +961 3 422 498
**Repo destination:** `rebuild/docs/homepage-visual-lock.md`
**Source:** `cyberchic_vibrant_home.html` (vibe prototype — approved for visual system only)
**Status:** visual direction LOCKED. This spec is what CC builds the React homepage from. The prototype's DOM, JS, and all hardcoded data are throwaway — only the system below is carried.

---

## 0. The one rule

Carry the **look**. Bind the **data to real published rows**. The prototype ships fiction (see §5) — none of its numbers, names, or claims survive to production. Homepage is read-only, published-only, against `szzctvtsomdyabetzjnh`.

---

## 1. Design tokens (locked)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0d0d0f` | page base |
| `--bg-2` | `#141418` | raised bands (proof, tiles) |
| `--line` | `#26262c` | hairlines, borders |
| `--white` | `#f7f5f1` | primary text |
| `--grey` | `#9a97a2` | secondary text |
| `--lime` | `#c6ff3a` | the single hot accent — used sparingly |
| `--lime-dim` | `#8fbf1f` | accent hover/pressed |
| maxw | `1320px` | content width |
| pad | `clamp(18px,4.5vw,72px)` | inline padding |

**Type:** Anton (display, uppercase, `line-height:.9`) + Inter 400–700 (body). Display scale runs large — hero `clamp(52px,12vw,168px)`, section heads `clamp(30px,5.5vw,64px)`, final CTA `clamp(44px,10vw,150px)`. Radius 10–12px on tiles/cards. The accent is a scalpel, not a bucket — one loud element per viewport, never competing limes.

**Typography rule (locked):**
- **Anton = DISPLAY ONLY, ≥ ~28px:** hero, section headings, large model names, big numbers.
- **Anything small and bold** — section labels, nav, buttons, tags, eyebrows, the nav wordmark — is **Inter 600/700, uppercase, letter-spacing ~.12–.14em**.
- **Never Anton below ~20px.**

---

## 2. Section order (locked)

1. **Nav** — sticky, blurred; brand wordmark (CHIC in lime); links; live "Casting open" dot (pulse); primary CTA "Start a brief".
2. **Hero** — Anton headline with one cycling accent line; sub; dual CTA; metrics row.
3. **Ticker** — lime band, marquee.
4. **Roster wall** — dual marquee, hover-to-pause, card hover = lift + lime border + bar fill.
5. **Proof band** — "One identity. Every scene. Zero drift." This is the moat stated plainly. Keep verbatim or tighter.
6. **Campaigns** — asymmetric grid (1 tall + 2), campaign-as-unit.
7. **Final CTA** — "Start a brief" + brief-intake framing.
8. **Footer** — wordmark + "AI models · No real person is depicted."

---

## 3. Motion (locked, accessibility-gated)

Drift columns behind hero; roster marquee (pause on hover); lime ticker; hero word-cycle; card hover lift + lime border + underline-bar fill. All wrapped in `prefers-reduced-motion: reduce` → animations off. Keep motion in CSS + light vanilla JS; **no heavy animation deps** in the React port.

---

## 4. Data-binding contract (this is the real work)

Nothing on this page is hardcoded. Every dynamic element binds to the new schema, published-only:

- **Roster wall** ← published `models` rows. Card = portrait (from `media` bucket) + name + **high-resolution ethnicity tag** ("Peruvian", not "Latina"; "Habesha", not "African") + register. No JS name arrays. Duotone panels are placeholder-only and are removed at build.
- **Hero + wall order** ← curated, not random. Lead with the most distinctive faces (`is_hero` / curated `display_order`), presented as the rarest, best product. This is the display-priority lever — distinctiveness converts. Never a diversity grid.
- **Metrics** ← derived from real counts at build/query time. Model count = `COUNT(published models)`. If the true number is small, show the true number or drop the numeric entirely — small-but-true reads more premium than inflated.
- **Campaign blocks** ← published `campaigns` / `campaign_images` (hero/featured flag). Titles/registers from the row, not hardcoded.
- **Ticker** ← real events (new published model, open casting window) or a fixed truthful set. No invented state.
- **Portraits** ← Supabase `media` (public, published-only) paths. Never the private `pipeline` bucket.

---

## 5. MUST STRIP before ship (claim truthing)

The prototype makes claims you cannot yet back. On a B2B licensing site, the product *is* reliable delivery — false capability claims attack the one thing you sell.

- **"40+ models on roster"** → real published count, or remove the number.
- **"Watch the film · 1:24"** → remove entirely until a flagship film exists (decision: film comes after the stills pipeline).
- **Ticker "New face · Nadia" / "Casting open · FW27" / "Roster growing weekly"** → bind to real events or delete.
- **Invented model names** (Astrid, Nadia, Freja, Zara, Ines, Mira, Juno, Selin, Noor…) → gone; wall binds to DB.
- **"100% Commercial rights"** → replace with the actual licensing terms (usage/term/territory) or link to terms — not a slogan.
- **Keep:** footer "No real person is depicted" (brand-neutral disclosure).

---

## 6. Brand rules carried into the build

Brand-neutral (no Pride/activist theming). Editorial leads every card; glamour walled off, never on the homepage. Precise ethnicity tags are mandatory (searchability = product). Age reads 25+ across all faces. B2B licensing framing throughout — buyer action is "start a brief / license a face"; "casting" stays internal-roster language, not a human-shoot promise.

---

## 7. Build target

React/TypeScript against the new schema (`szzctvtsomdyabetzjnh`), read-only public, published-only visibility. Homepage driven off `is_hero` campaign images (the `hero_images` table was dropped). Reuse existing tokens/components where the rebuild already has them; this spec governs the homepage surface only.
