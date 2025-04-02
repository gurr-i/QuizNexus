import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  count: number;
}

export default function QuizHome() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch categories from API
  const {
    data: categories,
    isLoading,
    error,
  } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleStartQuiz = () => {
    if (selectedCategory) {
      setLocation(`/quiz?category=${selectedCategory}`);
    } else {
      setLocation("/quiz");
    }
  };

  const totalQuestions =
    categories?.reduce((sum, category) => sum + category.count, 0) || 0;
  const topicCount = categories?.length || 0;

  return (
    <div className="flex flex-col items-center justify-center pb-8">
      <div className="bg-white rounded-2xl shadow-md p-8 max-w-3xl w-full text-center my-8">
        <div className="text-accent text-6xl mb-6">🎓</div>
        <h2 className="text-4xl font-bold text-primary mb-4">
          Ready to boost your knowledge?
        </h2>
        <p className="text-lg mb-8 text-gray-600">
          Test your skills with our premium quiz experience. Choose a topic and
          challenge yourself!
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-background p-4 rounded-xl">
            <div className="text-secondary text-2xl mb-2">🔀</div>
            <h3 className="font-semibold">Randomized Questions</h3>
          </div>
          <div className="bg-background p-4 rounded-xl">
            <div className="text-secondary text-2xl mb-2">⏱️</div>
            <h3 className="font-semibold">Timed Challenges</h3>
          </div>
          <div className="bg-background p-4 rounded-xl">
            <div className="text-secondary text-2xl mb-2">📊</div>
            <h3 className="font-semibold">Detailed Analysis</h3>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-background rounded-lg p-4 flex flex-col items-center w-40">
            <span className="text-4xl font-bold text-primary">
              {totalQuestions}
            </span>
            <span className="text-sm text-gray-600">Questions</span>
          </div>
          <div className="bg-background rounded-lg p-4 flex flex-col items-center w-40">
            <span className="text-4xl font-bold text-primary">15</span>
            <span className="text-sm text-gray-600">Minutes</span>
          </div>
          <div className="bg-background rounded-lg p-4 flex flex-col items-center w-40">
            <span className="text-4xl font-bold text-primary">
              {topicCount}
            </span>
            <span className="text-sm text-gray-600">Topics</span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Select a Category</h3>

          {isLoading && (
            <div className="flex justify-center">
              <div className="animate-pulse bg-background h-16 w-full max-w-md rounded-lg"></div>
            </div>
          )}

          {error && (
            <div className="text-red-500 mb-4">
              Failed to load categories. Please try again.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedCategory === category.id
                    ? "bg-primary text-white ring-2 ring-primary"
                    : "bg-background hover:bg-gray-100"
                }`}
              >
                <div className="font-medium">{category.name}</div>
                <div className="text-sm opacity-80">
                  {category.count} questions
                </div>
              </button>
            ))}

            <button
              onClick={() => setSelectedCategory(null)}
              className={`p-3 rounded-lg text-left transition-all ${
                selectedCategory === null
                  ? "bg-primary text-white ring-2 ring-primary"
                  : "bg-background hover:bg-gray-100"
              }`}
            >
              <div className="font-medium">All Categories</div>
              <div className="text-sm opacity-80">
                {totalQuestions} questions
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          className="mt-8 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-secondary/50"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
}
