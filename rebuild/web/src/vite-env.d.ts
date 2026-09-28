/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  // Base URL of the gated CyberChic Create admin app. Unset = no admin link.
  readonly VITE_CREATE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
