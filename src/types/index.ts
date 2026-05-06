export type Theme = "Light" | "Dark" | "Auto";

export interface Result {
  category: string;
  score: number;
  total: number;
  difficulty: string;
  breakdown: Breakdown[];
}

interface Breakdown {
  question: number;
  isCorrect: boolean;
  correctAnswer: string;
}