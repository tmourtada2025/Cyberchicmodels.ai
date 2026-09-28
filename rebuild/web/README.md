# CyberChic web (rebuild)

Vite + React + TypeScript front end for the rebuild, reading the new Supabase project
`szzctvtsomdyabetzjnh` (public, read-only, published-only via RLS).

Governing docs: `rebuild/docs/homepage-visual-lock.md` (tokens, sections, data contract).

## Setup

```sh
cp .env.example .env.local   # fill VITE_SUPABASE_ANON_KEY — never commit .env.local
npm install
npm run dev
```

`npm run build` type-checks and builds; `npm run lint` runs oxlint.
