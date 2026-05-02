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
});

