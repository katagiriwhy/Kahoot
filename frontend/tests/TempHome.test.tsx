import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TempHome from "../src/components/TempHome";
import { MemoryRouter } from "react-router-dom";

describe("TempHome Component", () => {
    test("renders temp home page", () => {
        render(
            <MemoryRouter>
                <TempHome />
            </MemoryRouter>
        );

        expect(screen.getByText("Temp Home Page")).toBeInTheDocument();
        expect(screen.getByText("Pages:")).toBeInTheDocument();
    });

    test("renders all navigation links", () => {
        render(
            <MemoryRouter>
                <TempHome />
            </MemoryRouter>
        );

        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.getByText("Register")).toBeInTheDocument();
        expect(screen.getByText("New quiz")).toBeInTheDocument();
        expect(screen.getByText("New question")).toBeInTheDocument();
        expect(screen.getByText("HOME")).toBeInTheDocument();
    });

    test("links have correct hrefs", () => {
        render(
            <MemoryRouter>
                <TempHome />
            </MemoryRouter>
        );

        const loginLink = screen.getByText("Login").closest("a");
        expect(loginLink).toHaveAttribute("href", "/login");

        const registerLink = screen.getByText("Register").closest("a");
        expect(registerLink).toHaveAttribute("href", "/register");

        const quizLink = screen.getByText("New quiz").closest("a");
        expect(quizLink).toHaveAttribute("href", "/newquiz");

        const questionLink = screen.getByText("New question").closest("a");
        expect(questionLink).toHaveAttribute("href", "/new-question");

        const homeLink = screen.getByText("HOME").closest("a");
        expect(homeLink).toHaveAttribute("href", "/home");
    });

    test("shows under development section", () => {
        render(
            <MemoryRouter>
                <TempHome />
            </MemoryRouter>
        );

        expect(screen.getByText("Under Development:")).toBeInTheDocument();
    });
});

