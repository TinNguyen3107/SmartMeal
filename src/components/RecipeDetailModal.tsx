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
            alert('⏰ Hết giờ nấu bước này! Món ăn đã sẵn sàng cho bước tiếp theo.');
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
    alert('🎉 Chúc mừng bạn đã hoàn thành món ăn thơm ngon! Đừng quên để lại đánh giá nhé.');
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
          message: `Trong món "${recipe?.name}", tôi muốn thay thế hoặc biến tấu: "${substitutionPrompt}". Hãy hướng dẫn tỉ lệ và cách làm phù hợp.`,
          pantryIngredients: pantryItems.map(p => p.name)
        })
      });
      const data = await res.json();
      setSubstitutionAdvice(data.reply || 'AI đã tiếp nhận câu hỏi của bạn.');
    } catch (e) {
      console.error('Advice error:', e);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  if (isLoading || !recipe) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 max-w-sm w-full">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold">Đang tải công thức chi tiết...</p>
        </div>
      </div>
    );
  }

  const pantryNormNames = new Set(pantryItems.map(p => p.normalizedName));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#EAE7E0] rounded-[36px] max-w-4xl w-full max-h-[92vh] overflow-y-auto card-shadow-lg text-[#3D3D3D] relative">
        {/* Close Button */}
        <button
          id="close-recipe-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center transition-colors shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-t-[36px]">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

          {/* Banner Meta Content */}
          <div className="absolute bottom-6 left-8 right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="px-3 py-1 rounded-full bg-[#8BA08E] text-white text-xs font-bold shadow-sm">
                  {recipe.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs font-semibold backdrop-blur-sm">
                  {recipe.cuisine}
                </span>
                {recipe.dietaryTags.map(d => (
                  <span key={d} className="px-2.5 py-1 rounded-full bg-[#4A5D4E]/80 text-[#E9EDC9] text-xs font-medium backdrop-blur-sm">
                    {d}
                  </span>
                ))}
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-normal text-white tracking-tight">{recipe.name}</h1>
            </div>

            {/* Favorite & Ratings */}
            <div className="flex items-center gap-2">
              <button
                id="toggle-favorite-recipe-btn"
                onClick={() => onToggleFavorite(recipe.id)}
                className={`px-4 py-2 rounded-full border flex items-center gap-1.5 text-xs font-bold transition-colors backdrop-blur-sm ${isFavorite
                    ? 'bg-[#C87D55] text-white border-[#C87D55]'
                    : 'bg-black/40 text-white border-white/30 hover:bg-black/60'
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
            <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8BA08E]/20 text-[#4A5D4E] flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[#7D857E] font-medium">Thời gian nấu</p>
                <p className="text-sm font-bold text-[#3D3D3D]">{recipe.cookingTime}p (Tổng: {recipe.totalTime}p)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C87D55]/20 text-[#8C5D36] flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[#7D857E] font-medium">Lượng Calo</p>
                <p className="text-sm font-bold text-[#3D3D3D]">{recipe.calories} kcal</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8BA08E]/20 text-[#4A5D4E] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-[#7D857E] font-medium">Khẩu phần</p>
                <p className="text-sm font-bold text-[#3D3D3D]">{recipe.servings * servingsMultiplier} người ăn</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D9AE94]/30 text-[#8C5D36] flex items-center justify-center">
                <Star className="w-5 h-5 fill-[#D9AE94] text-[#D9AE94]" />
              </div>
              <div>
                <p className="text-[11px] text-[#7D857E] font-medium">Đánh giá</p>
                <p className="text-sm font-bold text-[#3D3D3D]">{recipe.rating} ({recipe.reviewCount} lượt)</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EAE7E0] text-sm text-[#3D3D3D] leading-relaxed">
            {recipe.description}
          </div>

          {/* 2-Columns Layout: Ingredients Checklist vs Step-by-Step Cooking */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: Ingredients Checklist & Scaler (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[#8BA08E]" />
                  Nguyên liệu cần có
                </h3>
                {/* Scaler buttons */}
                <div className="flex items-center gap-1 bg-[#F9F7F2] p-1 rounded-full border border-[#EAE7E0] text-xs">
                  <span className="text-[10px] text-[#7D857E] px-1 font-medium">Khẩu phần:</span>
                  {[1, 2, 3].map(mult => (
                    <button
                      key={mult}
                      onClick={() => setServingsMultiplier(mult)}
                      className={`px-2.5 py-0.5 rounded-full font-bold transition-colors ${servingsMultiplier === mult
                          ? 'bg-[#8BA08E] text-white shadow-sm'
                          : 'text-[#7D857E] hover:text-[#3D3D3D]'
                        }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients Table */}
              <div className="rounded-[28px] bg-[#F9F7F2] border border-[#EAE7E0] p-4 space-y-2.5">
                {recipe.ingredients.map(ing => {
                  const hasInPantry = pantryNormNames.has(ing.normalizedName);
                  const scaledQty = ing.quantity * servingsMultiplier;

                  return (
                    <div
                      key={ing.ingredientId}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-colors ${hasInPantry
                          ? 'bg-white border-[#8BA08E]/40 text-[#4A5D4E] card-shadow'
                          : 'bg-white border-[#EAE7E0] text-[#3D3D3D]'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {hasInPantry ? (
                          <CheckCircle2 className="w-4 h-4 text-[#8BA08E] shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#C87D55] shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-[#3D3D3D]">{ing.name}</span>
                          {ing.isOptional && <span className="ml-1 text-[10px] text-[#7D857E]">(Tùy chọn)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#8C5D36] bg-[#F2EDE4] px-2.5 py-1 rounded-full">
                          {scaledQty} {ing.unit}
                        </span>
                        {!hasInPantry && (
                          <button
                            onClick={() => onAddToShoppingList(ing.name, scaledQty, ing.unit, recipe.name)}
                            className="p-1.5 rounded-full bg-[#C87D55]/15 text-[#8C5D36] hover:bg-[#C87D55]/30 transition-colors"
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
              <div className="p-5 rounded-[28px] bg-[#FDFBF7] border border-[#EAE7E0] space-y-3">
                <div className="flex items-center gap-2 text-[#4A5D4E] text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-[#8BA08E]" />
                  Hỏi AI mẹo thay thế nguyên liệu
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: Thay bơ lạt bằng gì? Không ăn cay thì sao?"
                    value={substitutionPrompt}
                    onChange={e => setSubstitutionPrompt(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-white border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
                  />
                  <button
                    disabled={isLoadingAdvice || !substitutionPrompt.trim()}
                    onClick={handleAskSubstitution}
                    className="px-4 py-2 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Hỏi
                  </button>
                </div>

                {substitutionAdvice && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EAE7E0] text-xs text-[#3D3D3D] leading-relaxed">
                    {substitutionAdvice}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Step-by-Step Interactive Cooking Mode (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
                  <span>Các bước chế biến</span>
                  <span className="text-xs text-[#4A5D4E] font-semibold">
                    ({completedSteps.length}/{recipe.instructions.length} bước xong)
                  </span>
                </h3>

                {/* Active countdown timer display if running */}
                {timerSeconds > 0 && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C87D55]/15 text-[#8C5D36] border border-[#C87D55]/30 text-xs font-mono font-bold">
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
                      className={`p-5 rounded-3xl border transition-all cursor-pointer ${isCurrent
                          ? 'bg-[#F9F7F2] border-[#8BA08E] ring-1 ring-[#8BA08E]'
                          : isDone
                            ? 'bg-[#F9F7F2]/60 border-[#EAE7E0] opacity-60'
                            : 'bg-white border-[#EAE7E0] hover:border-[#D1CEC7] card-shadow'
                        }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStep(step.stepNumber);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${isDone
                              ? 'bg-[#8BA08E] text-white'
                              : 'border-2 border-[#D1CEC7] text-[#7D857E] hover:border-[#8BA08E]'
                            }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : step.stepNumber}
                        </button>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif text-xs font-bold text-[#3D3D3D]">
                              Bước {step.stepNumber} {step.estimatedMinutes && `(~${step.estimatedMinutes} phút)`}
                            </h4>
                            {step.estimatedMinutes && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startTimerForMinutes(step.estimatedMinutes || 3);
                                }}
                                className="text-[11px] px-2.5 py-1 rounded-full bg-[#8BA08E]/15 text-[#4A5D4E] border border-[#8BA08E]/30 hover:bg-[#8BA08E]/25 flex items-center gap-1 font-semibold transition-colors"
                              >
                                <Play className="w-3 h-3" />
                                Hẹn giờ {step.estimatedMinutes}p
                              </button>
                            )}
                          </div>

                          <p className={`text-xs leading-relaxed ${isDone ? 'line-through text-[#A9A296]' : 'text-[#3D3D3D]'}`}>
                            {step.instruction}
                          </p>

                          {step.tip && (
                            <div className="p-3 rounded-2xl bg-[#FDFBF7] border border-[#EAE7E0] text-[11px] text-[#8C5D36] flex items-start gap-2">
                              <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D9AE94]" />
                              <span><strong>Mẹo bếp:</strong> {step.tip}</span>
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
                className="w-full py-3.5 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-sm card-shadow flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#E9EDC9]" />
                Hoàn thành nấu món này! (Ăn ngon miệng)
              </button>
            </div>
          </div>

          {/* Section: Community Ratings & Reviews (FR-16) */}
          <div className="pt-6 border-t border-[#EAE7E0] space-y-6">
            <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
              <Star className="w-4 h-4 fill-[#D9AE94] text-[#D9AE94]" />
              Đánh giá & Nhận xét từ người nấu ({reviews.length})
            </h3>

            {/* Submit form */}
            <form onSubmit={handleReviewSubmit} className="p-5 rounded-[28px] bg-[#F9F7F2] border border-[#EAE7E0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#3D3D3D]">Đánh giá món ăn:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1 text-[#D9AE94] hover:scale-110 transition-transform"
                    >
                      <Star className={`w-5 h-5 ${star <= newRating ? 'fill-[#D9AE94]' : 'text-[#D1CEC7]'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={2}
                placeholder="Chia sẻ cảm nhận, hương vị hoặc mẹo nêm nếm của bạn..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-white border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] resize-none font-medium"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview || !newComment.trim()}
                  className="px-5 py-2.5 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 card-shadow transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi nhận xét
                </button>
              </div>
            </form>

            {/* Reviews List */}
            <div className="space-y-3">
              {reviews.map(rev => (
                <div key={rev.id} className="p-5 rounded-3xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={rev.userName}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-[#EAE7E0]"
                      />
                      <span className="font-semibold text-[#3D3D3D]">{rev.userName}</span>
                      <span className="text-[10px] text-[#7D857E]">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-[#D9AE94]">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#D9AE94]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[#3D3D3D] leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
