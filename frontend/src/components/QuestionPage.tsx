import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

type Question = {
    id: number;
    text: string;
    answers: { id: number; text: string }[];
    timeLimit: number;
};

export function QuestionPage() {
    const [question, setQuestion] = useState<Question | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [answerSent, setAnswerSent] = useState(false);
    const [navigated, setNavigated] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const isHost = location.state?.isHost ?? false;
    const { subscribe, send } = useSocket();

    useEffect(() => {
        const normalizeQuestion = (raw: any): Question | null => {
            if (!raw) return null;
            const q = raw.question ?? raw;
            if (!q) return null;
            return {
                id: q.id ?? q.ID,
                text: q.text ?? q.Text ?? "",
                answers: (q.answers ?? q.Answers ?? []).map((a: any) => ({
                    id: a.id ?? a.ID,
                    text: a.text ?? a.Text ?? "",
                })),
                timeLimit: raw.timeLimit ?? q.timeLimit ?? q.TimeLimit ?? 15,
            };
        };

        const unsub = subscribe((msg) => {
            if (msg.type === "question") {
                const normalized = normalizeQuestion(msg);
                if (normalized) {
                    setQuestion(normalized);
                    setTimeLeft(normalized.timeLimit ?? 15);
                }
                setSelected(null);
                setAnswerSent(false);
                setNavigated(false);
            }
            if (msg.type === "question_end") {
                navigate(`/interim/${msg.questionId}`, { state: { isHost } });
            }
            if (msg.type === "lobby_closed") {
                navigate("/");
            }
            if (msg.type === "game_finished" || msg.type === "game_results") {
                navigate("/final");
            }
        });
        return unsub;
    }, [subscribe, navigate]);

    useEffect(() => {
        if (!question) return;
        
        // When timer reaches 0, navigate to interim page
        if (timeLeft <= 0 && !navigated) {
            // For players, send the answer if we have one and haven't sent it yet
            if (!isHost && !answerSent && selected !== null) {
                send("answer", { answer_id: selected });
                setAnswerSent(true);
            }
            // Navigate to interim page
            navigate(`/interim/${question.id}`, { state: { isHost } });
            setNavigated(true);
            return;
        }
        
        // Stop timer if we've already navigated
        if (navigated) return;
        
        // Continue countdown
        const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, selected, question, send, answerSent, isHost, navigated, navigate]);

     if (!question) return <p>Loading question...</p>;

    return (
        <div>
            <h2>{question.text}</h2>
            <ul>
                {question.answers.map(a => (
                    <li key={a.id}>
                        <button disabled={isHost || selected !== null} onClick={() => setSelected(a.id)}>
                            {a.text}
                        </button>
                    </li>
                ))}
            </ul>
            <p>Time left: {timeLeft}s</p>
        </div>
    );
}
