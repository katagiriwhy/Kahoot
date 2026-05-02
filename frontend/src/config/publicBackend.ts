function normalizeApiPrefix(prefix: string): string {
    const p = prefix.trim();
    if (!p) return "";
    return (p.startsWith("/") ? p : `/${p}`).replace(/\/$/, "");
}

/** Split configured URL into origin (scheme + host + port) and path prefix (e.g. /api). */
function parseConfiguredBackend(configured: string): { httpOrigin: string; apiPathFromUrl: string } {
    const raw = configured.trim() || "http://localhost:8080";
    try {
        const href = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
        const u = new URL(href);
        const httpOrigin = `${u.protocol}//${u.host}`;
        let apiPathFromUrl = u.pathname.replace(/\/$/, "");
        if (apiPathFromUrl === "/") apiPathFromUrl = "";
        return { httpOrigin, apiPathFromUrl };
    } catch {
        return { httpOrigin: raw.replace(/\/$/, ""), apiPathFromUrl: "" };
    }
}

const configured = (import.meta.env.VITE_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080").trim();
const { httpOrigin, apiPathFromUrl } = parseConfiguredBackend(configured);

const envPrefix = normalizeApiPrefix(String(import.meta.env.VITE_PUBLIC_API_PATH_PREFIX ?? ""));
const explicitPrefix = envPrefix || apiPathFromUrl;

/** When page and API share the same origin (typical nginx: / → Vite, /api/ → Go) but prefix was not set, assume /api. */
function inferredNginxApiPrefix(httpOrigin: string): string {
    const disabled =
        String(import.meta.env.VITE_SAME_ORIGIN_NO_API_PREFIX ?? "") === "1" ||
        String(import.meta.env.VITE_SAME_ORIGIN_NO_API_PREFIX ?? "") === "true";
    if (disabled || explicitPrefix) return "";
    if (typeof window === "undefined") return "";
    try {
        if (httpOrigin === window.location.origin) return "/api";
    } catch {
        /* ignore */
    }
    return "";
}

const apiPrefix = explicitPrefix || inferredNginxApiPrefix(httpOrigin);

/** Base URL for REST (axios). Includes path prefix when nginx mounts API under /api/. */
export const publicBackendOrigin = `${httpOrigin}${apiPrefix}`.replace(/\/$/, "");

/** WebSocket must hit the path Gin exposes: /ws/... (often not under /api/). */
export function wsGameSessionsJoinURL(token: string | null): string {
    const u = new URL(httpOrigin);
    const wsProto = u.protocol === "https:" ? "wss:" : "ws:";
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${wsProto}//${u.host}/ws/game-sessions/join${q}`;
}
