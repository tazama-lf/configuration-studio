declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.webp';

interface ImportMetaEnv {
    readonly VITE_ALLOWED_HOSTS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
