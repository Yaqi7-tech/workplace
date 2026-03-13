/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIFY_VISITOR_API_URL: string
  readonly VITE_DIFY_VISITOR_API_KEY: string
  readonly VITE_DIFY_SUPERVISOR_API_URL: string
  readonly VITE_DIFY_SUPERVISOR_API_KEY: string
  readonly VITE_APP_TITLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
