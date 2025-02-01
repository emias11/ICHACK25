import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let currentTheme: string | null = null;
let currentQuestion: {
  id: string;
  question: string;
  choices: Record<string, string>;
} | null = null;
let userAnswer: string | null = null;
let results: Record<string, { correct: boolean; explanation: string }> = {};

// Get current theme
app.get('/leetcode_question', (req: Request, res: Response) => {
  if (!currentTheme) {
    return res.status(404).json({ message: 'No theme selected' });
  }
  res.json({ theme: currentTheme });
});

// Get current question
app.get('/current-question', (req: Request, res: Response) => {
  if (!currentQuestion) {
    return res.status(404).json({ message: 'No question available' });
  }
  res.json(currentQuestion);
});

// Python script sends the question
app.post('/prompts/choices', (req: Request, res: Response) => {
  const { question, choices } = req.body;
  const questionId = Math.random().toString(36).substring(7);
  
  currentQuestion = {
    id: questionId,
    question,
    choices,
  };
  
  res.status(200).json({ questionId });
});

// Handle user answer
app.post('/answer', (req: Request, res: Response) => {
  const { questionId, answer } = req.body;
  
  if (!questionId || !answer) {
    return res.status(400).json({ message: 'Missing questionId or answer' });
  }
  
  userAnswer = answer;
  res.status(200).json({ success: true });
});

// Get result for a specific question
app.get('/result/:questionId', (req: Request, res: Response) => {
  const { questionId } = req.params;
  const result = results[questionId];
  
  if (!result) {
    return res.status(404).json({ message: 'Result not found' });
  }
  
  res.json(result);
});

// Python script sends the result
app.post('/result', (req: Request, res: Response) => {
  const { questionId, correct, explanation } = req.body;
  
  if (!questionId || correct === undefined || !explanation) {
    return res.status(400).json({ message: 'Missing questionId, correct, or explanation' });
  }
  
  results[questionId] = { correct, explanation };
  res.status(200).json({ success: true });
});

// Handle theme selection
app.post('/select_theme', (req: Request, res: Response) => {
  const { theme } = req.body;
  
  if (!theme) {
    return res.status(400).json({ message: 'Missing theme' });
  }
  
  currentTheme = theme;
  res.status(200).json({ success: true });
});

app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
