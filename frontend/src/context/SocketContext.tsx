import React, { createContext, useContext, useRef, useCallback, useState } from "react";

type WSMessageHandler = (data: any) => void;

interface SocketContextType {
    connectToSession: (sessionId: number) => void;
    leaveSession: () => void;
    send: (type: string, payload?: any) => void;
    subscribe: (handler: WSMessageHandler) => () => void;
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
    const [, setConnected] = useState(false);

    // helper: dispatch to handlers
    const dispatch = useCallback((data: any) => {
        // cache updates so new subscribers can be hydrated
        if (data?.type === "lobby_update") lastLobbyUpdate.current = data;
        if (data?.type === "question") lastQuestion.current = data;
        if (data?.type === "question_end") lastQuestionEnd.current = data;
        handlers.current.forEach(h => {
            try { h(data); } catch (e) { console.error("ws handler", e); }
        });
    }, []);

    // Create WS for a particular session. If already connected to the same session -> noop.
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
            const data = JSON.parse(event.data);
            dispatch(data);
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

    // Leave current session: inform server and close socket
    const leaveSession = useCallback(() => {
        if (!wsRef.current) return;
        const sid = sessionIdRef.current;
        try {
            // send leave message so server can remove from session_players (server handles leave)
            wsRef.current.send(JSON.stringify({ type: "leave", session_id: sid }));
        } catch (e) {
            console.warn("send leave failed", e);
        }
        try { wsRef.current.close(); } catch (_) {}
        wsRef.current = null;
        sessionIdRef.current = null;
        setConnected(false);
        // optionally clear cached lobby/question/question_end update:
        lastLobbyUpdate.current = null;
        lastQuestion.current = null;
        lastQuestionEnd.current = null;
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

    const subscribe = useCallback((handler: WSMessageHandler) => {
        handlers.current.add(handler);
        // If we have cached messages, immediately call the handler so UI hydrates instantly
        if (lastLobbyUpdate.current) {
            try { handler(lastLobbyUpdate.current); } catch (e) { console.error(e); }
        }
        if (lastQuestion.current) {
            try { handler(lastQuestion.current); } catch (e) { console.error(e); }
        }
        if (lastQuestionEnd.current) {
            try { handler(lastQuestionEnd.current); } catch (e) { console.error(e); }
        }
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
