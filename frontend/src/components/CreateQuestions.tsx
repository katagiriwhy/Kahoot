import { useState } from "react";
import { AxiosError } from "axios";
import api, { CREATE_QUESTION_WITH_ANSWERS_URL } from "./Api";
import "../styles/createQuestions.css";

const CreateQuestions = () => {
    const [quizId, setQuizId] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [points, setPoints] = useState(100);
    const [answers, setAnswers] = useState([
        { answer_text: "", is_correct: false },
        { answer_text: "", is_correct: false },
    ]);
    const [imageFile, setImageFile] = useState<File | null>(null); // новое поле
    const [error, setError] = useState<string | null>(null);
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
            const formData = new FormData();
            formData.append("quiz_id", quizId);
            formData.append("question_text", questionText);
            formData.append("points", points.toString());
            formData.append("answers", JSON.stringify(answers));
            if (imageFile) {
                formData.append("image", imageFile);
            }

            await api.post(CREATE_QUESTION_WITH_ANSWERS_URL, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setQuizId("");
            setQuestionText("");
            setPoints(100);
            setAnswers([
                { answer_text: "", is_correct: false },
                { answer_text: "", is_correct: false },
            ]);
            setImageFile(null);

        } catch (err) {
            const axiosErr = err as AxiosError<any>;
            setError(axiosErr.response?.data?.error || "Error creating question");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cq-wrapper">
            <div className="cq-card">
                <div className="create-questions-container">
                    <h1>Create Question</h1>
                    <form onSubmit={handleSubmit}>
                        <label>Quiz ID</label>
                        <input type="number" value={quizId} onChange={(e) => setQuizId(e.target.value)} required />

                        <label>Question Text</label>
                        <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />

                        <label>Points</label>
                        <input type="number" min={1} value={points} onChange={(e) => setPoints(parseInt(e.target.value))} required />

                        <label>Image (optional)</label>
                        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />

                        <h3>Answers</h3>
                        {answers.map((ans, index) => (
                            <div key={index} className="answer-row">
                                <input
                                    type="text"
                                    placeholder={`Answer ${index + 1}`}
                                    value={ans.answer_text}
                                    onChange={(e) => handleAnswerChange(index, "answer_text", e.target.value)}
                                    required
                                />
                                <label className="checkbox-field">
                                    <input
                                        type="checkbox"
                                        checked={ans.is_correct}
                                        onChange={(e) => handleAnswerChange(index, "is_correct", e.target.checked)}
                                    />
                                    Correct
                                </label>
                                {answers.length > 2 && (
                                    <button type="button" className="ghost-action" onClick={() => removeAnswer(index)}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        {answers.length < 4 && (
                            <button type="button" className="ghost-action" onClick={addAnswer}>
                                Add Answer
                            </button>
                        )}

                        {error && <p className="error-text">{error}</p>}

                        <button className="submit-btn" type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Question"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateQuestions;
