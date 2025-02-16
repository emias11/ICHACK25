import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let pendingPromptResponses: Array<{res: Response, questionData: any}> = [];
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
  res.json({ question: currentTheme });
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
  pendingPromptResponses.push({
      res: res,
      questionData: req.body
    });

  const { question, choices } = req.body;
  console.log("Received new question at choices endpoint!");
  // Generate a unique ID for the question
  const questionId = Math.random().toString(36).substring(7);

  // Store the question
  currentQuestion = {
    id: questionId,
    question,
    choices,
  };

  userAnswer = null;

  // Wait for the user to answer (long-polling)
  const waitForAnswer = async () => {
    while (userAnswer === null) {
      // console.log("spinning wait for answer is null...")
      await new Promise((resolve) => setTimeout(resolve, 100)); // Poll 10 times a second
    }

    // Send the question ID back to the Python script
    console.log("Sending answer to user: ", userAnswer);
    res.status(200).json({ answer: userAnswer });

  };

  waitForAnswer();
});

// Handle user answer
app.post('/answer', (req: Request, res: Response) => {
  const { questionId, answer } = req.body;

  if (!answer) {
    return res.status(400).json({ message: 'Missing questionId or answer' });
  }
  
  userAnswer = answer;
  console.log("setting answer variable to : ", answer);
  res.status(200).json({ success: true });
});

// Get result for a specific question
app.get('/result/:questionId', (req: Request, res: Response) => {
  console.log("probing result...");
  const { questionId } = req.params;
  const result = results[questionId];
  
  if (!result) {
    return res.status(404).json({ message: 'Result not found' });
  }
  
  res.json(result);
});

// Python script sends the result
app.post('/result', (req: Request, res: Response) => {
  const { correct, explanation } = req.body;

  console.log("Received result!")

  if (correct === undefined || !explanation) {
    return res.status(400).json({ message: 'Missing correct or explanation' });
  }

  // Store the result for the most recent question
  if (currentQuestion) {
    results[currentQuestion.id] = { correct, explanation };
    res.status(200).json({ success: true });
  } else {
    res.status(404).json({ message: 'No current question found' });
  }

  // Reset for the next question
  console.log("Resetting user answer to null");
  userAnswer = null;
  currentQuestion = null;
});

// Handle theme selection
// Around line 190 in server.ts
app.post('/select_theme', (req: Request, res: Response) => {
  const { theme } = req.body;

  if (!theme) {
    return res.status(400).json({ message: 'Missing theme' });
  }
  
    
  // const smallDelay = async () => {
    // await new Promise(resolve => setTimeout(resolve, 1000));
  // }

  // console.log("Resetting user answer to null after 1 second...");
  // smallDelay()
  currentTheme = theme;
  currentQuestion = null;
  // userAnswer = null;

  // Send "exit" to any pending requests
  // if (pendingPromptResponses.length > 0) {
    // pendingPromptResponses.forEach(({res}) => {
      // console.log("Replying exit during auxiliary loop!");
      // res.json({ answer: 'exit' });
    // });
    // pendingPromptResponses = [];
  // }
  
  res.status(200).json({ success: true });
});
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});
