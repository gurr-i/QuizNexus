import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Question, QuestionResult, QuizResult, QuizStatus, UserAnswer } from "@/lib/types";
import QuizContainer from "./QuizContainer";
import ResultsContainer from "./ResultsContainer";
import { useToast } from "@/hooks/use-toast";

interface QuizAppProps {
  status: QuizStatus;
  onStatusChange: (status: QuizStatus) => void;
  onBackToHome: () => void;
  selectedCategory?: string | null;
}

export default function QuizApp({ 
  status, 
  onStatusChange, 
  onBackToHome, 
  selectedCategory: propCategory 
}: QuizAppProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(propCategory || null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const { toast } = useToast();

  // Update selected category when the prop changes
  useEffect(() => {
    if (propCategory !== undefined) {
      setSelectedCategory(propCategory);
    }
  }, [propCategory]);

  // Fetch questions, either for selected category or all
  const { data: questions, isLoading, error } = useQuery<Question[]>({
    queryKey: [selectedCategory ? `/api/questions/category/${selectedCategory}` : '/api/questions'],
    staleTime: 60000, // 1 minute
  });

  // When questions are loaded, randomize and set them
  useEffect(() => {
    if (questions && Array.isArray(questions) && questions.length > 0) {
      // Get 10 questions randomly
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);
      setCurrentQuizQuestions(selected);
    }
  }, [questions]);

  const handleAnswerSubmit = (questionId: number, answer: string, timeSpent: number, skipped?: boolean) => {
    setUserAnswers((prev) => [
      ...prev.filter((a) => a.questionId !== questionId),
      { questionId, answer, timeSpent, skipped },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleNavigateToQuestion = (index: number) => {
    if (index >= 0 && index < currentQuizQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleQuizSubmit = () => {
    // Check if all questions have been answered or skipped
    const answeredOrSkipped = userAnswers.length;
    const unanswered = currentQuizQuestions.length - answeredOrSkipped;
    
    if (unanswered > 0) {
      toast({
        title: "Unanswered Questions",
        description: `You have ${unanswered} unanswered questions. Would you like to go back and complete them, or mark them as skipped?`,
        variant: "destructive",
        action: (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => {
                // Auto-mark all unanswered questions as skipped
                currentQuizQuestions.forEach(question => {
                  const hasAnswer = userAnswers.some(a => a.questionId === question.id);
                  if (!hasAnswer) {
                    handleAnswerSubmit(question.id, "SKIPPED", 0, true);
                  }
                });
                // After a short delay, submit the quiz with the skipped answers
                setTimeout(() => {
                  handleQuizSubmit();
                }, 100);
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Skip All
            </button>
          </div>
        ),
      });
      return;
    }

    // Calculate quiz result
    const questionResults: QuestionResult[] = currentQuizQuestions.map((question) => {
      const userAnswer = userAnswers.find((a) => a.questionId === question.id);
      const isCorrect = userAnswer?.answer === question.correctAnswer && !userAnswer?.skipped;
      
      return {
        questionId: question.id,
        questionText: question.questionText,
        userAnswer: userAnswer?.answer || "",
        correctAnswer: question.correctAnswer,
        isCorrect: isCorrect,
        timeSpent: userAnswer?.timeSpent || 0,
        skipped: userAnswer?.skipped || false,
      };
    });

    // Count correct answers
    const correctCount = questionResults.filter((r) => r.isCorrect).length;
    
    // Calculate total time spent
    const endTime = new Date();
    const totalTimeInSec = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const result: QuizResult = {
      quizTopic: selectedCategory || "All Categories",
      score: correctCount,
      totalQuestions: currentQuizQuestions.length,
      timeSpent: totalTimeInSec,
      completedAt: endTime,
      questionResults: questionResults,
    };

    // Prepare data for API - convert Date to ISO string for proper serialization
    const apiData = {
      ...result,
      completedAt: endTime.toISOString(),
    };

    // Save result to server
    fetch('/api/quiz-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to save quiz result');
        }
        return response.json();
      })
      .then(() => {
        setQuizResult(result);
        onStatusChange('results');
      })
      .catch(error => {
        console.error('Error saving quiz result:', error);
        toast({
          title: "Error",
          description: "Failed to save quiz result. Please try again.",
          variant: "destructive",
        });
      });
  };

  const handleRetakeQuiz = () => {
    // Reset all quiz state
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setStartTime(new Date());
    onStatusChange('quiz');
    
    // Re-shuffle questions
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 10);
      setCurrentQuizQuestions(selected);
    }
  };

  const handleNewQuiz = () => {
    onBackToHome();
  };

  // Show loading state while questions are loading
  if (isLoading || currentQuizQuestions.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl text-gray-600">Loading quiz questions...</div>
      </div>
    );
  }

  // Show error state if there was an error loading questions
  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-xl text-red-600">
          Error loading questions. Please try again later.
        </div>
      </div>
    );
  }

  if (status === 'results' && quizResult) {
    return (
      <ResultsContainer 
        quizResult={quizResult} 
        onRetakeQuiz={handleRetakeQuiz} 
        onNewQuiz={handleNewQuiz} 
      />
    );
  }

  return (
    <QuizContainer 
      questions={currentQuizQuestions}
      currentQuestionIndex={currentQuestionIndex}
      userAnswers={userAnswers}
      onAnswerSubmit={handleAnswerSubmit}
      onNextQuestion={handleNextQuestion}
      onPreviousQuestion={handlePreviousQuestion}
      onNavigateToQuestion={handleNavigateToQuestion}
      onQuizSubmit={handleQuizSubmit}
      selectedCategory={selectedCategory}
      selectedDifficulty={selectedDifficulty}
      onDifficultyChange={setSelectedDifficulty}
    />
  );
}
