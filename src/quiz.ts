import type {Breakdown, Question, QuizConfig, Result,} from "./types";
import {calculateTimer,} from "./utils/quiz.ts";
import {addQuizKeyboardListeners, removeQuizKeyboardListeners} from "./events.ts";
import {
    renderNavButtons,
    renderResultsDOM,
    showConfirmationModal,
    updateAnswerIndicatorDOM,
    updateProgressBar,
    updateQuestionDOM,
    updateSelectionIndicatorDOM,
    updateTimerDOM
} from "./render.ts";
import {questionCounterEl, questionTextEl, timerEl, totalQuestionEl} from "./dom.ts";

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
            },
        });
    }
    
    private startTimer(): void {
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            updateTimerDOM(this.remainingTime, timerEl);
            
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
        removeQuizKeyboardListeners()
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
                incorrect: userAnswer || "",
                userAnswer,
                isCorrect,
            });
        });
        
        return {
            breakdown,
            categoryText: this.categoryText,
            difficulty: this.difficulty,
            score,
            timeTaken: this.totalTime - this.remainingTime,
            total: this.questions.length,
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
            userAnswer,
            questionCounterEl,
            totalQuestionEl,
            questionTextEl
        );
    }
}
