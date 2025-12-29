// OneSignal TypeScript tip tanımları

declare global {
  interface Window {
    OneSignal: {
      init: (config: OneSignalConfig) => Promise<void>;
      User: {
        addAlias: (key: string, value: string) => Promise<void>;
        addEmail: (email: string) => Promise<void>;
        addTag: (key: string, value: string) => Promise<void>;
        addTags: (tags: Record<string, string>) => Promise<void>;
        removeTag: (key: string) => Promise<void>;
        onesignalId: string | null;
        PushSubscription: {
          optedIn: boolean;
          token: string | null;
        };
      };
      Notifications: {
        requestPermission: () => Promise<boolean>;
        permission: string;
      };
    };
    OneSignalDeferred: Array<(OneSignal: any) => void>;
  }

  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_ADMIN_PASS: string;
      VITE_ONESIGNAL_APP_ID: string;
      VITE_ONESIGNAL_SAFARI_WEB_ID: string;
      VITE_ONESIGNAL_AUTH_KEY: string;
    };
  }
}

interface OneSignalConfig {
  appId: string;
  safari_web_id?: string;
  notifyButton?: {
    enable: boolean;
  };
}

export {};