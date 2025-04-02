import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the schema for questions
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
});

// Define the schema for quiz results
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  quizTopic: text("quiz_topic").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  timeSpent: integer("time_spent").notNull(), // in seconds
  completedAt: timestamp("completed_at").notNull(),
  questionResults: jsonb("question_results").notNull().$type<QuestionResult[]>(),
});

// Define schemas for DB interactions
export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
}).extend({
  // Transform ISO string dates into Date objects for proper validation
  completedAt: z.coerce.date()
});

// Define TS types
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;

// Additional custom types
export type QuestionResult = {
  questionId: number;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
};

// Zod schema for importing question banks
export const importQuestionBankSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.string(),
      category: z.string(),
      difficulty: z.string(),
    })
  ),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
