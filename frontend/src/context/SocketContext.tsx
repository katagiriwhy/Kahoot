import React, { createContext, useContext, useRef, useCallback, useState } from "react";

type WSMessageHandler = (data: any) => void;

type ReplayableMessageType =
    | "lobby_update"
    | "question"
    | "question_end"
    | "game_finished"
    | "game_results"
    | "game_over";

interface SubscribeOptions {
    replay?: ReplayableMessageType[];
}

interface SocketContextType {
    connectToSession: (sessionId: number) => void;
    leaveSession: () => void;
    send: (type: string, payload?: any) => void;
    subscribe: (handler: WSMessageHandler, options?: SubscribeOptions) => () => void;
    getLastLobbyUpdate: () => any | null;
    isConnected: () => boolean;
}

const SocketContext = createContext<SocketContextType>(null!);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const wsRef = useRef<WebSocket | null>(null);
    const handlers = useRef(new Set<WSMessageHandler>());
    const sessionIdRef = useRef<number | null>(null);
    const lastLobbyUpdate = useRef<any | null>(null);
    const lastQuestion = useRef<any | null>(null);
    const lastQuestionEnd = useRef<any | null>(null);
    const lastGameResults = useRef<any | null>(null);
    const [, setConnected] = useState(false);

    const dispatch = useCallback((data: any) => {

        if (data?.type === "lobby_update") lastLobbyUpdate.current = data;
        if (data?.type === "question") lastQuestion.current = data;
        if (data?.type === "question_end") lastQuestionEnd.current = data;
        if (data?.type === "game_finished" || data?.type === "game_results" || data?.type === "game_over") {
            lastGameResults.current = data;
        }
        handlers.current.forEach(h => {
            try { h(data); } catch (e) { console.error("ws handler", e); }
        });
    }, []);

    const connectToSession = useCallback((sessionId: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            console.log("[WS] Already connected");
            return;
        }

        console.log("[WS] Creating new WebSocket… session:", sessionId);
        sessionIdRef.current = sessionId;

        const token = localStorage.getItem("token");
        const ws = new WebSocket(
            `ws://172.20.10.3:8080/ws/game-sessions/join?token=${token}`
        );

        ws.onopen = () => {
            console.log("[WS] OPEN");

            ws.send(JSON.stringify({
                type: "joined",
                session_id: sessionIdRef.current
            }));
        };

        ws.onmessage = (event) => {
            console.log("[WS] MESSAGE:", event.data);
            try {
                const data = JSON.parse(event.data);
                dispatch(data);
            } catch (e) {

                const text = event.data.toString();
                let start = 0;
                let depth = 0;
                for (let i = 0; i < text.length; i++) {
                    if (text[i] === '{') depth++;
                    if (text[i] === '}') {
                        depth--;
                        if (depth === 0) {
                            try {
                                const chunk = text.substring(start, i + 1);
                                const data = JSON.parse(chunk);
                                dispatch(data);
                            } catch (parseErr) {
                                const chunk = text.substring(start, i + 1);
                                console.error("[WS] Failed to parse chunk:", parseErr, chunk);
                            }
                            start = i + 1;
                        }
                    }
                }
                if (start < text.length) {
                    console.warn("[WS] Unparsed remainder:", text.substring(start));
                }
            }
        };

        ws.onclose = () => {
            console.log("[WS] CLOSED");
            wsRef.current = null;
        };

        ws.onerror = (err) => {
            console.log("[WS] ERROR:", err);
        };

        wsRef.current = ws;
    }, [dispatch]);

    const leaveSession = useCallback(() => {
        if (!wsRef.current) return;
        const sid = sessionIdRef.current;
        try {

            wsRef.current.send(JSON.stringify({ type: "leave", session_id: sid }));
        } catch (e) {
            console.warn("send leave failed", e);
        }
        try { wsRef.current.close(); } catch (_) {}
        wsRef.current = null;
        sessionIdRef.current = null;
        setConnected(false);

        lastLobbyUpdate.current = null;
        lastQuestion.current = null;
        lastQuestionEnd.current = null;
        lastGameResults.current = null;
    }, []);

    const send = useCallback((type: string, payload: any = {}) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
        try {
            wsRef.current.send(JSON.stringify({ type, ...payload }));
            return true;
        } catch (e) {
            console.error("ws send error", e);
            return false;
        }
    }, []);

    const subscribe = useCallback((handler: WSMessageHandler, options?: SubscribeOptions) => {
        handlers.current.add(handler);
        const replayTypes = options?.replay ?? [];
        replayTypes.forEach(type => {
            if (type === "lobby_update" && lastLobbyUpdate.current) {
                try { handler(lastLobbyUpdate.current); } catch (e) { console.error(e); }
            }
            if (type === "question" && lastQuestion.current) {
                try { handler(lastQuestion.current); } catch (e) { console.error(e); }
            }
            if (type === "question_end" && lastQuestionEnd.current) {
                try { handler(lastQuestionEnd.current); } catch (e) { console.error(e); }
            }
            if ((type === "game_finished" || type === "game_results" || type === "game_over")
                && lastGameResults.current
                && (lastGameResults.current.type === type
                    || ["game_finished", "game_results", "game_over"].includes(lastGameResults.current.type))) {
                try { handler(lastGameResults.current); } catch (e) { console.error(e); }
            }
        });
        return () => handlers.current.delete(handler);
    }, []);

    const getLastLobbyUpdate = useCallback(() => lastLobbyUpdate.current, []);
    const isConnected = useCallback(() => !!wsRef.current && wsRef.current.readyState === WebSocket.OPEN, []);

    return (
        <SocketContext.Provider value={{ connectToSession, leaveSession, send, subscribe, getLastLobbyUpdate, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
