// server.ts
import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3001; // Port for the Express server

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON bodies

// In-memory storage for the question and answer
let currentTheme: string | null = null; // Store the selected theme
let currentQuestion: {
  id: string;
  question: string;
  choices: Record<string, string>;
} | null = null;

let userAnswer: string | null = null;
let result: { correct: boolean; explanation: string } | null = null;

// GET endpoint: Python script fetches the selected theme
app.get('/leetcode_question', (req: Request, res: Response) => {
  if (!currentTheme) {
    return res.status(404).json({ message: 'No theme selected' });
  }

  res.json({ theme: currentTheme });
});

// POST endpoint: Python script sends the question and choices
app.post('/prompts/choices', (req: Request, res: Response) => {
  const { question, choices } = req.body;

  // Generate a unique ID for the question
  const questionId = Math.random().toString(36).substring(7);

  // Store the question
  currentQuestion = {
    id: questionId,
    question,
    choices,
  };

  console.log("Received question")

  // Wait for the user to answer (long-polling)
  const waitForAnswer = async () => {
    while (userAnswer === null) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second
    }

    // Send the question ID back to the Python script
    res.status(200).json({ questionId });

    // Reset for the next question
    userAnswer = null;
    currentQuestion = null;
  };

  waitForAnswer();
});

// POST endpoint: React app sends the selected answer
app.post('/answer', (req: Request, res: Response) => {
  const { questionId, answer } = req.body;

  if (!questionId || !answer) {
    return res.status(400).json({ message: 'Missing questionId or answer' });
  }

  if (currentQuestion && currentQuestion.id === questionId) {
    userAnswer = answer;
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ message: 'Question not found' });
  }
});

// POST endpoint: Python script sends the result (correctness and explanation)
app.post('/result', (req: Request, res: Response) => {
  const { questionId, correct, explanation } = req.body;

  if (!questionId || correct === undefined || !explanation) {
    return res.status(400).json({ message: 'Missing questionId, correct, or explanation' });
  }

  // Store the result
  result = { correct, explanation };
  res.status(200).json({ success: true });
});

// POST endpoint: React app sends the selected theme
app.post('/select_theme', (req: Request, res: Response) => {
  const { theme } = req.body;

  if (!theme) {
    return res.status(400).json({ message: 'Missing theme' });
  }

  currentTheme = theme;
  res.status(200).json({ success: true });
});

// Start the server
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
