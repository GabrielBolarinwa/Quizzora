import {
  categoriesDropdown,
  exitQuiz,
  exitQuizButton,
  nextButton,
  optionsList,
  previousButton,
  questionNumber,
  quitQuizButton,
  quizForm,
  QuizSession,
  renderRulesTimer,
  replayQuizButton,
  requestSubmitButton,
  showSection,
  startQuizButton,
  validateForm,
} from "./quiz.ts";
import type { Difficulty, Question, QuizConfig, RawQuestion } from "./types";
import { session, setSession } from "./session.ts";
import { eventListener, shuffle } from "./utils";

export default function events(): void {
  eventListener(quizForm, "submit", async (e) => {
    e.preventDefault();
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
      const quiz = await fetch(apiURL)
        .then((data) => data.json())
        .catch((e) => {
          console.error(e);
          window.alert("Failed to fetch quiz, please check your connection");
          startQuizButton.disabled = false;
          startQuizButton.textContent = "Start Quiz";
        });
      const questions: Question[] = quiz.results.map((q: RawQuestion) => ({
        ...q,
        options: shuffle([...q.incorrect_answers, q.correct_answer]),
      }));
      setSession(new QuizSession(config, questions));
      startQuizButton.disabled = false;
      startQuizButton.textContent = "Start Quiz";
      renderRulesTimer(session?.getCalculatedTime() as number);
      showSection("rules");
    }
  });

  eventListener(startQuizButton, "click", () => {
    session?.start();
    showSection("quiz");
    optionsList.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.type === "radio") {
        session?.selectAnswer(target.value);
      }
    });
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
