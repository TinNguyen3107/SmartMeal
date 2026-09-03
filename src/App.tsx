import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Beef,
  BookOpen,
  CheckCircle2,
  ChefHat,
  Clock,
  Database,
  Dumbbell,
  Flame,
  Leaf,
  Loader2,
  LogOut,
  Plus,
  Scale,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Wheat
} from 'lucide-react';
import { GoalType, IngredientProfile, SmartMealAnalysisResponse } from './types';

type Role = 'guest' | 'user' | 'admin';
type View = 'analyze' | 'history' | 'admin';

const goalOptions: { id: GoalType; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'balanced', label: 'Cân bằng', description: 'Bữa ăn gia đình, đủ nhóm chất', icon: Scale },
  { id: 'weight-loss', label: 'Ăn kiêng', description: 'No lâu, kiểm soát calo', icon: Leaf },
  { id: 'muscle-gain', label: 'Tập gym', description: 'Tăng protein và năng lượng phục hồi', icon: Dumbbell },
  { id: 'low-carb', label: 'Low carb', description: 'Giảm tinh bột, tăng đạm và chất béo tốt', icon: Beef },
  { id: 'vegetarian', label: 'Ăn chay', description: 'Ưu tiên nguyên liệu thực vật', icon: Wheat }
];

const examples = [
  '200g ức gà, 1 chén cơm, 150g bông cải xanh, 1 quả cà chua',
  '2 quả trứng, 100g nấm, 1 quả bơ, 150g dưa leo',
  '150g đậu hũ, 1 bó rau muống, 1 chén gạo lứt, 10ml nước tương',
  '200g tôm, 150g rau bina, 1 củ khoai lang, 5ml dầu ô liu'
];

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function MacroCard({
  label,
  value,
  unit,
  tone,
  icon: Icon
}: {
  label: string;
  value: number;
  unit: string;
  tone: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase text-zinc-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1">
        <strong className="text-2xl text-zinc-950">{formatNumber(value)}</strong>
        <span className="pb-1 text-xs font-semibold text-zinc-500">{unit}</span>
      </div>
    </div>
  );
}

function Header({
  role,
  view,
  setView,
  login,
  logout
}: {
  role: Role;
  view: View;
  setView: (view: View) => void;
  login: (role: Exclude<Role, 'guest'>) => void;
  logout: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight">SmartMeal</h1>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600">Graduation Project</span>
            </div>
            <p className="text-xs font-medium text-zinc-500">Ingredient nutrition analysis and recipe recommendation</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setView('analyze')}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${view === 'analyze' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
          >
            Phân tích & gợi ý
          </button>
          {role !== 'guest' && (
            <button
              onClick={() => setView('history')}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${view === 'history' ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'}`}
            >
              Lịch sử user
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={() => setView('admin')}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${view === 'admin' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
            >
              Admin
            </button>
          )}

          {role === 'guest' ? (
            <>
              <button onClick={() => login('user')} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
                Demo User
              </button>
              <button onClick={() => login('admin')} className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-800">
                Demo Admin
              </button>
            </>
          ) : (
            <button onClick={logout} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
              <LogOut className="h-4 w-4" />
              {role === 'admin' ? 'Admin' : 'User'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function AnalyzeView({
  role,
  onSaveHistory
}: {
  role: Role;
  onSaveHistory: (item: { at: string; input: string; goal: GoalType; result: SmartMealAnalysisResponse }) => void;
}) {
  const [text, setText] = useState(examples[0]);
  const [goal, setGoal] = useState<GoalType>('muscle-gain');
  const [maxMinutes, setMaxMinutes] = useState(30);
  const [servings, setServings] = useState(1);
  const [result, setResult] = useState<SmartMealAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const selectedGoal = useMemo(() => goalOptions.find(item => item.id === goal) || goalOptions[0], [goal]);

  const runAnalysis = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập nguyên liệu trước khi phân tích.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/smartmeal/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, goal, maxMinutes, servings })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể phân tích nguyên liệu.');
      setResult(data);
      if (role !== 'guest') {
        onSaveHistory({ at: new Date().toLocaleString(), input: text, goal, result: data });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi phân tích.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
      <section className="lg:col-span-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Offline-first AI logic
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">Nhập nguyên liệu, hệ thống tự phân tích và gợi ý món ăn</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Lõi xử lý dùng dữ liệu dinh dưỡng nội bộ và thuật toán scoring riêng. Gemini không bắt buộc cho kết quả gợi ý.
            </p>
          </div>

          <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Nguyên liệu đang có</label>
          <textarea
            value={text}
            onChange={event => setText(event.target.value)}
            rows={6}
            className="w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold leading-6 outline-none transition focus:border-emerald-500 focus:bg-white"
            placeholder="Ví dụ: 200g ức gà, 1 chén cơm, 150g bông cải xanh"
          />

          <div className="mt-3 grid grid-cols-1 gap-2">
            {examples.map(example => (
              <button
                key={example}
                type="button"
                onClick={() => setText(example)}
                className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-xs font-semibold text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs font-bold uppercase text-zinc-500">Mục tiêu dinh dưỡng</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {goalOptions.map(option => {
                const Icon = option.icon;
                const active = option.id === goal;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setGoal(option.id)}
                    className={`rounded-lg border p-3 text-left transition ${active ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${active ? 'text-emerald-700' : 'text-zinc-500'}`} />
                      <span className="text-sm font-extrabold">{option.label}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-zinc-500">Thời gian tối đa</span>
              <input
                type="number"
                min={10}
                max={90}
                value={maxMinutes}
                onChange={event => setMaxMinutes(Number(event.target.value))}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase text-zinc-500">Khẩu phần</span>
              <input
                type="number"
                min={1}
                max={6}
                value={servings}
                onChange={event => setServings(Number(event.target.value))}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm font-bold outline-none focus:border-emerald-500 focus:bg-white"
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={runAnalysis}
            disabled={isLoading}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChefHat className="h-5 w-5" />}
            Phân tích và gợi ý món ăn
          </button>
        </div>
      </section>

      <section className="space-y-6 lg:col-span-7">
        {!result ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
            <div className="max-w-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-extrabold">Kết quả phân tích sẽ hiển thị tại đây</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Bạn sẽ thấy tổng calories, protein, carb, fat, fiber, tỷ lệ macro và danh sách công thức được xếp hạng theo thuật toán.
              </p>
            </div>
          </div>
        ) : (
          <ResultPanel result={result} selectedGoal={selectedGoal.label} />
        )}
      </section>
    </main>
  );
}

function ResultPanel({ result, selectedGoal }: { result: SmartMealAnalysisResponse; selectedGoal: string }) {
  return (
    <>
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-700">{selectedGoal}</p>
            <h2 className="text-xl font-extrabold">Phân tích trị số nguyên liệu</h2>
          </div>
          <span className="rounded-md bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
            {result.analyzedIngredients.length} nguyên liệu nhận diện
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MacroCard label="Calories" value={result.totals.calories} unit="kcal" tone="bg-rose-50 text-rose-700" icon={Flame} />
          <MacroCard label="Protein" value={result.totals.protein} unit="g" tone="bg-emerald-50 text-emerald-700" icon={Dumbbell} />
          <MacroCard label="Carb" value={result.totals.carbs} unit="g" tone="bg-amber-50 text-amber-700" icon={Wheat} />
          <MacroCard label="Fat" value={result.totals.fat} unit="g" tone="bg-sky-50 text-sky-700" icon={Activity} />
          <MacroCard label="Fiber" value={result.totals.fiber} unit="g" tone="bg-lime-50 text-lime-700" icon={Leaf} />
        </div>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase text-zinc-500">
            <span>Tỷ lệ macro theo năng lượng</span>
            <span>P/C/F</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-zinc-200">
            <div className="bg-emerald-500" style={{ width: `${result.macroRatio.proteinPercent}%` }} />
            <div className="bg-amber-500" style={{ width: `${result.macroRatio.carbsPercent}%` }} />
            <div className="bg-sky-500" style={{ width: `${result.macroRatio.fatPercent}%` }} />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-bold text-zinc-600">
            <span>Protein {result.macroRatio.proteinPercent}%</span>
            <span>Carb {result.macroRatio.carbsPercent}%</span>
            <span>Fat {result.macroRatio.fatPercent}%</span>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-[11px] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-3">Nguyên liệu</th>
                <th className="px-3 py-3">Gram</th>
                <th className="px-3 py-3">Kcal</th>
                <th className="px-3 py-3">P/C/F</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {result.analyzedIngredients.map(item => (
                <tr key={`${item.inputName}-${item.grams}`}>
                  <td className="px-3 py-3 font-bold text-zinc-900">
                    {item.matchedName}
                    <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">{Math.round(item.confidence * 100)}%</span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-zinc-600">{formatNumber(item.grams)}g</td>
                  <td className="px-3 py-3 font-semibold text-zinc-600">{formatNumber(item.nutrition.calories)}</td>
                  <td className="px-3 py-3 font-semibold text-zinc-600">
                    {formatNumber(item.nutrition.protein)} / {formatNumber(item.nutrition.carbs)} / {formatNumber(item.nutrition.fat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-amber-800">
            <AlertCircle className="h-4 w-4" />
            Cảnh báo dữ liệu
          </div>
          <ul className="space-y-1 text-sm font-semibold text-amber-800">
            {result.warnings.map(warning => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Công thức phù hợp</h2>
          <span className="text-xs font-bold uppercase text-zinc-500">Xếp hạng theo score</span>
        </div>
        {result.recommendations.map(recipe => (
          <article key={recipe.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {recipe.audience.map(tag => (
                    <span key={tag} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{tag}</span>
                  ))}
                </div>
                <h3 className="text-lg font-extrabold">{recipe.name}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{recipe.description}</p>
              </div>
              <div className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-center">
                <p className="text-[11px] font-bold uppercase text-zinc-500">Score</p>
                <strong className="text-2xl text-emerald-700">{recipe.score}</strong>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-md bg-zinc-50 p-3"><Clock className="mb-1 h-4 w-4 text-zinc-500" /><p className="text-xs font-bold">{recipe.totalMinutes} phút</p></div>
              <div className="rounded-md bg-zinc-50 p-3"><Flame className="mb-1 h-4 w-4 text-zinc-500" /><p className="text-xs font-bold">{formatNumber(recipe.nutrition.calories)} kcal</p></div>
              <div className="rounded-md bg-zinc-50 p-3"><Dumbbell className="mb-1 h-4 w-4 text-zinc-500" /><p className="text-xs font-bold">{formatNumber(recipe.nutrition.protein)}g protein</p></div>
              <div className="rounded-md bg-zinc-50 p-3"><ChefHat className="mb-1 h-4 w-4 text-zinc-500" /><p className="text-xs font-bold">{recipe.difficulty}</p></div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-extrabold uppercase text-zinc-500">Định lượng</h4>
                <div className="space-y-2">
                  {recipe.ingredients.map(ingredient => (
                    <div key={`${recipe.id}-${ingredient.name}`} className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-xs font-semibold">
                      <span>{ingredient.name}</span>
                      <span className="text-zinc-500">{ingredient.quantity} {ingredient.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-extrabold uppercase text-zinc-500">Các bước nấu</h4>
                <ol className="space-y-2">
                  {recipe.steps.map(step => (
                    <li key={`${recipe.id}-${step.order}`} className="flex gap-3 rounded-md bg-zinc-50 p-3 text-xs leading-5 text-zinc-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white font-extrabold text-emerald-700">{step.order}</span>
                      <span>{step.text} <strong>({step.minutes}p)</strong></span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase text-emerald-800">
                <ArrowRight className="h-4 w-4" />
                Vì sao món này được gợi ý?
              </h4>
              <ul className="space-y-1 text-sm font-semibold leading-6 text-emerald-900">
                {recipe.reasons.map(reason => <li key={reason}>{reason}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold">
          <BarChart3 className="h-5 w-5 text-emerald-700" />
          Thuật toán sử dụng
        </h2>
        <p className="mb-3 text-sm font-bold text-zinc-700">{result.algorithm.name}</p>
        <div className="space-y-2">
          {result.algorithm.explanation.map((line, index) => (
            <div key={line} className="flex gap-3 rounded-md bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-xs font-extrabold text-emerald-700">{index + 1}</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function HistoryView({ history }: { history: { at: string; input: string; goal: GoalType; result: SmartMealAnalysisResponse }[] }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-extrabold">
          <BookOpen className="h-5 w-5 text-emerald-700" />
          Lịch sử phân tích của user
        </h2>
        {history.length === 0 ? (
          <p className="rounded-lg bg-zinc-50 p-6 text-sm font-semibold text-zinc-600">Chưa có lần phân tích nào. Hãy đăng nhập user/admin và chạy phân tích để lưu lịch sử trong phiên làm việc.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={`${item.at}-${index}`} className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase text-zinc-500">{item.at}</span>
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{goalOptions.find(goal => goal.id === item.goal)?.label}</span>
                </div>
                <p className="text-sm font-bold text-zinc-800">{item.input}</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Tổng: {item.result.totals.calories} kcal, {item.result.totals.protein}g protein. Gợi ý top 1: <strong>{item.result.recommendations[0]?.name || 'Không có'}</strong>.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function AdminView() {
  const [ingredients, setIngredients] = useState<IngredientProfile[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    aliases: '',
    category: 'protein',
    defaultUnit: 'g',
    gramsPerUnit: 1,
    vegetarian: false,
    calories: 100,
    protein: 10,
    carbs: 0,
    fat: 2,
    fiber: 0
  });
  const [message, setMessage] = useState('');

  const loadAdminData = async () => {
    const [ingredientRes, evaluationRes] = await Promise.all([
      fetch('/api/admin/ingredients'),
      fetch('/api/admin/evaluation')
    ]);
    setIngredients((await ingredientRes.json()).ingredients || []);
    setEvaluation(await evaluationRes.json());
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const addIngredient = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    const response = await fetch('/api/admin/ingredients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        aliases: form.aliases.split(',').map(item => item.trim()).filter(Boolean)
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || 'Không thể thêm nguyên liệu.');
      return;
    }
    setMessage(`Đã thêm "${data.ingredient.name}" vào kho dữ liệu dinh dưỡng.`);
    setForm(prev => ({ ...prev, name: '', aliases: '' }));
    loadAdminData();
  };

  return (
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:px-8">
      <section className="space-y-6 lg:col-span-5">
        <div className="rounded-lg border border-orange-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-600" />
            <h2 className="text-xl font-extrabold">Admin Dashboard</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-xs font-bold uppercase text-orange-700">Nguyên liệu</p>
              <strong className="text-3xl text-orange-900">{ingredients.length}</strong>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-700">HitRate</p>
              <strong className="text-3xl text-emerald-900">{evaluation?.hitRate ?? 0}%</strong>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="mb-2 text-sm font-extrabold">Vai trò admin</h3>
            <p className="text-sm leading-6 text-zinc-600">
              Admin quản lý kho dữ liệu dinh dưỡng, kiểm tra thuật toán gợi ý và chạy test case đánh giá. User chỉ tập trung nhập nguyên liệu và nhận kết quả.
            </p>
          </div>
        </div>

        <form onSubmit={addIngredient} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <Plus className="h-5 w-5 text-emerald-700" />
            Thêm nguyên liệu dinh dưỡng
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tên nguyên liệu" className="col-span-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            <input value={form.aliases} onChange={e => setForm({ ...form, aliases: e.target.value })} placeholder="Alias, cách nhau bằng dấu phẩy" className="col-span-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold">
              <option value="protein">Protein</option>
              <option value="vegetable">Rau củ</option>
              <option value="carb">Tinh bột</option>
              <option value="fat">Chất béo</option>
              <option value="seasoning">Gia vị</option>
              <option value="dairy">Sữa</option>
            </select>
            <input value={form.defaultUnit} onChange={e => setForm({ ...form, defaultUnit: e.target.value })} placeholder="Đơn vị" className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold" />
            {(['gramsPerUnit', 'calories', 'protein', 'carbs', 'fat', 'fiber'] as const).map(key => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] font-bold uppercase text-zinc-500">{key}</span>
                <input type="number" value={form[key]} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold" />
              </label>
            ))}
            <label className="col-span-2 flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={form.vegetarian} onChange={e => setForm({ ...form, vegetarian: e.target.checked })} />
              Phù hợp ăn chay
            </label>
          </div>
          {message && <p className="mt-3 rounded-md bg-zinc-50 p-3 text-sm font-semibold text-zinc-700">{message}</p>}
          <button className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-700">Lưu nguyên liệu</button>
        </form>
      </section>

      <section className="space-y-6 lg:col-span-7">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <BarChart3 className="h-5 w-5 text-emerald-700" />
            Đánh giá thuật toán
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs font-bold uppercase text-zinc-500">Test case</p><strong className="text-2xl">{evaluation?.total ?? 0}</strong></div>
            <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs font-bold uppercase text-zinc-500">Pass</p><strong className="text-2xl">{evaluation?.passed ?? 0}</strong></div>
            <div className="rounded-lg bg-zinc-50 p-4"><p className="text-xs font-bold uppercase text-zinc-500">Avg score</p><strong className="text-2xl">{evaluation?.averageScore ?? 0}</strong></div>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Mã</th>
                  <th className="px-3 py-3">Input</th>
                  <th className="px-3 py-3">Kỳ vọng</th>
                  <th className="px-3 py-3">Top recipe</th>
                  <th className="px-3 py-3">Điểm</th>
                  <th className="px-3 py-3">KQ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(evaluation?.results || []).map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3 font-bold">{item.id}</td>
                    <td className="px-3 py-3 font-semibold text-zinc-600">{item.input}</td>
                    <td className="px-3 py-3 text-zinc-600">{item.expected}</td>
                    <td className="px-3 py-3 font-bold text-zinc-800">{item.topRecipe}</td>
                    <td className="px-3 py-3 font-bold">{item.score}</td>
                    <td className="px-3 py-3">{item.passed ? <span className="text-emerald-700 font-bold">Pass</span> : <span className="text-red-600 font-bold">Fail</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <Database className="h-5 w-5 text-emerald-700" />
            Kho dữ liệu dinh dưỡng
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ingredients.slice(0, 16).map(item => (
              <div key={item.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm">{item.name}</strong>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase text-zinc-500">{item.category}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-zinc-600">
                  100g: {item.calories} kcal, P {item.protein}g, C {item.carbs}g, F {item.fat}g
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [role, setRole] = useState<Role>('guest');
  const [view, setView] = useState<View>('analyze');
  const [history, setHistory] = useState<{ at: string; input: string; goal: GoalType; result: SmartMealAnalysisResponse }[]>([]);

  const login = (nextRole: Exclude<Role, 'guest'>) => {
    setRole(nextRole);
    setView(nextRole === 'admin' ? 'admin' : 'analyze');
  };

  const logout = () => {
    setRole('guest');
    setView('analyze');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <Header role={role} view={view} setView={setView} login={login} logout={logout} />
      {view === 'analyze' && <AnalyzeView role={role} onSaveHistory={item => setHistory(prev => [item, ...prev].slice(0, 12))} />}
      {view === 'history' && <HistoryView history={history} />}
      {view === 'admin' && role === 'admin' && <AdminView />}
    </div>
  );
}

export default App;
