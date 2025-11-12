import {useEffect, useRef, useState} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

type Player = {
    user_id: number;
    nickname: string;
};

const Lobby = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
   // const [,setWs] = useState<WebSocket | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost] = useState(location.state?.isHost ?? false);
    const wsRef = useRef<WebSocket | null >(null);

    useEffect(() => {
        if (wsRef.current) return;
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }

        const wsUrl = `ws://localhost:8080/ws/game-sessions/join?token=${encodeURIComponent(token)}`;
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;


        socket.onopen = () => {
            console.log("WS OPEN");
            console.log(Number(id));
            socket.send(JSON.stringify({session_id: Number(id)}));
        };

        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "lobby_update" && Array.isArray(data.players)) {
                setPlayers(data.players.map((p: { id : string, nickname: string; }) => ({ user_id: Number(p.id), nickname: p.nickname })));
            }
        };

        socket.onerror = (e) => console.error("WS ERROR:", e);
        socket.onclose = function(event) {
            if (event.wasClean) {
                console.log('Соединение закрыто чисто');
            } else {
                console.log('Обрыв соединения'); // например, "убит" процесс сервера
            }
            console.log('Код: ' + event.code + ' причина: ' + event.reason);
        };

        return () => socket.close();
    }, [id, navigate]);

    const startGame = async () => {
        const token = localStorage.getItem("token");
        await fetch("http://localhost:8080/ws/game-sessions/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ session_id: Number(id) }),
        });
    };

    const endLobby = async () => {
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:8080/ws/game-sessions/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        }).then(() => navigate("/"));
    };

    const leaveLobby = () => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({ type: "leave", session_id: Number(id) }));
        }
        navigate("/");
    };

    return (
        <div className="lobby-container">
            <h1>Lobby PIN: {id}</h1>
            <h3>Players:</h3>
            <ul>
                {players.map((p) => (
                    <li key={p.user_id}>{p.nickname}</li>
                ))}
            </ul>

            {isHost ? (
                <>
                    <button onClick={startGame}>Start Game</button>
                    <button onClick={endLobby}>End Lobby</button>
                </>
            ) : (
                <button onClick={leaveLobby}>Leave Lobby</button>
            )}
        </div>
    );
};

export default Lobby;
