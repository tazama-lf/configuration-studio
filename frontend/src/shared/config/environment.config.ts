// Environment configuration

declare global {
  interface Window {
    RUNTIME_CONFIG?: {
      API_BASE_URL?: string;
      APP_TITLE?: string;
      APP_ENV?: string;
      ALLOWED_HOSTS? : string
    };
  }

  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly VITE_APP_TITLE?: string;
    readonly VITE_APP_ENV?: string;
    readonly VITE_ALLOWED_HOSTS?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export const ENV = {
  API_BASE_URL:
    window.RUNTIME_CONFIG?.API_BASE_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    'http://localhost:3011',

  APP_TITLE:
    window.RUNTIME_CONFIG?.APP_TITLE ??
    import.meta.env.VITE_APP_TITLE ??
    'Tazama Config Studio',

  APP_ENV:
    window.RUNTIME_CONFIG?.APP_ENV ??
    import.meta.env.VITE_APP_ENV ??
    'development',
  ALLOWED_HOSTS:
    window.RUNTIME_CONFIG?.ALLOWED_HOSTS ??
    import.meta.env.VITE_ALLOWED_HOSTS ??
    'all',
} as const;