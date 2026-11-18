
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Supabase database connection
const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
const supabaseKey = process.env.SUPABASE_KEY?.trim();

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase connection configured.");
} else {
  console.log("Supabase credentials are missing.");
}

// Quiz question bank
const questions = [
  {
    id: 1,
    question: "Which language is used to create the structure of a web page?",
    options: ["CSS", "HTML", "Python", "Java"],
    answer: 1
  },
  {
    id: 2,
    question: "Which language is used to style a web page?",
    options: ["HTML", "Java", "CSS", "C++"],
    answer: 2
  },
  {
    id: 3,
    question: "What does CPU stand for?",
    options: [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Program Utility",
      "Control Processing User"
    ],
    answer: 0
  },
  {
    id: 4,
    question: "Which company developed JavaScript?",
    options: ["Microsoft", "Netscape", "Google", "Apple"],
    answer: 1
  },
  {
    id: 5,
    question: "Which of these is a database?",
    options: ["HTML", "CSS", "Supabase", "Windows"],
    answer: 2
  },
  {
    id: 6,
    question: "Which language is mainly used for web page styling?",
    options: ["Python", "CSS", "Java", "C"],
    answer: 1
  },
  {
    id: 7,
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Text Machine Language",
      "Hyper Transfer Markup Language",
      "Home Tool Markup Language"
    ],
    answer: 0
  },
  {
    id: 8,
    question: "Which symbol is used for single-line comments in JavaScript?",
    options: ["##", "//", "<!--", "**"],
    answer: 1
  },
  {
    id: 9,
    question: "Which organization manages the Python language?",
    options: [
      "Microsoft",
      "Apple",
      "Python Software Foundation",
      "Google"
    ],
    answer: 2
  },
  {
    id: 10,
    question: "Which of these is an operating system?",
    options: ["Windows", "HTML", "CSS", "MySQL"],
    answer: 0
  },
  {
    id: 11,
    question: "What does RAM stand for?",
    options: [
      "Read Access Memory",
      "Random Access Memory",
      "Run Access Machine",
      "Real Application Memory"
    ],
    answer: 1
  },
  {
    id: 12,
    question: "Which language is used for database queries?",
    options: ["SQL", "HTML", "CSS", "XML"],
    answer: 0
  },
  {
    id: 13,
    question: "Which tag is used to create a paragraph in HTML?",
    options: ["<h1>", "<img>", "<p>", "<br>"],
    answer: 2
  },
  {
    id: 14,
    question: "Which of these is used to store data?",
    options: ["Database", "Monitor", "Keyboard", "Mouse"],
    answer: 0
  },
  {
    id: 15,
    question: "What does URL stand for?",
    options: [
      "Uniform Resource Locator",
      "Universal Record Link",
      "User Reference Location",
      "Uniform Read Language"
    ],
    answer: 0
  }
];

// Select 5 random questions
function getRandomQuestions() {
  const shuffled = [...questions];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, 5);
}

// Send random questions without correct answers
app.get("/api/questions", (req, res) => {
  const selectedQuestions = getRandomQuestions();

  const safeQuestions = selectedQuestions.map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));

  res.json(safeQuestions);
});

// Submit quiz and calculate score
app.post("/api/submit", async (req, res) => {
  try {
    const { answers, questionIds, playerName } = req.body;

    // Validate player name
    if (
      typeof playerName !== "string" ||
      playerName.trim().length < 1 ||
      playerName.trim().length > 50
    ) {
      return res.status(400).json({
        error: "Enter a valid name"
      });
    }

    // Validate answers and question IDs
    if (
      !Array.isArray(answers) ||
      !Array.isArray(questionIds) ||
      answers.length !== 5 ||
      questionIds.length !== 5
    ) {
      return res.status(400).json({
        error: "Invalid quiz submission"
      });
    }

    // Check that question IDs are valid and unique
    const selectedQuestions = questionIds.map((id) =>
      questions.find((q) => q.id === id)
    );

    if (
      selectedQuestions.some((q) => !q) ||
      new Set(questionIds).size !== 5
    ) {
      return res.status(400).json({
        error: "Invalid question selection"
      });
    }

    // Validate answer indexes
    if (
      answers.some(
        (answer, index) =>
          !Number.isInteger(answer) ||
          answer < 0 ||
          answer >= selectedQuestions[index].options.length
      )
    ) {
      return res.status(400).json({
        error: "Invalid answer selection"
      });
    }

    // Calculate score
    const score = selectedQuestions.reduce((total, q, index) => {
      return total + (answers[index] === q.answer ? 1 : 0);
    }, 0);

    let saved = false;

    // Save result in Supabase
    if (supabase) {
      const { error } = await supabase
        .from("quiz_results")
        .insert([
          {
            player_name: playerName.trim(),
            score: score,
            total_questions: selectedQuestions.length
          }
        ]);

      if (error) {
        console.error("Database error:", error.message);
      } else {
        saved = true;
      }
    }

    // Send result to browser
    res.json({
      playerName: playerName.trim(),
      score: score,
      total: selectedQuestions.length,
      saved: saved
    });

  } catch (error) {
    console.error("Quiz submission error:", error);

    res.status(500).json({
      error: "Something went wrong"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`QuizMaster running on port ${PORT}`);
});
