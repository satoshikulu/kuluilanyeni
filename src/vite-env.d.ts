/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ONESIGNAL_APP_ID: string
  readonly VITE_ONESIGNAL_SAFARI_WEB_ID: string
  readonly VITE_ONESIGNAL_AUTH_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    OneSignal: any;
  }
}
