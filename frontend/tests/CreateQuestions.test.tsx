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

    test("renders question creation form", () => {
        render(<CreateQuestions />);

        expect(screen.getByText("Create Question")).toBeInTheDocument();
        expect(screen.getByLabelText(/Quiz ID/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Question Text/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Points/i)).toBeInTheDocument();
    });

    test("handles input changes", () => {
        render(<CreateQuestions />);

        const quizIdInput = screen.getByLabelText(/Quiz ID/i);
        fireEvent.change(quizIdInput, { target: { value: "1" } });

        expect(quizIdInput).toHaveValue(1);
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

    test("successfully creates question with answers", async () => {
        (api.post as any).mockResolvedValueOnce({ data: {} });

        render(<CreateQuestions />);

        fireEvent.change(screen.getByLabelText(/Quiz ID/i), {
            target: { value: "1" },
        });
        fireEvent.change(screen.getByLabelText(/Question Text/i), {
            target: { value: "Test Question?" },
        });
        fireEvent.change(screen.getByLabelText(/Points/i), {
            target: { value: "100" },
        });

        const answerInputs = screen.getAllByPlaceholderText(/Answer/i);
        fireEvent.change(answerInputs[0], { target: { value: "Answer 1" } });
        fireEvent.change(answerInputs[1], { target: { value: "Answer 2" } });

        const checkboxes = screen.getAllByLabelText("Correct");
        fireEvent.click(checkboxes[0]);

        fireEvent.click(screen.getByText("Create Question"));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith(
                CREATE_QUESTION_WITH_ANSWERS_URL,
                expect.any(FormData),
                expect.objectContaining({
                    headers: { "Content-Type": "multipart/form-data" },
                })
            );
        });
    });

    test("resets form after successful creation", async () => {
        (api.post as any).mockResolvedValueOnce({ data: {} });

        render(<CreateQuestions />);

        fireEvent.change(screen.getByLabelText(/Quiz ID/i), {
            target: { value: "1" },
        });
        fireEvent.change(screen.getByLabelText(/Question Text/i), {
            target: { value: "Test Question?" },
        });

        fireEvent.click(screen.getByText("Create Question"));

        await waitFor(() => {
            expect(screen.getByLabelText(/Quiz ID/i)).toHaveValue(null);
        });
    });

    test("shows error on creation failure", async () => {
        (api.post as any).mockRejectedValueOnce({
            response: { data: { error: "Creation failed" } },
        });

        render(<CreateQuestions />);

        fireEvent.change(screen.getByLabelText(/Quiz ID/i), {
            target: { value: "1" },
        });
        fireEvent.change(screen.getByLabelText(/Question Text/i), {
            target: { value: "Test Question?" },
        });

        fireEvent.click(screen.getByText("Create Question"));

        expect(await screen.findByText("Creation failed")).toBeInTheDocument();
    });

    test("handles file upload", async () => {
        (api.post as any).mockResolvedValueOnce({ data: {} });

        const file = new File(["test"], "test.png", { type: "image/png" });

        render(<CreateQuestions />);

        const fileInput = screen.getByLabelText(/Image/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        fireEvent.change(screen.getByLabelText(/Quiz ID/i), {
            target: { value: "1" },
        });
        fireEvent.change(screen.getByLabelText(/Question Text/i), {
            target: { value: "Test Question?" },
        });

        fireEvent.click(screen.getByText("Create Question"));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        });
    });

    test("disables submit button while loading", async () => {
        (api.post as any).mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(<CreateQuestions />);

        fireEvent.change(screen.getByLabelText(/Quiz ID/i), {
            target: { value: "1" },
        });
        fireEvent.change(screen.getByLabelText(/Question Text/i), {
            target: { value: "Test Question?" },
        });

        const submitButton = screen.getByText("Create Question");
        fireEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText("Creating...")).toBeInTheDocument();
    });
});
