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

  const radarData = [
    { subject: 'Trùng khớp (Match)', value: weights.w_match * 100, fullMark: 100 },
    { subject: 'Cá nhân hóa (User)', value: weights.w_user * 100, fullMark: 100 },
    { subject: 'Đánh giá (Rating)', value: weights.w_rating * 100, fullMark: 100 },
    { subject: 'Độ phổ biến (Pop)', value: weights.w_popularity * 100, fullMark: 100 },
    { subject: 'Thời gian (Time)', value: weights.w_time * 100, fullMark: 100 },
    { subject: 'Độ khó (Diff)', value: weights.w_difficulty * 100, fullMark: 100 }
  ];

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
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'evaluation'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
              }`}
          >
            <BarChart3 className="w-4 h-4" />
            Đánh giá Độ chính xác
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'recipes'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            Quản lý Công thức ({recipes.length})
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'ingredients'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
              }`}
          >
            <Layers className="w-4 h-4" />
            Từ điển Nguyên liệu ({allIngredients.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'logs'
                ? 'bg-white text-[#4A5D4E] card-shadow'
                : 'text-white/80 hover:text-white'
              }`}
          >
            <Activity className="w-4 h-4" />
            Nhật ký Hệ thống ({logs.length})
          </button>
        </div>
      </div>

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
                      className={`px-3 py-1 rounded-full font-bold transition-colors ${kValue === k ? 'bg-[#8BA08E] text-white shadow-sm' : 'text-[#7D857E] hover:text-[#3D3D3D]'
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
        </div>
      )}

      {/* TAB 2: RECIPE MANAGEMENT */}
      {activeTab === 'recipes' && (
        <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Danh sách Công thức Hệ thống ({recipes.length})</h3>
              <p className="text-xs text-[#7D857E]">Xem và quản lý các công thức chuẩn trong cơ sở dữ liệu</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE7E0] text-[#7D857E] font-semibold uppercase text-[10px]">
                  <th className="pb-3 px-3">Tên món ăn</th>
                  <th className="pb-3 px-3">Phân loại</th>
                  <th className="pb-3 px-3">Thời gian</th>
                  <th className="pb-3 px-3">Calo</th>
                  <th className="pb-3 px-3">Độ khó</th>
                  <th className="pb-3 px-3">Đánh giá</th>
                  <th className="pb-3 px-3">Số nguyên liệu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE7E0] text-[#3D3D3D]">
                {recipes.map(r => (
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
                    <td className="py-3 px-3 text-[#8C5D36] font-medium">{r.calories} kcal</td>
                    <td className="py-3 px-3">{r.difficulty}</td>
                    <td className="py-3 px-3 text-[#D9AE94] font-medium">⭐ {r.rating} ({r.reviewCount})</td>
                    <td className="py-3 px-3 font-mono">{r.ingredients.length} món</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INGREDIENT & ALIAS MASTER DATA */}
      {activeTab === 'ingredients' && (
        <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Từ điển Nguyên liệu Chuẩn hóa ({allIngredients.length})</h3>
              <p className="text-xs text-[#7D857E]">Danh mục chuẩn và bí danh (aliases) phục vụ chuẩn hóa văn bản</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {allIngredients.map(ing => (
              <div key={ing.id} className="bg-[#F9F7F2] border border-[#EAE7E0] rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{ing.icon || '🥗'}</span>
                  <div>
                    <h4 className="font-bold text-[#3D3D3D] text-xs">{ing.name}</h4>
                    <span className="text-[10px] font-mono text-[#4A5D4E]">{ing.normalizedName}</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#7D857E]">
                  <span className="font-semibold text-[#3D3D3D]">Bí danh: </span>
                  {ing.aliases.slice(0, 4).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow space-y-4">
          <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Nhật ký Hoạt động Hệ thống</h3>
          <div className="space-y-2.5 max-h-125 overflow-y-auto pr-1">
            {logs.map(log => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs flex items-start gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${log.type === 'AUTH'
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
