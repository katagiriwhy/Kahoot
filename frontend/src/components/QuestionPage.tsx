import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

type Question = {
    id: number;
    text: string;
    answers: { id: number; text: string }[];
    timeLimit: number;
};

export function QuestionPage({ isHost }: { isHost: boolean }) {
    const [question, setQuestion] = useState<Question | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);

    const navigate = useNavigate();
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
            }
            if (msg.type === "question_end") {
                navigate(`/interim/${msg.questionId}`);
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
        if (timeLeft <= 0) {
            if (selected !== null) {
                send("answer", { answer_id: selected });
            } else {
                // if no selected answer, optionally send empty or ignore
            }
            return;
        }
        const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft, selected, question, send]);

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
