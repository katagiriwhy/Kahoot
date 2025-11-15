import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles//interimPage.css";

export function InterimPage({ token, isHost }: { token: string, isHost: boolean }) {
    const [players, setPlayers] = useState<{nickname: string, score: number}[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState<string>('');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const socket = new WebSocket(`ws://server/ws/game-sessions/join?token=${token}`);
        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "question_end") {
                setCorrectAnswer(data.correctAnswer);
                setPlayers(data.players);
            }
            if (data.type === "next_question") {
                navigate(`/question/${data.nextQuestionId}`);
            }
        };
        setWs(socket);
        return () => socket.close();
    }, []);

    const nextQuestion = () => {
        ws?.send(JSON.stringify({ type: "next_question" }));
    };

    return (
        <div>
            <h2>Правильный ответ: {correctAnswer}</h2>
            <table>
                <thead>
                <tr><th>Игрок</th><th>Баллы</th></tr>
                </thead>
                <tbody>
                {players.map(p => <tr key={p.nickname}><td>{p.nickname}</td><td>{p.score}</td></tr>)}
                </tbody>
            </table>
            {isHost && <button onClick={nextQuestion}>Следующий вопрос</button>}
        </div>
    );
}
