import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/questionPage.css";

export function QuestionPage({ token, isHost }: { token: string, isHost: boolean }) {
    const [question, setQuestion] = useState<{text: string, answers: {id: number, text: string}[], imageUrl?: string}>({text: '', answers: []});
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const socket = new WebSocket(`ws://server/ws/game-sessions/join?token=${token}`);
        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === "question") {
                setQuestion({
                    text: data.question.text,
                    answers: data.question.answers,
                    imageUrl: `/questions/${data.question.id}/image`
                });
                setTimeLeft(data.timeLimit);
            }
            if (data.type === "question_end") {
                navigate(`/results/${data.questionId}`);
            }
        };
        setWs(socket);
        return () => socket.close();
    }, []);

    useEffect(() => {
        if (timeLeft <= 0 && selectedAnswer !== null) {
            ws?.send(JSON.stringify({ type: "answer", answerId: selectedAnswer }));
        }
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    return (
        <div>
            <h2>{question.text}</h2>
            {question.imageUrl && <img src={question.imageUrl} alt="question" style={{maxWidth: "400px"}} />}
            <ul>
                {question.answers.map(a => (
                    <li key={a.id}>
                        <button disabled={isHost} onClick={() => setSelectedAnswer(a.id)}>
                            {a.text}
                        </button>
                    </li>
                ))}
            </ul>
            <p>Осталось времени: {timeLeft} сек</p>
        </div>
    );
}
