import type {Question, QuizCategory, Result} from "./types";
import {decode, eventListener, parseTime, trapFocus} from "./utils/quiz.ts";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleQuestionMark,
    createIcons,
    Crown,
    Info,
    ThumbsUp
} from "lucide";
import {session} from "./session.ts";
import {categoriesDropdown, optionsList, quizFetchError} from "./dom.ts";
import {showSection} from "./events.ts";

createIcons({
    icons: {
        ChevronLeft,
        ChevronRight,
        Info,
        ArrowLeft,
        CircleQuestionMark,
    },
});

let navButtonEls: NodeListOf<HTMLButtonElement>;

export function renderResultsDOM(result: Result) {
    const breakdownList = document.getElementById("answer_breakdown") as HTMLUListElement;
    breakdownList.innerHTML = "";
    result.breakdown.forEach((item, index) => {
        const li = document.createElement("li");
        if (item.isCorrect) {
            li.textContent = `✅ Question ${index + 1}: Correct`;
            li.className = "correct";
        } else {
            li.innerHTML = `
      ❌ Question ${index + 1} (${item.question}):
      <br>
      Your answer: ${decode(item.incorrect || "Unanswered")}
      <br>
      Correct answer: ${decode(item.correct)}`;
            li.className = "incorrect";
        }
        breakdownList.appendChild(li);
    });
    let feedback = "";
    const resultIconContainer = document.getElementById(
        "resultIcon",
    ) as HTMLDivElement;
    resultIconContainer.innerHTML = "";
    const resultIcon = document.createElement("span");
    resultIcon.classList.add("icon");
    resultIcon.setAttribute("height", "150");
    resultIcon.setAttribute("width", "150");
    const feedbackText = document.getElementById("feedbackText") as HTMLParagraphElement;
    if (result.score === 0) {
        resultIcon.setAttribute("data-lucide", "circle-alert");
        resultIcon.setAttribute("color", "#FF4500");
        resultIconContainer.appendChild(resultIcon);
        
        createIcons({
            icons: {CircleAlert},
        });
        feedback = "A Poor Result! Keep practicing! You'll get better";
        feedbackText.classList.add("notOk");
    } else if (result.score >= result.total / 2 && result.score < result.total) {
        resultIcon.setAttribute("data-lucide", "thumbs-up");
        resultIcon.setAttribute("color", "#17A589");
        resultIconContainer.appendChild(resultIcon);
        
        createIcons({
            icons: {ThumbsUp},
        });
        feedback = "Good job! You're on the right track.";
        feedbackText.classList.add("ok");
    } else if (result.score >= 1 && result.score < result.total / 2) {
        resultIcon.setAttribute("data-lucide", "");
        resultIcon.textContent = "😢";
        
        resultIcon.style.fontSize = `var(--text-4xl)`;
        resultIconContainer.appendChild(resultIcon);
        feedback = "Keep practicing! You'll get better";
        feedbackText.classList.add("notOk");
    } else if (result.score === result.total) {
        resultIcon.setAttribute("data-lucide", "crown");
        resultIcon.setAttribute("color", "#ffc107");
        resultIconContainer.appendChild(resultIcon);
        
        createIcons({
            icons: {Crown},
        });
        feedback = "Perfect Score! You're a genius!🎉";
        feedbackText.classList.add("ok");
    }
    (document.getElementById("scoreText") as HTMLParagraphElement).textContent =
        `You scored ${result.score} out of ${result.total} (${Math.floor((result.score / result.total) * 100)}%)`;
    (document.getElementById("feedbackText") as HTMLParagraphElement).textContent = feedback;
    showSection("results");
}

export function updateQuestionDOM(
    question: Question,
    currentIndex: number,
    total: number,
    userAnswer: string | null,
    questionCounterEl: HTMLSpanElement,
    totalQuestionEl: HTMLSpanElement,
    questionTextEl: HTMLParagraphElement,
): void {
    questionCounterEl.textContent = `${currentIndex + 1}`;
    totalQuestionEl.textContent = `${total}`;
    
    questionTextEl.textContent = decode(question.question);
    
    optionsList.innerHTML = "";
    question.options.forEach((option, index) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        const optionContainer = document.createElement("li");
        input.type = "radio";
        input.name = "quiz-option";
        input.value = option;
        input.id = `option-${index + 1}`;
        input.checked = userAnswer === option;
        label.htmlFor = `option-${index + 1}`;
        label.appendChild(document.createTextNode(decode(option)));
        optionContainer.classList.add("option");
        optionContainer.append(input, label);
        optionsList.appendChild(optionContainer);
    });
    
    navButtonEls?.forEach((btn, index) => {
        btn.classList.toggle("active", index === currentIndex);
    });
}


export function updateTimerDOM(remainingTime: number, timerEl: HTMLParagraphElement): void {
    const {minutes, seconds} = parseTime(remainingTime);
    timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function updateProgressBar(answered: number, total: number): void {
    const progressBar = document.getElementById("progressBar") as HTMLDivElement;
    progressBar.style.width = `${(answered / total) * 100}%`;
}

export function updateAnswerIndicatorDOM(index: number, answer: string | null): void {
    if (!navButtonEls) return;
    const btn = navButtonEls[index];
    if (!btn) return;
    btn.classList.toggle("answered", answer !== null);
}

export function updateSelectionIndicatorDOM(index: number): void {
    if (!navButtonEls) return;
    const btn = navButtonEls[index];
    if (!btn) return;
    navButtonEls.forEach((btn) => {
        btn.classList.remove("selected");
    });
    btn.classList.add("selected");
}

export function renderNavButtons(total: number, userAnswers: Map<number, string>) {
    const questionSwitchContainer = document.getElementById("questionSwitches");
    if (questionSwitchContainer) questionSwitchContainer.innerHTML = "";
    for (let i = 0; i < total; i++) {
        const btn = document.createElement("button");
        btn.textContent = `${i + 1}`;
        btn.classList.toggle("answered", userAnswers.has(i));
        btn.addEventListener("click", () => session?.goToQuestion(i));
        btn.classList.add("navigation_button");
        questionSwitchContainer?.appendChild(btn);
    }
    navButtonEls = questionSwitchContainer?.querySelectorAll("button") as NodeListOf<HTMLButtonElement>;
}

export function showConfirmationModal(
    answeredCount: number,
    total: number,
    modalOptions: {
        onConfirm: VoidFunction;
        onCancel: VoidFunction;
    },
): void {
    (document.getElementById("answeredQuestions") as HTMLSpanElement).textContent =
        answeredCount.toString();
    (document.getElementById("totalQuestion") as HTMLSpanElement).textContent = total.toString();
    const confirmationModal = document.getElementById(
        "confirmationModal",
    ) as HTMLDivElement;
    confirmationModal.classList.remove("hidden");
    trapFocus(confirmationModal);
    eventListener((document.getElementById("submitQuiz") as HTMLButtonElement), "click", () => {
        modalOptions.onConfirm();
        confirmationModal.classList.add("hidden");
    });
    eventListener((document.getElementById("resumeQuizButton") as HTMLButtonElement), "click", () => {
        modalOptions.onCancel();
        confirmationModal.classList.add("hidden");
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            confirmationModal.classList.add("hidden");
            modalOptions.onCancel();
        }
    });
}

export function renderCategories(quizCategories: QuizCategory[]) {
    quizCategories.forEach((quizCategory) => {
        let option = document.createElement("option");
        option.value = quizCategory.id.toString();
        option.textContent = quizCategory.name;
        categoriesDropdown.appendChild(option);
    });
}

export function populateQuizFetchError(error: string) {
    quizFetchError.classList.remove("hidden")
    quizFetchError.textContent = error
}