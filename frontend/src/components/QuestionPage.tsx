import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import "../styles/questionPage.css"

type Question = {
    id: number;
    text: string;
    answers: { id: number; text: string }[];
    timeLimit: number;
    points: number;
    image?: string | null;
    imageType?: string | null;
};

export function QuestionPage() {
    const [question, setQuestion] = useState<Question | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(15);
    const [answerSent, setAnswerSent] = useState(false);
    const [navigated, setNavigated] = useState(false);
    const navigatedToInterimRef = useRef(false);
    const navigatedToFinalRef = useRef(false);

    const navigate = useNavigate();
    const location = useLocation();
    const isHost = location.state?.isHost ?? false;
    const { subscribe, send } = useSocket();

    useEffect(() => {
        const normalizeQuestion = (raw: any): Question | null => {
            if (!raw) return null;
            const q = raw.question ?? raw;
            if (!q) return null;
            const points = q.points ?? q.Points ?? 1;
            const image = q.image ?? raw.image ?? null;
            const imageType = q.imageType ?? raw.imageType ?? null;
            return {
                id: q.id ?? q.ID,
                text: q.text ?? q.Text ?? "",
                answers: (q.answers ?? q.Answers ?? []).map((a: any) => ({
                    id: a.id ?? a.ID,
                    text: a.text ?? a.Text ?? "",
                })),
                timeLimit: raw.timeLimit ?? q.timeLimit ?? q.TimeLimit ?? 15,
                points,
                image,
                imageType,
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
                navigatedToInterimRef.current = false;
                navigatedToFinalRef.current = false;
            }
            if (msg.type === "question_end" && !navigatedToInterimRef.current) {
                navigatedToInterimRef.current = true;
                navigate(`/interim/${msg.questionId}`, { state: { isHost } });
            }
            if (msg.type === "lobby_closed") {
                navigate("/");
            }
            if ((msg.type === "game_finished" || msg.type === "game_results") && !navigatedToFinalRef.current) {
                navigatedToFinalRef.current = true;
                navigate("/final");
            }
        }, { replay: ["question"] });
        return unsub;
    }, [subscribe, navigate]);

    useEffect(() => {
        if (!question || isHost || answerSent) return;
        if (selected !== null) {
            send("answer", { answer_id: selected });
            setAnswerSent(true);
        }
    }, [selected, question, isHost, answerSent, send]);

    useEffect(() => {
        if (!question) return;

        if (navigated || navigatedToInterimRef.current) {
            return;
        }

        if (timeLeft <= 0) {

            if (!isHost && !answerSent && selected !== null) {
                send("answer", { answer_id: selected });
                setAnswerSent(true);
            }

            if (isHost) {
                setTimeout(() => {
                    send("end_question", {});
                }, 500);
            }

            navigatedToInterimRef.current = true;
            setNavigated(true);
            navigate(`/interim/${question.id}`, { state: { isHost } });
            return;
        }

        const t = setTimeout(() => {
            if (!navigated && !navigatedToInterimRef.current) {
                setTimeLeft(s => Math.max(0, s - 1));
            }
        }, 1000);
        return () => clearTimeout(t);
    }, [timeLeft, selected, question, send, answerSent, isHost, navigated, navigate]);

     if (!question) return <p>Loading question...</p>;

    const imageSrc = question.image
        ? (question.image.startsWith("data:")
            ? question.image
            : `data:${question.imageType ?? "image/png"};base64,${question.image}`)
        : null;

    return (
        <div className="question-container">
            <h2>{question.text}</h2>
            <p>Points for this question: {question.points}</p>
            {imageSrc && <img src={imageSrc} alt="Question" />}
            <ul className="answers-list">
                {question.answers.map(a => (
                    <li key={a.id}>
                        <button
                            className="answer-btn"
                            disabled={isHost || selected !== null}
                            onClick={() => setSelected(a.id)}
                        >
                            {a.text}
                        </button>
                    </li>
                ))}
            </ul>
            <p className="timer">Time left: {timeLeft}s</p>
        </div>
    );
}
