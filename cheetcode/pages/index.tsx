import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Filter } from 'lucide-react';
import { problems, all_topics } from '@/data/questions';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ClipLoader } from 'react-spinners';


const IP_ADDRESS = "172.26.251.48"

const customDarkTheme = {
  ...dark,
  'pre[class*="language-"]': {
    ...dark['pre[class*="language-"]'],
    backgroundColor: '#1e1e1e',
    borderColor: '#1e1e1e',
  },
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
  const [loadingQuestions, setLoadingQuestions] = useState<Record<string, boolean>>({});
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const sendExitSignal = async () => {
  try {
    const response = await fetch("http://" + IP_ADDRESS + ":3001/answer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questionId: 0, answer: "exit" }),
    });

    if (!response.ok) {
      throw new Error("Failed to send exit signal");
    }
  } catch (error) {
    console.error("Error sending exit signal:", error);
  }
};

  // Fixed hasCommonTopic function
  const hasCommonTopic = (problemTopics: string[]) => {
    return selectedTopics.length === 0 || selectedTopics.some(topic => problemTopics.includes(topic));
  };

  // Handle swipe gestures for problem selection with clearing questions
  const handlers = useSwipeable({
  onSwipedLeft: async () => {
    await sendExitSignal().catch((error) => console.error("Failed to send exit signal:", error));

    // Continue with existing swipe logic
    let i = 1;
    while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + i) % problems.length].topics)) {
      i++;
    }
    const newProblemSet = (currentProblemSet + i) % problems.length;
    setCurrentProblemSet(newProblemSet);
    clearQuestions();
    updateTheme(problems[newProblemSet].problem_title);
  },
  onSwipedRight: async () => {
    await sendExitSignal().catch((error) => console.error("Failed to send exit signal:", error));

    // Continue with existing swipe logic
    let i = 1;
    while (i < problems.length && !hasCommonTopic(problems[(currentProblemSet + problems.length - i) % problems.length].topics)) {
      i++;
    }
    const newProblemSet = (currentProblemSet + problems.length - i) % problems.length;
    setCurrentProblemSet(newProblemSet);
    clearQuestions();
    updateTheme(problems[newProblemSet].problem_title);
  },
  preventDefaultTouchmoveEvent: true,
  trackMouse: true,
});

  const clearQuestions = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setIsAnswered({});
    setResults({});
    questionRefs.current = {};
  };

  const updateTheme = async (theme: string) => {
    try {
      await fetch('http://' + IP_ADDRESS + ':3001/select_theme', {
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

  const handleTopicSelection = (topic: string) => {
    setSelectedTopics((prevSelected) => {
    if (topic === "All") {
      // If "All" is clicked, select it only if no other topics are selected
      return prevSelected.length === 1 && prevSelected.includes("All")
        ? [] // Unselect "All" if it's already the only selected topic
        : ["All"]; // Select "All" and deselect other topics
    } else {
      if (prevSelected.includes("All")) {
        // If "All" is selected, remove it before selecting other topics
        return [topic];
      }
      return prevSelected.includes(topic)
        ? prevSelected.filter(t => t !== topic) // Deselect if already selected
        : [...prevSelected, topic]; // Otherwise, select the topic
    }
  });
};


  useEffect(() => {
  const fetchQuestion = async () => {
    try {
      const response = await fetch('http://' + IP_ADDRESS + ':3001/current-question');
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
}, [questions, currentProblemSet]); // Added currentProblemSet to dependencies

  useEffect(() => {
    updateTheme(problems[currentProblemSet].problem_title);
  }, []);

  const handleAnswer = async (questionId: string, answer: string) => {
    if (isAnswered[questionId]) return;
    
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
    setIsAnswered((prev) => ({ ...prev, [questionId]: true }));
    setLoadingQuestions((prev) => ({ ...prev, [questionId]: true }));
    
    try {
      const response = await fetch('http://' + IP_ADDRESS + ':3001/answer', {
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
    } finally {
      setLoadingQuestions((prev) => ({ ...prev, [questionId]: false })); // Set loading to false for the question
    }
  };

  const fetchResult = async (questionId: string) => {
  let attempts = 0;
  const maxAttempts = 50; // Increased from 30
  
  const pollResult = async () => {
    try {
      const response = await fetch(`http://${IP_ADDRESS}:3001/result/${questionId}`);
      if (response.ok) {
        const data = await response.json();
        setResults((prev) => ({ ...prev, [questionId]: data }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  while (attempts < maxAttempts) {
    const resultReceived = await pollResult();
    if (resultReceived) break;
    await new Promise(resolve => setTimeout(resolve, 500)); // Increased from 100ms to 500ms
    attempts++;
  }
};

  // Helper function to replace backticks with <code> tags
    const renderInlineCode = (text) => {
      return text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
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

        <div {...handlers}>
          <h2 className="text-xl font-semibold text-center text-gray-100">
            {problems[currentProblemSet].problem_title}
          </h2>

          <p className="text-center text-gray-400 mt-2">
            {problems[currentProblemSet].problem_description}
          </p>

          {questions.map((question) => (
            <Card
              key={question.id}
              ref={el => questionRefs.current[question.id] = el}
              className="mt-6 bg-gray-800 border-gray-700"
            >
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-100">
                  {question.question}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(question.choices).map(([key, code]) => {
  const [explanation, ...codeLines] = code.split('\n');
  
  // Check if the first line is just "python" and remove it if so
  const firstLine = codeLines[0]?.trim();
  const isPythonTag = firstLine === 'python' || firstLine === '```python';
  const cleanCode = (isPythonTag ? codeLines.slice(1) : codeLines).join('\n').replace(/```/g, '');

  return (
    <div
      key={key}
      className={`p-4 rounded-lg cursor-pointer ${
        !loadingQuestions[question.id] && isAnswered[question.id] && selectedAnswers[question.id] === key
          ? results[question.id]?.correct
            ? 'bg-green-900'
            : 'bg-red-900'
          : 'bg-gray-900'
      }`}
      onClick={() => handleAnswer(question.id, key)}
    >
      {/* Explanation text */}
      <p className="text-sm text-gray-300 mb-2">{explanation}</p>

      {/* Code block or loading spinner */}
      <div className="relative min-h-[100px]"> {/* Ensure the container has a minimum height */}
        {loadingQuestions[question.id] && selectedAnswers[question.id] === key ? (
          <div className="absolute inset-0 flex justify-center items-center"> {/* Center the spinner */}
            <ClipLoader color="#4A90E2" loading={true} size={30} />
          </div>
        ) : (
          <SyntaxHighlighter
            language="python"
            style={customDarkTheme}
            customStyle={{ margin: 0, background: 'transparent', fontSize: '11.5px' }}
          >
            {cleanCode}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
})}
                </div>
                {results[question.id] && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <p className="text-sm">
                      {results[question.id].correct ? (
                        <span className="text-green-400 font-semibold">Correct! </span>
                      ) : (
                        <span className="text-red-400 font-semibold">Incorrect. </span>
                      )}
                      {results[question.id].explanation}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <style jsx>{`
        .topic-bubble {
          padding: 8px 16px;
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
    </div>
  );
};

export default QuizApp;
