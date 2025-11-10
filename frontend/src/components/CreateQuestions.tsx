import { useState } from "react";
import { AxiosError } from "axios";
import api, {CREATE_QUESTION_WITH_ANSWERS_URL} from "./Api";
import "../styles/createQuestions.css"

const CreateQuestions = () => {
    const [quizId, setQuizId] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [points, setPoints] = useState(1);
    const [answers, setAnswers] = useState([
        { answer_text: "", is_correct: false },
        { answer_text: "", is_correct: false },
    ]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    type Answer = {
        answer_text: string;
        is_correct: boolean;
    };

    const handleAnswerChange = (
        index: number,
        field: keyof Answer,
        value: string | boolean
    ) => {
        const updated = [...answers];
        updated[index][field] = value as never;
        setAnswers(updated);
    };

    const addAnswer = () => {
        if (answers.length < 4) {
            setAnswers([...answers, { answer_text: "", is_correct: false }]);
        }
    };

    const removeAnswer = (index: number) => {
        if (answers.length > 2) {
            setAnswers(answers.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                quiz_id: Number(quizId),
                question_text: questionText,
                points: Number(points),
                answers: answers.map((a) => ({
                    answer_text: a.answer_text,
                    is_correct: a.is_correct,
                })),
            };

            await api.post(CREATE_QUESTION_WITH_ANSWERS_URL, payload);
            setQuizId("");
            setQuestionText("");
            setPoints(1);
            setAnswers([
                { answer_text: "", is_correct: false },
                { answer_text: "", is_correct: false },
            ]);
        } catch (err) {
            const axiosErr = err as AxiosError<any>;
            setError(axiosErr.response?.data?.error || "Error creating question");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-questions-container">
            <h1>Create Question</h1>
            <form onSubmit={handleSubmit}>
                <label>Quiz ID</label>
                <input type="number" value={quizId} onChange={(e) => setQuizId(e.target.value)} required />

                <label>Question Text</label>
                <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />

                <label>Points</label>
                <input type="number" min={1} value={points} onChange={(e) => setPoints(parseInt(e.target.value))} required />

                <h3>Answers</h3>
                {answers.map((ans, index) => (
                    <div key={index}>
                        <input
                            type="text"
                            placeholder={`Answer ${index + 1}`}
                            value={ans.answer_text}
                            onChange={(e) => handleAnswerChange(index, "answer_text", e.target.value)}
                            required
                        />
                        <label>
                            <input
                                type="checkbox"
                                checked={ans.is_correct}
                                onChange={(e) => handleAnswerChange(index, "is_correct", e.target.checked)}
                            />
                            Correct
                        </label>
                        {answers.length > 2 && (
                            <button type="button" onClick={() => removeAnswer(index)}>
                                Remove
                            </button>
                        )}
                    </div>
                ))}
                {answers.length < 4 && (
                    <button type="button" onClick={addAnswer}>
                        Add Answer
                    </button>
                )}

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Question"}
                </button>
            </form>
        </div>
    );
};

export default CreateQuestions;
