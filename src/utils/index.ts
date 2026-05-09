import type {Difficulty, ParsedTime} from "../types";
import {session} from "../session.ts";
import {optionsList} from "../quiz.ts";

export const shuffle = (arr: Array<any>) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const BASE_TIME: Record<Difficulty, number> = {
    easy: 20,
    medium: 25,
    hard: 30
};

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
    easy: 1,
    medium: 1.25,
    hard: 1.5
};

export function calculateTimer(
    difficulty: Difficulty,
    questionCount: number
): number {
    return Math.round(
        questionCount * BASE_TIME[difficulty] * DIFFICULTY_MULTIPLIER[difficulty]
    );
}

export function parseTime(seconds: number): ParsedTime {
    return {
        minutes: Math.floor(seconds / 60),
        seconds: seconds % 60
    };
}

export function eventListener(
    element: HTMLElement | Document,
    type: keyof HTMLElementEventMap,
    func: EventListenerOrEventListenerObject,
    onceBoolean?: boolean
): void {
    element.addEventListener(type, func, {once: onceBoolean});
}

export function decode(str: string): string {
    return (
        new DOMParser().parseFromString(str, "text/html").body.textContent ?? str
    );
}

export function handleQuizKeyboard(e: KeyboardEvent) {
    
    if (!session?.isActive) return
    
    switch (e.key.toUpperCase()) {
        case 'N':
            session.nextQuestion()
            break
        case 'P':
            session.previousQuestion()
            break
        case 'S':
            session.requestSubmit()
            break
        case '1':
        case '2':
        case '3':
        case '4':
            const index = Number(e.key) - 1
            const options = session.getCurrentOptions()
            if (options[index]) {
                session.selectAnswer(options[index])
                const radios = optionsList.querySelectorAll<HTMLInputElement>('input[type="radio"]')
                if (radios[index]) radios[index].checked = true
            }
            break
    }
}