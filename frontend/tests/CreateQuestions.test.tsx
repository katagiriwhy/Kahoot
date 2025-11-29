import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CreateQuestions from "../src/components/CreateQuestions";
import api from "../src/components/Api";
import { CREATE_QUESTION_WITH_ANSWERS_URL } from "../src/components/Api";
import { vi } from "vitest";

vi.mock("../src/components/Api");

describe("CreateQuestions Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });


    test("handles answer text changes", () => {
        render(<CreateQuestions />);

        const answerInputs = screen.getAllByPlaceholderText(/Answer/i);
        fireEvent.change(answerInputs[0], { target: { value: "Answer 1" } });

        expect(answerInputs[0]).toHaveValue("Answer 1");
    });

    test("handles correct answer checkbox", () => {
        render(<CreateQuestions />);

        const checkboxes = screen.getAllByLabelText("Correct");
        fireEvent.click(checkboxes[0]);

        expect(checkboxes[0]).toBeChecked();
    });

    test("adds new answer", () => {
        render(<CreateQuestions />);

        const addButton = screen.getByText("Add Answer");
        fireEvent.click(addButton);

        const answerInputs = screen.getAllByPlaceholderText(/Answer/i);
        expect(answerInputs.length).toBe(3);
    });

    test("removes answer when more than 2 answers exist", () => {
        render(<CreateQuestions />);

        const addButton = screen.getByText("Add Answer");
        fireEvent.click(addButton);

        const removeButtons = screen.getAllByText("Remove");
        fireEvent.click(removeButtons[0]);

        const answerInputs = screen.getAllByPlaceholderText(/Answer/i);
        expect(answerInputs.length).toBe(2);
    });

    test("does not allow removing when only 2 answers", () => {
        render(<CreateQuestions />);

        const removeButtons = screen.queryAllByText("Remove");
        expect(removeButtons.length).toBe(0);
    });

    test("does not allow adding more than 4 answers", () => {
        render(<CreateQuestions />);

        const addButton = screen.getByText("Add Answer");
        fireEvent.click(addButton);
        fireEvent.click(addButton);

        expect(screen.queryByText("Add Answer")).not.toBeInTheDocument();
    });
});
