import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  question: string;
  choices: Record<string, string>;
}

interface Result {
  correct: boolean;
  explanation: string;
}

const QuizApp = () => {
  const [theme, setTheme] = useState<string | null>(null); // Selected theme
  const [questions, setQuestions] = useState<Question[]>([]); // Store all questions
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // Track answers by question ID
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({}); // Track answered state by question ID
  const [results, setResults] = useState<Record<string, Result>>({}); // Track results by question ID
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({}); // Refs for smooth scrolling

  // Fetch the selected theme
  useEffect(() => {
    if (!theme) return;

    const fetchTheme = async () => {
      try {
        const response = await fetch('http://localhost:3001/leetcode_question');
        if (!response.ok) {
          throw new Error('Failed to fetch theme');
        }
        const data = await response.json();
        console.log('Selected theme:', data.theme);
      } catch (error) {
        console.error('Failed to fetch theme:', error);
      }
    };

    fetchTheme();
  }, [theme]);

  // Poll the Express server for new questions
  useEffect(() => {
  if (!theme) return;

  const fetchQuestion = async () => {
    while (true) {
      try {
        console.log("Trying to get choices!")
        const response = await fetch('http://localhost:3001/prompts/choices');
        if (response.ok) {
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
            break; // Exit the loop once a valid question is received
          }
        } else {
          console.log('No question available, retrying...');
        }
      } catch (error) {
        console.error('Failed to fetch question, retrying...', error);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Retry after 2 seconds
    }
  };

  fetchQuestion();
  }, [theme, questions]);

// Fetch result for a question
  const fetchResult = async (questionId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/result`);
      if (!response.ok) {
        throw new Error('Failed to fetch result');
      }
      const data = await response.json();
      setResults((prev) => ({ ...prev, [questionId]: data }));
    } catch (error) {
      console.error('Failed to fetch result:', error);
    }
  };

  const handleAnswer = async (questionId: string, answer: string) => {
  if (isAnswered[questionId]) return;

  // Update selected answer and answered state
  setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
  setIsAnswered((prev) => ({ ...prev, [questionId]: true }));

  // Send the selected answer back to the Express server
  try {
    const response = await fetch('http://localhost:3001/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questionId, answer }),
    });

    if (!response.ok) {
      console.error('Failed to send answer');
    }
  } catch (error) {
    console.error('Failed to send answer:', error);
  }
  };

  const handleThemeSelection = async (selectedTheme: string) => {
    try {
      const response = await fetch('http://localhost:3001/select_theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme: selectedTheme }),
      });

      if (!response.ok) {
        throw new Error('Failed to select theme');
      }

      setTheme(selectedTheme);
    } catch (error) {
      console.error('Failed to select theme:', error);
    }
  };

  if (!theme) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <h1 className="text-3xl font-bold text-center">Select a Theme</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Question 1', 'Question 2', 'Question 3', 'Question 4'].map((themeOption) => (
              <Button
                key={themeOption}
                onClick={() => handleThemeSelection(themeOption)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {themeOption}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {questions.map((question) => {
          // Check if `choices` exists and is an object
          if (!question.choices || typeof question.choices !== 'object') {
            return (
              <div key={question.id} className="text-gray-400">
                Invalid question data.
              </div>
            );
          }

          return (
            <div key={question.id}>
              <Card
                ref={(el) => (questionRefs.current[question.id] = el)} // Attach ref to each question
                className="bg-gray-800 border-gray-700 snap-center"
              >
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-100">
                    {question.question}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.entries(question.choices).map(([key, choice]) => (
                      <Button
                        key={key}
                        onClick={() => handleAnswer(question.id, key)}
                        disabled={isAnswered[question.id]}
                        className={`w-full ${
                          isAnswered[question.id]
                            ? selectedAnswers[question.id] === key
                              ? 'bg-blue-600 hover:bg-blue-700' // Highlight selected answer
                              : 'bg-gray-700 hover:bg-gray-600' // Gray for other choices
                            : 'bg-blue-600 hover:bg-blue-700' // Blue for unanswered choices
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
                    </div>
                  )}
                </CardContent>
              </Card>

              {results[question.id] && (
                <Card
                  className={`mt-4 border-2 ${
                    results[question.id].correct
                      ? 'border-green-500' // Subtle green outline for correct answers
                      : 'border-orange-500' // Subtle orange outline for incorrect answers
                  }`}
                >
                  <CardContent className="p-6">
                    <p className="text-sm text-gray-100">
                      Explanation: {results[question.id].explanation}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizApp;
