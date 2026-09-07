import React, { useEffect, useState } from 'react';
import { Clock, History, RefreshCw, Search, Sparkles, UtensilsCrossed } from 'lucide-react';

interface HistoryItem {
  id: string;
  recipeId: string;
  recipeName: string;
  recipeImage: string;
  inputIngredients: string;
  score: number;
  matchScore: number;
  missingCount: number;
  generatedAt: string;
}

interface UserHistoryProps {
  onSelectRecipe: (id: string) => void;
}

export const UserHistory: React.FC<UserHistoryProps> = ({ onSelectRecipe }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadHistory = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/user/history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tải lịch sử gợi ý.');
      setItems(data.history || []);
    } catch (error) {
      console.error('Load history failed:', error);
      setLoadError(error instanceof Error ? error.message : 'Không thể tải lịch sử gợi ý.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = items.filter(item =>
    `${item.recipeName} ${item.inputIngredients}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-[#4A5D4E] text-white rounded-[36px] p-6 sm:p-8 card-shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[#E9EDC9] text-xs font-semibold mb-3">
            <History className="w-4 h-4" />
            User workspace
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal">Lịch sử gợi ý món ăn</h1>
          <p className="mt-2 text-sm text-white/75 max-w-2xl">
            Theo dõi những lần hệ thống đã đề xuất món dựa trên nguyên liệu của bạn, kèm điểm match và số nguyên liệu còn thiếu.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="self-start lg:self-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#4A5D4E] card-shadow transition-colors hover:bg-[#F2EDE4]"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="rounded-[28px] border border-[#EAE7E0] bg-white p-4 card-shadow flex items-center gap-3">
        <Search className="w-4 h-4 text-[#8BA08E]" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Tìm theo tên món hoặc nguyên liệu đã nhập..."
          className="w-full bg-transparent text-sm font-medium text-[#3D3D3D] outline-none placeholder:text-[#A9A296]"
        />
      </div>

      {loadError ? (
        <div className="rounded-[36px] border border-[#C87D55]/30 bg-[#D9AE94]/15 p-8 text-center text-sm font-semibold text-[#8C5D36] card-shadow">
          {loadError}
        </div>
      ) : isLoading ? (
        <div className="rounded-[36px] border border-[#EAE7E0] bg-white p-10 text-center text-sm text-[#7D857E] card-shadow">
          Đang tải lịch sử gợi ý...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[36px] border border-[#EAE7E0] bg-white p-10 text-center card-shadow">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[#8BA08E]" />
          <h3 className="font-serif text-xl text-[#3D3D3D]">Chưa có lịch sử phù hợp</h3>
          <p className="mt-1 text-sm text-[#7D857E]">Hãy dùng tab Gợi ý món để tạo phiên đề xuất đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(item => (
            <button
              key={item.id}
              onClick={() => onSelectRecipe(item.recipeId)}
              className="text-left rounded-[28px] border border-[#EAE7E0] bg-white p-4 card-shadow transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex gap-4">
                <img src={item.recipeImage} alt={item.recipeName} className="h-24 w-24 rounded-3xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#8BA08E]/15 px-2.5 py-1 text-[10px] font-bold text-[#4A5D4E]">
                      Match {item.matchScore}%
                    </span>
                    <span className="rounded-full bg-[#F2EDE4] px-2.5 py-1 text-[10px] font-bold text-[#8C5D36]">
                      Score {item.score}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-bold text-[#3D3D3D]">{item.recipeName}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-[#7D857E]">
                    Nguyên liệu nhập: {item.inputIngredients}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#7D857E]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#8BA08E]" />
                      {new Date(item.generatedAt).toLocaleString('vi-VN')}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UtensilsCrossed className="h-3.5 w-3.5 text-[#C87D55]" />
                      Thiếu {item.missingCount} nguyên liệu
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
