import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

type Player = {
    user_id: number;
    nickname: string;
};

const Lobby = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [,setWs] = useState<WebSocket | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost] = useState(location.state?.isHost ?? false);

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8080/ws/game-sessions/join");

        socket.onopen = () => {
            console.log("WebSocket connected");
            socket.send(JSON.stringify(Number(id)));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.players) setPlayers(data.players);
            if (data.status === "joined") console.log("Joined lobby");
        };

        socket.onclose = () => console.log("WebSocket closed");
        socket.onerror = (err) => console.error(err);

        setWs(socket);

        return () => socket.close();
    }, [id]);

    const startGame = () => {
        fetch("http://localhost:8080/ws/game-sessions/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: Number(id) }),
        }).then(() => console.log("Game started"));
    };

    const endLobby = () => {
        fetch(`http://localhost:8080/ws/game-sessions/${id}`, {
            method: "DELETE",
        }).then(() => navigate("/"));
    };

    const leaveLobby = () => {
        fetch(`http://localhost:8080/ws/game-sessions/${id}/players`, {
            method: "DELETE",
        }).then(() => navigate("/"));
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
