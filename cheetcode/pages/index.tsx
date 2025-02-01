import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Code } from 'lucide-react';

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

const questions = [
  {
    id: 1,
    question: "Which code implementation is more efficient for finding a number in a sorted array?",
    codeA: `def find_number(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1`,
    codeB: `def find_number(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    correctAnswer: "Code B",
    explanation: "Code B implements binary search with O(log n) complexity, while Code A uses linear search with O(n) complexity."
  },
  {
    id: 2,
    question: "Which implementation of checking for a palindrome string is correct?",
    codeA: `def is_palindrome(s):
    s = s.lower()
    return s == s[::-1]`,
    codeB: `def is_palindrome(s):
    s = s.lower()
    left, right = 0, len(s) - 1
    while left < right:
        if s[left] != s[right]:
            return True
        left += 1
        right -= 1
    return False`,
    correctAnswer: "Code A",
    explanation: "Code A correctly checks for palindromes by comparing the string with its reverse. Code B has a logic error in the return statements."
  },
  {
    id: 3,
    question: "Which implementation correctly counts the frequency of elements?",
    codeA: `def count_frequency(arr):
    freq = {}
    for num in arr:
        if num in freq:
            freq[num] += 1
    return freq`,
    codeB: `def count_frequency(arr):
    freq = {}
    for num in arr:
        freq[num] = freq.get(num, 0) + 1
    return freq`,
    correctAnswer: "Code B",
    explanation: "Code B correctly handles all cases using dict.get(), while Code A misses initializing counts for new elements."
  }
];

const QuizApp = () => {
  const [answered, setAnswered] = useState({});
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questionRefs = useRef([]);

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
  }, []);

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

  // Helper function for determining the background color of the code block
  const getCodeBlockStyle = (questionId, option) => {
    if (!answered[questionId]) return 'bg-gray-900';
    const isCorrectAnswer = selectedAnswers[questionId] === questions.find(q => q.id === questionId).correctAnswer;
    const isSelected = selectedAnswers[questionId] === option;
    if (isSelected && isCorrectAnswer) {
      return 'bg-[rgba(34,197,94,0.6)]'; // Green with 60% opacity
    } 
    if (isSelected && !isCorrectAnswer) {
      return 'bg-[rgba(239,68,68,0.6)]'; // Red with 60% opacity
    }
    return 'bg-gray-900';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code size={32} className="text-blue-400" />
          <h1 className="text-3xl font-bold text-center text-blue-400">CheetCode</h1>
        </div>
        
        {questions.slice(0, currentQuestionIndex + 1).map((question, index) => (
          <Card
            key={question.id}
            ref={el => questionRefs.current[question.id] = el}
            className="mb-6 bg-gray-800 border-gray-700 snap-center"
          >
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-100">
                {index + 1}. {question.question}
              </h2>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Code Block A */}
                <div className="flex-1">
                  <div
                    className={`bg-gray-900 p-4 rounded-lg h-full cursor-pointer ${getCodeBlockStyle(question.id, 'Code A')}`}
                    onClick={() => handleAnswer(question.id, "Code A")}
                  >
                    <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100">
                      {question.codeA}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Code Block B */}
                <div className="flex-1">
                  <div
                    className={`bg-gray-900 p-4 rounded-lg h-full cursor-pointer ${getCodeBlockStyle(question.id, 'Code B')}`}
                    onClick={() => handleAnswer(question.id, "Code B")}
                  >
                    <SyntaxHighlighter language="python" style={customDarkTheme} className="text-gray-100">
                      {question.codeB}
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
        {currentQuestionIndex >= questions.length && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-center text-gray-100">
                Duel Complete! 🎉
              </h2>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizApp;
