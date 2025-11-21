import type Question from "./Question";

interface QuizData {
    id: number;
    questions: Question[];
}

export type { QuizData as default };