import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/finalPage.css"

type Player = {
    user_id: number;
    nickname: string;
    score: number;
};

export function FinalPage() {
    const { subscribe, leaveSession } = useSocket();
    const navigate = useNavigate();
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        const unsub = subscribe(msg => {
            if (msg.type === "game_results" || msg.type === "game_finished" || msg.type === "game_over") {
                // Normalize player data from server
                if (msg.players && Array.isArray(msg.players)) {
                    setPlayers(msg.players.map((p: any) => ({
                        user_id: typeof p.user_id === 'string' ? parseInt(p.user_id) : p.user_id,
                        nickname: p.nickname || "",
                        score: typeof p.score === 'string' ? parseInt(p.score) : p.score,
                    })));
                } else if (msg.scores) {

                    const scoresMap = msg.scores;
                    const playersArray: Player[] = Object.entries(scoresMap).map(([userId, score]) => ({
                        user_id: parseInt(userId),
                        nickname: `Player ${userId}`,
                        score: typeof score === 'string' ? parseInt(score) : score as number,
                    }));
                    setPlayers(playersArray);
                }
            }
        }, { replay: ["game_finished", "game_results", "game_over"] });
        return unsub;
    }, [subscribe]);

    const exit = () => {
        leaveSession();
        navigate("/home");
    };

    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const top3 = sortedPlayers.slice(0, 3);

    return (
        <div>
            <h2>Final Results</h2>
            
            <div>
                <h3>Top 3 Players:</h3>
                {top3.length > 0 ? (
                    <ol>
                        {top3.map((player, index) => (
                            <li key={player.user_id}>
                                {index === 0 && "🥇 "}
                                {index === 1 && "🥈 "}
                                {index === 2 && "🥉 "}
                                {player.nickname}: {player.score} point{player.score !== 1 ? 's' : ''}
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p>No results available</p>
                )}
            </div>

            {sortedPlayers.length > 3 && (
                <div>
                    <h3>All Players:</h3>
                    <ul>
                        {sortedPlayers.map((player) => (
                            <li key={player.user_id}>
                                {player.nickname}: {player.score} point{player.score !== 1 ? 's' : ''}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <button onClick={exit}>Return to Home</button>
        </div>
    );
}
