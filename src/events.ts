import {QuizSession} from "./quiz.ts";
import type {Difficulty, Question, QuizConfig, RawAPIResponse, RawQuestion, Section} from "./types";
import {session, setSession} from "./session.ts";
import {eventListener, fetchWithRetry, parseTime, resolveAPIError, shuffle} from "./utils/quiz.ts";
import {populateQuizFetchError, renderCategories} from "./render.ts";
import {
    categoriesDropdown,
    easyDifficulty,
    exitQuizButton,
    hardDifficulty,
    mediumDifficulty,
    nextButton,
    optionsList,
    previousButton,
    questionNumber,
    quitQuizButton,
    quizFetchError,
    quizForm,
    replayQuizButton,
    requestSubmitButton,
    startQuizButton
} from "./dom.ts";

export default function events(): void {
    eventListener(quizForm, "submit", async (e) => {
        e.preventDefault();
        quizFetchError.classList.add("hidden")
        const startQuizButton = document.getElementById(
            "startQuizButton",
        ) as HTMLButtonElement;
        startQuizButton.textContent = "Loading Quiz...";
        startQuizButton.disabled = true;
        const form = e.target as HTMLFormElement;
        if ((await validateForm()).every(Boolean)) {
            const amount = Number(questionNumber.value);
            let category = categoriesDropdown.value;
            let selectedIndex = categoriesDropdown.selectedIndex;
            let categoryText = categoriesDropdown.options[selectedIndex].textContent;
            
            const difficulty = (
                form.querySelector('input[type="radio"]:checked') as HTMLInputElement
            )?.value as Difficulty;
            const config: QuizConfig = {
                categoryText,
                difficulty,
                questionCount: amount,
            };
            const apiURL = `https://opentdb.com/api.php?amount=${amount}&category=${category}&difficulty=${difficulty}`;
            try {
                const quiz =
                    await fetchWithRetry<RawAPIResponse>(apiURL)
                if (quiz.response_code === 0) {
                    const questions: Question[] = quiz.results.map((q: RawQuestion) => ({
                        ...q,
                        options: shuffle([...q.incorrect_answers, q.correct_answer]),
                    }));
                    setSession(new QuizSession(config, questions));
                    startQuizButton.disabled = false;
                    startQuizButton.textContent = "Start Quiz";
                    renderRulesTimer(session?.getCalculatedTime() as number);
                    showSection("rules");
                } else {
                    const errorResponse = resolveAPIError(quiz.response_code)
                    populateQuizFetchError(errorResponse)
                }
            } catch (err) {
                console.error(err);
                populateQuizFetchError("Failed to get quiz data, please check your connection or try again later")
                
                startQuizButton.disabled = false;
                startQuizButton.textContent = "Start Quiz";
            }
        }
    });
    
    eventListener(optionsList, "change", (e) => {
        const target = e.target as HTMLInputElement;
        if (target.type === "radio") {
            session?.selectAnswer(target.value);
        }
    });
    
    eventListener(startQuizButton, "click", () => {
        session?.start();
        showSection("quiz");
    });
    
    
    eventListener(exitQuizButton, "click", () => {
        setSession(null);
        showSection("config");
    });
    
    eventListener(nextButton, "click", () => {
        session?.nextQuestion();
    });
    
    eventListener(previousButton, "click", () => {
        session?.previousQuestion();
    });
    
    eventListener(requestSubmitButton, "click", () => {
        session?.requestSubmit();
    });
    eventListener(replayQuizButton, "click", exitQuiz);
    eventListener(quitQuizButton, "click", () => {
        window.location.pathname = "/";
    });
}

const quizCategoryAPIResult = await fetch(
    `https://opentdb.com/api_category.php`,
)
    .then((data) => data.json())
    .catch(() => {
        document.getElementById("categoryError")?.classList.remove("hidden");
        quizForm.onsubmit = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };
    });

quizCategoryAPIResult && renderCategories(quizCategoryAPIResult.trivia_categories)

const params = new URLSearchParams(window.location.search);
const category = params.get("category");
if (category) {
    Array.from(categoriesDropdown.options).forEach((option) => {
        if (option.value === category) {
            option.selected = true;
        }
    });
}


export function validateForm() {
    document.querySelectorAll(".difficultyOption").forEach((option) => {
        option.addEventListener("change", () => validateDifficulty());
    });
    return Promise.all([validateNumber(), validateDifficulty()]);
}

function validateNumber() {
    const questionNumberError = document.getElementById(
        "questionNumberError",
    ) as HTMLParagraphElement;
    if (
        !questionNumber.value ||
        Number(questionNumber.value) > 50 ||
        Number(questionNumber.value) < 10
    ) {
        questionNumberError.classList.remove("hidden");
        questionNumber.addEventListener("input", () => {
            validateNumber();
        });
        
        return false;
    }
    questionNumberError.classList.add("hidden");
    return true;
}

function validateDifficulty() {
    const questionDifficultyError = document.getElementById(
        "difficultyError",
    ) as HTMLParagraphElement;
    if (
        !(
            hardDifficulty.checked ||
            mediumDifficulty.checked ||
            easyDifficulty.checked
        )
    ) {
        questionDifficultyError.classList.remove("hidden");
        return false;
    }
    questionDifficultyError.classList.add("hidden");
    return true;
}

export function renderRulesTimer(totalTime: number) {
    const timeText = document.getElementById("time-text") as HTMLSpanElement;
    const {minutes} = parseTime(totalTime);
    if (timeText) timeText.textContent = `${minutes} minutes`;
}

export function showSection(section: Section) {
    document.querySelectorAll("[data-section]").forEach((el) => {
        el.classList.remove("active");
    });
    
    document
        .querySelector(`[data-section="${section}"]`)
        ?.classList.add("active");
}

export function exitQuiz(): void {
    setSession(null);
    (document.getElementById("startQuizButton") as HTMLButtonElement).disabled =
        false;
    showSection("config");
}

window.addEventListener("beforeunload", (e) => {
    if (session?.isActive) e.preventDefault();
});

export function addQuizKeyboardListeners(): void {
    document.addEventListener("keydown", handleQuizKeyboard);
}

export function removeQuizKeyboardListeners(): void {
    document.removeEventListener("keydown", handleQuizKeyboard);
}

events();

export function handleQuizKeyboard(e: KeyboardEvent) {
    if (!session?.isActive) return;
    
    switch (e.key.toUpperCase()) {
        case "N":
            session.nextQuestion();
            break;
        case "P":
            session.previousQuestion();
            break;
        case "S":
            session.requestSubmit();
            break;
        case "1":
        case "2":
        case "3":
        case "4":
            const index = Number(e.key) - 1;
            const options = session.getCurrentOptions();
            if (options[index]) {
                session.selectAnswer(options[index]);
                const radios = optionsList.querySelectorAll<HTMLInputElement>(
                    'input[type="radio"]',
                );
                if (radios[index]) radios[index].checked = true;
            }
            break;
    }
}