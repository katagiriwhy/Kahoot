import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    send: (event: string, data?: any) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    send: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const newSocket = io("http://172.20.10.3:8080", {
            auth: { token },
            transports: ["websocket"],
        });

        newSocket.on("connect", () => console.log("Socket connected:", newSocket.id));
        newSocket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const send = (event: string, data?: any) => {
        if (socket) socket.emit(event, data);
    };

    return <SocketContext.Provider value={{ socket, send }}>{children}</SocketContext.Provider>;
};
