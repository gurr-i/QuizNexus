import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import QuizApp from "@/components/QuizApp";
import { QuizStatus } from "@/lib/types";

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('quiz');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Parse the URL to get the category parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    setSelectedCategory(category);
  }, []);

  // Fetch available categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const handleBackToHome = () => {
    setLocation("/");
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value === "all" ? null : e.target.value;
    setSelectedCategory(category);
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleBackToHome}>
            <i className="text-accent text-2xl">🧠</i>
            <h1 className="text-xl md:text-2xl font-bold">Brain Boost Quiz</h1>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedCategory || "all"} 
              onChange={handleCategoryChange}
              className="bg-white/10 text-white px-3 py-1 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Categories</option>
              {categories && categories.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <QuizApp 
          status={quizStatus} 
          onStatusChange={setQuizStatus} 
          onBackToHome={handleBackToHome} 
          selectedCategory={selectedCategory}
        />
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
