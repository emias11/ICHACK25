import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { problems, all_topics } from '@/data/questions';

const QuizApp = () => {
  const [answered, setAnswered] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentProblemSet, setCurrentProblemSet] = useState(0);
  const [topics, setTopics] = useState(all_topics);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const questionRefs = useRef([]);

  const customDarkTheme = {
    ...dark,
    'pre[class*="language-"]': {
      ...dark['pre[class*="language-"]'],
      backgroundColor: '#1e1e1e',
      borderColor: '#1e1e1e',
    },
  };

  const handleAnswer = (questionId, selectedOption) => {
    if (answered[questionId]) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));

    setAnswered(prev => ({
      ...prev,
      [questionId]: true
    }));

    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = questionRefs.current[questionId];
      if (nextQuestion) {
        nextQuestion.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 1000);
  };

  const hasCommonTopic = (topics1, topics2) => {
    return topics1.some(topic => topics2.includes(topic));
  };

  const changeProblemSet = (direction) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideDirection(direction);

    setTimeout(() => {
      if (direction === 'slide-left') {
        let i = 1;
        while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + i) % problems.length].topics, topics)) {
          i++;
        }
        setCurrentProblemSet((currentProblemSet + i) % problems.length);
      } else {
        let i = 1;
        while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + problems.length - i) % problems.length].topics, topics)) {
          i++;
        }
        setCurrentProblemSet((currentProblemSet + problems.length - i) % problems.length);
      }
      
      setCurrentQuestionIndex(0);
      setAnswered({});
      setSelectedAnswers({});
      questionRefs.current = [];
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

        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .slide-left + .problem-container {
          animation: slideInRight 0.3s ease-out forwards;
        }

        .slide-right + .problem-container {
          animation: slideInLeft 0.3s ease-out forwards;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code size={32} className="text-blue-400" />
          <h1 className="text-3xl font-bold text-center text-blue-400">CheetCode</h1>
        </div>

        <div {...handlers} className="relative overflow-hidden">
          <div className={`problem-container ${slideDirection}`}>
            <h2 className="text-xl font-semibold text-center text-gray-100">
              {problems[currentProblemSet].problem_title}
            </h2>
            
            <p className="text-center text-gray-400 mt-4">
              {problems[currentProblemSet].problem_description}
            </p>

            {problems[currentProblemSet].problem_questions.slice(0, currentQuestionIndex + 1).map((question, index) => (
              <Card
                key={question.id}
                ref={el => questionRefs.current[question.id] = el}
                className="mt-6 bg-gray-800 border-gray-700 snap-center"
              >
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-100">
                    {index + 1}. {question.question}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {["Code A", "Code B", "Code C", "Code D"].map((option) => (
                      <div key={option} className="flex justify-center">
                        <div
                          className={`bg-gray-900 p-4 rounded-lg w-full cursor-pointer ${
                            !answered[question.id] ? 'hover:bg-gray-700' : 
                            selectedAnswers[question.id] === option ? 
                              (option === question.correctAnswer ? 'bg-green-900' : 'bg-red-900') : ''
                          }`}
                          onClick={() => handleAnswer(question.id, option)}
                        >
                          <SyntaxHighlighter
                            language="python"
                            style={customDarkTheme}
                            className="text-gray-100"
                            customStyle={{ fontSize: '11.5px' }}
                          >
                            {question[`code${option.slice(-1)}`]}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ))}
                  </div>

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

            {currentQuestionIndex >= problems[currentProblemSet].problem_questions.length && (
              <Card className="mt-6 bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-center text-gray-100">
                    Question Complete! 🎉
                  </h2>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizApp;