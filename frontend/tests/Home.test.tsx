import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../src/components/Home";
import axios from "../src/components/Api";
import { CREATE_LOBBY_URL } from "../src/components/Api";
import { vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../components/Api");

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => {
    const actual = vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

function renderWithRouter(ui: React.ReactNode) {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <Routes>
                <Route path="/" element={ui} />
                <Route path="/lobby/:id" element={<div>Lobby Page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe("Home Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("creates lobby and navigates", async () => {
        (axios.post as any).mockResolvedValueOnce({
            data: { game_session_id: 123 },
        });

        renderWithRouter(<Home />);

        fireEvent.change(screen.getByPlaceholderText("Quiz ID"), {
            target: { value: "10" },
        });

        fireEvent.click(screen.getByText(/Create Lobby/i));

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(CREATE_LOBBY_URL, { quiz_id: 10 });
        });

        expect(mockNavigate).toHaveBeenCalledWith("/lobby/123", {
            state: { isHost: true },
        });
    });

    test("shows error when create lobby fails", async () => {
        (axios.post as any).mockRejectedValueOnce({
            response: { data: { error: "Failed" } },
        });

        renderWithRouter(<Home />);

        fireEvent.change(screen.getByPlaceholderText("Quiz ID"), {
            target: { value: "5" },
        });

        fireEvent.click(screen.getByText(/Create Lobby/i));

        expect(await screen.findByText("Failed")).toBeInTheDocument();
    });

    test("joins existing lobby", async () => {
        (axios.get as any).mockResolvedValueOnce({
            data: { exists: true },
        });

        renderWithRouter(<Home />);

        fireEvent.change(screen.getByPlaceholderText("Lobby ID"), {
            target: { value: "77" },
        });

        fireEvent.click(screen.getByText(/Join Lobby/i));

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith("/game-sessions/77/exists");
        });

        expect(mockNavigate).toHaveBeenCalledWith("/lobby/77", {
            state: { isHost: false },
        });
    });

    test("shows error when lobby does not exist", async () => {
        (axios.get as any).mockResolvedValueOnce({
            data: { exists: false },
        });

        renderWithRouter(<Home />);

        fireEvent.change(screen.getByPlaceholderText("Lobby ID"), {
            target: { value: "99" },
        });

        fireEvent.click(screen.getByText(/Join Lobby/i));

        expect(await screen.findByText("Лобби с ID:99 не существует!")).toBeInTheDocument();
    });

    test("shows error when join lobby request fails", async () => {
        (axios.get as any).mockRejectedValueOnce("Network error");

        renderWithRouter(<Home />);

        fireEvent.change(screen.getByPlaceholderText("Lobby ID"), {
            target: { value: "12" },
        });

        fireEvent.click(screen.getByText(/Join Lobby/i));

        expect(await screen.findByText("Network error")).toBeInTheDocument();
    });
});
