import { NextApiRequest, NextApiResponse } from 'next';

// In-memory storage for the question and answer
let currentQuestion: {
  id: string;
  question: string;
  first: string;
  second: string;
} | null = null;

let userAnswer: string | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Python script sends the question and choices
    const { question, first, second } = req.body;

    // Generate a unique ID for the question
    const questionId = Math.random().toString(36).substring(7);

    // Store the question
    currentQuestion = {
      id: questionId,
      question,
      first,
      second,
    };

    // Wait for the user to answer (long-polling)
    while (userAnswer === null) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Poll every second
    }

    // Send the answer back to the Python script
    res.status(200).json({ answer: userAnswer });

    // Reset for the next question
    userAnswer = null;
    currentQuestion = null;
  } else if (req.method === 'GET') {
    // React app fetches the question
    if (!currentQuestion) {
      return res.status(404).json({ message: 'No question available' });
    }

    res.status(200).json(currentQuestion);
  } else if (req.method === 'PUT') {
    // React app sends the selected answer
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
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
