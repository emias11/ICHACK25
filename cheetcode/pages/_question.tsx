import { useState, useEffect } from 'react';

const QuestionPage = () => {
  const [question, setQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);

  // Fetch the question from the Express API when the component mounts
  useEffect(() => {
    const fetchQuestion = async () => {
      const response = await fetch('http://localhost:3001/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'What is your name?', // This could be dynamically sent from Python or predefined
        }),
      });

      const data = await response.json();
      setQuestion(data.question); // Set the question from Express API
    };

    fetchQuestion();
  }, []);

  // Handle the answer submission
  const handleSubmitAnswer = async () => {
    const response = await fetch('http://localhost:3001/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: userAnswer, // The user's answer
      }),
    });

    const data = await response.json();
    console.log('Answer received by Express:', data.answer);

    // Send the answer back to Python
    sendAnswerToPython(data.answer);

    setAnswerSubmitted(true);
  };

  // Send the user's answer back to Python
  const sendAnswerToPython = async (answer: string) => {
    const pythonUrl = 'http://localhost:5000/receive_answer'; // Python API endpoint
    const response = await fetch(pythonUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: answer, // Send the answer back to Python
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Answer received by Python:', result);
    } else {
      console.error('Failed to send answer to Python');
    }
  };

  return (
    <div>
      <h1>{question}</h1>
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Enter your answer"
      />
      <button onClick={handleSubmitAnswer} disabled={answerSubmitted}>
        Submit Answer
      </button>

      {answerSubmitted && <p>Answer submitted: {userAnswer}</p>}
    </div>
  );
};

export default QuestionPage;
