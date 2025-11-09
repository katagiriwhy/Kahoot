import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "./Api";
import {NEW_QUIZ_URL} from "./Api.tsx";
import '../styles/quizCreate.css';

function QuizCreate() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "",
        difficulty: "Легкий",
        is_public: true,
        question_amount: 5,
        time_limit: 60,
        description: "",
    });

    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const checked =
            e.target instanceof HTMLInputElement && e.target.type === "checkbox"
                ? e.target.checked
                : undefined;

        setFormData((prev) => ({
            ...prev,
            [name]: checked !== undefined ? checked : value,
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setImage(file);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("No auth token found. You must login first.");
                return;
            }

            const payload = JSON.parse(atob(token.split(".")[1]));
            const creator_id = payload.user_id;

            const data = new FormData();
            data.append("title", formData.title);
            data.append("difficulty", formData.difficulty);
            data.append("is_public", String(formData.is_public));
            data.append("question_amount", String(formData.question_amount));
            data.append("time_limit", String(formData.time_limit));
            data.append("description", formData.description);
            data.append("creator_id", String(creator_id));

            if (image) {
                data.append("image", image);
            }

            // @ts-ignore
            const res = await api.post(NEW_QUIZ_URL, data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            console.log("✅ Created:", res.data);

            navigate(`/`);
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.error || "Error creating quiz");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="quiz-create-container">
            <h1>Create Quiz</h1>

            <form onSubmit={handleSubmit}>
                <label>Title</label>
                <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                />

                <label>Difficulty</label>
                <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                >
                    <option value="Легкий">Легкий</option>
                    <option value="Средний">Средний</option>
                    <option value="Сложный">Сложный</option>
                </select>

                <label>
                    <input
                        type="checkbox"
                        name="is_public"
                        checked={formData.is_public}
                        onChange={handleChange}
                    />
                    Public Quiz
                </label>

                <label>Question Amount</label>
                <input
                    type="number"
                    name="question_amount"
                    min={1}
                    value={formData.question_amount}
                    onChange={handleChange}
                />

                <label>Time Limit (sec)</label>
                <input
                    type="number"
                    name="time_limit"
                    min={10}
                    value={formData.time_limit}
                    onChange={handleChange}
                />

                <label>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                />

                <label>Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />

                {error && <p style={{ color: "red" }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Quiz"}
                </button>
            </form>
        </div>
    );
}

export default QuizCreate;
