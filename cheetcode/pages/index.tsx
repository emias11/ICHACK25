import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Filter } from 'lucide-react';
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
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isAnswered, setIsAnswered] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [showTopicMenu, setShowTopicMenu] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const changeProblemSet = (direction: 'slide-left' | 'slide-right') => {
    if (isAnimating) return;

    setIsAnimating(true);
    setSlideDirection(direction);

    setTimeout(() => {
      if (direction === 'slide-left') {
        let i = 1;
        while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + i) % problems.length].topics, selectedTopics)) {
          i++;
        }
        const newProblemSet = (currentProblemSet + i) % problems.length;
        setCurrentProblemSet(newProblemSet);
        updateTheme(problems[newProblemSet].problem_title);
      } else {
        let i = 1;
        while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + problems.length - i) % problems.length].topics, selectedTopics)) {
          i++;
        }
        const newProblemSet = (currentProblemSet + problems.length - i) % problems.length;
        setCurrentProblemSet(newProblemSet);
        updateTheme(problems[newProblemSet].problem_title);
      }

      setQuestions([]);
      setSlideDirection('');
      setIsAnimating(false);
    }, 300);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => changeProblemSet('slide-left'),
    onSwipedRight: () => changeProblemSet('slide-right'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const handleTopicSelection = (topic: string) => {
    setSelectedTopics((prevSelected) => {
      if (prevSelected.includes(topic)) {
        return prevSelected.filter(t => t !== topic);
      } else {
        return [...prevSelected, topic];
      }
    });
  };

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

  useEffect(() => {
    updateTheme(problems[currentProblemSet].problem_title);
  }, []);

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
      <style jsx global>{`
        .problem-container {
          transform-origin: center;
          transition: transform 0.3s ease-out;
          position: relative;
        }

        .slide-left {
          animation: slideOutLeft 0.3s ease-out forwards;
        }

        .slide-right {
          animation: slideOutRight 0.3s ease-out forwards;
        }

        @keyframes slideOutLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .topic-bubble {
          display: inline-block;
          padding: 8px 16px;
          margin: 4px;
          border-radius: 9999px;
          background-color: #2d3748;
          color: #fff;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .topic-bubble.selected {
          background-color: #4fd1c5;
          font-weight: bold;
        }

        .topic-bubble:hover {
          background-color: #2b6cb0;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 space-y-6" {...handlers}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Code size={32} className="text-blue-400" />
            <h1 className="text-3xl font-bold text-center text-blue-400">CheetCode</h1>
          </div>

          <button
            className="flex items-center text-blue-400 border border-blue-400 px-4 py-2 rounded-lg hover:bg-blue-400 hover:text-white"
            onClick={() => setShowTopicMenu(prev => !prev)}
          >
            <Filter size={20} className="mr-2" />
            Filter
          </button>
        </div>

        {showTopicMenu && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {all_topics.map((topic) => (
              <div
                key={topic}
                className={`topic-bubble ${selectedTopics.includes(topic) ? 'selected' : ''}`}
                onClick={() => handleTopicSelection(topic)}
              >
                {topic}
              </div>
            ))}
          </div>
        )}

        <div className={`problem-container ${slideDirection}`}>
          <h2 className="text-xl font-semibold text-center text-gray-100">
            {problems[currentProblemSet].problem_title}
          </h2>

          <p className="text-center text-gray-400">
            {problems[currentProblemSet].problem_description}
          </p>

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
    </div>
  );
};

export default QuizApp;
