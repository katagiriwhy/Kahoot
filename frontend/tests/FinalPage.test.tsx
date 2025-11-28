import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FinalPage } from "../src/components/FinalPage";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockSubscribe = vi.fn();
const mockLeaveSession = vi.fn();

vi.mock("../src/context/SocketContext", async () => {
    const actual = await vi.importActual("../src/context/SocketContext");
    return {
        ...actual,
        useSocket: () => ({
            subscribe: mockSubscribe,
            leaveSession: mockLeaveSession,
        }),
    };
});

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("FinalPage Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders final page", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        expect(screen.getByText("Game concluded")).toBeInTheDocument();
        expect(screen.getByText("Final Results")).toBeInTheDocument();
    });

    test("displays top 3 players", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "game_results",
            players: [
                { user_id: 1, nickname: "Player1", score: 300 },
                { user_id: 2, nickname: "Player2", score: 200 },
                { user_id: 3, nickname: "Player3", score: 100 },
            ],
        });

        expect(screen.getByText("Top 3 Players")).toBeInTheDocument();
        expect(screen.getByText("Player1")).toBeInTheDocument();
        expect(screen.getByText("Player2")).toBeInTheDocument();
        expect(screen.getByText("Player3")).toBeInTheDocument();
    });

    test("sorts players by score", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "game_results",
            players: [
                { user_id: 2, nickname: "Player2", score: 200 },
                { user_id: 1, nickname: "Player1", score: 300 },
            ],
        });

        const playerElements = screen.getAllByText(/Player/i);
        expect(playerElements[0]).toHaveTextContent("Player1");
    });

    test("displays all players when more than 3", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "game_results",
            players: [
                { user_id: 1, nickname: "Player1", score: 300 },
                { user_id: 2, nickname: "Player2", score: 200 },
                { user_id: 3, nickname: "Player3", score: 100 },
                { user_id: 4, nickname: "Player4", score: 50 },
            ],
        });

        expect(screen.getByText("All Players")).toBeInTheDocument();
        expect(screen.getByText("Player4")).toBeInTheDocument();
    });

    test("handles scores from scores map", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "game_results",
            scores: {
                "1": 300,
                "2": 200,
            },
        });

        expect(screen.getByText("Player 1")).toBeInTheDocument();
        expect(screen.getByText("Player 2")).toBeInTheDocument();
    });

    test("shows empty state when no results", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        expect(screen.getByText("No results available")).toBeInTheDocument();
    });

    test("exit button navigates to home and leaves session", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        const exitButton = screen.getByText("Return to Home");
        fireEvent.click(exitButton);

        expect(mockLeaveSession).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/home");
    });

    test("handles game_finished message type", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "game_finished",
            players: [
                { user_id: 1, nickname: "Player1", score: 300 },
            ],
        });

        expect(screen.getByText("Player1")).toBeInTheDocument();
    });

    test("handles game_over message type", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <FinalPage />
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({
            type: "game_over",
            players: [
                { user_id: 1, nickname: "Player1", score: 300 },
            ],
        });

        expect(screen.getByText("Player1")).toBeInTheDocument();
    });
});

