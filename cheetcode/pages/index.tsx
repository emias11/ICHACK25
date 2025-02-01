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
  const [theme, setTheme] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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
      try {
        // First, check if there's a current question
        const response = await fetch('http://localhost:3001/current-question');
        if (response.ok) {
          const data = await response.json();
          if (data && data.question && !questions.some((q) => q.id === data.id)) {
            setQuestions((prev) => [...prev, data]);
            
            // Scroll to new question
            setTimeout(() => {
              const newQuestionRef = questionRefs.current[data.id];
              if (newQuestionRef) {
                newQuestionRef.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to fetch question:', error);
      }
    };

    // Poll every 2 seconds
    const pollInterval = setInterval(fetchQuestion, 2000);
    return () => clearInterval(pollInterval);
  }, [theme, questions]);

  // Handle answer submission
  const handleAnswer = async (questionId: string, answer: string) => {
    if (isAnswered[questionId]) return;

    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setIsAnswered((prev) => ({ ...prev, [questionId]: true }));

    try {
      const response = await fetch('http://localhost:3001/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId, answer }),
      });

      if (!response.ok) {
        throw new Error('Failed to send answer');
      }

      // Fetch result immediately after answering
      await fetchResult(questionId);
    } catch (error) {
      console.error('Failed to send answer:', error);
    }
  };

  // Fetch result for a question
  const fetchResult = async (questionId: string) => {
  let attempts = 0;
  const maxAttempts = 30; // Will try for 60 seconds (30 attempts * 2 second interval)
  
  const pollResult = async () => {
    try {
      const response = await fetch(`http://localhost:3001/result/${questionId}`);
      if (response.ok) {
        const data = await response.json();
        setResults((prev) => ({ ...prev, [questionId]: data }));
        return true;
      }
      return false;
    } catch (error) {
      console.log('Waiting for result...');
      return false;
    }
  };

  while (attempts < maxAttempts) {
    const resultReceived = await pollResult();
    if (resultReceived) break;
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.log('Result timeout - no result received after 60 seconds');
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

  // Rest of the component remains the same...
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {!theme ? (
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
      ) : (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {questions.length === 0 ? (
            <div className="text-center">Loading questions...</div>
          ) : (
            questions.map((question) => (
              <div key={question.id}>
                <Card
                  ref={(el) => (questionRefs.current[question.id] = el)}
                  className="bg-gray-800 border-gray-700"
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
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-700 hover:bg-gray-600'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {choice}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {results[question.id] && (
                  <Card className={`mt-4 border-2 ${
                    results[question.id].correct
                      ? 'border-green-500'
                      : 'border-orange-500'
                  }`}>
                    <CardContent className="p-6">
                      <p className="text-sm text-gray-100">
                        Explanation: {results[question.id].explanation}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default QuizApp;
