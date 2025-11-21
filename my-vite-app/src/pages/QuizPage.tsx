import type { FormEvent } from "react";
import { useState, useEffect } from "react";

import type { UserAnswers, QuizData, Question } from '../components/Quiz'

import axios from '../components/Api';
import { SEND_ANSWER_URL, GET_QUIZ_URL } from '../components/Api';

function QuizPage() {

    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState<QuizData>({ questions: [] });
    const [submitted, setSubmitted] = useState(false);
    const [numberOfCorrect, setCorrect] = useState(0);

    useEffect(() => {
        axios.get<Question[]>(GET_QUIZ_URL)
            .then(response => {
                const backendData = response.data;
                const questions: Question[] = backendData.map((q: Question) => ({
                    question: q.question,
                    correctVariant: q.correctVariant,
                    variants: q.variants
                }));
                setQuizData({ questions });
            })
            .catch(error => {
                console.error('Ошибка:', error);
                const fallbackQuestions: Question[] = [
                    {
                        question: 'Выбери Вариант 1',
                        variants: ['Вариант 1', 'Вариант 2', 'Вариант 3'],
                        correctVariant: 0
                    },
                    {
                        question: 'Выбери Нет',
                        variants: ['Да', 'Нет'],
                        correctVariant: 1
                    },
                    {
                        question: 'Выбери Зеленый',
                        variants: ['Красный', 'Синий', 'Зеленый', 'Желтый'],
                        correctVariant: 2
                    }
                ];
                setQuizData({ questions: fallbackQuestions });
            });
    }, []);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);

        const formData = new FormData(e.currentTarget);
        
        let correctCount = 0;
        quizData.questions.forEach((question, questionIndex) => {
            const selectedAnswer = formData.get(`question-${questionIndex}`);
            const selectedIndex = parseInt(selectedAnswer as string);
            if (selectedIndex === question.correctVariant) {
                correctCount++;
            }
        })
        setCorrect(correctCount);
        console.log("Результаты проверки:", correctCount);
        const userAnswersData: UserAnswers = {
            answers: correctCount
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
                setSubmitted(true);
            });
    }

    return (
        <>
            <form className="formAnswer" onSubmit={handleSubmit}>
                {quizData.questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="question">
                        <h3>{question.question}</h3>
                        <div className="variants">
                            {question.variants.map((variant, variantIndex) => (
                                <div key={variantIndex} className="variant">
                                    <input
                                        type="radio"
                                        id={`q${questionIndex}-v${variantIndex}`}
                                        name={`question-${questionIndex}`}
                                        value={variantIndex}
                                        required
                                        disabled={submitted}
                                    />
                                    <label htmlFor={`q${questionIndex}-v${variantIndex}`}>
                                        {variant}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                ))}
                <button type="submit" className="sendAnswer"  disabled={loading || submitted} >{loading ? "Loading..." : "Submit"}</button>
            </form>
            {submitted && (
                <div className="quizDone">
                    <p>{`Your score is ${numberOfCorrect}`}</p>
                </div>
            )}
        </>
    )
}

export default QuizPage