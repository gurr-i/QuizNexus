import { Link } from "wouter";
import QuizHome from "@/components/QuizHome";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="text-accent text-2xl">🧠</i>
            <h1 className="text-xl md:text-2xl font-bold">Brain Boost Quiz</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <QuizHome />
      </main>

      <footer className="bg-primary text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <i className="text-accent">🧠</i>
                <span className="font-semibold">Brain Boost Quiz</span>
              </div>
              <p className="text-sm text-white/70 mt-1">Elevate your knowledge with engaging quizzes</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-white">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-white/70 hover:text-white">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" className="text-white/70 hover:text-white">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-white/70 hover:text-white">
                <i className="fab fa-github"></i>
              </a>
            </div>
          </div>
          <div className="border-t border-white/20 mt-4 pt-4 text-center text-sm text-white/70">
            &copy; 2023 Brain Boost Quiz. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
