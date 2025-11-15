import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/lobby.css";

type Player = {
    user_id: number;
    nickname: string;
};

const Lobby = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { ws, connect, send, close } = useSocket();
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost] = useState(location.state?.isHost ?? false);

    // Подключение к WS
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { navigate("/login"); return; }

        const url = `ws://172.20.10.3:8080/ws/game-sessions/join?token=${encodeURIComponent(token)}`;
        connect(url);

        return () => close();
    }, [connect, close, navigate]);

    // Обработка сообщений
    useEffect(() => {
        if (!ws) return;

        const handleMessage = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.type === "lobby_update") setPlayers(data.players);
            if (data.type === "lobby_closed") {
                alert("Лобби было закрыто хостом");
                navigate("/");
            }
        };

        ws.addEventListener("message", handleMessage);

        ws.addEventListener("open", () => {
            send("joined", { session_id: Number(id) });
        });

        return () => ws.removeEventListener("message", handleMessage);
    }, [ws, send, id, navigate]);

    const startGame = async () => {
        const token = localStorage.getItem("token");
        await fetch("http://172.20.10.3:8080/game-sessions/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ session_id: Number(id) }),
        });
    };

    //const startGame = () => send("start_game", { session_id: Number(id) });
    //const endLobby = () => { send("end_lobby", { session_id: Number(id) }); navigate("/");}

    const endLobby = async () => {
        const token = localStorage.getItem("token");
        await fetch(`http://172.20.10.3:8080/game-sessions/${id}/end`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            credentials: "include"
        }).then(() => navigate("/"));
    };

    const leaveLobby = () => { send("leave", { session_id: Number(id) }); navigate("/"); };

    return (
        <div className="lobby-container">
            <h1>Lobby PIN: {id}</h1>
            <h3>Players:</h3>
            <ul>
                {players.map(p => <li key={p.user_id}>{p.nickname}</li>)}
            </ul>
            {isHost ? (
                <>
                    <button onClick={startGame}>Start Game</button>
                    <button onClick={endLobby}>End Lobby</button>
                </>
            ) : <button onClick={leaveLobby}>Leave Lobby</button>}
        </div>
    );
};

export default Lobby;
