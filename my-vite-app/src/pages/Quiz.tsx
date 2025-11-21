import type { FormEvent } from "react";
import { useState } from "react";

import type { UserAnswers, QuizData } from '../components/Quiz'

import axios from '../components/Api';
import { SEND_ANSWER_URL } from '../components/Api';

function Quiz() {

    const [loading, setLoading] = useState(false);

    const quizData: QuizData = {
        id: 1,
        questions: [
            {
                variants: ["Вариант 1", "Вариант 2", "Вариант 3"],
                correct: 0
            },
            {
                variants: ["Да", "Нет"],
                correct: 1
            },
            {
                variants: ["Красный", "Синий", "Зеленый", "Желтый"],
                correct: 2
            }
        ]
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const userAnswers: boolean[] = [];

        quizData.questions.forEach((question, questionIndex) => {
            const selectedAnswer = formData.get(`question-${questionIndex}`);
            const selectedIndex = parseInt(selectedAnswer as string);
            userAnswers.push(selectedIndex === question.correct);
        })
        console.log("Результаты проверки:", userAnswers);
        const userAnswersData: UserAnswers = {
            answers: userAnswers
        };
        axios.post(SEND_ANSWER_URL, {
            userAnswersData
        })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    return (
        <>
            <form className="formAnswer" onSubmit={handleSubmit}>
                {quizData.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="question">
                        <h3>Вопрос {questionIndex + 1}</h3>
                        <div className="variants">
                            {question.variants.map((variant, variantIndex) => (
                                <div key={variantIndex} className="variant">
                                    <input
                                        type="radio"
                                        id={`q${questionIndex}-v${variantIndex}`}
                                        name={`question-${questionIndex}`}
                                        value={variantIndex}
                                        required
                                    />
                                    <label htmlFor={`q${questionIndex}-v${variantIndex}`}>
                                        {variant}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                ))}
                <button type="submit" className="sendAnswer" disabled={loading}>{loading ? "Loading..." : "Submit"}</button>
            </form>
        </>
    )
}

export default Quiz