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

});

