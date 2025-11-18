import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/lobby.css"

type Player = { id: number; nickname: string };

export default function Lobby() {
    const { id } = useParams<{ id: string }>();
    const isHost = useLocation().state?.isHost ?? false;
    const navigate = useNavigate();
    const { connectToSession, subscribe, send, leaveSession } = useSocket();

    const [players, setPlayers] = useState<Player[]>([]);
    const navigatedRef = useRef(false);

    useEffect(() => {
        connectToSession(Number(id));
        navigatedRef.current = false;
    }, [id, connectToSession]);

    useEffect(() => {

        const unsub = subscribe((data) => {
            if (data.type === "lobby_update") setPlayers(data.players ?? []);
            if (data.type === "lobby_closed" && !navigatedRef.current) {
                navigatedRef.current = true;
                navigate("/");
            }
            if (data.type === "question" && !navigatedRef.current) {
                navigatedRef.current = true;
                navigate("/question", { state: { isHost } });
            }
        }, { replay: ["lobby_update", "question"] });
        return unsub;
    }, [subscribe, navigate, isHost]);

    const startGame = () => send("start_game", { session_id: Number(id) });

    const leaveLobby = () => {

        send("leave", { session_id: Number(id) });
        leaveSession();
        navigate("/");
    };

    const endLobby = async () => {
        const token = localStorage.getItem("token");
        await fetch(`http://172.20.10.3:8080/game-sessions/${id}/end`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            credentials: "include"
        });

        leaveSession();
        navigate("/");
    };

    return (
        <div>
            <h1>Lobby PIN: {id}</h1>
            <ul>{players.map(p => <li key={p.id}>{p.nickname}</li>)}</ul>

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
}
