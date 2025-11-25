import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CreateQuestions from '../src/components/CreateQuestions';

const mockPost = vi.fn();

vi.mock('../src/components/Api', () => ({
    default: { post: mockPost },
    CREATE_QUESTION_WITH_ANSWERS_URL: '/questions/answers',
}));

describe('CreateQuestions component', () => {
    beforeEach(() => {
        mockPost.mockReset();
    });

    it('adds answer fields when requested', async () => {
        render(<CreateQuestions />);

        expect(screen.getAllByPlaceholderText(/Answer/i)).toHaveLength(2);

        await userEvent.click(screen.getByRole('button', { name: /Add Answer/i }));
        expect(screen.getAllByPlaceholderText(/Answer/i)).toHaveLength(3);
    });

    it('submits form data to API', async () => {
        mockPost.mockResolvedValueOnce({});

        render(<CreateQuestions />);

        const numberInputs = screen.getAllByRole('spinbutton');
        await userEvent.type(numberInputs[0], '5'); // Quiz ID
        await userEvent.type(numberInputs[1], '50'); // Points

        const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA');
        await userEvent.type(textareas[0], 'Who am I?');

        const [answerOne, answerTwo] = screen.getAllByPlaceholderText(/Answer/i);
        await userEvent.type(answerOne, 'Option A');
        await userEvent.type(answerTwo, 'Option B');
        await userEvent.click(screen.getAllByLabelText(/Correct/i)[0]);

        await userEvent.click(screen.getByRole('button', { name: /Create Question/i }));

        await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1));

        const [, formData] = mockPost.mock.calls[0];
        expect((formData as FormData).get('quiz_id')).toBe('5');
        expect((formData as FormData).get('question_text')).toBe('Who am I?');
        expect((formData as FormData).get('points')).toBe('50');

        const answersPayload = (formData as FormData).get('answers') as string;
        const answers = JSON.parse(answersPayload);
        expect(answers).toHaveLength(2);
        expect(answers[0]).toMatchObject({ answer_text: 'Option A', is_correct: true });
        expect(answers[1]).toMatchObject({ answer_text: 'Option B', is_correct: false });
    });
});

