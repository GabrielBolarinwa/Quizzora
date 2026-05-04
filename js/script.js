const infoBox = document.getElementById("rules");
const quizBox = document.getElementById("quiz_box");
const timerText = document.getElementById("time");
const question = document.querySelector(".question");
const resultBox = document.getElementById("result");
const indexNumber = document.getElementById("currentNumber");
const options = document.querySelectorAll(".option input[type=radio]");
const scoreText = document.getElementById("score_text");
const resultIcon = document.getElementById("result-icon");
const questionCount = document.getElementById("totalCount");
const originalClasses = resultIcon.className;
const progressFill = document.getElementById("progress_fill");
const feedBackText = document.getElementById("feedback_message");
const prevBtn = document.getElementById("previous");
const nextBtn = document.getElementById("next");
const optionList = document.getElementById("option_list");

const questionSwitchContainer = document.getElementById(
  "question-switch-buttons",
);
const questions = [
  {
    question: "Which language runs in a web browser",
    options: ["Java", "C", "Python", "JavaScript"],
    correctAnswer: "JavaScript",
  },
  {
    question: "What does CSS stand for",
    options: [
      "Central Style Sheets",
      "Cascading Style Sheets",
      "Cascading Simple Sheets",
      "Cars SUVs Sailboats",
    ],

    correctAnswer: "Cascading Style Sheets",
  },
  {
    question: "What does HTML stand for",
    options: [
      "HyperText Markup Language",
      "HyperText Markdown Language",
      "Hyperloop Machine Language",
      "Helicopters Terminals Motorcycles Lamborghini",
    ],
    correctAnswer: "HyperText Markup Language",
  },
  {
    question: "What year was JavaScript launched",
    options: ["1996", "1995", "1994", "none of the above"],
    correctAnswer: "1995",
  },
];

let currentNumber = 1;
let totalCount = questions.length;
let secondsText;
let minutesText;
let count = 0;
let correctAnswer = 0;
let timerStart;
let userAnswers;

function displayRules() {
  infoBox.classList.add("display");
}

function hideResult() {
  resultBox.classList.remove("showResult");
}

function renderQuestionSwitches() {
  questions.forEach((question, index) => {
    const switchButton = document.createElement("button");
    switchButton.innerText = `${(index + 1).toString()}`;
    console.log(switchButton.textContent);

    switchButton.setAttribute("onclick", `changeQuestion(${index})`);
    questionSwitchContainer.appendChild(switchButton);
  });
}

function showQuiz() {
  quizBox.classList.add("display");
  count = 0;
  currentNumber = 1;
  indexNumber.textContent = currentNumber;
  progressFill.style.width = "0";
  infoBox.classList.remove("display");
  questionSwitchContainer.innerHTML = "";
  correctAnswer = 0;
  resultIcon.className = originalClasses;
  resultIcon.innerHTML = "";
  userAnswers = new Map();
  userAnswers.clear();

  optionList.addEventListener("change", (e) => {
    console.log(e.target.value);

    userAnswers.set(count, e.target.value);
  });
  questionCount.textContent = `${totalCount}`;
  timerText.textContent = "03:00";
  let initialTime = new Date(100);
  let finalTime = new Date(180100);
  let timeDifference = finalTime - initialTime;
  setTimeout(function () {
    timerStart = setInterval(() => {
      timeDifference = timeDifference - 1000;
      if (timeDifference <= 0) {
        clearInterval(timerStart);
        quizBox.classList.remove("display");
        showResult();
      } else {
        let seconds = Math.floor((timeDifference / 1000) % 60);
        let minutes = Math.floor(timeDifference / 1000 / 60);
        secondsText = seconds.toString().padStart(2, "0");
        minutesText = minutes.toString().padStart(2, "0");
        timerText.textContent = `${minutesText}:${secondsText}`;
      }
    }, 1000);
  }, 1000);
  renderQuestionSwitches();

  initializeQuestionSwitch();
  hideResult();
  questionControl();
  updateProgressBar();
  renderQuestion(count, userAnswers.get(count));
}

function initializeQuestionSwitch() {
  if (questions.length > 0) {
    renderQuestion(count, userAnswers.get(count));
  }
}

function questionControl() {
  if (count === totalCount) {
    clearInterval(timerStart);
    quizBox.classList.remove("display");
    compileResult();
  }
  if (count === totalCount - 1) {
    nextBtn.textContent = "End Quiz";
  } else {
    nextBtn.innerHTML = `<span class="button-big">Next</span>
    <span class="button-small fa fa-chevron-right"></span>`;
  }
  if (count === 1) {
    prevBtn.style.visibility = "visible";
  } else if (count === 0) {
    prevBtn.style.visibility = "hidden";
  }
  if (count !== totalCount) {
    renderQuestion(count, userAnswers.get(count));
  }
}

function previousQuestion() {
  count--;
  currentNumber--;
  indexNumber.textContent = currentNumber;
  deselectOptions();
  questionControl();
  updateProgressBar();
}

function nextQuestion() {
  count++;
  currentNumber++;
  indexNumber.textContent = currentNumber;
  deselectOptions();
  questionControl();
  updateProgressBar();
}

function deselectOptions() {
  const options = document.querySelectorAll(".option input[type=radio]");
  options.forEach((opt) => {
    opt.checked = false;
  });
}

function compileResult() {
  const options = document.querySelectorAll(".option input[type=radio]");
  const breakdown = [];
  questions.forEach((question, index) => {
    const userAnswer = userAnswers.get(index);
    const isCorrect = userAnswer === question.correctAnswer;
    if (isCorrect) correctAnswer++;
    const breakdownItem = {
      question: question.question,
      correct: question.correctAnswer,
      isCorrect,
    };
    if (!breakdown.includes(breakdownItem)) {
      breakdown.push(breakdownItem);
      console.log(breakdown);
    }
  });
  showResult(breakdown);
}

function updateProgressBar() {
  let progressPercent = (currentNumber / totalCount) * 100;
  progressFill.style.width = `${progressPercent}%`;
}

function renderQuestion(count, userAnswer) {
  const question = questions[count];
  const questionName = document.getElementById("question_text");
  questionName.textContent = question.question;
  optionList.innerHTML = "";
  question.options.forEach((option, index) => {
    const input = document.createElement("input");
    const label = document.createElement("label");
    input.value = option;
    input.type = "radio";
    input.name = "option";
    input.id = `option-${index}`;
    label.textContent = option;
    label.htmlFor = `option-${index}`;
    console.log(option, userAnswer);

    input.checked = option === userAnswer;
    const optionDiv = document.createElement("div");
    optionDiv.classList.add("option");
    optionDiv.append(input, label);
    optionList.appendChild(optionDiv);
  });
}

function changeQuestion(questionNumber) {
  count = questionNumber;
  currentNumber = questionNumber;
  indexNumber.textContent = currentNumber;

  questionControl();
  updateProgressBar();
}

function showResult(breakdown) {
  const breakdownDiv = document.getElementById("answer_breakdown");
  breakdown.forEach((item, index) => {
    const li = document.createElement("li");
    if (item.isCorrect) {
      li.textContent = `✅ Question ${index + 1}: Correct`;
      li.className = "correct";
    } else {
      li.textContent = `❌ Question ${index + 1} (Correct answer: ${item.correct})`;
      li.className = "incorrect";
    }
    breakdownDiv.appendChild(li);
  });
  let feedback = "";
  if (correctAnswer === 0) {
    resultIcon.classList.add("fa-exclamation");
    feedback = "A Poor Result! Keep practicing! You'll get better";
    feedBackText.style.color = "red";
  } else if (correctAnswer >= totalCount / 2 && correctAnswer < totalCount) {
    resultIcon.classList.add("fa-thumbs-up");
    feedback = "Good job! You're on the right track.";
    feedBackText.style.color = "#2ecc71";
  } else if (correctAnswer >= 1 && correctAnswer < totalCount / 2) {
    resultIcon.textContent = "😢";
    feedback = "Keep practicing! You'll get better";
    feedBackText.style.color = "#e76518";
  } else if (correctAnswer === totalCount) {
    resultIcon.classList.add("fa-crown");
    feedback = "Perfect Score! You're a genius!🎉";
    feedBackText.style.color = "lime";
  }
  scoreText.textContent = `You scored ${correctAnswer} out of ${totalCount}`;
  document.getElementById("feedback_message").textContent = feedback;
  resultBox.classList.add("showResult");
}
