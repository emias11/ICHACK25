import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  question: string;
  choices: string[];
}

const QuizApp = () => {
  const [questions, setQuestions] = useState<Question[]>([]); // Store all questions
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // Track answers by question ID
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({}); // Track answered state by question ID
  const [explanations, setExplanations] = useState<Record<string, string>>({}); // Track explanations by question ID
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({}); // Refs for smooth scrolling

  // Poll the Express server for new questions
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch('http://localhost:3001/prompt/choices');
        const data = await response.json();

        // Only add the question if it's new
        if (!questions.some((q) => q.id === data.id)) {
          setQuestions((prev) => [...prev, data]);

          // Smoothly scroll to the new question
          setTimeout(() => {
            const newQuestionRef = questionRefs.current[data.id];
            if (newQuestionRef) {
              newQuestionRef.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          }, 100); // Small delay to ensure the DOM is updated
        }
      } catch (error) {
        console.error('Failed to fetch question:', error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(fetchQuestion, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [questions]);

  // Fetch explanation for a question
  const fetchExplanation = async (questionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/explanation`);
      const data = await response.json();
      setExplanations((prev) => ({ ...prev, [questionId]: data.explanation }));
    } catch (error) {
      console.error('Failed to fetch explanation:', error);
    }
  };

  const handleAnswer = async (questionId: string, answer: string) => {
    if (isAnswered[questionId]) return;

    // Update selected answer and answered state
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setIsAnswered((prev) => ({ ...prev, [questionId]: true }));

    // Send the selected answer back to the Express server
    try {
      const response = await fetch('http://localhost:3001/prompt/choices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          answer,
        }),
      });

      if (response.ok) {
        // Fetch and display the explanation
        await fetchExplanation(questionId);
      }
    } catch (error) {
      console.error('Failed to send answer:', error);
    }
  };

  if (questions.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {questions.map((question, index) => {
          // Check if `choices` exists and is an array, also ensure the question data is complete
          if (!question.choices || !Array.isArray(question.choices) || !question.question || !question.id) {
            return (
              <div key={question.id || index} className="text-gray-400">
                Invalid question data.
              </div>
            );
          }

          return (
            <Card
              key={question.id}
              ref={(el) => (questionRefs.current[question.id] = el)} // Attach ref to each question
              className="bg-gray-800 border-gray-700 snap-center"
            >
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">
                  {index + 1}. {question.question}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {question.choices.map((choice, choiceIndex) => (
                    <Button
                      key={choiceIndex}
                      onClick={() => handleAnswer(question.id, choice)}
                      disabled={isAnswered[question.id]}
                      className={`w-full ${
                        isAnswered[question.id]
                          ? selectedAnswers[question.id] === choice
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {choice}
                    </Button>
                  ))}
                </div>

                {isAnswered[question.id] && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm">
                      You selected:{' '}
                      <span className="font-semibold">
                        {selectedAnswers[question.id]}
                      </span>
                    </p>
                    {explanations[question.id] && (
                      <p className="text-sm mt-2">
                        Explanation: {explanations[question.id]}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default QuizApp;
