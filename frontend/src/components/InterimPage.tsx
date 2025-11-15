import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/interimPage.css";

export function InterimPage({  isHost }: { isHost: boolean }) {
    const [players, setPlayers] = useState<{nickname: string, score: number}[]>([]);
    const [correctAnswer, setCorrectAnswer] = useState<string>('');
    const { ws, send } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!ws) return;

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            switch (data.type) {
                case "question_end":
                    setCorrectAnswer(data.correctAnswer);
                    setPlayers(data.players);
                    break;
                case "next_question":
                    navigate(`/question/${data.nextQuestionId}`);
                    break;
            }
        };
    }, [ws, navigate]);

    const nextQuestion = () => send("next_question");

    return (
        <div className="interim-page">
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
