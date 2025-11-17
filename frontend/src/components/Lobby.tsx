import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

type Player = { id: number; nickname: string };

export default function Lobby() {
    const { id } = useParams<{ id: string }>();
    const isHost = useLocation().state?.isHost ?? false;
    const navigate = useNavigate();
    const { connectToSession, subscribe, send, leaveSession } = useSocket();

    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        // connectToSession will create socket only once per session
        connectToSession(Number(id));
    }, [id, connectToSession]);

    useEffect(() => {
        // subscribe to ws messages, and hydrate immediately if last lobby_update exists
        const unsub = subscribe((data) => {
            if (data.type === "lobby_update") setPlayers(data.players ?? []);
            if (data.type === "lobby_closed") navigate("/");
            if (data.type === "question") navigate("/question");
        });
        return unsub;
    }, [subscribe, navigate]);

    const startGame = () => send("start_game", { session_id: Number(id) });

    const leaveLobby = () => {
        // Inform server and close socket
        send("leave", { session_id: Number(id) });
        leaveSession(); // ensures socket closed
        navigate("/");
    };

    const endLobby = async () => {
        const token = localStorage.getItem("token");
        await fetch(`http://172.20.10.3:8080/game-sessions/${id}/end`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            credentials: "include"
        });
        // If host ends the lobby, server should broadcast lobby_closed; but ensure we also cleanup
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
