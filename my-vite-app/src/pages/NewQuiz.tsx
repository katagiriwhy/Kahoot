import { useState } from 'react';
import type { FormEvent } from 'react';

import axios from '../components/Api';
import { NEW_QUIZ_URL } from '../components/Api';
import Variant from '../components/NewQuiz/Variant';

function NewQuiz() {

    const [questions, setQuestions] = useState([
        { question: '', correctVariant: 0, variants: [''] }
    ]);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = JSON.stringify(questions)
        console.log('Submitted questions:', data);
        axios.post(NEW_QUIZ_URL, data)
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            })
    };

    const addQuestion = () => {
        setQuestions([...questions, { question: '', correctVariant: 0, variants: [''] }]);
    };

    const addVariant = (questionIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].variants.push('');
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            const newQuestions = questions.filter((_, i) => i !== index);
            setQuestions(newQuestions);
        }
    };

    const removeVariant = (questionIndex: number) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].variants.pop();
        setQuestions(newQuestions);
    }

    const handleQuestionChange = (index: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index].question = value;
        setQuestions(newQuestions);
    };

    const handleVariantChange = (index: number, id: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[index].variants[id] = value;
        setQuestions(newQuestions);
    }

    const handleCorrectnessChange = (index: number, value: number) => {
        const newQuestions = [...questions];
        newQuestions[index].correctVariant = value;
        setQuestions(newQuestions);
    };

    return (
        <>
            <form className="newQuizForm" onSubmit={handleSubmit}>
                {questions.map((item, index) => (
                    <div key={index} className="questionItem">
                        <input type="text" placeholder={`Question ${index + 1}`} value={item.question} onChange={(e) => handleQuestionChange(index, e.target.value)} required />
                        <button type="button" onClick={() => addVariant(index)}>Add variant</button>
                        {questions[index].variants.length > 1 && <button type="button" onClick={() => removeVariant(index)}>Remove variant</button>}
                        <Variant variants={item.variants} onVariantChange={(variantIndex, value) => handleVariantChange(index, variantIndex, value)} />
                        <label htmlFor="correctVar">Correct Variant:</label>
                        <select id="correctVar" value={item.correctVariant} onChange={(e) => handleCorrectnessChange(index, Number(e.target.value))}>
                            {item.variants.map((_, index) => (
                                <option key={index} value={index}>Variant {index + 1}</option>
                            ))}
                        </select>
                        {questions.length > 1 && (<button type="button" onClick={() => removeQuestion(index)}>Delete</button>)}
                    </div>
                ))}
                <button type="submit">Submit</button>
            </form>
            <button onClick={addQuestion}>Add question</button>
        </>
    )
}

export default NewQuiz;