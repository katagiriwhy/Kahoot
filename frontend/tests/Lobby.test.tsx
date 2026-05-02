import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Lobby from "../src/components/Lobby";
import { vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import {SocketProvider} from "../src/context/SocketContext";

const mockConnectToSession = vi.fn();
const mockSubscribe = vi.fn();
const mockSend = vi.fn();
const mockLeaveSession = vi.fn();

vi.mock("../src/context/SocketContext", async () => {
    const actual = await vi.importActual("../src/context/SocketContext");
    return {
        ...actual,
        useSocket: () => ({
            connectToSession: mockConnectToSession,
            subscribe: mockSubscribe,
            send: mockSend,
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
        useParams: () => ({ id: "123" }),
        useLocation: () => ({ state: { isHost: true } }),
    };
});

global.fetch = vi.fn();

describe("Lobby Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (global.fetch as any).mockClear();
    });

    test("renders lobby with session PIN", () => {
        render(
            <MemoryRouter>
                <Lobby />
            </MemoryRouter>
        );

        expect(screen.getByText("Session PIN")).toBeInTheDocument();
        expect(screen.getByText("#123")).toBeInTheDocument();
    });

    test("connects to session on mount", () => {
        render(
            <MemoryRouter>
                <SocketProvider>
                    <Lobby />
                </SocketProvider>
            </MemoryRouter>
        );

        expect(mockConnectToSession).toHaveBeenCalledWith(123);
    });

    test("subscribes to socket messages", () => {
        render(
            <MemoryRouter>
                <SocketProvider>
                    <Lobby />
                </SocketProvider>
            </MemoryRouter>
        );

        expect(mockSubscribe).toHaveBeenCalled();
    });


    test("shows waiting message when no players", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <SocketProvider>
                    <Lobby />
                </SocketProvider>
            </MemoryRouter>
        );

        expect(screen.getByText("Waiting for players...")).toBeInTheDocument();
    });


    test("player can leave lobby", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        vi.mock("react-router-dom", async () => {
            const actual = await vi.importActual("react-router-dom");
            return {
                ...actual,
                useNavigate: () => mockNavigate,
                useParams: () => ({ id: "123" }),
                useLocation: () => ({ state: { isHost: false } }),
            };
        });

        render(
            <MemoryRouter>
                <SocketProvider>
                    <Lobby />
                </SocketProvider>
            </MemoryRouter>
        );

        const leaveButton = screen.getByText("Leave Lobby");
        fireEvent.click(leaveButton);

        expect(mockSend).toHaveBeenCalledWith("leave", { session_id: 123 });
        expect(mockLeaveSession).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });


    test("navigates home when lobby is closed", () => {
        const mockUnsubscribe = vi.fn();
        mockSubscribe.mockReturnValueOnce(mockUnsubscribe);

        render(
            <MemoryRouter>
                <SocketProvider>
                    <Lobby />
                </SocketProvider>
            </MemoryRouter>
        );

        const subscribeCall = mockSubscribe.mock.calls[0];
        const handler = subscribeCall[0];

        handler({ type: "lobby_closed" });

        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
});

