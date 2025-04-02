import { useEffect, useRef, useState } from "react";
import { QuizResult, QuestionResult, CategoryStatistics } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Chart from 'chart.js/auto';

interface ResultsContainerProps {
  quizResult: QuizResult;
  onRetakeQuiz: () => void;
  onNewQuiz: () => void;
  selectedDifficulty?: string;
}

export default function ResultsContainer({ 
  quizResult, 
  onRetakeQuiz, 
  onNewQuiz,
  selectedDifficulty = "all" 
}: ResultsContainerProps) {
  const categoryChartRef = useRef<HTMLCanvasElement>(null);
  const timeChartRef = useRef<HTMLCanvasElement>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStatistics[]>([]);
  const [performanceLevel, setPerformanceLevel] = useState<string>('Good');
  
  // Initialize charts when component mounts
  useEffect(() => {
    if (categoryChartRef.current && timeChartRef.current) {
      // Calculate category statistics
      const allCategories = quizResult.questionResults.map(q => q.questionText.split(' ')[0]);
      const uniqueCategories = Array.from(new Set(allCategories));
      
      const stats = uniqueCategories.map(category => {
        const questionsInCategory = quizResult.questionResults.filter(
          q => q.questionText.split(' ')[0] === category
        );
        
        // Count correctly answered questions (excluding skipped questions)
        const correctCount = questionsInCategory.filter(q => q.isCorrect && !q.skipped).length;
        
        // Count attempted questions (excluding skipped questions)
        const attemptedCount = questionsInCategory.filter(q => !q.skipped).length;
        
        // Count skipped questions
        const skippedCount = questionsInCategory.filter(q => q.skipped).length;
        
        // Calculate accuracy based on attempted questions
        const accuracy = attemptedCount > 0 
          ? (correctCount / attemptedCount) * 100 
          : 0;
        
        return {
          category,
          correct: correctCount,
          total: questionsInCategory.length,
          attempted: attemptedCount,
          skipped: skippedCount,
          accuracy: accuracy
        };
      });
      
      setCategoryStats(stats);
      
      // Determine performance level
      const scorePercentage = (quizResult.score / quizResult.totalQuestions) * 100;
      if (scorePercentage >= 80) {
        setPerformanceLevel('Excellent');
      } else if (scorePercentage >= 60) {
        setPerformanceLevel('Good');
      } else if (scorePercentage >= 40) {
        setPerformanceLevel('Average');
      } else {
        setPerformanceLevel('Needs Improvement');
      }
      
      // Create category chart
      const categoryCtx = categoryChartRef.current.getContext('2d');
      if (categoryCtx) {
        new Chart(categoryCtx, {
          type: 'bar',
          data: {
            labels: stats.map(s => s.category),
            datasets: [
              {
                label: 'Accuracy %',
                data: stats.map(s => s.accuracy),
                backgroundColor: '#F1C40F',
                borderColor: '#F1C40F',
                borderWidth: 1,
                order: 1
              },
              {
                label: 'Skipped',
                data: stats.map(s => s.skipped),
                backgroundColor: '#95A5A6',
                borderColor: '#95A5A6',
                borderWidth: 1,
                type: 'bar',
                order: 2
              }
            ]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: 'Accuracy %'
                }
              },
              y1: {
                beginAtZero: true,
                position: 'right',
                grid: {
                  drawOnChartArea: false,
                },
                title: {
                  display: true,
                  text: 'Skipped Count'
                }
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
      
      // Create time spent chart with skipped question indicators
      const timeCtx = timeChartRef.current.getContext('2d');
      if (timeCtx) {
        // Prepare data for time chart
        const timeChartData = quizResult.questionResults.map((q, i) => {
          return {
            x: `Q${i + 1}`,
            y: q.timeSpent,
            skipped: q.skipped || false
          };
        });
        
        new Chart(timeCtx, {
          type: 'line',
          data: {
            labels: quizResult.questionResults.map((_, i) => `Q${i + 1}`),
            datasets: [{
              label: 'Time (seconds)',
              data: quizResult.questionResults.map(q => q.timeSpent),
              borderColor: '#E74C3C',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.2,
              pointBackgroundColor: quizResult.questionResults.map(q => 
                q.skipped ? '#95A5A6' : '#E74C3C'
              ),
              pointRadius: quizResult.questionResults.map(q => 
                q.skipped ? 6 : 4
              ),
              pointStyle: quizResult.questionResults.map(q => 
                q.skipped ? 'triangle' : 'circle'
              )
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const index = context.dataIndex;
                    const result = quizResult.questionResults[index];
                    let label = `Time: ${result.timeSpent}s`;
                    
                    if (result.skipped) {
                      label += ' (Skipped)';
                    }
                    
                    return label;
                  }
                }
              }
            }
          }
        });
      }
    }
  }, [quizResult]);
  
  // Format time display
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate average time per question
  const avgTimePerQuestion = Math.round(
    quizResult.questionResults.reduce((sum, q) => sum + q.timeSpent, 0) / quizResult.questionResults.length
  );
  
  // Calculate skipped questions count
  const skippedCount = quizResult.questionResults.filter(q => q.skipped).length;

  return (
    <Card className="bg-white rounded-2xl shadow-md mb-8">
      <CardContent className="p-6 md:p-8">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-accent to-primary mb-4 animate-bounce-custom shadow-xl">
            <div className="text-white text-3xl">🏆</div>
          </div>
          <h2 className="text-3xl font-bold text-primary mb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>Quiz Completed!</h2>
          <p className="text-gray-600 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            You've completed the <span className="font-medium text-primary">{quizResult.quizTopic}</span> quiz. Here's your performance analysis.
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Score</h3>
            <p className="text-2xl font-bold text-primary">{quizResult.score}/{quizResult.totalQuestions}</p>
            <p className="text-sm text-gray-600">({Math.round((quizResult.score / quizResult.totalQuestions) * 100)}%)</p>
            <p className="text-sm text-gray-600 mt-1">Difficulty: {selectedDifficulty === "all" ? "Mixed" : selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}</p>
            <p className="text-sm text-gray-600">Time Bonus: +{Math.round((quizResult.score * 0.5) * (1 - quizResult.timeSpent / (quizResult.totalQuestions * 60)))}</p>
          </div>
          <div className="bg-background rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Time Spent</h3>
            <p className="text-2xl font-bold text-secondary">{formatTime(quizResult.timeSpent)}</p>
            <p className="text-sm text-gray-600">of 15:00</p>
          </div>
          <div className="bg-background rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Avg. Time/Question</h3>
            <p className="text-2xl font-bold text-accent">{avgTimePerQuestion}s</p>
            <p className="text-sm text-gray-600">per question</p>
          </div>
          <div className="bg-background rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-sm text-gray-600 mb-1">Performance</h3>
            <p className="text-2xl font-bold text-green-600">{performanceLevel}</p>
            <p className="text-sm text-gray-600">keep improving</p>
          </div>
        </div>
        
        {/* Added Skipped Questions Info */}
        {skippedCount > 0 && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <div className="bg-gray-400 text-white p-2 rounded-full mr-3">⏩</div>
              <h3 className="font-semibold text-lg">Skipped Questions</h3>
            </div>
            <p className="text-gray-600 mb-2">
              You skipped <span className="font-bold text-gray-700">{skippedCount}</span> out of {quizResult.totalQuestions} questions.
            </p>
            <p className="text-sm text-gray-500">
              Skipping difficult questions can be a good strategy to manage time, but try to come back to them if you can.
            </p>
          </div>
        )}
        
        {/* Performance Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-md transform transition-all duration-500 hover:shadow-lg animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3 className="font-semibold mb-4 text-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Accuracy by Category
            </h3>
            <div className="h-64 chart-container">
              <canvas ref={categoryChartRef}></canvas>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md transform transition-all duration-500 hover:shadow-lg animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <h3 className="font-semibold mb-4 text-lg flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Time Spent per Question
            </h3>
            <div className="h-64 chart-container">
              <canvas ref={timeChartRef}></canvas>
            </div>
          </div>
        </div>
        
        {/* Questions Review */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <h3 className="font-semibold mb-4 text-lg flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Questions Review
          </h3>
          
          <div className="bg-white rounded-xl shadow-md p-4">
            {quizResult.questionResults.map((result, index) => (
              <div 
                key={`result-${result.questionId}`}
                className={`mb-4 border-l-4 ${
                  result.skipped 
                    ? 'border-gray-400' 
                    : result.isCorrect 
                      ? 'border-success' 
                      : 'border-error'
                } pl-4 py-3 bg-gray-50 rounded-r-lg shadow-sm transform transition-all duration-300 hover:shadow-md hover:translate-x-1 animate-fade-in`}
                style={{ animationDelay: `${0.9 + index * 0.1}s` }}
              >
                <div className="flex flex-wrap md:flex-nowrap justify-between items-start mb-2 gap-2">
                  <h4 className="font-medium text-primary flex-grow">Q{index + 1}: {result.questionText}</h4>
                  <span className={`px-3 py-1 ${
                    result.skipped 
                      ? 'bg-gray-200 text-gray-600' 
                      : result.isCorrect 
                        ? 'bg-success/20 text-success' 
                        : 'bg-error/20 text-error'
                  } text-sm rounded-full shadow-sm flex-shrink-0 flex items-center`}>
                    {result.skipped ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                        </svg>
                        Skipped
                      </>
                    ) : result.isCorrect ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Correct
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Incorrect
                      </>
                    )}
                  </span>
                </div>
                
                <div className="pl-2">
                  {!result.skipped ? (
                    <p className="text-sm text-gray-600 mb-1 flex items-center">
                      <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-primary/10 text-primary mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Your answer: <span className="font-medium">{result.userAnswer}</span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 mb-1 italic flex items-center">
                      <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-500 mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Question skipped
                    </p>
                  )}
                  
                  {(!result.isCorrect || result.skipped) && (
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-success/10 text-success mr-2 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      Correct answer: <span className="font-medium">{result.correctAnswer}</span>
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-secondary/10 text-secondary mr-2 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </span>
                    Time spent: <span className="font-medium">{result.timeSpent}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-12 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full opacity-50 group-hover:opacity-70 blur transition duration-500 group-hover:duration-200"></div>
            <Button
              variant="default"
              onClick={onRetakeQuiz}
              className="relative bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl group-hover:shadow-primary/50 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Retake Quiz
            </Button>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary to-accent rounded-full opacity-50 group-hover:opacity-70 blur transition duration-500 group-hover:duration-200"></div>
            <Button
              variant="default"
              onClick={onNewQuiz}
              className="relative bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl group-hover:shadow-secondary/50 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              New Quiz
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
