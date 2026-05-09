import type { QuizSession } from "./quiz.ts";

export let session: QuizSession | null = null;

export function setSession(s: QuizSession | null): void {
  session = s;
}