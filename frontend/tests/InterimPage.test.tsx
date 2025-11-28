import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { InterimPage } from "../src/components/InterimPage";
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
        useParams: () => ({ questionId: "1" }),
        useLocation: () => ({ state: { isHost: true }, pathname: "/interim/1" }),
    };
});

describe("InterimPage Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders interim page with question ID", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        expect(screen.getByText(/Reviewing question #1/i)).toBeInTheDocument();
        expect(screen.getByText("Results")).toBeInTheDocument();
    });

    test("displays correct answer when received", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question_end",
            correctAnswerText: "The correct answer is 4",
        });

        expect(screen.getByText("Correct Answer")).toBeInTheDocument();
        expect(screen.getByText("The correct answer is 4")).toBeInTheDocument();
    });

    test("displays leaderboard with players", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question_end",
            players: [
                { user_id: 1, nickname: "Player1", score: 100 },
                { user_id: 2, nickname: "Player2", score: 50 },
            ],
        });

        expect(screen.getByText("Leaderboard")).toBeInTheDocument();
        expect(screen.getByText("Player1")).toBeInTheDocument();
        expect(screen.getByText("Player2")).toBeInTheDocument();
        expect(screen.getByText("100 points")).toBeInTheDocument();
        expect(screen.getByText("50 points")).toBeInTheDocument();
    });

    test("sorts players by score", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question_end",
            players: [
                { user_id: 2, nickname: "Player2", score: 50 },
                { user_id: 1, nickname: "Player1", score: 100 },
            ],
        });

        const playerElements = screen.getAllByText(/Player/i);
        expect(playerElements[0]).toHaveTextContent("Player1");
    });

    test("shows loading state when no players", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        expect(screen.getByText("Loading scores...")).toBeInTheDocument();
    });

    test("host can navigate to next question", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        const nextButton = screen.getByText("Next question");
        fireEvent.click(nextButton);

        expect(mockSend).toHaveBeenCalledWith("next_question", {});
    });

    test("player cannot see next question button", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        vi.mock("react-router-dom", async () => {
            const actual = await vi.importActual("react-router-dom");
            return {
                ...actual,
                useNavigate: () => mockNavigate,
                useParams: () => ({ questionId: "1" }),
                useLocation: () => ({ state: { isHost: false }, pathname: "/interim/1" }),
            };
        });

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        expect(screen.queryByText("Next question")).not.toBeInTheDocument();
    });

    test("navigates to question page when new question received", async () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        await waitFor(() => {
            handler({
                type: "question",
                question: { id: 2 },
            });
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/question", {
                state: { isHost: true },
            });
        });
    });

    test("navigates to final page when game finishes", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({ type: "game_finished" });

        expect(mockNavigate).toHaveBeenCalledWith("/final");
    });

    test("displays participant count", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <InterimPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "question_end",
            players: [
                { user_id: 1, nickname: "Player1", score: 100 },
                { user_id: 2, nickname: "Player2", score: 50 },
            ],
        });

        expect(screen.getByText("2 participants")).toBeInTheDocument();
    });
});

