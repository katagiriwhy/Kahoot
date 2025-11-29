import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import QuizCreate from "../src/components/QuizCreate";
import api from "../src/components/Api";
import { NEW_QUIZ_URL } from "../src/components/Api";
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

describe("QuizCreate Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    test("handles checkbox toggle", () => {
        render(
            <MemoryRouter>
                <QuizCreate />
            </MemoryRouter>
        );

        const publicCheckbox = screen.getByLabelText(/Public Quiz/i);
        expect(publicCheckbox).toBeChecked();

        fireEvent.click(publicCheckbox);
        expect(publicCheckbox).not.toBeChecked();
    });

});

