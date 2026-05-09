export type Theme = "Light" | "Dark" | "Auto";
export type Difficulty = "easy" | "medium" | "hard";
export type Section = "config" | "rules" | "quiz" | "results";


export interface Result {
    categoryText: string;
    score: number;
    total: number;
    difficulty: string;
    breakdown: Breakdown[];
    timeTaken: number;
}

export interface Breakdown {
    question: string;
    correct: string,
    userAnswer?: string;
    isCorrect: boolean;
}

export interface QuizCategory {
    id: number;
    name: string;
}

export interface QuizConfig {
    categoryText: string;
    difficulty: Difficulty;
    questionCount: number;
}

export interface ParsedTime {
    minutes: number;
    seconds: number;
}

export interface ModalCallbacks {
    onConfirm: () => void;
    onCancel: () => void;
}

export interface RawQuestion {
    category: string;
    type: "multiple" | "boolean";
    difficulty: Difficulty;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

export interface Question extends RawQuestion {
    options: string[];
}
