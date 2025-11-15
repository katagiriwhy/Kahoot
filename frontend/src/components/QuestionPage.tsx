import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/questionPage.css";

export function QuestionPage({  isHost }: { isHost: boolean }) {
    const [question, setQuestion] = useState<{text: string, answers: {id: number, text: string}[], imageUrl?: string}>({text: '', answers: []});
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const { ws, send } = useSocket();
    const navigate = useNavigate();

    useEffect(() => {
        if (!ws) return;

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            switch (data.type) {
                case "question":
                    setQuestion({
                        text: data.question.text,
                        answers: data.question.answers,
                        imageUrl: `/questions/${data.question.id}/image`
                    });
                    setTimeLeft(data.timeLimit);
                    break;
                case "question_end":
                    navigate(`/interim/${data.questionId}`);
                    break;
            }
        };
    }, [ws, navigate]);

    useEffect(() => {
        if (timeLeft <= 0 && selectedAnswer !== null) {
            send("answer", { answerId: selectedAnswer });
        }
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft, selectedAnswer, send]);

    return (
        <div className="question-page">
            <h2>{question.text}</h2>
            {question.imageUrl && <img src={question.imageUrl} alt="question" className="question-image"/>}
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
