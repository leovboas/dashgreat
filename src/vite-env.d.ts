/// <reference types="vite/client" />

interface ImportMetaEnv {
  // GreatPages
  readonly VITE_GP_TOKEN: string
  readonly VITE_GP_USER_ID: string
  readonly VITE_GP_PROJECT_ID: string
  readonly VITE_GP_PASSWORD: string
  // Windsor.ai
  readonly VITE_WINDSOR_API_KEY: string
  readonly VITE_WINDSOR_ACCOUNT_IDS: string // comma-separated, optional
  // Supabase
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
