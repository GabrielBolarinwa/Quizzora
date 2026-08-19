import type {Difficulty, ParsedTime} from "../types";

export const shuffle = <T>(arr: T[]): T[] => {
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
    hard: 30,
};

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
    easy: 1,
    medium: 1.25,
    hard: 1.5,
};

export function calculateTimer(
    difficulty: Difficulty,
    questionCount: number,
): number {
    return Math.round(
        questionCount * BASE_TIME[difficulty] * DIFFICULTY_MULTIPLIER[difficulty],
    );
}

export function parseTime(seconds: number): ParsedTime {
    return {
        minutes: Math.floor(seconds / 60),
        seconds: seconds % 60,
    };
}

export function eventListener(
    element: HTMLElement | Document,
    type: keyof HTMLElementEventMap,
    func: EventListenerOrEventListenerObject,
    onceBoolean?: boolean,
): void {
    element.addEventListener(type, func, {once: onceBoolean});
}

export function decode(str: string): string {
    return (
        new DOMParser().parseFromString(str, "text/html").body.textContent ?? str
    );
}

export function trapFocus(modal: HTMLElement): void {
    const focusable = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    first.focus();
    
    modal.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
}

export function resolveAPIError(response_code: number): string {
    switch (response_code) {
        case 1:
            return "Not enough questions for the selected category please select another category or reduce number of questions"
        case 2:
            return "Internal application error, please contact the developer"
        default:
            return "An unknown error occurred"
    }
}

export async function fetchWithRetry<T>(url: string, retries: number = 1): Promise<T> {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load quiz data, please check your internet connection`)
        return await res.json() as T
    } catch (err) {
        if (retries > 0) return fetchWithRetry<T>(url, retries - 1);
        throw err
    }
}