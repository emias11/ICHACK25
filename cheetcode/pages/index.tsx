import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Code } from 'lucide-react';

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
    options: ["Code A", "Code B"],
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
    options: ["Code A", "Code B"],
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
    options: ["Code A", "Code B"],
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

  const isCorrect = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    return selectedAnswers[questionId] === question.correctAnswer;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Code size={32} className="text-blue-400" />
          <h1 className="text-3xl font-bold text-center text-blue-400">Cheetcode</h1>
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
                <div className="flex-1">
                  <div className="bg-gray-900 p-4 rounded-lg h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        onClick={() => handleAnswer(question.id, "Code A")}
                        className={`w-full ${
                          answered[question.id]
                            ? "Code A" === question.correctAnswer
                              ? 'bg-green-600 hover:bg-green-700'
                              : selectedAnswers[question.id] === "Code A"
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={answered[question.id]}
                      >
                        Option A
                        {answered[question.id] && "Code A" === question.correctAnswer && (
                          <Check className="ml-2" size={16} />
                        )}
                        {answered[question.id] && 
                         "Code A" === selectedAnswers[question.id] && 
                         !isCorrect(question.id) && (
                          <X className="ml-2" size={16} />
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto p-2 bg-gray-950 rounded h-full">
                      <code className="text-gray-100">{question.codeA}</code>
                    </pre>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="bg-gray-900 p-4 rounded-lg h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <Button
                        onClick={() => handleAnswer(question.id, "Code B")}
                        className={`w-full ${
                          answered[question.id]
                            ? "Code B" === question.correctAnswer
                              ? 'bg-green-600 hover:bg-green-700'
                              : selectedAnswers[question.id] === "Code B"
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={answered[question.id]}
                      >
                        Option B
                        {answered[question.id] && "Code B" === question.correctAnswer && (
                          <Check className="ml-2" size={16} />
                        )}
                        {answered[question.id] && 
                         "Code B" === selectedAnswers[question.id] && 
                         !isCorrect(question.id) && (
                          <X className="ml-2" size={16} />
                        )}
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto p-2 bg-gray-950 rounded h-full">
                      <code className="text-gray-100">{question.codeB}</code>
                    </pre>
                  </div>
                </div>
              </div>
              
              {answered[question.id] && (
                <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                  <p className="text-sm">
                    {isCorrect(question.id) ? (
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
