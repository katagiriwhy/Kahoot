/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_PUBLIC_BACKEND_ORIGIN?: string;
    /** e.g. "/api" when nginx proxies /api/* to Go root */
    readonly VITE_PUBLIC_API_PATH_PREFIX?: string;
    /** Set to "1" to disable auto "/api" when page origin equals PUBLIC_BACKEND_ORIGIN */
    readonly VITE_SAME_ORIGIN_NO_API_PREFIX?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
