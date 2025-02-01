import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3001; // Port for the Express server

// Middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // Parse JSON bodies

// In-memory storage for the question and answer
let currentQuestion: {
  id: string;
  question: string;
  choices: string[];
} | null = null;

let userAnswer: string | null = null;
let explanation: string | null = null;

// POST endpoint: Python script sends the question
app.post('/prompt/choices', (req: Request, res: Response) => {
  const { question, choices } = req.body;

  // Generate a unique ID for the question
  const questionId = Math.random().toString(36).substring(7);

  // Store the question
  currentQuestion = {
    id: questionId,
    question,
    choices,
  };

  // Wait for the user to answer (long-polling)
  const waitForAnswer = async () => {
    while (userAnswer === null) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second
    }

    // Send the answer back to the Python script
    res.json({ answer: userAnswer, explanation });

    // Reset for the next question
    userAnswer = null;
    currentQuestion = null;
    explanation = null;
  };

  waitForAnswer();
});

// GET endpoint: React app fetches the question
app.get('/prompt/choices', (req: Request, res: Response) => {
  if (!currentQuestion) {
    return res.status(404).json({ message: 'No question available' });
  }

  res.json(currentQuestion);
});

// PUT endpoint: React app sends the selected answer
app.put('/prompt/choices', (req: Request, res: Response) => {
  const { questionId, answer } = req.body;

  if (!questionId || !answer) {
    return res.status(400).json({ message: 'Missing questionId or answer' });
  }

  if (currentQuestion && currentQuestion.id === questionId) {
    userAnswer = answer;
    explanation = `Explanation for choosing ${answer}`; // Replace with actual explanation logic
    res.json({ success: true });
  } else {
    res.status(404).json({ message: 'Question not found' });
  }
});

// GET endpoint: React app fetches the explanation
app.get('/explanation', (req: Request, res: Response) => {
  if (!explanation) {
    return res.status(404).json({ message: 'No explanation available' });
  }

  res.json({ explanation });
});

// Start the server
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
