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
        <div className="final-container glass-card">
            <header className="final-header">
                <p>Game concluded</p>
                <h2>Final Results</h2>
            </header>

            <section className="section-block">
                <h3>Top 3 Players</h3>
                {top3.length > 0 ? (
                    <ol className="top-list">
                        {top3.map((player, index) => (
                            <li key={player.user_id}>
                                <span className={`medal medal-${index + 1}`}>#{index + 1}</span>
                                <div className="player-meta">
                                    <p>{player.nickname}</p>
                                    <small>{player.score} pts</small>
                                </div>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="empty">No results available</p>
                )}
            </section>

            {sortedPlayers.length > 3 && (
                <section className="section-block">
                    <h3>All Players</h3>
                    <ul className="all-list">
                        {sortedPlayers.map((player, index) => (
                            <li key={player.user_id}>
                                <span>{index + 1}.</span>
                                <p>{player.nickname}</p>
                                <strong>{player.score} pts</strong>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <button className="exit-btn" onClick={exit}>
                Return to Home
            </button>
        </div>
    );
}
