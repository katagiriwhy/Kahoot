import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export function FinalPage() {
    const { subscribe, leaveSession } = useSocket();
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        const unsub = subscribe(msg => {
            if (msg.type === "game_results" || msg.type === "game_finished" || msg.type === "game_over") {
                // normalize whatever server sends
                setResults(msg.results ?? msg.scores ?? []);
            }
        });
        return unsub;
    }, [subscribe]);

    const exit = () => {
        // user finished the game — explicitly leave session & close ws
        leaveSession();
        // navigate back to home (call navigate from component if needed)
    };

    return (
        <div>
            <h2>Final Results</h2>
            <ul>{results.map(r => <li key={r.player_id ?? r.user_id}>{r.nickname}: {r.score}</li>)}</ul>
            <button onClick={exit}>Exit</button>
        </div>
    );
}
