import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Register from "../src/components/Register";
import api from "../src/components/Api";
import { REGISTER_URL } from "../src/components/Api";
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

describe("Register Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders register form", () => {
        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        expect(screen.getByText("Register")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Login")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Confirm password")).toBeInTheDocument();
    });

    test("handles form input changes", () => {
        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Name"), {
            target: { value: "John Doe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Login"), {
            target: { value: "johndoe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
            target: { value: "password123" },
        });

        expect(screen.getByPlaceholderText("Name")).toHaveValue("John Doe");
        expect(screen.getByPlaceholderText("Login")).toHaveValue("johndoe");
        expect(screen.getByPlaceholderText("Password")).toHaveValue("password123");
        expect(screen.getByPlaceholderText("Confirm password")).toHaveValue("password123");
    });

    test("successful registration navigates to login", async () => {
        (api.post as any).mockResolvedValueOnce({ data: {} });

        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Name"), {
            target: { value: "John Doe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Login"), {
            target: { value: "johndoe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
            target: { value: "password123" },
        });

        fireEvent.click(screen.getByText("Submit"));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith(REGISTER_URL, {
                username: "John Doe",
                login: "johndoe",
                password: "password123",
            });
        });

        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    test("shows error on registration failure", async () => {
        (api.post as any).mockRejectedValueOnce({
            response: { data: { error: "User already exists" } },
        });

        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText("Name"), {
            target: { value: "John Doe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Login"), {
            target: { value: "johndoe" },
        });
        fireEvent.change(screen.getByPlaceholderText("Password"), {
            target: { value: "password123" },
        });
        fireEvent.change(screen.getByPlaceholderText("Confirm password"), {
            target: { value: "password123" },
        });

        fireEvent.click(screen.getByText("Submit"));

        expect(await screen.findByText("User already exists")).toBeInTheDocument();
    });

    test("shows link to login page", () => {
        render(
            <MemoryRouter>
                <Register />
            </MemoryRouter>
        );

        const loginLink = screen.getByText("Already registered? Login");
        expect(loginLink.closest("a")).toHaveAttribute("href", "/login");
    });
});

