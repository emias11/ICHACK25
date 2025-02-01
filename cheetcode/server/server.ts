import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = 3001;

// Middleware
app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse incoming JSON requests

// Store the question temporarily
let currentQuestion = null;

// Single POST endpoint for handling question and answer exchange
app.post('/prompt', async (req, res) => {
  const { text, answer } = req.body; // Destructure the request body

  if (answer) {
    // Step 2: Answer received, send it back to Python
    console.log(`Answer received: ${answer}`);
    return res.json({
      answer: answer, // Send the answer back to Python
      status: 'answer_received',
    });
  }

  // Step 1: No answer, send the question to the frontend
  currentQuestion = text; // Store the question in the server

  return res.json({
    question: currentQuestion, // Send the question to the frontend
    status: 'question_received',
    message: 'Please answer the question on the frontend.',
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

/* import express from 'express';
import bodyParser from 'body-parser';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

let currentQuestion = {timestamp: 0, type: "", prompt: "", answer: ""}; // Heaped current question

app.prepare().then(() => {
  const server = express();
  const PORT = 3001;

  // Middleware to parse JSON requests
  server.use(bodyParser.json());

  // Create a simple endpoint to handle POST requests from Python
  server.post('/prompt/text', (req, res) => {
    const { timestamp, text } = req.body;

    // Update the timestamp and store the text data
    currentQuestion.timestamp = timestamp;
    currentQuestion.type = "text";
    currentQuestion.prompt = text;

    res.status(200).json({ answer : "My name is 10" })
  });

  // Handle all other routes through Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start the server on the specified port
  server.listen(PORT, (err?: any) => {
    if (err) throw err;
    console.log(`Express server running on http://localhost:${PORT}`);
  });
});
 */
