import type { FormEvent } from "react";

interface UserAnswers {
    answers: boolean[];
}

interface Question {
    variants: string[];
    correct: number;
}

interface QuizData {
    id: number;
    questions: Question[];
}

function Quiz() {

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
        const formData = new FormData(e.currentTarget);
        const userAnswers: boolean[] = [];

        quizData.questions.forEach((question, questionIndex) => {
            const selectedAnswer = formData.get(`question-${questionIndex}`);
            const selectedIndex = parseInt(selectedAnswer as string);
            userAnswers.push(selectedIndex === question.correct);
        })
        console.log("Результаты проверки:", userAnswers);
        console.log("Form sent");
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
                <button type="submit" className="sendAnswer">
                    Отправить ответы
                </button>
            </form>
        </>
    )
}

export default Quiz