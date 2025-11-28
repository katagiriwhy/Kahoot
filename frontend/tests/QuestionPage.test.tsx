import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QuestionPage } from "../src/components/QuestionPage";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockSubscribe = vi.fn();
const mockSend = vi.fn();

vi.mock("../src/context/SocketContext", async () => {
    const actual = await vi.importActual("../src/context/SocketContext");
    return {
        ...actual,
        useSocket: () => ({
            subscribe: mockSubscribe,
            send: mockSend,
        }),
    };
});

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: { isHost: false } }),
    };
});

describe("QuestionPage Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    test("shows loading message when no question", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        expect(screen.getByText("Loading question...")).toBeInTheDocument();
    });

    test("displays question when received", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question",
            question: {
                id: 1,
                text: "What is 2+2?",
                answers: [
                    { id: 1, text: "3" },
                    { id: 2, text: "4" },
                ],
                timeLimit: 15,
                points: 100,
            },
        });

        expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();
        expect(screen.getByText("Points for this question: 100")).toBeInTheDocument();
    });

    test("player can select answer", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question",
            question: {
                id: 1,
                text: "What is 2+2?",
                answers: [
                    { id: 1, text: "3" },
                    { id: 2, text: "4" },
                ],
                timeLimit: 15,
                points: 100,
            },
        });

        const answerButton = screen.getByText("4");
        fireEvent.click(answerButton);

        expect(mockSend).toHaveBeenCalledWith("answer", { answer_id: 2 });
    });

    test("host cannot select answer", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        vi.mock("react-router-dom", async () => {
            const actual = await vi.importActual("react-router-dom");
            return {
                ...actual,
                useNavigate: () => mockNavigate,
                useLocation: () => ({ state: { isHost: true } }),
            };
        });

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question",
            question: {
                id: 1,
                text: "What is 2+2?",
                answers: [
                    { id: 1, text: "3" },
                    { id: 2, text: "4" },
                ],
                timeLimit: 15,
                points: 100,
            },
        });

        const answerButtons = screen.getAllByRole("button");
        const answerButton = answerButtons.find((btn) => btn.textContent === "4");
        expect(answerButton).toBeDisabled();
    });

    test("disables answers after selection", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question",
            question: {
                id: 1,
                text: "What is 2+2?",
                answers: [
                    { id: 1, text: "3" },
                    { id: 2, text: "4" },
                ],
                timeLimit: 15,
                points: 100,
            },
        });

        const answerButton = screen.getByText("4");
        fireEvent.click(answerButton);

        const allAnswerButtons = screen.getAllByRole("button");
        allAnswerButtons.forEach((btn) => {
            if (btn.textContent !== "4") {
                expect(btn).toBeDisabled();
            }
        });
    });

    test("navigates to interim page when question ends", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question",
            question: {
                id: 1,
                text: "What is 2+2?",
                answers: [{ id: 1, text: "3" }],
                timeLimit: 15,
                points: 100,
            },
        });

        handler({ type: "question_end", questionId: 1 });

        expect(mockNavigate).toHaveBeenCalledWith("/interim/1", {
            state: { isHost: false },
        });
    });

    test("navigates to final page when game finishes", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({ type: "game_finished" });

        expect(mockNavigate).toHaveBeenCalledWith("/final");
    });

    test("displays timer", async () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question",
            question: {
                id: 1,
                text: "What is 2+2?",
                answers: [{ id: 1, text: "3" }],
                timeLimit: 15,
                points: 100,
            },
        });

        expect(screen.getByText(/Time left: 15s/i)).toBeInTheDocument();

        vi.advanceTimersByTime(1000);
        await waitFor(() => {
            expect(screen.getByText(/Time left: 14s/i)).toBeInTheDocument();
        });
    });

    test("displays image when provided", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <QuestionPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question",
            question: {
                id: 1,
                text: "What is 2+2?",
                answers: [{ id: 1, text: "3" }],
                timeLimit: 15,
                points: 100,
                image: "base64encodedimage",
                imageType: "image/png",
            },
        });

        const image = screen.getByAltText("Question");
        expect(image).toBeInTheDocument();
    });
});

