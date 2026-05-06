import { CircleX, createIcons, SunMoon } from "lucide";
import type { Result, Theme } from "./types";

createIcons({
  icons: {
    SunMoon,
    CircleX
  }
});

document.getElementById("themeButton")?.addEventListener("click", () => {
  if (document.body.classList.contains("light")) setTheme("Dark");
  else if (document.body.classList.contains("dark")) setTheme("Auto");
  else setTheme("Light");
});

let themeSetting = localStorage.getItem("themeSetting") as Theme;

function setTheme(theme: Theme) {
  themeSetting = theme;
  if (themeSetting === "Dark") {
    if (document.body.classList.contains("light")) {
      document.body.classList.replace("light", "dark");
    } else {
      document.body.classList.add("dark");
    }
  } else if (themeSetting == "Light") {
    if (document.body.classList.contains("dark")) {
      document.body.classList.replace("dark", "light");
    } else {
      document.body.classList.add("light");
    }
  } else if (themeSetting == "Auto") {
    document.body.classList.remove("light", "dark");
  }
  
  localStorage.setItem("themeSetting", themeSetting);
}

setTheme(themeSetting);

const sectionTitle = document.querySelector(
  ".section_header"
) as HTMLDivElement;
const featureCards = document.querySelectorAll(
  ".feature-card"
) as NodeListOf<HTMLDivElement>;

function addAnimationClass(element: HTMLElement) {
  const animationObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      let entry = e.target as HTMLElement;
      if (e.isIntersecting) {
        let animationClass = entry.getAttribute("data-animation") as string;
        entry.classList.add(animationClass);
      }
    });
  });
  animationObserver.observe(element);
}

window.addEventListener("load", () => {
  featureCards.forEach((card) => {
    addAnimationClass(card);
  });
  addAnimationClass(sectionTitle);
});

const lastQuiz = localStorage.getItem("lastQuiz");
if (lastQuiz) {
  let lastQuizData = JSON.parse(lastQuiz) as Result;
  let fullLastResult = document.createElement("div");
  fullLastResult.classList.add("full_last_result");
  fullLastResult.innerHTML = `
  <div class="result_meta">
<p>${lastQuizData.category} Quiz</p>
<p>Difficulty: ${lastQuizData.difficulty}</p>
<p>You scored ${lastQuizData.score} out of ${lastQuizData.total}</p>
</div>
<div class="result_breakdown">
<h4>Result Breakdown</h4>
<ul>
</ul>
</div>
  `;
  const resultBreakdownList = fullLastResult.querySelector(".result_breakdown ul");
  lastQuizData.breakdown.forEach(breakdown => {
    let resultBreakdownListItem = document.createElement("li");
    resultBreakdownListItem.textContent = `Question ${breakdown.question}: ${breakdown.isCorrect ? `Correct ✅` : `Incorrect ❌ (Correct Answer: ${breakdown.correctAnswer})`}`;
    breakdown.isCorrect ? resultBreakdownListItem.className = "correct" : resultBreakdownListItem.className = "incorrect";
    resultBreakdownList?.appendChild(resultBreakdownListItem);
  });
  let resultWidget = document.createElement("div");
  resultWidget.classList.add("last_result_widget");
  resultWidget.innerHTML = `
    Last Result: ${lastQuizData.score} / ${lastQuizData.total} out of ${lastQuizData.total} <button onclick="this.parentElement.style.display='none'"><span data-lucide="circle-x"></span></button>
  `;
  resultWidget.onclick = () => {
    displayFullResult();
  };
  document.body.append(fullLastResult, resultWidget);
}

function displayFullResult() {
  const fullResult = document.querySelector(".full_last_result") as HTMLDivElement;
  if (fullResult) {
    fullResult.style.display = "block";
  }
}

(document.getElementById("yearText") as HTMLSpanElement).innerText = new Date().getFullYear().toString();