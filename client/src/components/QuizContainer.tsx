import { useState, useEffect, useRef } from "react";
import { Question, UserAnswer } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QuizContainerProps {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  onAnswerSubmit: (
    questionId: number,
    answer: string,
    timeSpent: number,
    skipped?: boolean
  ) => void;
  onNextQuestion: () => void;
  onPreviousQuestion: () => void;
  onNavigateToQuestion: (index: number) => void;
  onQuizSubmit: () => void;
  selectedCategory: string | null;
  selectedDifficulty?: string;
  onDifficultyChange?: (difficulty: string) => void;
}

export default function QuizContainer({
  questions,
  currentQuestionIndex,
  userAnswers,
  onAnswerSubmit,
  onNextQuestion,
  onPreviousQuestion,
  onNavigateToQuestion,
  onQuizSubmit,
  selectedCategory,
  selectedDifficulty = "all",
  onDifficultyChange,
}: QuizContainerProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [questionTimer, setQuestionTimer] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [quizTimerValue, setQuizTimerValue] = useState<string>("15:00");
  const [timerPercent, setTimerPercent] = useState<number>(100);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quizTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quizTimeLimit = 15 * 60; // 15 minutes in seconds
  const [quizTimeRemaining, setQuizTimeRemaining] =
    useState<number>(quizTimeLimit);
  const { toast } = useToast();

  const currentQuestion = questions[currentQuestionIndex];

  // Set up question timer
  useEffect(() => {
    setQuestionStartTime(new Date());
    setQuestionTimer(0);

    // Get current user answer if any
    const currentUserAnswer = userAnswers.find(
      (answer) => answer.questionId === currentQuestion.id
    );

    if (currentUserAnswer) {
      setSelectedOption(currentUserAnswer.answer);
    } else {
      setSelectedOption("");
    }

    // Start question timer
    questionTimerRef.current = setInterval(() => {
      setQuestionTimer((prev) => prev + 1);
    }, 1000);

    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [currentQuestionIndex, currentQuestion.id]);

  // Update timer percentage for UI
  useEffect(() => {
    // Assuming average time per question is 60 seconds
    const expectedTime = 60;
    // Calculate percentage of time left (inverse of time spent)
    const percent = Math.max(0, 100 - (questionTimer / expectedTime) * 100);
    setTimerPercent(percent);
  }, [questionTimer]);

  // Set up quiz timer
  useEffect(() => {
    // Start quiz timer
    setQuizTimeRemaining(quizTimeLimit);

    quizTimerRef.current = setInterval(() => {
      setQuizTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up, submit quiz automatically
          if (quizTimerRef.current) {
            clearInterval(quizTimerRef.current);
          }
          toast({
            title: "Time's up!",
            description: "Your quiz has been submitted automatically.",
          });
          onQuizSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (quizTimerRef.current) {
        clearInterval(quizTimerRef.current);
      }
    };
  }, []);

  // Format quiz timer for display
  useEffect(() => {
    const minutes = Math.floor(quizTimeRemaining / 60);
    const seconds = quizTimeRemaining % 60;
    setQuizTimerValue(
      `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    );
  }, [quizTimeRemaining]);

  const formatQuestionTimer = () => {
    const minutes = Math.floor(questionTimer / 60);
    const seconds = questionTimer % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);

    // Save the time spent on this question
    const timeSpent = Math.floor(
      (new Date().getTime() - questionStartTime.getTime()) / 1000
    );

    // Calculate bonus points based on time spent
    // Faster answers get more points (up to 50% bonus)
    const maxBonusTime = 10; // seconds
    const bonusMultiplier = Math.max(
      0,
      1 + ((maxBonusTime - timeSpent) / maxBonusTime) * 0.5
    );

    // Submit answer with time-based scoring
    onAnswerSubmit(currentQuestion.id, option, timeSpent);

    // Show bonus points toast if answered quickly
    if (option === currentQuestion.correctAnswer && timeSpent < maxBonusTime) {
      toast({
        title: "Speed Bonus!",
        description: `Quick answer! You earned a ${Math.round(
          (bonusMultiplier - 1) * 100
        )}% bonus!`,
        variant: "default",
      });
    }
  };

  const handleNext = () => {
    onNextQuestion();
  };

  const handlePrevious = () => {
    onPreviousQuestion();
  };

  const handleSubmit = () => {
    const unansweredCount = questions.length - userAnswers.length;

    if (unansweredCount > 0) {
      toast({
        title: "Warning",
        description: `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`,
        variant: "destructive",
      });
    } else {
      onQuizSubmit();
    }
  };

  // Prepare pill states for question navigation
  const getPillState = (index: number) => {
    const question = questions[index];
    const userAnswer = userAnswers.find(
      (answer) => answer.questionId === question.id
    );
    const answered = !!userAnswer;
    const skipped = userAnswer?.skipped === true;

    if (index === currentQuestionIndex) {
      return "bg-primary text-white";
    } else if (answered && skipped) {
      return "bg-gray-400 text-white shadow-sm";
    } else if (answered) {
      return "bg-success text-white shadow-success/20";
    }
    return "bg-white shadow-sm";
  };

  // Handle skipping this question
  const handleSkipQuestion = () => {
    // Record this question as skipped
    const timeSpent = Math.floor(
      (new Date().getTime() - questionStartTime.getTime()) / 1000
    );

    onAnswerSubmit(currentQuestion.id, "SKIPPED", timeSpent, true);

    // Move to next question if possible
    if (currentQuestionIndex < questions.length - 1) {
      handleNext();
    }
  };

  return (
    <div>
      {/* Quiz Header with Progress */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold text-primary capitalize">
            {selectedCategory ? `${selectedCategory} Quiz` : "Quiz"}
          </h2>
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">
              <span>{currentQuestionIndex + 1}</span> of{" "}
              <span>{questions.length}</span> Questions
            </p>
            <select
              value={selectedDifficulty}
              onChange={(e) => onDifficultyChange?.(e.target.value)}
              className="bg-background text-primary px-3 py-1 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <i className="text-secondary">⏱️</i>
            <span id="quizTimer" className="font-semibold text-lg">
              {quizTimerValue}
            </span>
          </div>
          <button
            className="text-primary hover:text-secondary"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to quit the quiz? All progress will be lost."
                )
              ) {
                window.location.href = "/";
              }
            }}
          >
            <i className="fas fa-times"></i> Quit
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
        <div
          className="bg-secondary h-2.5 rounded-full"
          style={{
            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
          }}
        ></div>
      </div>

      {/* Question Card */}
      <Card className="rounded-2xl shadow-md mb-8 question-enter overflow-hidden">
        <CardContent className="p-6 md:p-8 relative">
          {/* Quiz decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 z-0"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full -ml-10 -mb-10 z-0"></div>

          {/* Timer for current question */}
          <div className="mb-4 relative z-10">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-secondary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Time for this question:
              </span>
              <span
                className={`font-medium ${
                  questionTimer > 30 ? "text-secondary animate-pulse" : ""
                }`}
              >
                {formatQuestionTimer()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 shadow-inner">
              <div
                className={`h-1.5 rounded-full timer-animation ${
                  timerPercent < 30 ? "bg-secondary" : "bg-accent"
                }`}
                style={{ width: `${timerPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Question Content */}
          <div className="mb-6 relative z-10">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-xl mb-6 animate-fade-in">
              <h3 className="text-xl md:text-2xl font-semibold">
                {currentQuestion.questionText}
              </h3>
            </div>

            <div className="space-y-4 animate-slide-up">
              {currentQuestion.options.map((option, index) => {
                const optionLetters = ["A", "B", "C", "D"];
                const animationDelay = `${0.1 + index * 0.1}s`;

                return (
                  <div
                    className="transform transition-all"
                    style={{
                      animationDelay,
                      opacity: 0,
                      animation: "fadeIn 0.5s ease-out forwards",
                    }}
                    key={`${currentQuestion.id}-option-${index}`}
                  >
                    <button
                      className={`option-hover w-full text-left p-4 rounded-xl border-2 
                        ${
                          selectedOption === option
                            ? "bg-primary/10 border-primary text-primary font-medium shadow-md transform scale-[1.02]"
                            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                        } 
                        transition-all duration-300 ease-in-out`}
                      onClick={() => handleOptionSelect(option)}
                    >
                      <div className="flex items-start">
                        <span
                          className={`flex-shrink-0 w-8 h-8 rounded-full ${
                            selectedOption === option
                              ? "bg-primary text-white"
                              : "bg-background"
                          } flex items-center justify-center font-semibold mr-3 shadow-sm transition-colors duration-300`}
                        >
                          {optionLetters[index]}
                        </span>
                        <span>{option}</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-background text-primary font-medium rounded-lg hover:bg-gray-300 focus:outline-none transition-all duration-300 transform hover:-translate-x-1 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={handleSkipQuestion}
              className="px-6 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 focus:outline-none group transition-all duration-300 transform hover:scale-105 flex items-center"
            >
              Skip Question
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </Button>

            <Button
              variant="default"
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 focus:outline-none transition-all duration-300 transform hover:translate-x-1 flex items-center"
            >
              Next
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question Navigation Pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {questions.map((question, index) => (
          <button
            key={`pill-${question.id}`}
            className={`w-10 h-10 rounded-full ${getPillState(
              index
            )} shadow-sm flex items-center justify-center font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 transform hover:scale-110`}
            onClick={() => {
              // Save current answer before navigating
              if (selectedOption) {
                const timeSpent = Math.floor(
                  (new Date().getTime() - questionStartTime.getTime()) / 1000
                );
                onAnswerSubmit(currentQuestion.id, selectedOption, timeSpent);
              }
              // Navigate directly to the selected question
              onNavigateToQuestion(index);
            }}
            aria-label={`Go to question ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Navigation Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-success"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          <span>Skipped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary"></div>
          <span>Current</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="text-center animate-fade-in">
        <div className="relative inline-block">
          {/* Decorative elements */}
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-secondary/10 rounded-full animate-pulse-custom"></div>
          <div
            className="absolute -bottom-6 -right-6 w-12 h-12 bg-secondary/10 rounded-full animate-pulse-custom"
            style={{ animationDelay: "1s" }}
          ></div>

          <Button
            variant="secondary"
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-secondary/50 relative z-10"
          >
            <span className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Submit Quiz
            </span>
          </Button>
        </div>
        <p
          className="mt-2 text-sm text-gray-600 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          Make sure to review all your answers before submitting
        </p>
      </div>
    </div>
  );
}
