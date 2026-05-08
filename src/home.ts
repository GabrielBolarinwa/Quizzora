import {CircleX, createIcons, SunMoon} from "lucide";
import type {Result, Theme} from "./types";

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
    ".feature_card"
) as NodeListOf<HTMLDivElement>;

function addAnimationClass(element: HTMLElement) {
    element.classList.add("opacity-0", "invisible");
    const animationObserver = new IntersectionObserver((entries) => {
        
        entries.forEach((e) => {
            let entry = e.target as HTMLElement;
            if (e.isIntersecting) {
                let animationClass = entry.getAttribute("data-animation") as string;
                entry.classList.remove("opacity-0", "invisible");
                entry.classList.add(animationClass)
            }
        });
    }, {threshold: 0.6});
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
    fullLastResult.classList.add("full_last_result", "animate-zoom-in");
    fullLastResult.innerHTML = `
<button class="absolute top-3 right-3" aria-label="Close Last Result" onclick="this.parentElement.style.display = 'none'"><span data-lucide="circle-x"></span></button>
  <div class="result_meta">
<h2>${lastQuizData.categoryText} Quiz</h2>
<p>Difficulty: ${lastQuizData.difficulty}</p>
<p>You scored ${lastQuizData.score} out of ${lastQuizData.total}</p>
</div>
<details class="result_breakdown" open>
<summary>Result Breakdown</summary>
<ul class="max-h-[50vh] overflow-y-auto">
</ul>
</details>
  `;
    const resultBreakdownList = fullLastResult.querySelector(".result_breakdown ul");
    lastQuizData.breakdown.forEach((breakdown, index) => {
        let resultBreakdownListItem = document.createElement("li");
        resultBreakdownListItem.textContent = `Question ${index + 1}: ${breakdown.isCorrect ? `Correct ✅` : `Incorrect ❌ (Correct Answer: ${breakdown.correct})`}`;
        breakdown.isCorrect ? resultBreakdownListItem.className = "correct" : resultBreakdownListItem.className = "incorrect";
        resultBreakdownList?.appendChild(resultBreakdownListItem);
    });
    let resultWidget = document.createElement("div");
    resultWidget.classList.add("last_result_widget");
    resultWidget.innerHTML = `
    <span id="score">Last Result: ${lastQuizData.score} out of ${lastQuizData.total}</span> <button onclick="localStorage.removeItem('lastQuiz');this.parentElement.style.display='none'" aria-label="Close Last Result"><span data-lucide="circle-x"></span></button>
  `;
    (resultWidget.querySelector("#score") as HTMLSpanElement).onclick = () => {
        displayFullResult();
    };
    document.body.append(fullLastResult, resultWidget);
    createIcons({
        icons: {CircleX}
    });
}

function displayFullResult() {
    const fullResult = document.querySelector(".full_last_result") as HTMLDivElement;
    if (fullResult) {
        fullResult.style.display = "block";
    }
}

(document.getElementById("yearText") as HTMLSpanElement).innerText = new Date().getFullYear().toString();

