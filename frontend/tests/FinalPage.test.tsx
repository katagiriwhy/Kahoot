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
});

