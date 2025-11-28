import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import QuizCreate from "../src/components/QuizCreate";
import api from "../src/components/Api";
import { NEW_QUIZ_URL } from "../src/components/Api";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../src/components/Api");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("QuizCreate Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    test("renders quiz creation form", () => {
        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        expect(screen.getByText("Create Quiz")).toBeInTheDocument();
        expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Difficulty/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Question Amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Time Limit/i)).toBeInTheDocument();
    });

    test("handles form input changes", () => {
        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        const titleInput = screen.getByLabelText(/Title/i);
        fireEvent.change(titleInput, { target: { value: "Test Quiz" } });

        expect(titleInput).toHaveValue("Test Quiz");
    });

    test("handles difficulty selection", () => {
        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        const difficultySelect = screen.getByLabelText(/Difficulty/i);
        fireEvent.change(difficultySelect, { target: { value: "Средний" } });

        expect(difficultySelect).toHaveValue("Средний");
    });

    test("handles checkbox toggle", () => {
        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        const publicCheckbox = screen.getByLabelText(/Public Quiz/i);
        expect(publicCheckbox).toBeChecked();

        fireEvent.click(publicCheckbox);
        expect(publicCheckbox).not.toBeChecked();
    });

    test("shows error when no token is found", async () => {
        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: "Test Quiz" },
        });

        fireEvent.click(screen.getByText("Create Quiz"));

        expect(
            await screen.findByText("No auth token found. You must login first.")
        ).toBeInTheDocument();
    });

    test("successfully creates quiz", async () => {
        const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjN9.test";
        localStorage.setItem("token", mockToken);

        (api.post as any).mockResolvedValueOnce({
            data: { quiz_id: 1 },
        });

        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: "Test Quiz" },
        });

        fireEvent.click(screen.getByText("Create Quiz"));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        });

        const callArgs = (api.post as any).mock.calls[0];
        expect(callArgs[0]).toBe(NEW_QUIZ_URL);
        expect(callArgs[1]).toBeInstanceOf(FormData);
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    test("handles file upload", async () => {
        const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjN9.test";
        localStorage.setItem("token", mockToken);

        (api.post as any).mockResolvedValueOnce({
            data: { quiz_id: 1 },
        });

        const file = new File(["test"], "test.png", { type: "image/png" });

        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        const fileInput = screen.getByLabelText(/Image/i);
        fireEvent.change(fileInput, { target: { files: [file] } });

        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: "Test Quiz" },
        });

        fireEvent.click(screen.getByText("Create Quiz"));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        });
    });

    test("shows error on creation failure", async () => {
        const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjN9.test";
        localStorage.setItem("token", mockToken);

        (api.post as any).mockRejectedValueOnce({
            response: { data: { error: "Creation failed" } },
        });

        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: "Test Quiz" },
        });

        fireEvent.click(screen.getByText("Create Quiz"));

        expect(await screen.findByText("Creation failed")).toBeInTheDocument();
    });

    test("disables submit button while loading", async () => {
        const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjN9.test";
        localStorage.setItem("token", mockToken);

        (api.post as any).mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText(/Title/i), {
            target: { value: "Test Quiz" },
        });

        const submitButton = screen.getByText("Create Quiz");
        fireEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText("Creating...")).toBeInTheDocument();
    });
});

