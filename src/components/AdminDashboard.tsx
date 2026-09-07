import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BarChart3,
  BookOpen,
  Layers,
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  Sliders,
  RefreshCw,
  Plus,
  Save,
  Trash2,
  Edit3,
  Download,
  WandSparkles,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  EvaluationMetricResult,
  EvaluationCaseRecord,
  EvaluationRunRecord,
  Ingredient,
  Recipe,
  SystemLog,
  TestCaseResult,
  RecommendationWeightConfig,
  RecipeDraft
} from '../types';

interface AdminDashboardProps {
  allIngredients: Ingredient[];
  onRefreshData: () => void;
}

interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  allIngredients,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'recipes' | 'ingredients' | 'users' | 'logs'>('evaluation');

  // Evaluation state
  const [kValue, setKValue] = useState<number>(5);
  const [metrics, setMetrics] = useState<EvaluationMetricResult | null>(null);
  const [testCases, setTestCases] = useState<TestCaseResult[]>([]);
  const [evaluationCases, setEvaluationCases] = useState<EvaluationCaseRecord[]>([]);
  const [evaluationRuns, setEvaluationRuns] = useState<EvaluationRunRecord[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Recipe master data
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [adminIngredients, setAdminIngredients] = useState<Ingredient[]>(allIngredients);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [adminMessage, setAdminMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState<boolean>(false);
  const [recipeStatusFilter, setRecipeStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'REJECTED'>('ALL');
  const [draftPrompt, setDraftPrompt] = useState<string>('2 quả trứng gà, 2 quả cà chua, hành lá');
  const [draftWarnings, setDraftWarnings] = useState<string[]>([]);
  const [evaluationCaseForm, setEvaluationCaseForm] = useState({
    id: '',
    code: '',
    description: '',
    inputIngredients: '',
    expectedRecipeIds: [] as string[],
    nutritionGoal: '',
    tags: '',
    isActive: true
  });
  const [ingredientForm, setIngredientForm] = useState({
    id: '',
    name: '',
    category: 'vegetable',
    categoryNameVi: 'Rau củ',
    defaultUnit: 'g',
    caloriesPer100g: '',
    proteinPer100g: '',
    carbsPer100g: '',
    fatPer100g: '',
    aliases: ''
  });
  const [recipeForm, setRecipeForm] = useState({
    id: '',
    vietnameseName: '',
    description: '',
    category: 'Món chính',
    cuisine: 'Vietnamese',
    difficulty: 'Easy',
    status: 'PUBLISHED',
    preparationTime: 10,
    cookingTime: 20,
    calories: 350,
    servings: 2,
    tags: 'Vietnamese, Healthy',
    ingredients: 'Trứng gà | 2 | quả\nCà chua | 2 | quả',
    instructions: 'Sơ chế nguyên liệu.\nNấu chín nguyên liệu chính.\nNêm nếm vừa ăn và trình bày.'
  });

  // Engine Weights Tuner
  const [weights, setWeights] = useState<RecommendationWeightConfig>({
    w_match: 0.40,
    w_user: 0.12,
    w_nutrition: 0.18,
    w_semantic: 0.12,
    w_rating: 0.08,
    w_popularity: 0.05,
    w_time: 0.08,
    w_difficulty: 0.05
  });

  const loadAdminData = async () => {
    try {
      setAdminMessage('');
      const [resMetrics, resRecipes, resLogs, resIngredients, resUsers, resEvaluationRuns, resEvaluationCases] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/recipes'),
        fetch('/api/admin/logs'),
        fetch('/api/admin/ingredients'),
        fetch('/api/admin/users'),
        fetch('/api/admin/evaluation-runs'),
        fetch('/api/admin/evaluation-cases')
      ]);
      const dataMetrics = await resMetrics.json();
      const dataRecipes = await resRecipes.json();
      const dataLogs = await resLogs.json();
      const dataIngredients = await resIngredients.json();
      const dataUsers = await resUsers.json();
      const dataEvaluationRuns = await resEvaluationRuns.json();
      const dataEvaluationCases = await resEvaluationCases.json();
      if (!resMetrics.ok || !resRecipes.ok || !resLogs.ok || !resIngredients.ok || !resUsers.ok || !resEvaluationRuns.ok || !resEvaluationCases.ok) {
        throw new Error(dataMetrics.message || dataRecipes.message || dataLogs.message || dataIngredients.message || dataUsers.message || dataEvaluationRuns.message || dataEvaluationCases.message || 'Không thể tải dữ liệu quản trị.');
      }

      setMetrics(dataMetrics.metrics);
      setRecipes(dataRecipes.recipes || []);
      setLogs(dataLogs.logs || []);
      setAdminIngredients(dataIngredients.ingredients || []);
      setUsers(dataUsers.users || []);
      setEvaluationRuns(dataEvaluationRuns.runs || []);
      setEvaluationCases(dataEvaluationCases.cases || []);
    } catch (e) {
      console.error('Admin data load failed:', e);
      setAdminMessage(e instanceof Error ? e.message : 'Không thể tải dữ liệu quản trị.');
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    setAdminIngredients(allIngredients);
  }, [allIngredients]);

  const runEvaluationSuite = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/admin/run-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: kValue, weights })
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setTestCases(data.testCases || []);
        if (data.run) {
          setEvaluationRuns(previous => [data.run, ...previous.filter(run => run.id !== data.run.id)].slice(0, 8));
        }
      }
    } catch (err) {
      console.error('Eval failed:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetEvaluationCaseForm = () => {
    setEvaluationCaseForm({
      id: '',
      code: '',
      description: '',
      inputIngredients: '',
      expectedRecipeIds: [],
      nutritionGoal: '',
      tags: '',
      isActive: true
    });
  };

  const saveEvaluationCase = async () => {
    setIsSaving(true);
    setAdminMessage('');
    try {
      const isEditing = Boolean(evaluationCaseForm.id);
      const res = await fetch(
        isEditing ? `/api/admin/evaluation-cases/${evaluationCaseForm.id}` : '/api/admin/evaluation-cases',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...evaluationCaseForm,
            inputIngredients: evaluationCaseForm.inputIngredients.split('\n').map(item => item.trim()).filter(Boolean),
            tags: evaluationCaseForm.tags.split(',').map(item => item.trim()).filter(Boolean)
          })
        }
      );
      const data = await res.json();
      if (!res.ok || !data.case) throw new Error(data.message || 'Không thể lưu ca đánh giá.');
      setEvaluationCases(previous => [data.case, ...previous.filter(item => item.id !== data.case.id)].sort((a, b) => a.code.localeCompare(b.code)));
      resetEvaluationCaseForm();
      setAdminMessage(isEditing ? 'Đã cập nhật ca evaluation.' : 'Đã thêm ca evaluation mới.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể lưu ca đánh giá.');
    } finally {
      setIsSaving(false);
    }
  };

  const editEvaluationCase = (item: EvaluationCaseRecord) => {
    setEvaluationCaseForm({
      id: item.id,
      code: item.code,
      description: item.description,
      inputIngredients: item.inputIngredients.join('\n'),
      expectedRecipeIds: item.expectedRecipeIds,
      nutritionGoal: item.nutritionGoal || '',
      tags: item.tags.join(', '),
      isActive: item.isActive
    });
  };

  const setEvaluationCaseActive = async (id: string, isActive: boolean) => {
    setIsSaving(true);
    setAdminMessage('');
    try {
      const res = await fetch(`/api/admin/evaluation-cases/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể cập nhật trạng thái ca đánh giá.');
      setEvaluationCases(previous => previous.map(item => item.id === id ? { ...item, isActive } : item));
      setAdminMessage(isActive ? 'Đã bật ca evaluation.' : 'Đã vô hiệu hóa ca evaluation; lịch sử cũ vẫn được giữ lại.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái ca đánh giá.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadEvaluationCsv = async (kind: 'runs' | 'cases') => {
    try {
      const res = await fetch(`/api/admin/evaluation-${kind}/export.csv`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể xuất dữ liệu CSV.');
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartmeal-evaluation-${kind}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể xuất dữ liệu CSV.');
    }
  };

  const parseRecipeIngredients = () =>
    recipeForm.ingredients
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [name, quantity, unit, optional] = line.split('|').map(part => part.trim());
        return {
          name,
          quantity: Number(quantity) || 1,
          unit: unit || 'phần',
          isOptional: optional?.toLowerCase() === 'optional' || optional === 'tùy chọn'
        };
      });

  const parseRecipeInstructions = () =>
    recipeForm.instructions
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((instruction, index) => ({ stepNumber: index + 1, instruction }));

  const applyDraftToRecipeForm = (draft: RecipeDraft) => {
    setRecipeForm({
      id: '',
      vietnameseName: draft.vietnameseName || draft.name,
      description: draft.description,
      category: draft.category,
      cuisine: draft.cuisine,
      difficulty: draft.difficulty,
      status: 'DRAFT',
      preparationTime: draft.preparationTime,
      cookingTime: draft.cookingTime,
      calories: draft.calories || 350,
      servings: draft.servings,
      tags: draft.tags.join(', '),
      ingredients: draft.ingredients.map(item => `${item.name} | ${item.quantity} | ${item.unit}${item.isOptional ? ' | optional' : ''}`).join('\n'),
      instructions: draft.instructions.map(item => item.instruction).join('\n')
    });
  };

  const generateRecipeDraftFromPrompt = async () => {
    if (!draftPrompt.trim()) {
      setAdminMessage('Vui lòng nhập nguyên liệu để sinh bản nháp công thức.');
      return;
    }
    setIsGeneratingDraft(true);
    setAdminMessage('');
    setDraftWarnings([]);
    try {
      const res = await fetch('/api/admin/recipe-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: draftPrompt,
          maxCookingTime: recipeForm.preparationTime + recipeForm.cookingTime,
          tags: recipeForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.draft) throw new Error(data.message || 'Không thể sinh bản nháp công thức.');
      applyDraftToRecipeForm(data.draft);
      setDraftWarnings(data.warnings || []);
      setAdminMessage('Đã sinh bản nháp bằng engine local. Admin hãy kiểm tra định lượng, thời gian và các bước trước khi duyệt lưu.');
      setActiveTab('recipes');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể sinh bản nháp công thức.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const saveIngredient = async () => {
    if (!ingredientForm.name.trim()) {
      setAdminMessage('Vui lòng nhập tên nguyên liệu.');
      return;
    }
    setIsSaving(true);
    setAdminMessage('');
    try {
      const aliases = ingredientForm.aliases
        .split(',')
        .map(alias => alias.trim())
        .filter(Boolean);
      const endpoint = ingredientForm.id ? `/api/admin/ingredients/${ingredientForm.id}` : '/api/admin/ingredients';
      const res = await fetch(endpoint, {
        method: ingredientForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ingredientForm, aliases })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể lưu nguyên liệu.');
      setIngredientForm({ id: '', name: '', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', caloriesPer100g: '', proteinPer100g: '', carbsPer100g: '', fatPer100g: '', aliases: '' });
      setAdminMessage('Đã lưu nguyên liệu và alias chuẩn hóa.');
      await loadAdminData();
      onRefreshData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể lưu nguyên liệu.');
    } finally {
      setIsSaving(false);
    }
  };

  const editIngredient = (ingredient: Ingredient) => {
    setIngredientForm({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category === 'Meat' || ingredient.category === 'Seafood' || ingredient.category === 'EggDairy' ? 'protein' : ingredient.category === 'GrainCarb' ? 'carb' : ingredient.category === 'Condiment' ? 'seasoning' : ingredient.category === 'Vegetable' ? 'vegetable' : 'other',
      categoryNameVi: ingredient.categoryNameVi,
      defaultUnit: ingredient.defaultUnit,
      caloriesPer100g: ingredient.caloriesPer100g?.toString() || '',
      proteinPer100g: ingredient.proteinPer100g?.toString() || '',
      carbsPer100g: ingredient.carbsPer100g?.toString() || '',
      fatPer100g: ingredient.fatPer100g?.toString() || '',
      aliases: ingredient.aliases.join(', ')
    });
    setActiveTab('ingredients');
  };

  const deleteIngredient = async (id: string) => {
    setIsSaving(true);
    setAdminMessage('');
    try {
      const res = await fetch(`/api/admin/ingredients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể xóa nguyên liệu. Có thể nguyên liệu đang được dùng trong công thức.');
      setAdminMessage('Đã xóa nguyên liệu.');
      await loadAdminData();
      onRefreshData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể xóa nguyên liệu.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipeForm.vietnameseName.trim()) {
      setAdminMessage('Vui lòng nhập tên món ăn.');
      return;
    }
    const ingredients = parseRecipeIngredients();
    if (ingredients.length === 0) {
      setAdminMessage('Mỗi công thức cần ít nhất một nguyên liệu.');
      return;
    }
    setIsSaving(true);
    setAdminMessage('');
    try {
      const endpoint = recipeForm.id ? `/api/admin/recipes/${recipeForm.id}` : '/api/admin/recipes';
      const res = await fetch(endpoint, {
        method: recipeForm.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recipeForm,
          name: recipeForm.vietnameseName,
          status: recipeForm.status,
          tags: recipeForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          ingredients,
          instructions: parseRecipeInstructions()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể lưu công thức.');
      setRecipeForm(prev => ({ ...prev, id: '', vietnameseName: '', description: '' }));
      setAdminMessage(recipeForm.status === 'DRAFT'
        ? 'Đã lưu công thức vào hàng chờ duyệt. User chưa nhìn thấy bản nháp này.'
        : 'Đã xuất bản công thức vào kho dữ liệu cho user.'
      );
      await loadAdminData();
      onRefreshData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể lưu công thức.');
    } finally {
      setIsSaving(false);
    }
  };

  const editRecipe = (recipe: Recipe) => {
    setRecipeForm({
      id: recipe.id,
      vietnameseName: recipe.vietnameseName || recipe.name,
      description: recipe.description,
      category: recipe.category,
      cuisine: recipe.cuisine,
      difficulty: recipe.difficulty,
      status: recipe.status || 'PUBLISHED',
      preparationTime: recipe.preparationTime,
      cookingTime: recipe.cookingTime,
      calories: recipe.calories,
      servings: recipe.servings,
      tags: recipe.dietaryTags.join(', '),
      ingredients: recipe.ingredients.map(item => `${item.name} | ${item.quantity} | ${item.unit}${item.isOptional ? ' | optional' : ''}`).join('\n'),
      instructions: recipe.instructions.map(item => item.instruction).join('\n')
    });
    setActiveTab('recipes');
  };

  const deleteRecipe = async (id: string) => {
    setIsSaving(true);
    setAdminMessage('');
    try {
      const res = await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể xóa công thức.');
      setAdminMessage('Đã xóa công thức khỏi kho dữ liệu.');
      await loadAdminData();
      onRefreshData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể xóa công thức.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateRecipeStatus = async (id: string, status: 'DRAFT' | 'PUBLISHED' | 'REJECTED') => {
    setIsSaving(true);
    setAdminMessage('');
    try {
      const res = await fetch(`/api/admin/recipes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể cập nhật trạng thái công thức.');
      setAdminMessage(status === 'PUBLISHED'
        ? 'Đã duyệt và xuất bản công thức cho user.'
        : status === 'REJECTED'
          ? 'Đã từ chối công thức nháp. User sẽ không nhìn thấy món này.'
          : 'Đã chuyển công thức về trạng thái nháp.'
      );
      await loadAdminData();
      onRefreshData();
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái công thức.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    runEvaluationSuite();
  }, [kValue]);

  // Chart data for accuracy metrics
  const chartData = metrics
    ? [
        { metric: 'Precision@K', score: metrics.precisionAtK, target: 80 },
        { metric: 'Recall@K', score: metrics.recallAtK, target: 70 },
        { metric: 'HitRate@K', score: metrics.hitRateAtK, target: 90 },
        { metric: 'NDCG@K', score: metrics.ndcgAtK, target: 85 }
      ]
    : [];

  const radarData = [
    { subject: 'Trùng khớp (Match)', value: weights.w_match * 100, fullMark: 100 },
    { subject: 'Cá nhân hóa (User)', value: weights.w_user * 100, fullMark: 100 },
    { subject: 'Dinh dưỡng (Nutrition)', value: (weights.w_nutrition || 0) * 100, fullMark: 100 },
    { subject: 'Ngữ nghĩa (Semantic)', value: (weights.w_semantic || 0) * 100, fullMark: 100 },
    { subject: 'Đánh giá (Rating)', value: weights.w_rating * 100, fullMark: 100 },
    { subject: 'Độ phổ biến (Pop)', value: weights.w_popularity * 100, fullMark: 100 },
    { subject: 'Thời gian (Time)', value: weights.w_time * 100, fullMark: 100 },
    { subject: 'Độ khó (Diff)', value: weights.w_difficulty * 100, fullMark: 100 }
  ];

  const filteredRecipes = recipes.filter(recipe =>
    recipeStatusFilter === 'ALL' || (recipe.status || 'PUBLISHED') === recipeStatusFilter
  );

  const recipeStatusCounts = {
    all: recipes.length,
    draft: recipes.filter(recipe => recipe.status === 'DRAFT').length,
    published: recipes.filter(recipe => (recipe.status || 'PUBLISHED') === 'PUBLISHED').length,
    rejected: recipes.filter(recipe => recipe.status === 'REJECTED').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#4A5D4E] text-white rounded-[36px] p-6 sm:p-8 card-shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[#E9EDC9] text-xs font-semibold mb-2 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4" />
            Hệ thống Quản trị & Đánh giá Thuật toán AI (Section 17)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal text-white">Bảng điều khiển Quản trị & Kiểm thử</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-black/20 p-1.5 rounded-full border border-white/20 self-start md:self-auto overflow-x-auto scrollbar-none backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'evaluation'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Đánh giá Độ chính xác
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'recipes'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Quản lý Công thức ({recipes.length})
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ingredients'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Từ điển Nguyên liệu ({adminIngredients.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Người dùng ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Nhật ký Hệ thống ({logs.length})
          </button>
        </div>
      </div>

      {adminMessage && (
        <div className="rounded-[24px] border border-[#EAE7E0] bg-white px-5 py-3 text-sm font-semibold text-[#4A5D4E] card-shadow">
          {adminMessage}
        </div>
      )}

      {/* TAB 1: EVALUATION & BENCHMARK METRICS (Section 17, 12.6, 13) */}
      {activeTab === 'evaluation' && (
        <div className="space-y-8">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#EAE7E0] rounded-[28px] p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-[#7D857E] font-semibold">
                <span>Precision@{kValue}</span>
                <span className="text-[#8BA08E] font-bold">Target &ge; 80%</span>
              </div>
              <p className="font-serif text-3xl font-normal text-[#3D3D3D]">{metrics?.precisionAtK || 0}%</p>
              <p className="text-[11px] text-[#7D857E]">Tỷ lệ công thức đề xuất thực sự chuẩn xác trong Top {kValue}</p>
            </div>

            <div className="bg-white border border-[#EAE7E0] rounded-[28px] p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-[#7D857E] font-semibold">
                <span>HitRate@{kValue}</span>
                <span className="text-[#4A5D4E] font-bold">Target &ge; 90%</span>
              </div>
              <p className="font-serif text-3xl font-normal text-[#4A5D4E]">{metrics?.hitRateAtK || 0}%</p>
              <p className="text-[11px] text-[#7D857E]">Tỷ lệ phiên gợi ý chứa ít nhất 1 món người dùng ưng ý</p>
            </div>

            <div className="bg-white border border-[#EAE7E0] rounded-[28px] p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-[#7D857E] font-semibold">
                <span>Recall@{kValue}</span>
                <span className="text-[#C87D55] font-bold">Target &ge; 70%</span>
              </div>
              <p className="font-serif text-3xl font-normal text-[#8C5D36]">{metrics?.recallAtK || 0}%</p>
              <p className="text-[11px] text-[#7D857E]">Độ bao phủ các món mục tiêu trong toàn bộ kho dữ liệu</p>
            </div>

            <div className="bg-white border border-[#EAE7E0] rounded-[28px] p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-[#7D857E] font-semibold">
                <span>NDCG@{kValue}</span>
                <span className="text-[#8C5D36] font-bold">Target &ge; 85%</span>
              </div>
              <p className="font-serif text-3xl font-normal text-[#8C5D36]">{metrics?.ndcgAtK || 0}%</p>
              <p className="text-[11px] text-[#7D857E]">Đo lường chất lượng xếp hạng giảm dần theo vị trí</p>
            </div>
          </div>

          {/* Charts & Interactive Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart: Precision vs Target (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Biểu đồ Đánh giá Thuật toán Gợi ý</h3>
                  <p className="text-xs text-[#7D857E]">So sánh chỉ số thực tế đạt được so với Benchmark SRS</p>
                </div>
                {/* K Selector */}
                <div className="flex items-center gap-1 bg-[#F9F7F2] p-1 rounded-full border border-[#EAE7E0] text-xs">
                  <span className="text-[11px] text-[#7D857E] px-2 font-semibold">K =</span>
                  {[3, 5, 10].map(k => (
                    <button
                      key={k}
                      onClick={() => setKValue(k)}
                      className={`px-3 py-1 rounded-full font-bold transition-colors ${
                        kValue === k ? 'bg-[#8BA08E] text-white shadow-sm' : 'text-[#7D857E] hover:text-[#3D3D3D]'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAE7E0" />
                    <XAxis dataKey="metric" stroke="#7D857E" fontSize={12} />
                    <YAxis stroke="#7D857E" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FDFBF7', borderColor: '#EAE7E0', borderRadius: '16px', color: '#3D3D3D' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="score" name="Thực tế đạt (%)" fill="#8BA08E" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="target" name="Mục tiêu SRS (%)" fill="#4A5D4E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar & Weights Simulator (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#8BA08E]" />
                    Trọng số Thuật toán (Formula Weights)
                  </h3>
                  <p className="text-[11px] text-[#7D857E]">Score = $w_1 \cdot M + w_2 \cdot U + w_3 \cdot R + ...$</p>
                </div>
              </div>

              {/* Weight sliders */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between text-[#3D3D3D] mb-1 font-medium">
                    <span>w_match (Trùng khớp):</span>
                    <span className="font-bold text-[#8BA08E]">{Math.round(weights.w_match * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.05"
                    value={weights.w_match}
                    onChange={e => setWeights(w => ({ ...w, w_match: parseFloat(e.target.value) }))}
                    className="w-full accent-[#8BA08E]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#3D3D3D] mb-1 font-medium">
                    <span>w_user (Sở thích cá nhân):</span>
                    <span className="font-bold text-[#4A5D4E]">{Math.round(weights.w_user * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.3"
                    step="0.05"
                    value={weights.w_user}
                    onChange={e => setWeights(w => ({ ...w, w_user: parseFloat(e.target.value) }))}
                    className="w-full accent-[#4A5D4E]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#3D3D3D] mb-1 font-medium">
                    <span>w_nutrition (Mục tiêu dinh dưỡng):</span>
                    <span className="font-bold text-[#4A5D4E]">{Math.round((weights.w_nutrition || 0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.35"
                    step="0.05"
                    value={weights.w_nutrition || 0.18}
                    onChange={e => setWeights(w => ({ ...w, w_nutrition: parseFloat(e.target.value) }))}
                    className="w-full accent-[#4A5D4E]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#3D3D3D] mb-1 font-medium">
                    <span>w_semantic (Tương đồng ngữ nghĩa):</span>
                    <span className="font-bold text-[#8C5D36]">{Math.round((weights.w_semantic || 0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.30"
                    step="0.05"
                    value={weights.w_semantic || 0.12}
                    onChange={e => setWeights(w => ({ ...w, w_semantic: parseFloat(e.target.value) }))}
                    className="w-full accent-[#C87D55]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#3D3D3D] mb-1 font-medium">
                    <span>w_time (Tối ưu thời gian):</span>
                    <span className="font-bold text-[#C87D55]">{Math.round(weights.w_time * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.2"
                    step="0.05"
                    value={weights.w_time}
                    onChange={e => setWeights(w => ({ ...w, w_time: parseFloat(e.target.value) }))}
                    className="w-full accent-[#C87D55]"
                  />
                </div>
              </div>

              <button
                onClick={runEvaluationSuite}
                className="w-full py-3 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-xs card-shadow flex items-center justify-center gap-2 transition-all mt-2"
              >
                {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Chạy lại Kiểm thử với bộ trọng số mới
              </button>
            </div>
          </div>

          {/* Test Cases Runner Table (TC-REC-01 to TC-REC-04) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <form
              onSubmit={event => {
                event.preventDefault();
                saveEvaluationCase();
              }}
              className="xl:col-span-4 border border-[#EAE7E0] bg-white rounded-[36px] p-6 card-shadow space-y-3"
            >
              <div>
                <h3 className="font-serif text-base font-bold text-[#3D3D3D]">{evaluationCaseForm.id ? 'Chỉnh sửa ca ground truth' : 'Thêm ca ground truth'}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#7D857E]">Đáp án phải là recipe đang xuất bản. Ca bị tắt sẽ không được dùng khi chạy evaluation.</p>
              </div>
              <input
                value={evaluationCaseForm.code}
                disabled={Boolean(evaluationCaseForm.id)}
                onChange={event => setEvaluationCaseForm(form => ({ ...form, code: event.target.value.toUpperCase() }))}
                className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs font-mono uppercase outline-none focus:border-[#8BA08E] disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="TC-REC-05"
              />
              <textarea
                value={evaluationCaseForm.description}
                onChange={event => setEvaluationCaseForm(form => ({ ...form, description: event.target.value }))}
                className="min-h-20 w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs outline-none focus:border-[#8BA08E]"
                placeholder="Mô tả kịch bản đánh giá"
              />
              <textarea
                value={evaluationCaseForm.inputIngredients}
                onChange={event => setEvaluationCaseForm(form => ({ ...form, inputIngredients: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs outline-none focus:border-[#8BA08E]"
                placeholder={'Nguyên liệu đầu vào, mỗi dòng một nguyên liệu\nVí dụ: Ức gà\nBông cải xanh\nCơm trắng'}
              />
              <select
                value={evaluationCaseForm.nutritionGoal}
                onChange={event => setEvaluationCaseForm(form => ({ ...form, nutritionGoal: event.target.value }))}
                className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs outline-none focus:border-[#8BA08E]"
              >
                <option value="">Không đặt mục tiêu dinh dưỡng</option>
                <option value="MUSCLE_GAIN">Tăng cơ</option>
                <option value="WEIGHT_LOSS">Giảm cân</option>
                <option value="LOW_CARB">Low Carb</option>
                <option value="VEGETARIAN">Ăn chay</option>
              </select>
              <input
                value={evaluationCaseForm.tags}
                onChange={event => setEvaluationCaseForm(form => ({ ...form, tags: event.target.value }))}
                className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs outline-none focus:border-[#8BA08E]"
                placeholder="Tags, phân tách bằng dấu phẩy"
              />
              <div className="rounded-[24px] border border-[#EAE7E0] bg-[#F9F7F2] p-3">
                <p className="mb-2 text-[11px] font-bold text-[#3D3D3D]">Công thức đáp án</p>
                <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
                  {recipes.filter(recipe => recipe.status === 'PUBLISHED').map(recipe => (
                    <label key={recipe.id} className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-1.5 text-xs text-[#3D3D3D] hover:bg-white">
                      <input
                        type="checkbox"
                        checked={evaluationCaseForm.expectedRecipeIds.includes(recipe.id)}
                        onChange={event => setEvaluationCaseForm(form => ({
                          ...form,
                          expectedRecipeIds: event.target.checked
                            ? [...form.expectedRecipeIds, recipe.id]
                            : form.expectedRecipeIds.filter(id => id !== recipe.id)
                        }))}
                        className="mt-0.5 accent-[#8BA08E]"
                      />
                      <span>{recipe.vietnameseName || recipe.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={isSaving} className="flex-1 rounded-full bg-[#8BA08E] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#798E7C] disabled:opacity-60">
                  {evaluationCaseForm.id ? 'Lưu thay đổi' : 'Thêm ca đánh giá'}
                </button>
                {evaluationCaseForm.id && (
                  <button type="button" onClick={resetEvaluationCaseForm} className="rounded-full border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs font-bold text-[#7D857E] hover:bg-[#F2EDE4]">Hủy</button>
                )}
              </div>
            </form>

            <div className="xl:col-span-8 border border-[#EAE7E0] bg-white rounded-[36px] p-6 card-shadow space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Bộ dữ liệu ground truth</h3>
                <p className="text-xs text-[#7D857E]">Các case đang bật là tập truy vấn dùng để đo Precision, Recall, HitRate và NDCG.</p>
                </div>
                <button type="button" onClick={() => downloadEvaluationCsv('cases')} className="shrink-0 rounded-full border border-[#EAE7E0] bg-[#F9F7F2] p-2 text-[#4A5D4E] transition-colors hover:bg-[#F2EDE4]" title="Xuất bộ ground truth CSV">
                  <Download className="h-4 w-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE7E0] text-[10px] font-semibold uppercase text-[#7D857E]">
                      <th className="px-3 pb-3">Mã</th>
                      <th className="px-3 pb-3">Kịch bản</th>
                      <th className="px-3 pb-3">Đáp án</th>
                      <th className="px-3 pb-3">Trạng thái</th>
                      <th className="px-3 pb-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE7E0] text-[#3D3D3D]">
                    {evaluationCases.map(item => (
                      <tr key={item.id} className={item.isActive ? 'hover:bg-[#F9F7F2]' : 'bg-[#F9F7F2]/60 text-[#A9A296]'}>
                        <td className="px-3 py-3 font-mono font-bold text-[#4A5D4E]">{item.code}</td>
                        <td className="max-w-56 px-3 py-3">
                          <p className="line-clamp-2">{item.description}</p>
                          <p className="mt-1 text-[10px] text-[#7D857E]">{item.inputIngredients.join(', ')}</p>
                        </td>
                        <td className="px-3 py-3 font-medium">{item.expectedRecipeNames.join(', ') || 'Recipe đã bị ẩn'}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${item.isActive ? 'bg-[#8BA08E]/15 text-[#4A5D4E]' : 'bg-[#D9AE94]/20 text-[#8C5D36]'}`}>
                            {item.isActive ? 'Đang dùng' : 'Đã tắt'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => editEvaluationCase(item)} className="rounded-full border border-[#EAE7E0] bg-white p-2 text-[#4A5D4E] hover:bg-[#F2EDE4]" title="Chỉnh sửa ca đánh giá">
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" disabled={isSaving} onClick={() => setEvaluationCaseActive(item.id, !item.isActive)} className="rounded-full border border-[#EAE7E0] bg-white px-3 py-2 text-[10px] font-bold text-[#7D857E] hover:bg-[#F2EDE4] disabled:opacity-60">
                              {item.isActive ? 'Tắt' : 'Bật'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#8BA08E]" />
                  Bộ kịch bản Kiểm thử Tự động (Automated Test Cases)
                </h3>
                <p className="text-xs text-[#7D857E]">Kiểm tra tính đúng đắn của động cơ gợi ý theo bảng TC-REC trong SRS</p>
              </div>

              <button
                onClick={runEvaluationSuite}
                className="px-4 py-2 rounded-full bg-[#F9F7F2] hover:bg-[#F2EDE4] text-[#3D3D3D] text-xs font-semibold flex items-center gap-1.5 border border-[#EAE7E0] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                Chạy toàn bộ Test Cases
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE7E0] text-[#7D857E] font-semibold uppercase text-[10px]">
                    <th className="pb-3 px-3">Mã Test</th>
                    <th className="pb-3 px-3">Mô tả kịch bản</th>
                    <th className="pb-3 px-3">Nguyên liệu đầu vào</th>
                    <th className="pb-3 px-3">Món kỳ vọng (Expected)</th>
                    <th className="pb-3 px-3">Top 1 Trả về (Actual)</th>
                    <th className="pb-3 px-3 text-center">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE7E0] text-[#3D3D3D]">
                  {testCases.map(tc => (
                    <tr key={tc.testId} className="hover:bg-[#F9F7F2]">
                      <td className="py-3 px-3 font-mono font-bold text-[#4A5D4E]">{tc.testId}</td>
                      <td className="py-3 px-3">{tc.description}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {tc.inputIngredients.map(i => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-[#F2EDE4] text-[10px] text-[#4A5D4E] font-medium">
                              {i}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#4A5D4E]">{tc.expectedRecipeNames.join(', ')}</td>
                      <td className="py-3 px-3 font-medium text-[#3D3D3D]">{tc.returnedTopRecipes[0]?.name || 'N/A'}</td>
                      <td className="py-3 px-3 text-center">
                        {tc.passed ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#8BA08E]/15 text-[#4A5D4E] font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C87D55]/15 text-[#8C5D36] font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            FAIL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Lịch sử chạy đánh giá</h3>
                <p className="text-xs text-[#7D857E]">Snapshot được lưu tại thời điểm admin chạy test, dùng để đối chiếu khi chọn bộ trọng số cho báo cáo.</p>
              </div>
              <button type="button" onClick={() => downloadEvaluationCsv('runs')} className="shrink-0 rounded-full border border-[#EAE7E0] bg-[#F9F7F2] p-2 text-[#4A5D4E] transition-colors hover:bg-[#F2EDE4]" title="Xuất lịch sử evaluation CSV">
                <Download className="h-4 w-4" />
              </button>
            </div>

            {evaluationRuns.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#7D857E]">Chưa có phiên đánh giá nào được lưu.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE7E0] text-[10px] font-semibold uppercase text-[#7D857E]">
                      <th className="px-3 pb-3">Thời điểm</th>
                      <th className="px-3 pb-3">Người chạy</th>
                      <th className="px-3 pb-3 text-center">K</th>
                      <th className="px-3 pb-3 text-center">Precision</th>
                      <th className="px-3 pb-3 text-center">HitRate</th>
                      <th className="px-3 pb-3 text-center">NDCG</th>
                      <th className="px-3 pb-3 text-center">Latency</th>
                      <th className="px-3 pb-3">Trọng số</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE7E0] text-[#3D3D3D]">
                    {evaluationRuns.map(run => (
                      <tr key={run.id} className="hover:bg-[#F9F7F2]">
                        <td className="px-3 py-3 whitespace-nowrap text-[#7D857E]">{new Date(run.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="px-3 py-3 font-semibold">{run.executedBy?.name || 'Hệ thống'}</td>
                        <td className="px-3 py-3 text-center font-mono">{run.k}</td>
                        <td className="px-3 py-3 text-center font-bold text-[#4A5D4E]">{run.precisionAtK}%</td>
                        <td className="px-3 py-3 text-center font-bold text-[#4A5D4E]">{run.hitRateAtK}%</td>
                        <td className="px-3 py-3 text-center font-bold text-[#8C5D36]">{run.ndcgAtK}%</td>
                        <td className="px-3 py-3 text-center text-[#7D857E]">{run.averageLatencyMs} ms</td>
                        <td className="px-3 py-3">
                          <div className="flex min-w-48 flex-wrap gap-1">
                            {Object.entries(run.weights).slice(0, 4).map(([key, value]) => (
                              <span key={key} className="rounded-full bg-[#F2EDE4] px-2 py-0.5 text-[10px] font-medium text-[#4A5D4E]">{key}: {Math.round(Number(value) * 100)}%</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECIPE MANAGEMENT */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 bg-white border border-[#EAE7E0] rounded-[36px] p-6 card-shadow space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D3D3D]">{recipeForm.id ? 'Cập nhật công thức' : 'Thêm công thức chuẩn'}</h3>
              <p className="text-xs text-[#7D857E]">Admin nhập công thức thật để engine ưu tiên trước khi sinh món linh hoạt.</p>
            </div>

            {!recipeForm.id && (
              <div className="rounded-[24px] border border-[#E0E8DD] bg-[#F7FAF5] p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="rounded-2xl bg-[#4A5D4E] p-2 text-white">
                    <WandSparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3D3D3D]">Sinh nháp công thức local</h4>
                    <p className="text-[11px] text-[#7D857E]">Không cần Gemini. Nháp có định lượng, thời gian và bước nấu; admin duyệt bằng nút lưu bên dưới.</p>
                  </div>
                </div>
                <textarea
                  value={draftPrompt}
                  onChange={e => setDraftPrompt(e.target.value)}
                  className="min-h-20 w-full rounded-2xl border border-[#DCE5D8] bg-white px-4 py-3 text-xs outline-none focus:border-[#8BA08E]"
                  placeholder="Ví dụ: 200g tôm, 1 quả dưa leo, rau thơm"
                />
                <button
                  onClick={generateRecipeDraftFromPrompt}
                  disabled={isGeneratingDraft}
                  className="w-full rounded-full bg-[#8BA08E] px-4 py-3 text-xs font-bold text-white hover:bg-[#788E7B] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  <WandSparkles className="w-4 h-4" />
                  {isGeneratingDraft ? 'Đang sinh nháp...' : 'Tạo nháp để admin duyệt'}
                </button>
                {draftWarnings.length > 0 && (
                  <div className="rounded-2xl bg-white border border-[#EAE7E0] p-3 text-[11px] text-[#8C5D36] space-y-1">
                    {draftWarnings.map(warning => <p key={warning}>{warning}</p>)}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <input value={recipeForm.vietnameseName} onChange={e => setRecipeForm(f => ({ ...f, vietnameseName: e.target.value }))} className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 outline-none focus:border-[#8BA08E]" placeholder="Tên món ăn" />
              <textarea value={recipeForm.description} onChange={e => setRecipeForm(f => ({ ...f, description: e.target.value }))} className="min-h-20 w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 outline-none focus:border-[#8BA08E]" placeholder="Mô tả ngắn" />
              <div className="grid grid-cols-2 gap-2">
                <select value={recipeForm.category} onChange={e => setRecipeForm(f => ({ ...f, category: e.target.value }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none">
                  {['Món chính', 'Canh / Súp', 'Món xào', 'Món kho', 'Món chiên / nướng', 'Salad / Khai vị', 'Món ăn nhanh'].map(item => <option key={item}>{item}</option>)}
                </select>
                <select value={recipeForm.difficulty} onChange={e => setRecipeForm(f => ({ ...f, difficulty: e.target.value }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none">
                  {['Easy', 'Medium', 'Hard'].map(item => <option key={item}>{item}</option>)}
                </select>
              </div>
              <select value={recipeForm.status} onChange={e => setRecipeForm(f => ({ ...f, status: e.target.value }))} className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none">
                <option value="DRAFT">Bản nháp - chờ admin duyệt</option>
                <option value="PUBLISHED">Xuất bản cho user</option>
                <option value="REJECTED">Từ chối / ẩn khỏi user</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={recipeForm.preparationTime} onChange={e => setRecipeForm(f => ({ ...f, preparationTime: Number(e.target.value) }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none" placeholder="Sơ chế phút" />
                <input type="number" value={recipeForm.cookingTime} onChange={e => setRecipeForm(f => ({ ...f, cookingTime: Number(e.target.value) }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none" placeholder="Nấu phút" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={recipeForm.calories} onChange={e => setRecipeForm(f => ({ ...f, calories: Number(e.target.value) }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none" placeholder="Calories" />
                <input type="number" value={recipeForm.servings} onChange={e => setRecipeForm(f => ({ ...f, servings: Number(e.target.value) }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none" placeholder="Khẩu phần" />
              </div>
              <input value={recipeForm.tags} onChange={e => setRecipeForm(f => ({ ...f, tags: e.target.value }))} className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 outline-none focus:border-[#8BA08E]" placeholder="Tags, cách nhau bằng dấu phẩy" />
              <textarea value={recipeForm.ingredients} onChange={e => setRecipeForm(f => ({ ...f, ingredients: e.target.value }))} className="min-h-28 w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 font-mono text-[11px] outline-none focus:border-[#8BA08E]" placeholder="Tên | số lượng | đơn vị | optional" />
              <textarea value={recipeForm.instructions} onChange={e => setRecipeForm(f => ({ ...f, instructions: e.target.value }))} className="min-h-28 w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 outline-none focus:border-[#8BA08E]" placeholder="Mỗi dòng là một bước nấu" />
            </div>

            <div className="flex gap-2">
              <button onClick={saveRecipe} disabled={isSaving} className="flex-1 rounded-full bg-[#4A5D4E] px-4 py-3 text-xs font-bold text-white card-shadow hover:bg-[#3D4D40] disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {recipeForm.id ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {recipeForm.id ? 'Lưu sửa' : 'Thêm món'}
              </button>
              {recipeForm.id && (
                <button onClick={() => setRecipeForm(f => ({ ...f, id: '', vietnameseName: '', description: '' }))} className="rounded-full border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs font-bold text-[#7D857E] hover:bg-[#F2EDE4]">
                  Hủy
                </button>
              )}
            </div>
          </div>

          <div className="xl:col-span-8 bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-6">
            <div>
              <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Danh sách Công thức Hệ thống ({recipes.length})</h3>
              <p className="text-xs text-[#7D857E]">Quản lý các công thức chuẩn trong cơ sở dữ liệu</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: 'ALL', label: `Tất cả (${recipeStatusCounts.all})` },
                { value: 'DRAFT', label: `Nháp (${recipeStatusCounts.draft})` },
                { value: 'PUBLISHED', label: `Đã xuất bản (${recipeStatusCounts.published})` },
                { value: 'REJECTED', label: `Từ chối (${recipeStatusCounts.rejected})` }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setRecipeStatusFilter(item.value as typeof recipeStatusFilter)}
                  className={`rounded-full px-4 py-2 text-[11px] font-bold transition-colors ${
                    recipeStatusFilter === item.value
                      ? 'bg-[#4A5D4E] text-white'
                      : 'bg-[#F9F7F2] text-[#4A5D4E] border border-[#EAE7E0] hover:bg-[#F2EDE4]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE7E0] text-[#7D857E] font-semibold uppercase text-[10px]">
                    <th className="pb-3 px-3">Tên món ăn</th>
                    <th className="pb-3 px-3">Phân loại</th>
                    <th className="pb-3 px-3">Thời gian</th>
                    <th className="pb-3 px-3">Độ khó</th>
                    <th className="pb-3 px-3">Trạng thái</th>
                    <th className="pb-3 px-3">NL</th>
                    <th className="pb-3 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE7E0] text-[#3D3D3D]">
                  {filteredRecipes.map(r => (
                    <tr key={r.id} className="hover:bg-[#F9F7F2]">
                      <td className="py-3 px-3 font-semibold text-[#3D3D3D] flex items-center gap-2.5">
                        <img src={r.image} alt={r.name} className="w-9 h-9 rounded-xl object-cover" />
                        <span>{r.name}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F2EDE4] text-[10px] text-[#4A5D4E] font-medium">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">{r.totalTime} phút</td>
                      <td className="py-3 px-3">{r.difficulty}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          (r.status || 'PUBLISHED') === 'PUBLISHED'
                            ? 'bg-[#8BA08E]/15 text-[#4A5D4E]'
                            : r.status === 'DRAFT'
                              ? 'bg-[#C87D55]/15 text-[#8C5D36]'
                              : 'bg-[#B85244]/10 text-[#B85244]'
                        }`}>
                          {r.status === 'DRAFT' ? 'NHÁP' : r.status === 'REJECTED' ? 'TỪ CHỐI' : 'PUBLISHED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">{r.ingredients.length}</td>
                      <td className="py-3 px-3">
                        <div className="flex justify-end gap-2">
                          {(r.status || 'PUBLISHED') !== 'PUBLISHED' && (
                            <button onClick={() => updateRecipeStatus(r.id, 'PUBLISHED')} className="rounded-full bg-[#8BA08E]/15 px-3 py-2 text-[10px] font-bold text-[#4A5D4E] hover:bg-[#8BA08E]/25" aria-label="Duyệt công thức">
                              Duyệt
                            </button>
                          )}
                          {r.status !== 'DRAFT' && (
                            <button onClick={() => updateRecipeStatus(r.id, 'DRAFT')} className="rounded-full bg-[#F2EDE4] px-3 py-2 text-[10px] font-bold text-[#8C5D36] hover:bg-[#EAE7E0]" aria-label="Chuyển về nháp">
                              Nháp
                            </button>
                          )}
                          {r.status !== 'REJECTED' && (
                            <button onClick={() => updateRecipeStatus(r.id, 'REJECTED')} className="rounded-full bg-[#B85244]/10 px-3 py-2 text-[10px] font-bold text-[#B85244] hover:bg-[#B85244]/20" aria-label="Từ chối công thức">
                              Từ chối
                            </button>
                          )}
                          <button onClick={() => editRecipe(r)} className="rounded-full bg-[#F2EDE4] p-2 text-[#4A5D4E] hover:bg-[#EAE7E0]" aria-label="Sửa công thức">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteRecipe(r.id)} className="rounded-full bg-[#B85244]/10 p-2 text-[#B85244] hover:bg-[#B85244]/20" aria-label="Xóa công thức">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INGREDIENT & ALIAS MASTER DATA */}
      {activeTab === 'ingredients' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 bg-white border border-[#EAE7E0] rounded-[36px] p-6 card-shadow space-y-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#3D3D3D]">{ingredientForm.id ? 'Cập nhật nguyên liệu' : 'Thêm nguyên liệu'}</h3>
              <p className="text-xs text-[#7D857E]">Alias giúp hệ thống hiểu “cà”, “tomato”, “cà chua” là cùng một nguyên liệu.</p>
            </div>

            <div className="space-y-3 text-xs">
              <input value={ingredientForm.name} onChange={e => setIngredientForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 outline-none focus:border-[#8BA08E]" placeholder="Tên nguyên liệu" />
              <div className="grid grid-cols-2 gap-2">
                <select value={ingredientForm.category} onChange={e => setIngredientForm(f => ({ ...f, category: e.target.value }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none">
                  <option value="vegetable">Rau củ</option>
                  <option value="protein">Đạm</option>
                  <option value="seafood">Hải sản</option>
                  <option value="carb">Tinh bột</option>
                  <option value="seasoning">Gia vị</option>
                  <option value="fruit">Trái cây</option>
                  <option value="other">Khác</option>
                </select>
                <input value={ingredientForm.defaultUnit} onChange={e => setIngredientForm(f => ({ ...f, defaultUnit: e.target.value }))} className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-3 py-2.5 outline-none" placeholder="Đơn vị" />
              </div>
              <input value={ingredientForm.categoryNameVi} onChange={e => setIngredientForm(f => ({ ...f, categoryNameVi: e.target.value }))} className="w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 outline-none focus:border-[#8BA08E]" placeholder="Tên nhóm tiếng Việt" />
              <div className="rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] p-3 space-y-2">
                <p className="text-[11px] font-bold text-[#4A5D4E]">Dinh dưỡng trên 100g</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={ingredientForm.caloriesPer100g} onChange={e => setIngredientForm(f => ({ ...f, caloriesPer100g: e.target.value }))} className="rounded-xl border border-[#EAE7E0] bg-white px-3 py-2 outline-none focus:border-[#8BA08E]" placeholder="kcal" />
                  <input type="number" value={ingredientForm.proteinPer100g} onChange={e => setIngredientForm(f => ({ ...f, proteinPer100g: e.target.value }))} className="rounded-xl border border-[#EAE7E0] bg-white px-3 py-2 outline-none focus:border-[#8BA08E]" placeholder="Protein g" />
                  <input type="number" value={ingredientForm.carbsPer100g} onChange={e => setIngredientForm(f => ({ ...f, carbsPer100g: e.target.value }))} className="rounded-xl border border-[#EAE7E0] bg-white px-3 py-2 outline-none focus:border-[#8BA08E]" placeholder="Carb g" />
                  <input type="number" value={ingredientForm.fatPer100g} onChange={e => setIngredientForm(f => ({ ...f, fatPer100g: e.target.value }))} className="rounded-xl border border-[#EAE7E0] bg-white px-3 py-2 outline-none focus:border-[#8BA08E]" placeholder="Fat g" />
                </div>
              </div>
              <textarea value={ingredientForm.aliases} onChange={e => setIngredientForm(f => ({ ...f, aliases: e.target.value }))} className="min-h-24 w-full rounded-2xl border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 outline-none focus:border-[#8BA08E]" placeholder="Alias, cách nhau bằng dấu phẩy" />
            </div>

            <div className="flex gap-2">
              <button onClick={saveIngredient} disabled={isSaving} className="flex-1 rounded-full bg-[#4A5D4E] px-4 py-3 text-xs font-bold text-white card-shadow hover:bg-[#3D4D40] disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {ingredientForm.id ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {ingredientForm.id ? 'Lưu sửa' : 'Thêm nguyên liệu'}
              </button>
              {ingredientForm.id && (
                <button onClick={() => setIngredientForm({ id: '', name: '', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', caloriesPer100g: '', proteinPer100g: '', carbsPer100g: '', fatPer100g: '', aliases: '' })} className="rounded-full border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-3 text-xs font-bold text-[#7D857E] hover:bg-[#F2EDE4]">
                  Hủy
                </button>
              )}
            </div>
          </div>

          <div className="xl:col-span-8 bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-6">
            <div>
              <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Từ điển Nguyên liệu Chuẩn hóa ({adminIngredients.length})</h3>
              <p className="text-xs text-[#7D857E]">Danh mục chuẩn và bí danh phục vụ chuẩn hóa văn bản</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {adminIngredients.map(ing => (
                <div key={ing.id} className="bg-[#F9F7F2] border border-[#EAE7E0] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl">{ing.icon || '🥗'}</span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#3D3D3D] text-xs truncate">{ing.name}</h4>
                        <span className="text-[10px] font-mono text-[#4A5D4E]">{ing.normalizedName}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => editIngredient(ing)} className="rounded-full bg-white p-2 text-[#4A5D4E] hover:bg-[#EAE7E0]" aria-label="Sửa nguyên liệu">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteIngredient(ing.id)} className="rounded-full bg-[#B85244]/10 p-2 text-[#B85244] hover:bg-[#B85244]/20" aria-label="Xóa nguyên liệu">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#7D857E]">
                    <span className="font-semibold text-[#3D3D3D]">Bí danh: </span>
                    {ing.aliases.slice(0, 6).join(', ') || 'Chưa có alias'}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                    <span className="rounded-xl bg-white border border-[#EAE7E0] px-2 py-1 text-center">{ing.caloriesPer100g ?? '-'} kcal</span>
                    <span className="rounded-xl bg-white border border-[#EAE7E0] px-2 py-1 text-center">{ing.proteinPer100g ?? '-'}g P</span>
                    <span className="rounded-xl bg-white border border-[#EAE7E0] px-2 py-1 text-center">{ing.carbsPer100g ?? '-'}g C</span>
                    <span className="rounded-xl bg-white border border-[#EAE7E0] px-2 py-1 text-center">{ing.fatPer100g ?? '-'}g F</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Tài khoản hệ thống ({users.length})</h3>
              <p className="text-xs text-[#7D857E]">Admin theo dõi tài khoản demo và tài khoản user đã đăng ký thật trong database.</p>
            </div>
            <button
              onClick={loadAdminData}
              className="self-start sm:self-auto rounded-full border border-[#EAE7E0] bg-[#F9F7F2] px-4 py-2 text-xs font-bold text-[#4A5D4E] hover:bg-[#F2EDE4] inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tải lại
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE7E0] text-[#7D857E] font-semibold uppercase text-[10px]">
                  <th className="pb-3 px-3">Tên</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Quyền</th>
                  <th className="pb-3 px-3">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE7E0] text-[#3D3D3D]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[#F9F7F2]">
                    <td className="py-3 px-3 font-semibold">{user.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px]">{user.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        user.role === 'ADMIN'
                          ? 'bg-[#C87D55]/15 text-[#8C5D36]'
                          : 'bg-[#8BA08E]/15 text-[#4A5D4E]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#7D857E]">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-4">
          <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Nhật ký Hoạt động Hệ thống</h3>
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {logs.map(log => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs flex items-start gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  log.type === 'AUTH'
                    ? 'bg-[#8BA08E]/20 text-[#4A5D4E]'
                    : log.type === 'RECOMMEND'
                    ? 'bg-[#4A5D4E]/20 text-[#4A5D4E]'
                    : log.type === 'AI_NLP'
                    ? 'bg-[#C87D55]/20 text-[#8C5D36]'
                    : 'bg-[#F2EDE4] text-[#7D857E]'
                }`}>
                  {log.type}
                </span>
                <div className="flex-1">
                  <p className="text-[#3D3D3D]">{log.message}</p>
                  <span className="text-[10px] text-[#7D857E]">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
