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
import type { Breakdown, Question, QuizCategory, QuizConfig, Result, Section } from "./types";
import { calculateTimer, decode, eventListener, handleQuizKeyboard, parseTime } from "./utils";
import { session, setSession } from "./session.ts";
import events from "./events.ts";

createIcons({
  icons: {
    ChevronLeft,
    ChevronRight,
    Info,
    ArrowLeft,
    CircleQuestionMark
  }
});

export class QuizSession {
  isActive: boolean;
  private readonly questions: Question[];
  private currentIndex: number;
  private readonly totalTime: number;
  private remainingTime: number;
  private timerInterval: number | null;
  private readonly userAnswers: Map<number, string>;
  private readonly categoryText: string;
  private readonly difficulty: string;
  
  constructor(config: QuizConfig, questions: Question[]) {
    this.questions = questions;
    this.currentIndex = 0;
    this.totalTime = calculateTimer(config.difficulty, config.questionCount);
    this.categoryText = config.categoryText;
    this.difficulty = config.difficulty;
    this.remainingTime = this.totalTime;
    this.timerInterval = null;
    this.userAnswers = new Map();
    this.isActive = false;
  }
  
  getCalculatedTime(): number {
    return this.totalTime;
  }
  
  start(): void {
    this.isActive = true;
    renderNavButtons(this.questions.length, this.userAnswers);
    this.renderQuestion();
    addQuizKeyboardListeners();
    this.startTimer();
  }
  
  pauseTimer(): void {
    this.stopTimer();
  }
  
  resumeTimer(): void {
    this.startTimer();
  }
  
  getCurrentOptions(): string[] {
    return this.questions[this.currentIndex].options;
  }
  
  goToQuestion(index: number): void {
    if (index < 0 || index >= this.questions.length) return;
    this.currentIndex = index;
    this.renderQuestion();
    updateSelectionIndicatorDOM(this.currentIndex);
    updateProgressBar(this.userAnswers.size, this.questions.length);
  }
  
  nextQuestion(): void {
    this.goToQuestion(this.currentIndex + 1);
  }
  
  previousQuestion(): void {
    this.goToQuestion(this.currentIndex - 1);
  }
  
  selectAnswer(answer: string): void {
    this.userAnswers.set(this.currentIndex, answer);
    updateAnswerIndicatorDOM(this.currentIndex, answer);
  }
  
  requestSubmit(): void {
    this.pauseTimer();
    const answeredCount = this.userAnswers.size;
    removeQuizKeyboardListeners();
    showConfirmationModal(answeredCount, this.questions.length, {
      onConfirm: () => {
        const result = this.submit();
        localStorage.setItem("lastQuiz", JSON.stringify(result));
        renderResultsDOM(result);
      },
      onCancel: () => {
        this.resumeTimer();
        addQuizKeyboardListeners();
      }
    });
  }
  
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.remainingTime--;
      updateTimerDOM(this.remainingTime);
      
      if (this.remainingTime <= 0) {
        this.autoSubmit();
      }
    }, 1000);
  }
  
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  
  private submit(): Result {
    this.stopTimer();
    this.isActive = false;
    return this.compile();
  }
  
  private autoSubmit(): void {
    const result = this.submit();
    renderResultsDOM(result);
  }
  
  private compile(): Result {
    let score = 0;
    const breakdown: Breakdown[] = [];
    
    this.questions.forEach((question, index) => {
      const userAnswer = this.userAnswers.get(index) ?? undefined;
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) score++;
      
      breakdown.push({
        question: question.question,
        correct: question.correct_answer,
        userAnswer,
        isCorrect
      });
    });
    
    return {
      breakdown,
      categoryText: this.categoryText,
      difficulty: this.difficulty,
      score,
      timeTaken: this.totalTime - this.remainingTime,
      total: this.questions.length
    };
  }
  
  private renderQuestion(): void {
    const question = this.questions[this.currentIndex];
    const userAnswer = this.userAnswers.get(this.currentIndex) ?? null;
    
    updateSelectionIndicatorDOM(this.currentIndex);
    updateProgressBar(this.userAnswers.size, this.questions.length);
    updateQuestionDOM(
      question,
      this.currentIndex,
      this.questions.length,
      userAnswer
    );
  }
}

/* DOM Element References */
export const categoriesDropdown = document.getElementById(
  "questionCategories"
) as HTMLSelectElement;
export const questionNumber = document.getElementById(
  "questionNumber"
) as HTMLInputElement;
export const quizForm = document.getElementById("quizForm") as HTMLFormElement;
export const startQuizButton = document.getElementById(
  "startQuiz"
) as HTMLButtonElement;
export const exitQuizButton = document.getElementById(
  "exitQuiz"
) as HTMLButtonElement;
export const nextButton = document.getElementById(
  "nextQuestion"
) as HTMLButtonElement;
export const previousButton = document.getElementById(
  "previousQuestion"
) as HTMLButtonElement;
export const optionsList = document.getElementById(
  "optionList"
) as HTMLDivElement;
export const quitQuizButton = document.getElementById("quitQuizButton") as HTMLButtonElement;
export const replayQuizButton = document.getElementById("replayQuizButton") as HTMLButtonElement;
export const requestSubmitButton = document.getElementById("requestSubmit") as HTMLButtonElement;
const timerEl = document.getElementById("timer") as HTMLParagraphElement;
const questionTextEl = document.getElementById("questionText") as HTMLHeadingElement;
const questionCounterEl = document.getElementById("currentQuestion") as HTMLSpanElement;
const totalQuestionEl = document.getElementById("totalQuestions") as HTMLSpanElement;
let navButtonEls: NodeListOf<HTMLButtonElement> | undefined;
const hardDifficulty = document.getElementById("hard") as HTMLInputElement;
const easyDifficulty = document.getElementById("easy") as HTMLInputElement;
const mediumDifficulty = document.getElementById("medium") as HTMLInputElement;

const quizCategoryAPIResult = await fetch(
  `https://opentdb.com/api_category.php`
)
  .then((data) => data.json())
  .catch(() => {
    document.getElementById("categoryError")?.classList.remove("hidden");
    quizForm.onsubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
  });

const quizCategories: QuizCategory[] = quizCategoryAPIResult.trivia_categories;

quizCategories.forEach((quizCategory) => {
  let option = document.createElement("option");
  option.value = quizCategory.id.toString();
  option.textContent = quizCategory.name;
  categoriesDropdown.appendChild(option);
});

const params = new URLSearchParams(window.location.search);
const category = params.get("category");
if (category) {
  Array.from(categoriesDropdown.options).forEach((option) => {
    if (option.value === category) {
      option.selected = true;
    }
  });
}

events();

export function validateForm() {
  document.querySelectorAll(".difficultyOption").forEach((option) => {
    option.addEventListener("change", () => validateDifficulty());
  });
  return Promise.all([validateNumber(), validateDifficulty()]);
}

function validateNumber() {
  const questionNumberError = document.getElementById(
    "questionNumberError"
  ) as HTMLParagraphElement;
  if (
    !questionNumber.value ||
    Number(questionNumber.value) > 60 ||
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
    "difficultyError"
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
  const { minutes } = parseTime(totalTime);
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

function renderNavButtons(total: number, userAnswers: Map<number, string>) {
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
  navButtonEls = questionSwitchContainer?.querySelectorAll("button");
}

function updateTimerDOM(remainingTime: number): void {
  const { minutes, seconds } = parseTime(remainingTime);
  timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateQuestionDOM(
  question: Question,
  currentIndex: number,
  total: number,
  userAnswer: string | null
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
  
  navButtonEls!.forEach((btn, index) => {
    btn.classList.toggle("active", index === currentIndex);
  });
}

function updateAnswerIndicatorDOM(index: number, answer: string | null): void {
  const btn = navButtonEls![index];
  if (!btn) return;
  btn.classList.toggle("answered", answer !== null);
}

function updateSelectionIndicatorDOM(index: number): void {
  const btn = navButtonEls![index];
  if (!btn) return;
  navButtonEls!.forEach((btn) => {
    btn.classList.remove("selected");
  });
  btn.classList.add("selected");
}

function updateProgressBar(answered: number, total: number): void {
  const progressBar = document.getElementById("progressBar");
  progressBar!.style.width = `${(answered / total) * 100}%`;
}

function showConfirmationModal(answeredCount: number, total: number, modalOptions: {
  onConfirm: VoidFunction,
  onCancel: VoidFunction
}): void {
  document.getElementById("answeredQuestions")!.textContent = answeredCount.toString();
  document.getElementById("totalQuestion")!.textContent = total.toString();
  const confirmationModel = document.getElementById("confirmationModal") as HTMLDivElement;
  confirmationModel.classList.remove("hidden");
  eventListener(document.getElementById("submitQuiz")!, "click", () => {
    modalOptions.onConfirm();
    confirmationModel.classList.add("hidden");
  });
  eventListener(document.getElementById("resumeQuizButton")!, "click", () => {
    modalOptions.onCancel();
    confirmationModel.classList.add("hidden");
    
  });
}

function renderResultsDOM(result: Result) {
  const breakdownList = document.getElementById("answer_breakdown");
  result.breakdown.forEach((item, index) => {
    const li = document.createElement("li");
    if (item.isCorrect) {
      li.textContent = `✅ Question ${index + 1}: Correct`;
      li.className = "correct";
    } else {
      li.textContent = `❌ Question ${index + 1} (Correct answer: ${decode(item.correct)})`;
      li.className = "incorrect";
    }
    breakdownList!.appendChild(li);
  });
  let feedback = "";
  const resultIcon = document.querySelector("#resultIcon span") as HTMLDivElement;
  const feedbackText = document.getElementById("feedbackText");
  if (result.score === 0) {
    resultIcon.setAttribute("data-lucide", "circle-alert");
    resultIcon.setAttribute("color", "#FF4500");
    createIcons({
      icons: { CircleAlert }
    });
    feedback = "A Poor Result! Keep practicing! You'll get better";
    feedbackText!.classList.add("notOk");
  } else if (result.score >= result.total / 2 && result.score < result.total) {
    resultIcon.setAttribute("data-lucide", "thumbs-up");
    resultIcon.setAttribute("color", "#17A589");
    createIcons({
      icons: { ThumbsUp }
    });
    feedback = "Good job! You're on the right track.";
    feedbackText!.classList.add("ok");
    
  } else if (result.score >= 1 && result.score < result.total / 2) {
    resultIcon.setAttribute("data-lucide", "");
    resultIcon.textContent = "😢";
    
    resultIcon.style.fontSize = `var(--text-4xl)`;
    feedback = "Keep practicing! You'll get better";
    feedbackText!.classList.add("notOk");
    
  } else if (result.score === result.total) {
    resultIcon.setAttribute("data-lucide", "crown");
    resultIcon.setAttribute("color", "#ffc107");
    createIcons({
      icons: { Crown }
    });
    feedback = "Perfect Score! You're a genius!🎉";
    feedbackText!.classList.add("notOk");
    
  }
  document.getElementById("scoreText")!.textContent = `You scored ${result.score} out of ${result.total} (${Math.floor((result.score / result.total) * 100)}%)`;
  document.getElementById("feedbackText")!.textContent = feedback;
  showSection("results");
}

export function exitQuiz(): void {
  setSession(null);
  (document.getElementById("startQuizButton") as HTMLButtonElement).disabled = false;
  showSection("config");
}

window.addEventListener("beforeunload", (e) => {
  if (session?.isActive) e.preventDefault();
});

function addQuizKeyboardListeners(): void {
  
  
  document.addEventListener("keydown", (e) => {
    
    handleQuizKeyboard(e);
  });
}

function removeQuizKeyboardListeners(): void {
  document.removeEventListener("keydown", (e) => {
    handleQuizKeyboard(e);
  });
}