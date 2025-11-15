import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from "react";

interface SocketContextType {
    ws: WebSocket | null;
    connect: (url: string) => void;
    send: (event: string, data?: any) => void;
    close: () => void;
}

const SocketContext = createContext<SocketContextType>({
    ws: null,
    connect: () => {},
    send: () => {},
    close: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);

    const connect = useCallback((url: string) => {
        // Не подключаемся, если уже есть открытое или подключающееся соединение
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

        const socket = new WebSocket(url);

        socket.onopen = () => console.log("WebSocket connected");
        socket.onclose = (e) => console.log("WebSocket disconnected", e);
        socket.onerror = (e) => console.error("WebSocket error", e, socket.readyState);

        wsRef.current = socket;
        setWs(socket);
    }, []);

    const send = useCallback((event: string, data?: any) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: event, ...data }));
    }, []);

    const close = useCallback(() => {
        wsRef.current?.close();
        wsRef.current = null;
        setWs(null);
    }, []);

    return (
        <SocketContext.Provider value={{ ws, connect, send, close }}>
            {children}
        </SocketContext.Provider>
    );
};
