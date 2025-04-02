import { 
  users, type User, type InsertUser,
  questions, type Question, type InsertQuestion,
  quizResults, type QuizResult, type InsertQuizResult, 
  QuestionResult
} from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Question methods
  getQuestions(): Promise<Question[]>;
  getQuestionsByCategory(category: string): Promise<Question[]>;
  getAvailableCategories(): Promise<string[]>;
  getQuestion(id: number): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  bulkCreateQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  
  // Quiz result methods
  getQuizResults(): Promise<QuizResult[]>;
  getQuizResult(id: number): Promise<QuizResult | undefined>;
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
}

// Helper functions to ensure arrays are correctly typed
function ensureStringArray(arr: any): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  // Map each item to string to ensure correct type
  return arr.map(item => String(item));
}

// Helper function to ensure QuestionResult arrays are correctly typed
function ensureQuestionResultArray(arr: any): QuestionResult[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  // Map each item to ensure correct structure
  return arr.map(item => ({
    questionId: Number(item.questionId || 0),
    questionText: String(item.questionText || ''),
    userAnswer: String(item.userAnswer || ''),
    correctAnswer: String(item.correctAnswer || ''),
    isCorrect: Boolean(item.isCorrect),
    timeSpent: Number(item.timeSpent || 0)
  }));
}

// Function to load questions from JSON file
function loadQuestionsFromFile(): InsertQuestion[] {
  try {
    // Using import.meta.dirname for ESM modules
    const filePath = path.resolve(import.meta.dirname, 'data', 'questions.json');
    
    console.log('Loading questions from:', filePath);
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (!data || !Array.isArray(data.questions)) {
      console.error('Invalid questions data format in JSON file');
      return [];
    }
    
    // Process each question to ensure correct types
    return data.questions.map((q: any): InsertQuestion => ({
      questionText: String(q.questionText || ''),
      correctAnswer: String(q.correctAnswer || ''),
      category: String(q.category || ''),
      difficulty: String(q.difficulty || ''),
      options: ensureStringArray(q.options)
    }));
    
  } catch (error) {
    console.error('Error loading questions from file:', error);
    // Fallback to empty array if file loading fails
    return [];
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private questions: Map<number, Question>;
  private quizResults: Map<number, QuizResult>;
  
  private currentUserId: number;
  private currentQuestionId: number;
  private currentQuizResultId: number;

  constructor() {
    this.users = new Map();
    this.questions = new Map();
    this.quizResults = new Map();
    
    this.currentUserId = 1;
    this.currentQuestionId = 1;
    this.currentQuizResultId = 1;
    
    // Initialize with sample questions
    this.initializeSampleQuestions();
  }

  private initializeSampleQuestions() {
    // Load questions from JSON file
    const fileQuestions = loadQuestionsFromFile();
    
    if (fileQuestions.length > 0) {
      console.log(`Loaded ${fileQuestions.length} questions from JSON file`);
      
      // Add questions from file
      fileQuestions.forEach(question => {
        const id = this.currentQuestionId++;
        // Create new question with proper typing
        const newQuestion: Question = {
          id,
          questionText: question.questionText,
          correctAnswer: question.correctAnswer,
          category: question.category,
          difficulty: question.difficulty,
          options: ensureStringArray(question.options)
        };
        this.questions.set(id, newQuestion);
      });
    } else {
      console.warn('No questions loaded from file. The quiz will be empty.');
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Question methods
  async getQuestions(): Promise<Question[]> {
    return Array.from(this.questions.values());
  }

  async getQuestionsByCategory(category: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(
      (question) => question.category === category
    );
  }
  
  async getAvailableCategories(): Promise<string[]> {
    const questions = Array.from(this.questions.values());
    const categories = new Set<string>();
    
    // Extract unique categories
    questions.forEach(question => {
      if (question.category) {
        categories.add(question.category);
      }
    });
    
    return Array.from(categories);
  }

  async getQuestion(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = { 
      ...insertQuestion, 
      id,
      // Ensure options is properly typed as string[]
      options: ensureStringArray(insertQuestion.options)
    };
    this.questions.set(id, question);
    return question;
  }

  async bulkCreateQuestions(insertQuestions: InsertQuestion[]): Promise<Question[]> {
    const createdQuestions: Question[] = [];
    
    for (const insertQuestion of insertQuestions) {
      const id = this.currentQuestionId++;
      const question: Question = { 
        ...insertQuestion, 
        id,
        // Ensure options is properly typed as string[]
        options: ensureStringArray(insertQuestion.options)
      };
      this.questions.set(id, question);
      createdQuestions.push(question);
    }
    
    return createdQuestions;
  }

  // Quiz result methods
  async getQuizResults(): Promise<QuizResult[]> {
    return Array.from(this.quizResults.values());
  }

  async getQuizResult(id: number): Promise<QuizResult | undefined> {
    return this.quizResults.get(id);
  }

  async createQuizResult(insertQuizResult: InsertQuizResult): Promise<QuizResult> {
    const id = this.currentQuizResultId++;
    
    // Ensure questionResults is properly typed as QuestionResult[]
    const quizResult: QuizResult = { 
      ...insertQuizResult, 
      id,
      questionResults: ensureQuestionResultArray(insertQuizResult.questionResults)
    };
    
    this.quizResults.set(id, quizResult);
    return quizResult;
  }
}

export const storage = new MemStorage();
