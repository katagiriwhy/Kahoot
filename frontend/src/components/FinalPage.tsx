import { useEffect, useState } from "react";
import "../styles/finalPage.css";

export function FinalPage({ token }: { token: string }) {
    const [results, setResults] = useState<{nickname: string, score: number, rank: number}[]>([]);
    const [,setWs] = useState<WebSocket | null>(null);

    useEffect(() => {
        const socket = new WebSocket(`ws://server/ws/game-sessions/join?token=${token}`);
        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "quiz_finished") {
                setResults(data.results);
            }
        };
        setWs(socket);
        return () => socket.close();
    }, []);

    return (
        <div>
            <h1>Итоговые результаты</h1>
            <table>
                <thead>
                <tr><th>Место</th><th>Игрок</th><th>Баллы</th></tr>
                </thead>
                <tbody>
                {results.map(r => (
                    <tr key={r.nickname}>
                        <td>{r.rank}</td>
                        <td>{r.nickname}</td>
                        <td>{r.score}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
