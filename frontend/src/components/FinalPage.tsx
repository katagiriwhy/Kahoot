import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import "../styles/finalPage.css";

export function FinalPage() {
    const [results, setResults] = useState<{nickname: string, score: number, rank: number}[]>([]);
    const { ws } = useSocket();

    useEffect(() => {
        if (!ws) return;

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "quiz_finished") {
                setResults(data.results);
            }
        };
    }, [ws]);

    return (
        <div className="final-page">
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
