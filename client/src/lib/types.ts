export interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: string;
}

export interface QuestionResult {
  questionId: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  skipped?: boolean;
}

export interface QuizResult {
  id?: number;
  quizTopic: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  completedAt: Date;
  questionResults: QuestionResult[];
}

export interface TimerState {
  totalSeconds: number;
  isRunning: boolean;
}

export interface UserAnswer {
  questionId: number;
  answer: string;
  timeSpent: number;
  skipped?: boolean;
}

export interface CategoryStatistics {
  category: string;
  correct: number;
  total: number;
  attempted: number;
  skipped: number;
  accuracy: number;
}

export type QuizStatus = 'home' | 'quiz' | 'results';
