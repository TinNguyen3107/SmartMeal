import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Flame,
  Users,
  Star,
  Heart,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Send,
  ChefHat,
  Lightbulb,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Recipe, RecipeReview, UserIngredient } from '../types';
import { formatMinutes, playTimerSound } from '../utils/helpers';

interface RecipeDetailModalProps {
  recipeId: string;
  onClose: () => void;
  pantryItems: UserIngredient[];
  isFavorite: boolean;
  onToggleFavorite: (recipeId: string) => void;
  onAddToShoppingList: (name: string, quantity: number, unit: string, recipeName: string) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipeId,
  onClose,
  pantryItems,
  isFavorite,
  onToggleFavorite,
  onAddToShoppingList
}) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [reviews, setReviews] = useState<RecipeReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Servings multiplier (1x, 2x, 4x)
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);

  // Cooking Mode
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Step Timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Review submission
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // AI Substitution Advice
  const [substitutionPrompt, setSubstitutionPrompt] = useState<string>('');
  const [substitutionAdvice, setSubstitutionAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/recipes/${recipeId}`);
        const data = await res.json();
        setRecipe(data.recipe);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Failed to load recipe:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipe();
  }, [recipeId]);

  // Countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => {
          if (sec <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            playTimerSound();
            alert('Hết giờ nấu bước này! Món ăn đã sẵn sàng cho bước tiếp theo.');
            return 0;
          }
          return sec - 1;
        });
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startTimerForMinutes = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
  };

  const handleToggleStep = (stepNumber: number) => {
    setCompletedSteps(prev =>
      prev.includes(stepNumber) ? prev.filter(s => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const handleFinishCooking = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    alert('Chúc mừng bạn đã hoàn thành món ăn thơm ngon!');
  };

  // Submit Rating & Review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/user/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId,
          rating: newRating,
          comment: newComment
        })
      });
      const data = await res.json();
      if (data.success && data.review) {
        setReviews(prev => [data.review, ...prev]);
        setNewComment('');
        if (recipe) {
          setRecipe({ ...recipe, rating: data.newRating || recipe.rating });
        }
      }
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Ask AI for Substitutions
  const handleAskSubstitution = async () => {
    if (!substitutionPrompt.trim()) return;
    setIsLoadingAdvice(true);
    setSubstitutionAdvice(null);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tôi đang xem món "${recipe?.name}" với nguyên liệu: [${recipe?.ingredients.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}]. Câu hỏi: "${substitutionPrompt}". Hãy hướng dẫn tỉ lệ và cách làm phù hợp cho đúng món này.`,
          pantryIngredients: pantryItems.map(p => p.name)
        })
      });
      const data = await res.json();
      if (res.status === 401) {
        setSubstitutionAdvice('⚠️ Bạn cần đăng nhập để sử dụng tính năng này.');
      } else {
        setSubstitutionAdvice(data.reply || 'AI đã tiếp nhận câu hỏi của bạn.');
      }
    } catch (e) {
      console.error('Advice error:', e);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  if (isLoading || !recipe) {
    return (
      <div className="fixed inset-0 z-50 bg-emerald-500/80 flex items-center justify-center p-4">
        <div className="bg-emerald-50 border border-zinc-800 rounded-2xl p-8 text-center text-emerald-600 max-w-sm w-full">
          <div className="w-10 h-10 border-4 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Đang tải...</p>
        </div>
      </div>
    );
  }

  const pantryNormNames = new Set(pantryItems.map(p => p.normalizedName));

  return (
    <div className="fixed inset-0 z-50 bg-emerald-500/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-emerald-950 relative">
        {/* Close Button */}
        <button
          id="close-recipe-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-emerald-500/50 hover:bg-emerald-500/80 text-white backdrop-blur-sm flex items-center justify-center transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-2xl">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

          {/* Banner Meta Content */}
          <div className="absolute bottom-6 left-8 right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="px-3 py-1 rounded-md bg-white text-emerald-950 text-xs font-bold shadow-sm uppercase tracking-wider">
                  {recipe.category}
                </span>
                <span className="px-3 py-1 rounded-md bg-emerald-100/80 text-white text-xs font-semibold backdrop-blur-sm">
                  {recipe.cuisine}
                </span>
                {recipe.dietaryTags.map(d => (
                  <span key={d} className="px-2.5 py-1 rounded-md bg-zinc-700/80 text-zinc-100 text-xs font-medium backdrop-blur-sm">
                    {d}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">{recipe.name}</h1>
            </div>

            {/* Favorite & Ratings */}
            <div className="flex items-center gap-2">
              <button
                id="toggle-favorite-recipe-btn"
                onClick={() => onToggleFavorite(recipe.id)}
                className={`px-4 py-2 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-colors backdrop-blur-sm ${isFavorite
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-emerald-500/40 text-white border-white/30 hover:bg-emerald-500/60'
                  }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white text-white' : ''}`} />
                <span>{isFavorite ? 'Đã yêu thích' : 'Yêu thích'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-900/60 font-medium uppercase tracking-wider">Thời gian</p>
                <p className="text-sm font-bold text-emerald-950">{recipe.cookingTime}p</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-900/60 font-medium uppercase tracking-wider">Lượng Calo</p>
                <p className="text-sm font-bold text-emerald-950">{recipe.calories} kcal</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-900/60 font-medium uppercase tracking-wider">Khẩu phần</p>
                <p className="text-sm font-bold text-emerald-950">{recipe.servings * servingsMultiplier} người</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center">
                <Star className="w-5 h-5 fill-zinc-700 text-zinc-700" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-900/60 font-medium uppercase tracking-wider">Đánh giá</p>
                <p className="text-sm font-bold text-emerald-950">{recipe.rating} ({recipe.reviewCount})</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="text-sm text-zinc-600 leading-relaxed font-medium">
            {recipe.description}
          </div>

          {/* 2-Columns Layout: Ingredients Checklist vs Step-by-Step Cooking */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: Ingredients Checklist & Scaler (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-900/60" />
                  Nguyên liệu
                </h3>
                {/* Scaler buttons */}
                <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200 text-xs">
                  <span className="text-[10px] text-emerald-900/60 px-1 font-medium">Nhân:</span>
                  {[1, 2, 3].map(mult => (
                    <button
                      key={mult}
                      onClick={() => setServingsMultiplier(mult)}
                      className={`px-2.5 py-0.5 rounded-md font-bold transition-colors ${servingsMultiplier === mult
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-emerald-900/60 hover:text-emerald-950'
                        }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="rounded-xl border border-zinc-200 p-1 space-y-1">
                {recipe.ingredients.map(ing => {
                  const hasInPantry = pantryNormNames.has(ing.normalizedName);
                  const scaledQty = ing.quantity * servingsMultiplier;

                  return (
                    <div
                      key={ing.ingredientId}
                      className={`p-3 rounded-lg flex items-center justify-between text-xs transition-colors ${hasInPantry
                        ? 'bg-zinc-50 text-zinc-800'
                        : 'bg-white text-emerald-950'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {hasInPantry ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-900/50 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold">{ing.name}</span>
                          {ing.isOptional && <span className="ml-1 text-[10px] text-emerald-900/50">(Tùy chọn)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md">
                          {scaledQty} {ing.unit}
                        </span>
                        {!hasInPantry && (
                          <button
                            onClick={() => onAddToShoppingList(ing.name, scaledQty, ing.unit, recipe.name)}
                            className="p-1.5 rounded-md text-emerald-900/50 hover:bg-zinc-100 hover:text-emerald-950 transition-colors"
                            title="Thêm vào giỏ đi chợ"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Substitution box */}
              <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div className="flex items-center gap-2 text-zinc-800 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-900/60" />
                  Hỏi AI mẹo thay thế
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: Thay bơ bằng dầu được không?"
                    value={substitutionPrompt}
                    onChange={e => setSubstitutionPrompt(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-zinc-200 text-emerald-950 placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-400 font-medium"
                  />
                  <button
                    disabled={isLoadingAdvice || !substitutionPrompt.trim()}
                    onClick={handleAskSubstitution}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Hỏi
                  </button>
                </div>

                {substitutionAdvice && (
                  <div className="p-3.5 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-700 leading-relaxed">
                    {substitutionAdvice}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Step-by-Step Interactive Cooking Mode (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <span>Các bước chế biến</span>
                  <span className="text-xs text-emerald-900/60 font-semibold">
                    ({completedSteps.length}/{recipe.instructions.length})
                  </span>
                </h3>

                {/* Active countdown timer display if running */}
                {timerSeconds > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-mono font-bold">
                    <span>⏱️ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)}>
                      {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setTimerSeconds(0)}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Steps Timeline List */}
              <div className="space-y-3">
                {recipe.instructions.map((step) => {
                  const isDone = completedSteps.includes(step.stepNumber);
                  const isCurrent = activeStep === step.stepNumber;

                  return (
                    <div
                      key={step.stepNumber}
                      onClick={() => setActiveStep(step.stepNumber)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer ${isCurrent
                        ? 'bg-zinc-50 border-emerald-500 ring-1 ring-emerald-500'
                        : isDone
                          ? 'bg-white border-zinc-100 opacity-60'
                          : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStep(step.stepNumber);
                          }}
                          className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${isDone
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-zinc-300 text-emerald-900/60 hover:border-zinc-500'
                            }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : step.stepNumber}
                        </button>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                              Bước {step.stepNumber} {step.estimatedMinutes && `(~${step.estimatedMinutes}p)`}
                            </h4>
                            {step.estimatedMinutes && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startTimerForMinutes(step.estimatedMinutes || 3);
                                }}
                                className="text-[10px] px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 flex items-center gap-1 font-bold uppercase transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                Hẹn giờ {step.estimatedMinutes}p
                              </button>
                            )}
                          </div>

                          <p className={`text-sm leading-relaxed ${isDone ? 'line-through text-emerald-900/50' : 'text-zinc-700'}`}>
                            {step.instruction}
                          </p>

                          {step.tip && (
                            <div className="p-3 rounded-lg bg-zinc-50 text-[11px] text-zinc-600 flex items-start gap-2 font-medium">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-900/50" />
                              <span><strong>Mẹo:</strong> {step.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Finish cooking button */}
              <button
                id="finish-cooking-btn"
                onClick={handleFinishCooking}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Hoàn thành nấu!
              </button>
            </div>
          </div>

          {/* Section: Community Ratings & Reviews */}
          <div className="pt-6 border-t border-zinc-200 space-y-6">
            <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
              <Star className="w-4 h-4 fill-emerald-500 text-emerald-950" />
              Đánh giá từ cộng đồng ({reviews.length})
            </h3>

            {/* Submit form */}
            <form onSubmit={handleReviewSubmit} className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Đánh giá của bạn</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 text-zinc-800 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${star <= newRating ? 'fill-emerald-500' : 'text-emerald-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                placeholder="Chia sẻ cảm nhận, hương vị..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full p-3.5 rounded-lg bg-white border border-zinc-200 text-emerald-950 placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-400 resize-none font-medium"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview || !newComment.trim()}
                  className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi đánh giá
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.map(rev => (
                <div key={rev.id} className="p-5 rounded-xl bg-white border border-zinc-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={rev.userName}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-200"
                      />
                      <span className="font-semibold text-emerald-950">{rev.userName}</span>
                      <span className="text-[10px] text-emerald-900/60 font-medium">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-zinc-800">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-emerald-500 text-emerald-950" />
                      ))}
                    </div>
                  </div>
                  <p className="text-zinc-700 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
