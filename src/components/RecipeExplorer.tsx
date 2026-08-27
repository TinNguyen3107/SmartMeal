import React, { useState, useEffect } from 'react';
import {
  Search,
  UtensilsCrossed,
  Clock,
  Flame,
  Star,
  Heart,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { Recipe, DietaryType, Difficulty } from '../types';
import { formatMinutes } from '../utils/helpers';

interface RecipeExplorerProps {
  onSelectRecipe: (recipeId: string) => void;
  favorites: string[];
  onToggleFavorite: (recipeId: string) => void;
}

export const RecipeExplorer: React.FC<RecipeExplorerProps> = ({
  onSelectRecipe,
  favorites,
  onToggleFavorite
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'All'>('All');
  const [selectedDiet, setSelectedDiet] = useState<DietaryType | 'All'>('All');
  const [maxTime, setMaxTime] = useState<number>(60);
  const [sortBy, setSortBy] = useState<'rating' | 'time' | 'calories'>('rating');

  useEffect(() => {
    async function loadRecipes() {
      try {
        const res = await fetch('/api/recipes');
        const data = await res.json();
        setRecipes(data.recipes || []);
      } catch (err) {
        console.error('Failed to load recipes:', err);
      }
    }
    loadRecipes();
  }, []);

  const cuisines = ['All', 'Vietnamese', 'Asian', 'Western'];
  const categories = ['All', 'Món chính', 'Món xào', 'Món canh', 'Món kho', 'Món chiên', 'Salad'];
  const diets: (DietaryType | 'All')[] = ['All', 'Healthy', 'Vegetarian', 'Low Carb', 'High Protein', 'Quick Meal', 'Budget Meal'];

  const filteredRecipes = recipes
    .filter(r => {
      const matchQuery = !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCuisine = selectedCuisine === 'All' || r.cuisine.toLowerCase() === selectedCuisine.toLowerCase();
      const matchCategory = selectedCategory === 'All' || r.category === selectedCategory;
      const matchDiff = selectedDifficulty === 'All' || r.difficulty === selectedDifficulty;
      const matchDiet = selectedDiet === 'All' || r.dietaryTags.includes(selectedDiet);
      const matchTime = r.totalTime <= maxTime;

      return matchQuery && matchCuisine && matchCategory && matchDiff && matchDiet && matchTime;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'time') return a.totalTime - b.totalTime;
      if (sortBy === 'calories') return a.calories - b.calories;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-emerald-500 text-white rounded-3xl p-8 sm:p-10 card-shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">Kho công thức</h1>
            <p className="text-xs sm:text-sm text-emerald-900/50 mt-1">Khám phá {recipes.length} món ăn với định lượng và dinh dưỡng chi tiết</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 card-shadow space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-900/50 absolute left-4 top-3.5" />
          <input
            id="recipe-explorer-search"
            type="text"
            placeholder="Tìm theo tên món ăn, nguyên liệu, hương vị..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-emerald-950 placeholder-zinc-400 text-xs sm:text-sm focus:outline-none focus:border-zinc-400 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Cuisine */}
          <div>
            <label className="block text-emerald-900/60 mb-1 font-semibold">Ẩm thực:</label>
            <select
              value={selectedCuisine}
              onChange={e => setSelectedCuisine(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 focus:outline-none focus:border-zinc-400 font-medium"
            >
              {cuisines.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'Tất cả ẩm thực' : c}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-emerald-900/60 mb-1 font-semibold">Loại món:</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 focus:outline-none focus:border-zinc-400 font-medium"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'Tất cả loại món' : c}</option>
              ))}
            </select>
          </div>

          {/* Diet */}
          <div>
            <label className="block text-emerald-900/60 mb-1 font-semibold">Chế độ ăn:</label>
            <select
              value={selectedDiet}
              onChange={e => setSelectedDiet(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 focus:outline-none focus:border-zinc-400 font-medium"
            >
              {diets.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'Tất cả chế độ' : d}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-emerald-900/60 mb-1 font-semibold">Sắp xếp theo:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 focus:outline-none focus:border-zinc-400 font-medium"
            >
              <option value="rating">Đánh giá cao nhất</option>
              <option value="time">Thời gian nấu nhanh nhất</option>
              <option value="calories">Ít calo nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Recipes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => {
          const isFav = favorites.includes(recipe.id);
          return (
            <div
              key={recipe.id}
              className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl overflow-hidden card-shadow flex flex-col group transition-all"
            >
              {/* Image & Favorite toggle */}
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-70" />

                <button
                  onClick={() => onToggleFavorite(recipe.id)}
                  className="absolute top-3 right-3 p-2.5 rounded-lg bg-emerald-500/40 hover:bg-emerald-500/70 text-white backdrop-blur-sm transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'fill-white text-white' : 'text-white'}`} />
                </button>

                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-md bg-emerald-500/60 text-white text-[11px] font-bold backdrop-blur-sm">
                    {recipe.category}
                  </span>
                  <span className="text-xs font-semibold text-white bg-emerald-500/50 backdrop-blur-sm px-2.5 py-0.5 rounded-md">
                    {recipe.cuisine}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3
                    onClick={() => onSelectRecipe(recipe.id)}
                    className="text-base font-bold text-emerald-950 group-hover:text-zinc-600 transition-colors cursor-pointer leading-tight mb-1.5"
                  >
                    {recipe.name}
                  </h3>
                  <p className="text-xs text-emerald-900/60 line-clamp-2 leading-relaxed">
                    {recipe.description}
                  </p>
                </div>

                <div className="space-y-3.5 pt-3 border-t border-zinc-100">
                  <div className="flex items-center justify-between text-xs text-emerald-900/60 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatMinutes(recipe.totalTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      {recipe.calories} kcal
                    </span>
                    <span className="flex items-center gap-1 text-emerald-950 font-bold">
                      <Star className="w-3.5 h-3.5 fill-emerald-500" />
                      {recipe.rating}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectRecipe(recipe.id)}
                    className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Xem công thức</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
