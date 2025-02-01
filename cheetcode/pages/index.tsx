import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Code } from 'lucide-react';
import { problems, all_topics } from '@/data/questions';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const customDarkTheme = {
  ...dark,
  'pre[class*="language-"]': {
    ...dark['pre[class*="language-"]'],
    backgroundColor: '#1e1e1e', // Set background to black
    borderColor: '#1e1e1e',
  },
};

const hasCommonTopic = (topics1, topics2) => {
  console.log(topics1, topics2);
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
  const [theme, setTheme] = useState<string | null>(null);
  const [answered, setAnswered] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentProblemSet, setCurrentProblemSet] = useState(0);
  const [topics, setTopics] = useState(all_topics);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

const handlers = useSwipeable({
    onSwipedLeft: () => {
      let i = 1;
      while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + i) % problems.length].topics, topics)) {
        i++;
      }
      setCurrentProblemSet((currentProblemSet + i) % problems.length);
      setCurrentQuestionIndex(0);
      setAnswered({});
    },
    onSwipedRight: () => {
      let i = 1;
      while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + problems.length - i) % problems.length].topics, topics)) {
        i++;
      }
      setCurrentProblemSet((currentProblemSet + problems.length - i) % problems.length);
      setCurrentQuestionIndex(0);
      setAnswered({});
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  })

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

const getDivColour = (questionId, option) => {
    if (!answered[questionId]) return ''; // No class if not answered
    const isCorrectAnswer = selectedAnswers[questionId] === problems[currentProblemSet].problem_questions.find(q => q.id === questionId).correctAnswer;
    const isSelected = selectedAnswers[questionId] === option;
    
    if (isSelected) {
      return isCorrectAnswer
        ? 'bg-green-900' // Correct
        : 'bg-red-900';  // Incorrect
    }

    return ''; // No class if option is not selected
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

        {problems[currentProblemSet].problem_questions.slice(0, currentQuestionIndex + 1).map((question, index) => (
          <Card
            key={question.id}
            ref={el => questionRefs.current[question.id] = el}
            className="mb-6 bg-gray-800 border-gray-700 snap-center"
          >
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">
                {index + 1}. {question.question}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          
          {/* Code Block A */}
          <div className="flex justify-center">
            <div
              className={`bg-gray-900 p-4 rounded-lg w-full cursor-pointer ${getDivColour(question.id, "Code A")}`}
              onClick={() => handleAnswer(question.id, "Code A")}
            >


              <SyntaxHighlighter
                language="python"
                style={customDarkTheme}
                className="text-gray-100"
                customStyle={{ fontSize: '11.5px' }} // Change the font size here
              >
                {question.codeA}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Code Block B */}
          <div className="flex justify-center">
            <div
              className={`bg-gray-900 p-4 rounded-lg w-full cursor-pointer ${getDivColour(question.id, "Code B")}`}
              onClick={() => handleAnswer(question.id, "Code B")}
            >
              <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100" customStyle={{ fontSize: '11.5px' }}>
                {question.codeB}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Code Block C (New Option) */}
          <div className="flex justify-center">
            <div
              className={`bg-gray-900 p-4 rounded-lg w-full cursor-pointer ${getDivColour(question.id, "Code C")}`}
              onClick={() => handleAnswer(question.id, "Code C")}
            >
              <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100" customStyle={{ fontSize: '11.5px' }}>
                {question.codeC}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Code Block D (New Option) */}
          <div className="flex justify-center">
            <div
              className={`bg-gray-900 p-4 rounded-lg w-full cursor-pointer ${getDivColour(question.id, "Code D")}`}
              onClick={() => handleAnswer(question.id, "Code D")}
            >
              <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100" customStyle={{ fontSize: '11.5px' }}>
                {question.codeD}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

              {/* Explanation */}
              {answered[question.id] && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm">
                    {selectedAnswers[question.id] === question.correctAnswer ? (
                      <span className="text-green-400 font-semibold">Correct! </span>
                    ) : (
                      <span className="text-red-400 font-semibold">Incorrect. </span>
                    )}
                    {question.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Quiz Completion */}
        {currentQuestionIndex >= problems[currentProblemSet].problem_questions.length && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-center text-gray-100">
                Question Complete! 🎉
              </h2>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizApp;

