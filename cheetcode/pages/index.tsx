import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent } from '@/components/ui/card';
import { Code } from 'lucide-react';
import { problems, all_topics } from '@/data/questions';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const customDarkTheme = {
  ...dark,
  'pre[class*="language-"]': {
    ...dark['pre[class*="language-"]'],
    backgroundColor: '#1e1e1e',
    borderColor: '#1e1e1e',
  },
};

const hasCommonTopic = (topics1, topics2) => {
  return topics1.some(topic => topics2.includes(topic));
};

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
  const [currentProblemSet, setCurrentProblemSet] = useState(0);
  const [topics, setTopics] = useState(all_topics);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Handle swipe gestures for problem selection
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      let i = 1;
      while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + i) % problems.length].topics, topics)) {
        i++;
      }
      const newProblemSet = (currentProblemSet + i) % problems.length;
      setCurrentProblemSet(newProblemSet);
      updateTheme(problems[newProblemSet].problem_title);
      setQuestions([]); // Clear questions when switching problems
    },
    onSwipedRight: () => {
      let i = 1;
      while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + problems.length - i) % problems.length].topics, topics)) {
        i++;
      }
      const newProblemSet = (currentProblemSet + problems.length - i) % problems.length;
      setCurrentProblemSet(newProblemSet);
      updateTheme(problems[newProblemSet].problem_title);
      setQuestions([]); // Clear questions when switching problems
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // Update theme on server when problem changes
  const updateTheme = async (theme: string) => {
    try {
      await fetch('http://localhost:3001/select_theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  // Set initial theme
  useEffect(() => {
    updateTheme(problems[currentProblemSet].problem_title);
  }, []);

  // Poll for new questions
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch('http://localhost:3001/current-question');
        if (response.ok) {
          const data = await response.json();
          if (data && data.question && !questions.some((q) => q.id === data.id)) {
            setQuestions((prev) => [...prev, data]);
            
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

    const pollInterval = setInterval(fetchQuestion, 2000);
    return () => clearInterval(pollInterval);
  }, [questions]);

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
      
      await fetchResult(questionId);
    } catch (error) {
      console.error('Failed to send answer:', error);
    }
  };

  const fetchResult = async (questionId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

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
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-6" {...handlers}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code size={32} className="text-blue-400" />
          <h1 className="text-3xl font-bold text-center text-blue-400">CheetCode</h1>
        </div>

        {/* Problem Title */}
        <h2 className="text-xl font-semibold text-center text-gray-100">
          {problems[currentProblemSet].problem_title}
        </h2>

        {/* Problem Description */}
        <p className="text-center text-gray-400">
          {problems[currentProblemSet].problem_description}
        </p>

        {/* External Questions */}
        {questions.map((question) => (
          <Card
            key={question.id}
            ref={el => questionRefs.current[question.id] = el}
            className="mb-6 bg-gray-800 border-gray-700"
          >
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">
                {question.question}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {Object.entries(question.choices).map(([key, code]) => (
                  <div key={key} className="flex justify-center">
                    <div
                      className={`bg-gray-900 p-4 rounded-lg w-full cursor-pointer 
                        ${isAnswered[question.id] && selectedAnswers[question.id] === key
                          ? (results[question.id]?.correct ? 'bg-green-900' : 'bg-red-900')
                          : ''
                        }`}
                      onClick={() => handleAnswer(question.id, key)}
                    >
                      <SyntaxHighlighter
                        language="python"
                        style={customDarkTheme}
                        className="text-gray-100"
                        customStyle={{ fontSize: '11.5px' }}
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                ))}
              </div>

              {results[question.id] && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm">
                    <span className={`font-semibold ${results[question.id].correct ? 'text-green-400' : 'text-red-400'}`}>
                      {results[question.id].correct ? 'Correct! ' : 'Incorrect. '}
                    </span>
                    {results[question.id].explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default QuizApp;
