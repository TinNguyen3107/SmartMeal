import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BarChart3,
  BookOpen,
  Layers,
  Activity,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Sliders,
  RefreshCw,
  Trash2,
  Edit2,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  EvaluationMetricResult,
  Ingredient,
  Recipe,
  SystemLog,
  TestCaseResult,
  RecommendationWeightConfig
} from '../types';

interface AdminDashboardProps {
  allIngredients: Ingredient[];
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  allIngredients,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'recipes' | 'ingredients' | 'logs'>('evaluation');

  // Evaluation state
  const [kValue, setKValue] = useState<number>(5);
  const [metrics, setMetrics] = useState<EvaluationMetricResult | null>(null);
  const [testCases, setTestCases] = useState<TestCaseResult[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Recipe master data
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);

  // Engine Weights Tuner
  const [weights, setWeights] = useState<RecommendationWeightConfig>({
    w_match: 0.55,
    w_user: 0.15,
    w_rating: 0.10,
    w_popularity: 0.05,
    w_time: 0.10,
    w_difficulty: 0.05
  });

  const loadAdminData = async () => {
    try {
      const [resMetrics, resRecipes, resLogs] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/recipes'),
        fetch('/api/admin/logs')
      ]);
      const dataMetrics = await resMetrics.json();
      const dataRecipes = await resRecipes.json();
      const dataLogs = await resLogs.json();

      setMetrics(dataMetrics.metrics);
      setRecipes(dataRecipes.recipes || []);
      setLogs(dataLogs.logs || []);
    } catch (e) {
      console.error('Admin data load failed:', e);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const runEvaluationSuite = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/admin/run-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k: kValue })
      });
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setTestCases(data.testCases || []);
      }
    } catch (err) {
      console.error('Eval failed:', err);
    } finally {
      setIsEvaluating(false);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-emerald-500 text-white rounded-3xl p-6 sm:p-8 card-shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100 text-emerald-600 text-[10px] font-bold tracking-widest uppercase mb-2">
            <ShieldCheck className="w-4 h-4" />
            Quản trị & Kiểm thử
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Bảng điều khiển Admin</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-emerald-50 p-1.5 rounded-xl border border-zinc-800 self-start md:self-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'evaluation'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-900/50 hover:text-white'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            Đánh giá
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'recipes'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-900/50 hover:text-white'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            Công thức ({recipes.length})
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'ingredients'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-900/50 hover:text-white'
              }`}
          >
            <Layers className="w-4 h-4" />
            Nguyên liệu ({allIngredients.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'logs'
                ? 'bg-white text-emerald-950 shadow-sm'
                : 'text-emerald-900/50 hover:text-white'
              }`}
          >
            <Activity className="w-4 h-4" />
            Nhật ký
          </button>
        </div>
      </div>

      {/* TAB 1: EVALUATION & BENCHMARK METRICS */}
      {activeTab === 'evaluation' && (
        <div className="space-y-8">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-emerald-900/60 font-bold uppercase tracking-wider">
                <span>Precision@{kValue}</span>
                <span className="text-emerald-950">&ge; 80%</span>
              </div>
              <p className="text-3xl font-bold text-emerald-950">{metrics?.precisionAtK || 0}%</p>
              <p className="text-[11px] text-emerald-900/60">Tỷ lệ công thức đề xuất thực sự chuẩn xác</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-emerald-900/60 font-bold uppercase tracking-wider">
                <span>HitRate@{kValue}</span>
                <span className="text-emerald-950">&ge; 90%</span>
              </div>
              <p className="text-3xl font-bold text-zinc-700">{metrics?.hitRateAtK || 0}%</p>
              <p className="text-[11px] text-emerald-900/60">Tỷ lệ phiên gợi ý chứa 1 món ưng ý</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-emerald-900/60 font-bold uppercase tracking-wider">
                <span>Recall@{kValue}</span>
                <span className="text-emerald-950">&ge; 70%</span>
              </div>
              <p className="text-3xl font-bold text-zinc-700">{metrics?.recallAtK || 0}%</p>
              <p className="text-[11px] text-emerald-900/60">Độ bao phủ món mục tiêu</p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 card-shadow space-y-1">
              <div className="flex justify-between items-center text-xs text-emerald-900/60 font-bold uppercase tracking-wider">
                <span>NDCG@{kValue}</span>
                <span className="text-emerald-950">&ge; 85%</span>
              </div>
              <p className="text-3xl font-bold text-zinc-700">{metrics?.ndcgAtK || 0}%</p>
              <p className="text-[11px] text-emerald-900/60">Chất lượng xếp hạng giảm dần</p>
            </div>
          </div>

          {/* Charts & Interactive Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Chart: Precision vs Target (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-emerald-950">Biểu đồ Đánh giá Thuật toán</h3>
                  <p className="text-xs text-emerald-900/60">So sánh chỉ số thực tế so với Benchmark</p>
                </div>
                {/* K Selector */}
                <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-md border border-zinc-200 text-xs">
                  <span className="text-[11px] text-emerald-900/60 px-2 font-bold uppercase">K =</span>
                  {[3, 5, 10].map(k => (
                    <button
                      key={k}
                      onClick={() => setKValue(k)}
                      className={`px-3 py-1 rounded-md font-bold transition-colors ${kValue === k ? 'bg-emerald-500 text-white shadow-sm' : 'text-emerald-900/60 hover:text-emerald-950'
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="metric" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '8px', color: '#111827' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="score" name="Thực tế đạt (%)" fill="#18181b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Mục tiêu (%)" fill="#a1a1aa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar & Weights Simulator (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 card-shadow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-900/60" />
                    Trọng số Thuật toán
                  </h3>
                  <p className="text-[11px] text-emerald-900/60 font-mono mt-1">Score = w1*M + w2*U + w3*R + ...</p>
                </div>
              </div>

              {/* Weight sliders */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between text-zinc-700 mb-1 font-semibold">
                    <span>Trùng khớp:</span>
                    <span className="font-bold text-emerald-950">{Math.round(weights.w_match * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.8"
                    step="0.05"
                    value={weights.w_match}
                    onChange={e => setWeights(w => ({ ...w, w_match: parseFloat(e.target.value) }))}
                    className="w-full accent-black"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-700 mb-1 font-semibold">
                    <span>Sở thích cá nhân:</span>
                    <span className="font-bold text-emerald-950">{Math.round(weights.w_user * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.3"
                    step="0.05"
                    value={weights.w_user}
                    onChange={e => setWeights(w => ({ ...w, w_user: parseFloat(e.target.value) }))}
                    className="w-full accent-black"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-zinc-700 mb-1 font-semibold">
                    <span>Tối ưu thời gian:</span>
                    <span className="font-bold text-emerald-950">{Math.round(weights.w_time * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.2"
                    step="0.05"
                    value={weights.w_time}
                    onChange={e => setWeights(w => ({ ...w, w_time: parseFloat(e.target.value) }))}
                    className="w-full accent-black"
                  />
                </div>
              </div>

              <button
                onClick={runEvaluationSuite}
                className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all mt-2"
              >
                {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Cập nhật & Chạy lại
              </button>
            </div>
          </div>

          {/* Test Cases Runner Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 card-shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-900/60" />
                  Kịch bản Kiểm thử (Test Cases)
                </h3>
              </div>

              <button
                onClick={runEvaluationSuite}
                className="px-4 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 border border-zinc-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                Chạy kiểm thử
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-emerald-900/60 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Mã Test</th>
                    <th className="pb-3 px-3">Mô tả</th>
                    <th className="pb-3 px-3">Đầu vào</th>
                    <th className="pb-3 px-3">Kỳ vọng</th>
                    <th className="pb-3 px-3">Kết quả Top 1</th>
                    <th className="pb-3 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {testCases.map(tc => (
                    <tr key={tc.testId} className="hover:bg-zinc-50">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-950">{tc.testId}</td>
                      <td className="py-3 px-3">{tc.description}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {tc.inputIngredients.map(i => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-zinc-100 text-[10px] text-zinc-700 font-bold">
                              {i}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-zinc-600">{tc.expectedRecipeNames.join(', ')}</td>
                      <td className="py-3 px-3 font-medium text-emerald-950">{tc.returnedTopRecipes[0]?.name || 'N/A'}</td>
                      <td className="py-3 px-3 text-center">
                        {tc.passed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-emerald-950 font-bold text-[10px] uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 font-bold text-[10px] uppercase">
                            <XCircle className="w-3.5 h-3.5" />
                            Fail
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPE MANAGEMENT */}
      {activeTab === 'recipes' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 card-shadow space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-emerald-950">Danh sách Công thức ({recipes.length})</h3>
            </div>
            <button
              onClick={() => {
                const name = prompt('Nhập tên món ăn mới (VD: Trứng chiên):');
                if (!name) return;
                const ings = prompt('Nhập các nguyên liệu chính, cách nhau dấu phẩy (VD: Trứng gà, Hành lá):');
                if (!ings) return;
                
                const newRecipe = {
                  name,
                  vietnameseName: name,
                  description: 'Công thức mới được thêm từ Admin',
                  image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
                  cuisine: 'Vietnamese',
                  category: 'Món chính',
                  dietaryTags: ['Vietnamese'],
                  difficulty: 'Easy',
                  preparationTime: 5,
                  cookingTime: 10,
                  totalTime: 15,
                  calories: 250,
                  servings: 2,
                  ingredients: ings.split(',').map(i => ({
                    ingredientId: 'ing-' + Date.now(),
                    name: i.trim(),
                    normalizedName: i.trim().toUpperCase().replace(/\s+/g, '_'),
                    quantity: 1,
                    unit: 'phần'
                  })),
                  instructions: [
                    { stepNumber: 1, instruction: 'Chuẩn bị nguyên liệu.' },
                    { stepNumber: 2, instruction: 'Nấu chín và thưởng thức.' }
                  ]
                };

                fetch('/api/recipes', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newRecipe)
                }).then(() => onRefreshData());
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tạo công thức nhanh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-emerald-900/60 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Tên món ăn</th>
                  <th className="pb-3 px-3">Phân loại</th>
                  <th className="pb-3 px-3">Thời gian</th>
                  <th className="pb-3 px-3">Calo</th>
                  <th className="pb-3 px-3">Độ khó</th>
                  <th className="pb-3 px-3">Đánh giá</th>
                  <th className="pb-3 px-3">Nguyên liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {recipes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500">
                      Chưa có công thức nào. Hãy bấm "Tạo công thức nhanh" ở trên.
                    </td>
                  </tr>
                )}
                {recipes.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-50">
                    <td className="py-3 px-3 font-bold text-emerald-950 flex items-center gap-2.5">
                      <img src={r.image} alt={r.name} className="w-9 h-9 rounded-lg object-cover" />
                      <span>{r.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 text-[10px] text-zinc-700 font-bold uppercase">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium">{r.totalTime}p</td>
                    <td className="py-3 px-3 text-zinc-600 font-medium">{r.calories} kcal</td>
                    <td className="py-3 px-3 font-medium">{r.difficulty}</td>
                    <td className="py-3 px-3 text-emerald-950 font-bold">★ {r.rating} ({r.reviewCount})</td>
                    <td className="py-3 px-3 font-mono font-medium">{r.ingredients.length} món</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INGREDIENT & ALIAS MASTER DATA */}
      {activeTab === 'ingredients' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 card-shadow space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-emerald-950">Từ điển Nguyên liệu ({allIngredients.length})</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allIngredients.map(ing => (
              <div key={ing.id} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center font-bold text-zinc-600 uppercase">
                    {ing.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs">{ing.name}</h4>
                    <span className="text-[10px] font-mono text-emerald-900/60">{ing.normalizedName}</span>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-600 font-medium">
                  <span className="font-bold text-emerald-950">Bí danh: </span>
                  {ing.aliases.slice(0, 4).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 card-shadow space-y-4">
          <h3 className="text-base font-bold text-emerald-950">Nhật ký Hoạt động Hệ thống</h3>
          <div className="space-y-2 max-h-125 overflow-y-auto pr-1">
            {logs.map(log => (
              <div key={log.id} className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-100 text-xs flex items-start gap-3">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${log.type === 'AUTH'
                    ? 'bg-emerald-500 text-white'
                    : log.type === 'RECOMMEND'
                      ? 'bg-zinc-700 text-white'
                      : log.type === 'AI_NLP'
                        ? 'bg-zinc-300 text-emerald-950'
                        : 'bg-zinc-200 text-zinc-600'
                  }`}>
                  {log.type}
                </span>
                <div className="flex-1">
                  <p className="text-emerald-950 font-medium">{log.message}</p>
                  <span className="text-[10px] text-emerald-900/60 font-mono mt-1 block">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
