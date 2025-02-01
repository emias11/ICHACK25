import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Code } from 'lucide-react';
import { problems } from '@/data/questions';

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

const QuizApp = () => {
  const [answered, setAnswered] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentProblemSet, setCurrentProblemSet] = useState(0);
  const questionRefs = useRef([]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentProblemSet((currentProblemSet + 1) % problems.length);
      setCurrentQuestionIndex(0);
      setAnswered({});
    },
    onSwipedRight: () => {
      setCurrentProblemSet((currentProblemSet - 1 + problems.length) % problems.length);
      setCurrentQuestionIndex(0);
      setAnswered({});
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        });
      },
      {
        threshold: 0.5,
      }
    );

    questionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      questionRefs.current.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [problems[currentProblemSet]]);

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

  const getDivColour = (questionId, option) => {
    if (!answered[questionId]) return ''; // No class if not answered
    const isCorrectAnswer = selectedAnswers[questionId] === problems[currentProblemSet].find(q => q.id === questionId).correctAnswer;
    const isSelected = selectedAnswers[questionId] === option;

    if (isSelected) {
      return isCorrectAnswer
        ? 'bg-green-900' // Correct
        : 'bg-red-900';  // Incorrect
    }

    return ''; // No class if option is not selected
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-6" {...handlers}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code size={32} className="text-blue-400" />
          <h1 className="text-3xl font-bold text-center text-blue-400">CheetCode</h1>
        </div>

        {problems[currentProblemSet].slice(0, currentQuestionIndex + 1).map((question, index) => (
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
              <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100">
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
              <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100">
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
              <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100">
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
              <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100">
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
        {currentQuestionIndex >= problems[currentProblemSet].length && (
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
