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
    const { socket, send } = useSocket();

    const [players, setPlayers] = useState<Player[]>([]);
    const [isHost] = useState(location.state?.isHost ?? false);

    useEffect(() => {
        if (!socket) return;

        send("joined", { session_id: Number(id) });

        const lobbyUpdateHandler = (data: { players: Player[] }) => {
            setPlayers(data.players);
        };
        socket.on("lobby_update", lobbyUpdateHandler);

        // лобби было закрыто
        const lobbyClosedHandler = () => {
            alert("Лобби было закрыто хостом");
            navigate("/");
        };
        socket.on("lobby_closed", lobbyClosedHandler);

        return () => {
            socket.off("lobby_update", lobbyUpdateHandler);
            socket.off("lobby_closed", lobbyClosedHandler);
        };
    }, [socket, id, send, navigate]);

    const startGame = () => send("start_game", { session_id: Number(id) });
    const endLobby = () => send("end_lobby", { session_id: Number(id) });

    const leaveLobby = () => {
        send("leave", { session_id: Number(id) });
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
