import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Login from "../src/components/Login";
import api from "../src/components/Api";
import { LOGIN_URL } from "../src/components/Api";
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

describe("Login Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    test("renders login form", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByText("Log In")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Login")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByText("Submit")).toBeInTheDocument();
        expect(screen.getByText("Reset")).toBeInTheDocument();
    });

    test("handles form input changes", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const loginInput = screen.getByPlaceholderText("Login");
        const passwordInput = screen.getByPlaceholderText("Password");

        fireEvent.change(loginInput, { target: { value: "testuser" } });
        fireEvent.change(passwordInput, { target: { value: "testpass" } });

        expect(loginInput).toHaveValue("testuser");
        expect(passwordInput).toHaveValue("testpass");
    });

    test("successful login navigates to home", async () => {
        (api.post as any).mockResolvedValueOnce({
            data: { token: "test-token" },
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Login"), {
            target: { value: "testuser" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "testpass" },
        });

        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith(
                LOGIN_URL,
                { login: "testuser", password: "testpass" },
                { withCredentials: true }
            );
        });

        expect(localStorage.getItem("token")).toBe("test-token");
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    test("shows error on login failure", async () => {
        (api.post as any).mockRejectedValueOnce({
            response: { data: { error: "Invalid credentials" } },
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Login"), {
            target: { value: "testuser" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "wrongpass" },
        });

        fireEvent.click(screen.getByText("Submit"));

        expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    });

    test("shows default error message when error response is missing", async () => {
        (api.post as any).mockRejectedValueOnce({});

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Login"), {
            target: { value: "testuser" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "testpass" },
        });

        fireEvent.click(screen.getByText("Submit"));

        expect(await screen.findByText("Ошибка входа")).toBeInTheDocument();
    });

    test("disables submit button while loading", async () => {
        (api.post as any).mockImplementationOnce(
            () => new Promise((resolve) => setTimeout(resolve, 100))
        );

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Login"), {
            target: { value: "testuser" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "testpass" },
        });

        const submitButton = screen.getByText("Submit");
        fireEvent.click(submitButton);

        expect(submitButton).toBeDisabled();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    test("shows link to register page", () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const registerLink = screen.getByText("Not registered yet? Click here");
        expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
    });
});

