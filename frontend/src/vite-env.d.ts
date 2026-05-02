/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUBLIC_BACKEND_ORIGIN?: string;
    /** e.g. "/api" when nginx proxies /api/* to Go root */
    readonly VITE_PUBLIC_API_PATH_PREFIX?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
