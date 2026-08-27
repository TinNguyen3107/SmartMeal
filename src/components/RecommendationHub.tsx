import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Layers,
  MessageSquareText,
  Camera,
  Plus,
  X,
  SlidersHorizontal,
  Clock,
  Flame,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ThumbsUp,
  ThumbsDown,
  ChefHat,
  ArrowRight,
  RefreshCw,
  Info,
  Check,
  Star
} from 'lucide-react';
import {
  Ingredient,
  RecommendedRecipe,
  DietaryType,
  Difficulty,
  UserIngredient,
  MatchStatus
} from '../types';
import { formatMinutes } from '../utils/helpers';

interface RecommendationHubProps {
  allIngredients: Ingredient[];
  pantryItems: UserIngredient[];
  onSelectRecipe: (recipeId: string) => void;
  onAddToShoppingList: (ingredientName: string, quantity: number, unit: string, recipeName: string) => void;
  userDietaryPreferences: DietaryType[];
}

export const RecommendationHub: React.FC<RecommendationHubProps> = ({
  allIngredients,
  pantryItems,
  onSelectRecipe,
  onAddToShoppingList,
  userDietaryPreferences
}) => {
  // Input Method state
  const [inputTab, setInputTab] = useState<'search' | 'category' | 'nlp' | 'vision'>('search');

  // Selected ingredients list
  const [selectedIngredients, setSelectedIngredients] = useState<{ name: string; quantity?: number; unit?: string }[]>([
    { name: 'Trứng gà', quantity: 3, unit: 'quả' },
    { name: 'Cà chua', quantity: 2, unit: 'quả' },
    { name: 'Hành lá', quantity: 2, unit: 'nhánh' }
  ]);

  // Autocomplete search
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Ingredient[]>([]);

  // NLP Input
  const [nlpText, setNlpText] = useState('Trong tủ lạnh tôi có 4 quả trứng gà, 2 quả cà chua và ít hành lá. Tôi muốn món dễ nấu dưới 20 phút.');
  const [isExtractingNlp, setIsExtractingNlp] = useState(false);
  const [nlpSummary, setNlpSummary] = useState<string | null>(null);

  // Vision Input
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [isDetectingVision, setIsDetectingVision] = useState(false);

  // Filter preferences
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [maxCookingTime, setMaxCookingTime] = useState<number>(35);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'Any'>('Any');
  const [cuisineFilter, setCuisineFilter] = useState<string>('All');
  const [selectedDietTags, setSelectedDietTags] = useState<DietaryType[]>(userDietaryPreferences || ['Vietnamese']);

  // Results state
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendedRecipe[]>([]);
  const [hasRunRecommendation, setHasRunRecommendation] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'score' | 'time' | 'rating'>('match');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'HELPFUL' | 'NOT_RELEVANT'>>({});

  // Category view category selection
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Autocomplete search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = allIngredients.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.aliases.some(a => a.toLowerCase().includes(q))
    ).slice(0, 8);
    setSuggestions(matches);
  }, [searchQuery, allIngredients]);

  // Add ingredient
  const handleAddIngredient = (name: string, unit?: string, quantity: number = 1) => {
    if (!name.trim()) return;
    if (selectedIngredients.some(i => i.name.toLowerCase() === name.toLowerCase())) return;
    setSelectedIngredients(prev => [...prev, { name: name.trim(), quantity, unit: unit || 'phần' }]);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleRemoveIngredient = (name: string) => {
    setSelectedIngredients(prev => prev.filter(i => i.name.toLowerCase() !== name.toLowerCase()));
  };

  // Sync from Pantry
  const handleSyncPantry = () => {
    if (!pantryItems || pantryItems.length === 0) {
      alert('Tủ lạnh của bạn đang trống! Hãy thêm món vào tab "Tủ lạnh của tôi" trước nhé.');
      return;
    }
    const newItems = pantryItems.map(p => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit
    }));
    setSelectedIngredients(newItems);
  };

  // Extract from Natural Language AI NLP
  const handleExtractNlp = async () => {
    if (!nlpText.trim()) return;
    setIsExtractingNlp(true);
    setNlpSummary(null);
    try {
      const res = await fetch('/api/ai/extract-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlpText })
      });
      const data = await res.json();
      if (data.success && data.ingredients?.length) {
        setSelectedIngredients(data.ingredients);
        if (data.constraints?.maxCookingTime) {
          setMaxCookingTime(data.constraints.maxCookingTime);
        }
        if (data.constraints?.difficulty) {
          setDifficultyFilter(data.constraints.difficulty);
        }
        setNlpSummary(data.understoodIntentSummary || 'Đã phân tích thành công!');
        // Automatically run recommendation
        runRecommendation(data.ingredients);
      }
    } catch (err) {
      console.error('NLP error:', err);
    } finally {
      setIsExtractingNlp(false);
    }
  };

  // Handle Vision Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setVisionImage(base64);
      setIsDetectingVision(true);
      try {
        const res = await fetch('/api/ai/vision-fridge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
        });
        const data = await res.json();
        if (data.success && data.ingredients?.length) {
          setSelectedIngredients(data.ingredients);
          setNlpSummary(data.understoodIntentSummary || 'Đã nhận diện thành công thực phẩm từ ảnh!');
          runRecommendation(data.ingredients);
        }
      } catch (err) {
        console.error('Vision error:', err);
      } finally {
        setIsDetectingVision(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Run Recommendation Request
  const runRecommendation = async (currentList = selectedIngredients) => {
    if (currentList.length === 0) {
      alert('Vui lòng chọn hoặc nhập ít nhất một nguyên liệu!');
      return;
    }
    setIsLoading(true);
    setHasRunRecommendation(true);

    try {
      const payload = {
        ingredients: currentList,
        preferences: {
          dietaryTypes: selectedDietTags,
          preferredCuisine: cuisineFilter === 'All' ? undefined : cuisineFilter,
          maxCookingTime: maxCookingTime,
          difficulty: difficultyFilter === 'Any' ? undefined : difficultyFilter
        }
      };

      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Recommendation API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run initial recommendation on first render
  useEffect(() => {
    runRecommendation();
  }, []);

  // Send feedback
  const handleFeedback = async (recipeId: string, recipeName: string, type: 'HELPFUL' | 'NOT_RELEVANT') => {
    setFeedbackGiven(prev => ({ ...prev, [recipeId]: type }));
    try {
      await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, recipeName, feedbackType: type })
      });
    } catch (e) {
      console.error('Feedback failed:', e);
    }
  };

  // Filtered and sorted recommendations
  const filteredRecommendations = recommendations
    .filter(r => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'CAN_COOK') return r.matchScore >= 90;
      if (statusFilter === 'ALMOST') return r.matchScore >= 70 && r.matchScore < 90;
      if (statusFilter === 'SUPPLEMENT') return r.matchScore >= 50 && r.matchScore < 70;
      if (statusFilter === 'LOW') return r.matchScore < 50;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      if (sortBy === 'score') return b.finalScore - a.finalScore;
      if (sortBy === 'time') return a.recipe.totalTime - b.recipe.totalTime;
      if (sortBy === 'rating') return b.recipe.rating - a.recipe.rating;
      return 0;
    });

  const categories = [
    { id: 'All', name: 'Tất cả', icon: '🍽️' },
    { id: 'EggDairy', name: 'Trứng & Sữa', icon: '🥚' },
    { id: 'Vegetable', name: 'Rau củ', icon: '🥬' },
    { id: 'Meat', name: 'Thịt', icon: '🥩' },
    { id: 'Seafood', name: 'Hải sản', icon: '🦐' },
    { id: 'GrainCarb', name: 'Gạo & Mì', icon: '🍚' },
    { id: 'Condiment', name: 'Gia vị', icon: '🧂' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header - Deep Forest Botanical */}
      <div className="bg-[#4A5D4E] text-white rounded-[36px] p-8 sm:p-10 card-shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-[#8BA08E]/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-[#E9EDC9] text-xs font-semibold mb-4 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-[#D9AE94]" />
            Động cơ gợi ý thông minh SmartMeal Engine (FR-08)
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight">
            "Hôm nay trong bếp bạn có gì?"
          </h1>
          <p className="mt-3 text-[#E9EDC9] text-sm sm:text-base leading-relaxed opacity-95">
            Nhập nguyên liệu bằng giọng nói, văn bản tự nhiên, ảnh chụp tủ lạnh hoặc danh mục.
            Hệ thống sẽ chuẩn hóa, tính toán <strong className="text-[#D9AE94]">Match Score %</strong> và đề xuất thực đơn trọn vị tự nhiên.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: 4 Input Methods & Selected Ingredients Tray (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Input Method Switcher Box */}
          <div className="bg-white border border-[#EAE7E0] rounded-4xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-[#3D3D3D] flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#8BA08E]" />
                Phương thức nhập nguyên liệu
              </h2>
              <button
                id="sync-pantry-btn"
                onClick={handleSyncPantry}
                className="text-xs px-3 py-1.5 rounded-full bg-[#F2EDE4] text-[#4A5D4E] border border-[#EAE7E0] hover:bg-[#EAE7E0] transition-colors flex items-center gap-1.5 font-semibold"
                title="Lấy nguyên liệu đã lưu trong Tủ lạnh"
              >
                <RefreshCw className="w-3 h-3 text-[#8BA08E]" />
                Tủ lạnh ({pantryItems?.length || 0})
              </button>
            </div>

            {/* Segmented Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1.5 bg-[#F2EDE4] rounded-2xl border border-[#EAE7E0] text-xs mb-5">
              <button
                id="input-tab-search"
                onClick={() => setInputTab('search')}
                className={`py-2 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${inputTab === 'search'
                    ? 'bg-[#4A5D4E] text-white shadow-sm'
                    : 'text-[#686868] hover:text-[#3D3D3D]'
                  }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Tìm gõ</span>
              </button>
              <button
                id="input-tab-category"
                onClick={() => setInputTab('category')}
                className={`py-2 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${inputTab === 'category'
                    ? 'bg-[#4A5D4E] text-white shadow-sm'
                    : 'text-[#686868] hover:text-[#3D3D3D]'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Danh mục</span>
              </button>
              <button
                id="input-tab-nlp"
                onClick={() => setInputTab('nlp')}
                className={`py-2 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${inputTab === 'nlp'
                    ? 'bg-[#4A5D4E] text-white shadow-sm'
                    : 'text-[#686868] hover:text-[#3D3D3D]'
                  }`}
              >
                <MessageSquareText className="w-3.5 h-3.5" />
                <span>AI Câu nói</span>
              </button>
              <button
                id="input-tab-vision"
                onClick={() => setInputTab('vision')}
                className={`py-2 rounded-xl font-semibold transition-all flex flex-col items-center gap-1 ${inputTab === 'vision'
                    ? 'bg-[#4A5D4E] text-white shadow-sm'
                    : 'text-[#686868] hover:text-[#3D3D3D]'
                  }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ảnh tủ lạnh</span>
              </button>
            </div>

            {/* TAB 1: Search Autocomplete (FR-05 Method 1) */}
            {inputTab === 'search' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#A9A296] absolute left-3.5 top-3.5" />
                  <input
                    id="ingredient-search-input"
                    type="text"
                    placeholder="Gõ tên nguyên liệu: trứng gà, cà chua, thịt bò..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleAddIngredient(searchQuery.trim());
                      }
                    }}
                    className="w-full pl-10 pr-16 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] focus:bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleAddIngredient(searchQuery)}
                      className="absolute right-2 top-2 px-3 py-1 rounded-xl bg-[#8BA08E] text-white text-xs font-semibold hover:bg-[#798E7C] transition-colors"
                    >
                      Thêm
                    </button>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="rounded-2xl bg-white border border-[#EAE7E0] p-2 space-y-1 max-h-48 overflow-y-auto card-shadow">
                    <p className="text-[10px] text-[#7D857E] font-bold px-2 py-1 uppercase tracking-wider">Gợi ý từ điển chuẩn hóa</p>
                    {suggestions.map(sug => (
                      <button
                        key={sug.id}
                        onClick={() => handleAddIngredient(sug.name, sug.defaultUnit)}
                        className="w-full px-3 py-2 text-left rounded-xl text-xs text-[#3D3D3D] hover:bg-[#F2EDE4] hover:text-[#4A5D4E] flex items-center justify-between group transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{sug.icon || '🥗'}</span>
                          <span className="font-medium">{sug.name}</span>
                          <span className="text-[10px] text-[#7D857E]">({sug.categoryNameVi})</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F2EDE4] text-[#4A5D4E] group-hover:bg-[#8BA08E] group-hover:text-white font-semibold">
                          + Thêm
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick Add Pills */}
                <div>
                  <p className="text-xs text-[#7D857E] mb-2 font-medium">Thường có sẵn trong bếp:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Trứng gà', 'Cà chua', 'Hành lá', 'Tỏi', 'Thịt heo xay', 'Thịt bò', 'Khoai tây', 'Rau muống'].map(item => {
                      const isSelected = selectedIngredients.some(i => i.name.toLowerCase() === item.toLowerCase());
                      return (
                        <button
                          key={item}
                          disabled={isSelected}
                          onClick={() => handleAddIngredient(item)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${isSelected
                              ? 'bg-[#F2EDE4] text-[#A9A296] border-[#EAE7E0] cursor-not-allowed'
                              : 'bg-[#F9F7F2] hover:bg-white text-[#3D3D3D] border-[#EAE7E0] hover:border-[#8BA08E]'
                            }`}
                        >
                          + {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Category Grid Selection (FR-05 Method 2) */}
            {inputTab === 'category' && (
              <div className="space-y-3">
                {/* Category selector */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeCategory === cat.id
                          ? 'bg-[#4A5D4E] text-white shadow-sm'
                          : 'bg-[#F9F7F2] text-[#686868] hover:text-[#3D3D3D] border border-[#EAE7E0]'
                        }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Items grid */}
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {allIngredients
                    .filter(i => activeCategory === 'All' || i.category === activeCategory)
                    .map(ing => {
                      const isSelected = selectedIngredients.some(s => s.name.toLowerCase() === ing.name.toLowerCase());
                      return (
                        <button
                          key={ing.id}
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveIngredient(ing.name);
                            } else {
                              handleAddIngredient(ing.name, ing.defaultUnit);
                            }
                          }}
                          className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-colors ${isSelected
                              ? 'bg-[#8BA08E]/20 border-[#8BA08E] text-[#4A5D4E] font-medium'
                              : 'bg-[#F9F7F2] border-[#EAE7E0] hover:border-[#8BA08E] text-[#3D3D3D]'
                            }`}
                        >
                          <span className="text-xl">{ing.icon || '🥗'}</span>
                          <div className="truncate flex-1">
                            <p className="text-xs font-semibold leading-tight truncate">{ing.name}</p>
                            <p className="text-[10px] text-[#7D857E]">{ing.defaultUnit}</p>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-[#4A5D4E] shrink-0" />
                          ) : (
                            <Plus className="w-4 h-4 text-[#A9A296] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB 3: Natural Language AI NLP (FR-05 Method 3, FR-20) */}
            {inputTab === 'nlp' && (
              <div className="space-y-3">
                <p className="text-xs text-[#686868] leading-relaxed">
                  Gõ hoặc dán một câu mô tả tự nhiên. AI sẽ trích xuất danh sách nguyên liệu và giới hạn thời gian nấu:
                </p>
                <textarea
                  id="nlp-input-textarea"
                  rows={3}
                  value={nlpText}
                  onChange={e => setNlpText(e.target.value)}
                  placeholder="Ví dụ: 'Tôi có 3 quả trứng, 2 quả cà chua và thịt bò xay, muốn món dễ làm trong 20 phút.'"
                  className="w-full p-3 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] focus:bg-white resize-none leading-relaxed"
                />

                {/* Example prompts */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Tôi có trứng, cà chua, hành lá',
                    'Tôi có thịt bò, ớt chuông, bơ và hành tây',
                    'Tôi có ức gà, xà lách, dưa leo Eat Clean',
                    'Tôi có sườn heo, cà chua, dứa nấu chua'
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNlpText(sample)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-[#F2EDE4] hover:bg-[#EAE7E0] text-[#4A5D4E] border border-[#EAE7E0] truncate max-w-full font-medium"
                    >
                      🌿 {sample}
                    </button>
                  ))}
                </div>

                <button
                  id="extract-nlp-btn"
                  disabled={isExtractingNlp || !nlpText.trim()}
                  onClick={handleExtractNlp}
                  className="w-full py-3 rounded-2xl bg-[#4A5D4E] hover:bg-[#3D4D40] text-white font-bold text-xs flex items-center justify-center gap-2 card-shadow disabled:opacity-50 transition-all"
                >
                  {isExtractingNlp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Gemini AI đang phân tích văn bản...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#D9AE94]" />
                      Phân tích bằng AI NLP & Gợi ý ngay
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 4: AI Fridge Vision (FR-26) */}
            {inputTab === 'vision' && (
              <div className="space-y-3 text-center">
                <p className="text-xs text-[#686868]">
                  Tải lên ảnh chụp tủ lạnh, kệ bếp hoặc bàn nguyên liệu. Gemini Vision sẽ tự động nhận diện danh sách thực phẩm:
                </p>

                <div className="border-2 border-dashed border-[#D1CEC7] hover:border-[#8BA08E] rounded-3xl p-5 bg-[#F9F7F2] transition-colors">
                  {visionImage ? (
                    <div className="relative">
                      <img
                        src={visionImage}
                        alt="Fridge scan"
                        className="w-full h-40 object-cover rounded-2xl border border-[#EAE7E0]"
                      />
                      <button
                        onClick={() => setVisionImage(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                      <div className="w-12 h-12 rounded-full bg-[#8BA08E]/20 text-[#4A5D4E] flex items-center justify-center mb-2">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-[#3D3D3D]">Chọn ảnh tủ lạnh hoặc chụp ảnh</span>
                      <span className="text-[10px] text-[#7D857E] mt-1">Hỗ trợ JPG, PNG, WEBP</span>
                      <input
                        id="fridge-camera-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {isDetectingVision && (
                  <div className="p-3 rounded-2xl bg-[#8BA08E]/20 border border-[#8BA08E]/40 text-[#4A5D4E] text-xs flex items-center justify-center gap-2 font-medium">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#4A5D4E]" />
                    Gemini Vision AI đang nhận diện đồ ăn trong ảnh...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tray: Selected Ingredients (Active List) */}
          <div className="bg-white border border-[#EAE7E0] rounded-4xl p-6 card-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
                <span>Nguyên liệu bạn đang có</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#8BA08E]/20 text-[#4A5D4E] text-xs font-bold">
                  {selectedIngredients.length} món
                </span>
              </h3>
              {selectedIngredients.length > 0 && (
                <button
                  onClick={() => setSelectedIngredients([])}
                  className="text-xs text-[#A9A296] hover:text-[#B85244] transition-colors font-medium"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {nlpSummary && (
              <div className="mb-3 p-3 rounded-2xl bg-[#E9EDC9]/60 border border-[#D8DFB0] text-[#364939] text-xs flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#4A5D4E]" />
                <p className="leading-relaxed">{nlpSummary}</p>
              </div>
            )}

            {selectedIngredients.length === 0 ? (
              <div className="text-center py-6 text-[#7D857E] text-xs border border-dashed border-[#D1CEC7] rounded-2xl bg-[#F9F7F2]">
                Chưa có nguyên liệu nào được chọn. Hãy tìm gõ hoặc chọn từ danh mục ở trên!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {selectedIngredients.map((item, index) => (
                  <span
                    key={`${item.name}-${index}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F2EDE4] border border-[#EAE7E0] text-[#3D3D3D] text-xs shadow-sm group hover:border-[#8BA08E] transition-colors font-medium"
                  >
                    <span className="font-semibold text-[#4A5D4E]">{item.name}</span>
                    {item.quantity && (
                      <span className="text-[11px] text-[#7D857E]">
                        ({item.quantity} {item.unit || ''})
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveIngredient(item.name)}
                      className="ml-1 text-[#A9A296] hover:text-[#B85244] transition-colors"
                      title="Xóa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Filter Toggle & Primary Action */}
            <div className="mt-5 pt-4 border-t border-[#F2EDE4] flex flex-col gap-3">
              <button
                id="toggle-filters-btn"
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] hover:border-[#D1CEC7] text-[#3D3D3D] text-xs font-medium flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#8BA08E]" />
                  Bộ lọc nâng cao (Thời gian: &le; {maxCookingTime}p, Chế độ ăn: {selectedDietTags.join(', ')})
                </span>
                <span className="text-[10px] text-[#4A5D4E] font-bold">
                  {showFilterDrawer ? 'Thu gọn ▲' : 'Mở rộng ▼'}
                </span>
              </button>

              {/* Collapsible Filter Section */}
              {showFilterDrawer && (
                <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] space-y-4 text-xs">
                  {/* Max cooking time slider */}
                  <div>
                    <div className="flex justify-between text-[#3D3D3D] mb-1 font-semibold">
                      <span>Thời gian nấu tối đa:</span>
                      <span className="text-[#4A5D4E] font-bold">{maxCookingTime} phút</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={maxCookingTime}
                      onChange={e => setMaxCookingTime(Number(e.target.value))}
                      className="w-full accent-[#4A5D4E]"
                    />
                    <div className="flex justify-between text-[10px] text-[#7D857E] mt-0.5">
                      <span>10p (Siêu nhanh)</span>
                      <span>30p</span>
                      <span>60p (Món hầm)</span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <span className="block font-semibold text-[#3D3D3D] mb-1.5">Độ khó chế biến:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {['Any', 'Easy', 'Medium', 'Hard'].map(d => (
                        <button
                          key={d}
                          onClick={() => setDifficultyFilter(d as any)}
                          className={`py-1.5 rounded-xl font-semibold border text-center transition-colors ${difficultyFilter === d
                              ? 'bg-[#4A5D4E] text-white border-[#4A5D4E]'
                              : 'bg-white text-[#686868] border-[#EAE7E0] hover:bg-[#F2EDE4]'
                            }`}
                        >
                          {d === 'Any' ? 'Tất cả' : d === 'Easy' ? 'Dễ' : d === 'Medium' ? 'Vừa' : 'Khó'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Preferences Tags (FR-03) */}
                  <div>
                    <span className="block font-semibold text-[#3D3D3D] mb-1.5">Chế độ dinh dưỡng ưu tiên:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(['Vietnamese', 'Healthy', 'Vegetarian', 'Low Carb', 'High Protein', 'Quick Meal', 'Budget Meal'] as DietaryType[]).map(tag => {
                        const isSelected = selectedDietTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedDietTags(prev => prev.filter(t => t !== tag));
                              } else {
                                setSelectedDietTags(prev => [...prev, tag]);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${isSelected
                                ? 'bg-[#8BA08E] text-white border-[#8BA08E]'
                                : 'bg-white text-[#686868] border-[#EAE7E0] hover:border-[#8BA08E]'
                              }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Search Button */}
              <button
                id="run-recommendations-btn"
                disabled={isLoading || selectedIngredients.length === 0}
                onClick={() => runRecommendation()}
                className="w-full py-4 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-sm card-shadow flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Đang tính toán Matching Score...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-[#E9EDC9]" />
                    GỢI Ý MÓN ĂN NGAY ({selectedIngredients.length} nguyên liệu)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recommendation Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Bucket Filter & Sort Bar (FR-10) */}
          <div className="bg-white border border-[#EAE7E0] rounded-[28px] p-5 card-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#3D3D3D] flex items-center gap-2">
                <span>Kết quả gợi ý</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#8BA08E]/20 text-[#4A5D4E] text-xs font-bold">
                  {filteredRecommendations.length} món
                </span>
              </h2>
              <p className="text-xs text-[#7D857E]">Xếp hạng theo thuật toán Matching & Tùy biến tự nhiên</p>
            </div>

            {/* Sorting control */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#7D857E] whitespace-nowrap font-medium">Sắp xếp:</span>
              <select
                id="recommendation-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#8BA08E] font-medium"
              >
                <option value="match">% Khớp nguyên liệu (FR-09)</option>
                <option value="score">Điểm tổng hợp Final Score</option>
                <option value="time">Nấu nhanh nhất</option>
                <option value="rating">Đánh giá sao cao nhất</option>
              </select>
            </div>
          </div>

          {/* Tier Tabs (FR-10 Classification) */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'CAN_COOK', label: '🟢 Có thể nấu ngay (90-100%)' },
              { id: 'ALMOST', label: '🟡 Gần đủ (70-89%)' },
              { id: 'SUPPLEMENT', label: '🟠 Cần bổ sung (50-69%)' },
              { id: 'LOW', label: '⚪ Không ưu tiên (<50%)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${statusFilter === tab.id
                    ? 'bg-[#4A5D4E] text-white border-[#4A5D4E] shadow-sm'
                    : 'bg-white text-[#686868] border-[#EAE7E0] hover:bg-[#F2EDE4]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Recommendations List Cards */}
          {isLoading ? (
            <div className="text-center py-16 bg-white rounded-4xl border border-[#EAE7E0] card-shadow">
              <div className="w-12 h-12 rounded-full border-4 border-[#8BA08E]/20 border-t-[#8BA08E] animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-[#3D3D3D]">Đang chuẩn hóa nguyên liệu và tính toán điểm phù hợp...</p>
              <p className="text-xs text-[#7D857E] mt-1">Áp dụng thuật toán Ingredient Matching & User Preference Boost</p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-4xl border border-[#EAE7E0] p-6 card-shadow">
              <AlertCircle className="w-12 h-12 text-[#C87D55] mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-[#3D3D3D]">Không tìm thấy món ăn phù hợp</h3>
              <p className="text-xs text-[#7D857E] max-w-md mx-auto mt-1 mb-4 leading-relaxed">
                Bạn có thể thử: Thêm nguyên liệu phổ biến (Trứng gà, Cà chua, Thịt), tăng thời gian nấu hoặc bỏ bớt bộ lọc.
              </p>
              <button
                onClick={() => {
                  setSelectedIngredients([
                    { name: 'Trứng gà', quantity: 3, unit: 'quả' },
                    { name: 'Cà chua', quantity: 2, unit: 'quả' },
                    { name: 'Hành lá', quantity: 2, unit: 'nhánh' }
                  ]);
                  runRecommendation();
                }}
                className="px-5 py-2.5 rounded-full bg-[#8BA08E] text-white text-xs font-bold hover:bg-[#798E7C] transition-colors card-shadow"
              >
                Thử với bộ nguyên liệu mẫu [Trứng, Cà chua, Hành]
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecommendations.map((item, idx) => {
                const { recipe, matchScore, status, matchedIngredients, missingIngredients, explanation } = item;

                const statusColor =
                  status === 'CAN_COOK_NOW'
                    ? 'text-[#344C39] bg-[#E9EDC9] border-[#C5CF9F]'
                    : status === 'ALMOST_READY'
                      ? 'text-[#8C5D36] bg-[#F2EDE4] border-[#D9AE94]'
                      : status === 'NEEDS_SUPPLEMENT'
                        ? 'text-[#B85226] bg-[#FBE8DE] border-[#F3C1A8]'
                        : 'text-[#767676] bg-[#F5F5F5] border-[#EAE7E0]';

                return (
                  <div
                    key={recipe.id}
                    className="bg-white border border-[#EAE7E0] rounded-[28px] overflow-hidden card-shadow hover:border-[#D1CEC7] transition-all group"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Food Image */}
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-full sm:w-32 h-32 rounded-2xl object-cover ring-1 ring-[#EAE7E0] shrink-0 group-hover:scale-102 transition-transform"
                        />

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <span className="text-[11px] text-[#7D857E] font-medium">{recipe.category} • {recipe.cuisine}</span>
                              <h3
                                onClick={() => onSelectRecipe(recipe.id)}
                                className="font-serif text-lg font-bold text-[#3D3D3D] hover:text-[#4A5D4E] transition-colors cursor-pointer leading-tight truncate"
                              >
                                {idx + 1}. {recipe.name}
                              </h3>
                            </div>

                            {/* Match Score Badge (FR-09, FR-10) */}
                            <div className="text-right shrink-0">
                              <div className={`px-3 py-1 rounded-full text-xs font-extrabold border inline-flex items-center gap-1 ${statusColor}`}>
                                <Check className="w-3.5 h-3.5" />
                                Match: {matchScore}%
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#686868] line-clamp-2 leading-relaxed mb-3">
                            {recipe.description}
                          </p>

                          {/* Quick Meta */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#7D857E] mb-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#8BA08E]" />
                              {formatMinutes(recipe.totalTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 text-[#C87D55]" />
                              {recipe.calories} kcal
                            </span>
                            <span className="flex items-center gap-1 text-[#C87D55]">
                              <Star className="w-3.5 h-3.5 fill-[#C87D55]" />
                              {recipe.rating} ({recipe.reviewCount})
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#F2EDE4] text-[10px] font-semibold text-[#4A5D4E]">
                              {recipe.difficulty === 'Easy' ? 'Dễ làm' : recipe.difficulty === 'Medium' ? 'Vừa phải' : 'Cầu kỳ'}
                            </span>
                          </div>

                          {/* FR-11: Matched vs Missing Ingredients breakdown */}
                          <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs space-y-2">
                            {/* Matched */}
                            {matchedIngredients.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-[#4A5D4E] shrink-0">Đã có ({matchedIngredients.length}):</span>
                                <span className="text-[#3D3D3D]">
                                  {matchedIngredients.map(m => m.name).join(', ')}
                                </span>
                              </div>
                            )}

                            {/* Missing */}
                            {missingIngredients.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#EAE7E0]">
                                <span className="font-bold text-[#C87D55] shrink-0">Chỉ cần thêm:</span>
                                {missingIngredients.map(miss => (
                                  <button
                                    key={miss.ingredientId}
                                    onClick={() => onAddToShoppingList(miss.name, miss.requiredQuantity, miss.unit, recipe.name)}
                                    className="px-2.5 py-0.5 rounded-full bg-[#F2EDE4] text-[#8C5D36] border border-[#D9AE94]/50 hover:bg-[#D9AE94]/30 transition-colors flex items-center gap-1 text-[11px] font-medium"
                                    title="Thêm vào danh sách đi chợ"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {miss.name} ({miss.requiredQuantity} {miss.unit})
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[#4A5D4E] font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Bạn có đủ tất cả nguyên liệu để nấu ngay món này!
                              </div>
                            )}
                          </div>

                          {/* FR-19: Explainable AI Box */}
                          <div className="mt-3 p-3 rounded-2xl bg-[#E9EDC9]/50 border border-[#D8DFB0] text-[11px] text-[#364939] flex items-start gap-2">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#4A5D4E]" />
                            <div>
                              <strong className="text-[#2D3F30] font-bold">Giải thích đề xuất (XAI): </strong>
                              {explanation.summary}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Action & Feedback */}
                      <div className="mt-4 pt-3 border-t border-[#F2EDE4] flex items-center justify-between">
                        {/* Feedback (FR-16) */}
                        <div className="flex items-center gap-2 text-xs text-[#7D857E]">
                          <span>Gợi ý này có hữu ích?</span>
                          <button
                            onClick={() => handleFeedback(recipe.id, recipe.name, 'HELPFUL')}
                            className={`p-2 rounded-full border transition-colors ${feedbackGiven[recipe.id] === 'HELPFUL'
                                ? 'bg-[#8BA08E] text-white border-[#8BA08E]'
                                : 'bg-[#F2EDE4] hover:bg-[#EAE7E0] text-[#3D3D3D] border-[#EAE7E0]'
                              }`}
                            title="Hữu ích"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFeedback(recipe.id, recipe.name, 'NOT_RELEVANT')}
                            className={`p-2 rounded-full border transition-colors ${feedbackGiven[recipe.id] === 'NOT_RELEVANT'
                                ? 'bg-[#B85244] text-white border-[#B85244]'
                                : 'bg-[#F2EDE4] hover:bg-[#EAE7E0] text-[#3D3D3D] border-[#EAE7E0]'
                              }`}
                            title="Không phù hợp"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* View Recipe detail CTA */}
                        <button
                          onClick={() => onSelectRecipe(recipe.id)}
                          className="px-5 py-2.5 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-xs flex items-center gap-1.5 card-shadow transition-colors"
                        >
                          Xem công thức & Nấu
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
