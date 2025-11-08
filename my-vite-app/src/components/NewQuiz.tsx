import axios from './Api';
import { useState } from 'react';

function NewQuiz() {

    const [questions, setQuestions] = useState([
        { question: '', isCorrect: true }
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Submitted questions:', questions);
        // TODO: отправка данных
    };

    const addQuestion = () => {
        setQuestions([...questions, { question: '', isCorrect: true }]);
    };

    const removeQuestion = (index) => {
        if (questions.length > 1) {
            const newQuestions = questions.filter((_, i) => i !== index);
            setQuestions(newQuestions);
        }
    };

    const handleQuestionChange = (index, value) => {
        const newQuestions = [...questions];
        newQuestions[index].question = value;
        setQuestions(newQuestions);
    };

    const handleCorrectnessChange = (index, value) => {
        const newQuestions = [...questions];
        newQuestions[index].isCorrect = value === 'true';
        setQuestions(newQuestions);
    };

    return (
        <>
            <form className="newquizform" onSubmit={handleSubmit}>
                {questions.map((item, index) => (
                    <div key={index} className="question-item">
                        <input type="text" placeholder={`Question ${index + 1}`} value={item.question} onChange={(e) => handleQuestionChange(index, e.target.value)} required />
                        <select value={item.isCorrect}onChange={(e) => handleCorrectnessChange(index, e.target.value)}>
                            <option value={true}>True</option>
                            <option value={false}>False</option>
                        </select>
                        {questions.length > 1 && ( <button type="button" onClick={() => removeQuestion(index)}>Delete</button>)}
                    </div>
                ))}
                <button type="submit">Submit</button>
            </form>
            <button onClick={addQuestion}>Add question</button>
        </>
    )
}

export default NewQuiz;