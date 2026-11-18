
// Get HTML elements
const welcomeScreen = document.getElementById("welcome-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const nameInput = document.getElementById("player-name");
const startButton = document.getElementById("start-btn");
const nextButton = document.getElementById("next-btn");
const restartButton = document.getElementById("restart-btn");

const questionNumber = document.getElementById("question-number");
const progressText = document.getElementById("progress-text");
const progressFill = document.getElementById("progress-fill");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");

const resultMessage = document.getElementById("result-message");
const scoreText = document.getElementById("score-text");
const saveStatus = document.getElementById("save-status");

// Quiz data
let questions = [];
let currentQuestion = 0;
let selectedAnswer = null;
let answers = [];
let playerName = "";

// Start quiz
startButton.addEventListener("click", async () => {
  playerName = nameInput.value.trim();

  if (playerName === "") {
    alert("Please enter your name!");
    return;
  }

  startButton.disabled = true;
  startButton.textContent = "Loading...";

  try {
    const response = await fetch("/api/questions");

    if (!response.ok) {
      throw new Error("Could not load questions");
    }

    questions = await response.json();

    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error("Could not load 5 questions");
    }

    currentQuestion = 0;
    selectedAnswer = null;
    answers = [];

    welcomeScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    showQuestion();

  } catch (error) {
    alert("Unable to load quiz. Please try again.");
    console.error(error);

  } finally {
    startButton.disabled = false;
    startButton.textContent = "Start Quiz";
  }
});

// Display question
function showQuestion() {
  const question = questions[currentQuestion];

  selectedAnswer = null;

  questionNumber.textContent =
    `Question ${currentQuestion + 1} of ${questions.length}`;

  const progress = (currentQuestion / questions.length) * 100;

  progressText.textContent = `${Math.round(progress)}%`;
  progressFill.style.width = `${progress}%`;

  questionText.textContent = question.question;

  optionsContainer.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.textContent = option;
    button.className = "option";

    button.addEventListener("click", () => {
      selectOption(index, button);
    });

    optionsContainer.appendChild(button);
  });

  nextButton.disabled = true;

  if (currentQuestion === questions.length - 1) {
    nextButton.textContent = "Submit Quiz";
  } else {
    nextButton.textContent = "Next Question";
  }
}

// Select an answer
function selectOption(index, selectedButton) {
  selectedAnswer = index;

  const allOptions = document.querySelectorAll(".option");

  allOptions.forEach((option) => {
    option.classList.remove("selected");
  });

  selectedButton.classList.add("selected");

  nextButton.disabled = false;
}

// Next question or submit quiz
nextButton.addEventListener("click", async () => {
  if (selectedAnswer === null) {
    return;
  }

  answers[currentQuestion] = selectedAnswer;

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
  } else {
    await submitQuiz();
  }
});

// Submit quiz and get result
async function submitQuiz() {
  nextButton.disabled = true;
  nextButton.textContent = "Submitting...";

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        playerName: playerName,
        questionIds: questions.map((q) => q.id),
        answers: answers
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Submission failed");
    }

    quizScreen.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    scoreText.textContent =
      `${result.score} / ${result.total}`;

    if (result.score === result.total) {
      resultMessage.textContent =
        `Excellent, ${result.playerName}! Perfect score!`;
    } else if (result.score >= Math.ceil(result.total / 2)) {
      resultMessage.textContent =
        `Well done, ${result.playerName}! Keep learning!`;
    } else {
      resultMessage.textContent =
        `Good try, ${result.playerName}! Practice more!`;
    }

    saveStatus.textContent = result.saved
      ? "Your result has been saved successfully."
      : "Quiz completed, but result could not be saved in the database.";

  } catch (error) {
    alert("Unable to submit quiz. Please try again.");
    console.error(error);

  } finally {
    nextButton.disabled = false;
    nextButton.textContent = "Submit Quiz";
  }
}

// Restart quiz
restartButton.addEventListener("click", () => {
  currentQuestion = 0;
  selectedAnswer = null;
  answers = [];
  questions = [];

  resultScreen.classList.add("hidden");
  welcomeScreen.classList.remove("hidden");

  nameInput.value = "";
  progressFill.style.width = "0%";
  progressText.textContent = "0%";
});
