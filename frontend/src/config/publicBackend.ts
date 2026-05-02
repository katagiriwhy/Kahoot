const raw = (import.meta.env.VITE_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080").replace(/\/$/, "");

export const publicBackendOrigin = raw;

export function wsGameSessionsJoinURL(token: string | null): string {
    const u = new URL(publicBackendOrigin);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${u.origin}/ws/game-sessions/join${q}`;
}
