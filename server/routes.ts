import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertQuizResultSchema, importQuestionBankSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all available categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getAvailableCategories();
      
      // Format categories with count and display names
      const questions = await storage.getQuestions();
      const formattedCategories = categories.map(category => {
        const count = questions.filter(q => q.category === category).length;
        const displayName = category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
        
        return {
          id: category,
          name: displayName,
          count
        };
      });
      
      res.json(formattedCategories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  // Get all questions
  app.get('/api/questions', async (req, res) => {
    try {
      const questions = await storage.getQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching questions" });
    }
  });

  // Get questions by category
  app.get('/api/questions/category/:category', async (req, res) => {
    try {
      const { category } = req.params;
      const questions = await storage.getQuestionsByCategory(category);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching questions by category" });
    }
  });

  // Get a specific question
  app.get('/api/questions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid question ID" });
      }
      
      const question = await storage.getQuestion(id);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Error fetching question" });
    }
  });

  // Import questions from JSON question bank
  app.post('/api/questions/import', async (req, res) => {
    try {
      const result = importQuestionBankSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const questionsToInsert = result.data.questions.map(q => ({
        questionText: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        category: q.category,
        difficulty: q.difficulty
      }));
      
      const createdQuestions = await storage.bulkCreateQuestions(questionsToInsert);
      res.status(201).json({ 
        message: "Questions imported successfully", 
        count: createdQuestions.length 
      });
    } catch (error) {
      console.error("Error importing questions:", error);
      res.status(500).json({ message: "Error importing questions" });
    }
  });

  // Save quiz result
  app.post('/api/quiz-results', async (req, res) => {
    try {
      const result = insertQuizResultSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const quizResult = await storage.createQuizResult(result.data);
      res.status(201).json(quizResult);
    } catch (error) {
      console.error("Error saving quiz result:", error);
      res.status(500).json({ message: "Error saving quiz result" });
    }
  });

  // Get all quiz results
  app.get('/api/quiz-results', async (req, res) => {
    try {
      const quizResults = await storage.getQuizResults();
      res.json(quizResults);
    } catch (error) {
      res.status(500).json({ message: "Error fetching quiz results" });
    }
  });

  // Get a specific quiz result
  app.get('/api/quiz-results/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quiz result ID" });
      }
      
      const quizResult = await storage.getQuizResult(id);
      if (!quizResult) {
        return res.status(404).json({ message: "Quiz result not found" });
      }
      
      res.json(quizResult);
    } catch (error) {
      res.status(500).json({ message: "Error fetching quiz result" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
