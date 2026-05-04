const quizData = [
  {
    question: "Which language runs in a web browser",
    a: "Java",
    b: "C",
    c: "Python",
    d: "JavaScript",
    correctIndex: "d",
  },
  {
    question: "What does CSS stand for",
    a: "Central Style Sheets",
    b: "Cascading Style Sheets",
    c: "Cascading Simple Sheets",
    d: "Cars SUVs Sailboats",
    correctIndex: "b",
  },
  {
    question: "What does HTML stand for",
    a: "HyperText Markup Language",
    b: "HyperText Markdown Language",
    c: "Hyperloop Machine Language",
    d: "Helicopters Terminals Motorcycles Lamborgini",
    correctIndex: "a",
  },
  {
    question: "What year was JavaScript launched",
    a: "1996",
    b: "1995",
    c: "1994",
    d: "none of the above",
    correctIndex: "b",
  },
];
const quiz = document.getElementById("quiz");
const answerEls = document.querySelectorAll(".answer");
const questionEl = document.getElementById("question");
const a_text = document.getElementById("a_text");
const b_text = document.getElementById("b_text");
const c_text = document.getElementById("c_text");
const d_text = document.getElementById("d_text");
const submitBtn = document.getElementById("submit");
let currentQuiz = 0;
let score = 0;
loadQuiz();
function loadQuiz() {
  // deselectAnswers()
  const currentQuizData = quizData[currentQuiz];
  questionEl.innerText = currentQuizData.question;
  a_text.innerText = currentQuizData.a;
  b_text.innerText = currentQuizData.b;
  c_text.innerText = currentQuizData.c;
  d_text.innerText = currentQuizData.d;
}

/*function deselectAnswers() {
  answerEls.forEach(function (answerEls) {
    answerEls.checked = false
  });
}*/
function getSelected() {
  let answer;
  answerEls.forEach(function (answerEl) {
    console.log(answerEl.id);
    if (answerEl.checked) {
      console.log(answerEl.id);
      answer = answerEl.id;
    }
  });
  return answer;
}

submitBtn.addEventListener("click", function (_e) {
  let answer;
  answerEls.forEach(function (answerEl) {
    if (answerEl.checked) {
      answer = answerEl.id;
      console.log(answer);
    }
  });
  if (answer) {
    console.log(answer);
    currentQuiz++;
    console.log(currentQuiz);
    try {
      if (answer === quizData[currentQuiz].correctIndex) {
        score++;
      }
    } catch (e) {
      console.log(e);
    }

    if (currentQuiz < quizData.length) {
      loadQuiz();
    } else {
      quiz.innerHTML = `
        <h2>You answered ${score}/${quizData.length} correctly</h2>
        <button onclick="location.reload()">Reload</button>
      `;
    }
  }
});

document.addEventListener("DOMContentLoaded", getSelected());
