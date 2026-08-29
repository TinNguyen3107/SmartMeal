import React, { useState } from 'react';
import {
  Refrigerator,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Search,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Ingredient, UserIngredient, IngredientCategory } from '../types';

interface PantryManagerProps {
  pantryItems: UserIngredient[];
  allIngredients: Ingredient[];
  onAddPantryItem: (name: string, quantity: number, unit: string, category: IngredientCategory) => void;
  onRemovePantryItem: (id: string) => void;
  onTriggerRecommendation: (items: { name: string; quantity: number; unit: string }[]) => void;
}

export const PantryManager: React.FC<PantryManagerProps> = ({
  pantryItems,
  allIngredients,
  onAddPantryItem,
  onRemovePantryItem,
  onTriggerRecommendation
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState<number>(1);
  const [newUnit, setNewUnit] = useState('quả');
  const [newCategory, setNewCategory] = useState<IngredientCategory>('Vegetable');

  const categories: { id: string; name: string }[] = [
    { id: 'All', name: 'Tất cả' },
    { id: 'EggDairy', name: 'Trứng & Sữa' },
    { id: 'Vegetable', name: 'Rau củ' },
    { id: 'Meat', name: 'Thịt tươi' },
    { id: 'Seafood', name: 'Hải sản' },
    { id: 'GrainCarb', name: 'Gạo & Mì' },
    { id: 'Condiment', name: 'Gia vị' }
  ];

  const handleQuickAdd = (ing: Ingredient) => {
    onAddPantryItem(ing.name, 1, ing.defaultUnit, ing.category);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddPantryItem(newName.trim(), newQty, newUnit, newCategory);
    setNewName('');
    setNewQty(1);
  };

  const filteredItems = pantryItems.filter(item => {
    // Tìm category từ allIngredients (vì UserIngredient không lưu category trực tiếp)
    const originalIng = allIngredients.find(i => i.id === item.ingredientId);
    const itemCategory = originalIng ? originalIng.category : 'Other';

    const matchCat = selectedCategory === 'All' || itemCategory === selectedCategory;
    const matchQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-emerald-500 text-white rounded-3xl p-8 sm:p-10 card-shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100 border border-zinc-700 text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-3">
            <Refrigerator className="w-4 h-4 text-zinc-100" />
            Quản lý nguyên liệu
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
            Tủ lạnh của tôi
          </h1>
          <p className="mt-2 text-emerald-900/50 text-xs sm:text-sm leading-relaxed">
            Lưu giữ danh sách thực phẩm đang có. Nhấn "Gợi ý món" để tìm công thức phù hợp nhất.
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 relative z-10">
          <button
            id="cook-from-pantry-btn"
            disabled={pantryItems.length === 0}
            onClick={() => onTriggerRecommendation(pantryItems.map(p => ({ name: p.name, quantity: p.quantity, unit: p.unit })))}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-emerald-950 font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            Gợi ý món từ {pantryItems.length} nguyên liệu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Add Ingredient Form & Quick Add Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Custom Add Form */}
          <form onSubmit={handleFormSubmit} className="bg-white border border-zinc-200 rounded-2xl p-6 card-shadow space-y-4">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-900/60" />
              Thêm nguyên liệu mới
            </h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Tên thực phẩm</label>
              <input
                type="text"
                placeholder="Ví dụ: Trứng gà, Thịt bò, Nấm rơm..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-400 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Số lượng</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newQty}
                  onChange={e => setNewQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 text-xs focus:outline-none focus:border-zinc-400 focus:bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Đơn vị</label>
                <input
                  type="text"
                  placeholder="quả, g, củ, ml..."
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 text-xs focus:outline-none focus:border-zinc-400 focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Nhóm nguyên liệu</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 text-xs focus:outline-none focus:border-zinc-400 font-medium"
              >
                <option value="EggDairy">Trứng & Sữa</option>
                <option value="Vegetable">Rau củ</option>
                <option value="Meat">Thịt tươi</option>
                <option value="Seafood">Hải sản</option>
                <option value="GrainCarb">Gạo & Mì</option>
                <option value="Condiment">Gia vị</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={!newName.trim()}
              className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-colors"
            >
              + Lưu vào tủ lạnh
            </button>
          </form>

          {/* Quick Add Recommendations */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 card-shadow space-y-3">
            <h4 className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">Thêm nhanh từ thư viện</h4>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {allIngredients.slice(0, 16).map(ing => {
                const inPantry = pantryItems.some(p => p.normalizedName === ing.normalizedName);
                return (
                  <button
                    key={ing.id}
                    disabled={inPantry}
                    onClick={() => handleQuickAdd(ing)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition-colors ${inPantry
                      ? 'bg-zinc-100 text-emerald-900/50 border-zinc-200 cursor-not-allowed'
                      : 'bg-zinc-50 hover:bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400'
                      }`}
                  >
                    <span>{ing.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Visual Fridge Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 card-shadow flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-emerald-900/50 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Lọc tủ lạnh..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-400 font-medium"
              />
            </div>
          </div>

          {/* Grid of items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200 p-6 card-shadow">
              <Refrigerator className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-emerald-950">Chưa có nguyên liệu nào</h3>
              <p className="text-xs text-emerald-900/60 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                Hãy thêm đồ ăn bằng form bên trái để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredItems.map(item => {
                const getEmoji = (name: string) => {
                  const n = name.toLowerCase();
                  if (n.includes('trứng')) return '🥚';
                  if (n.includes('sữa')) return '🥛';
                  if (n.includes('nước') || n.includes('dầu ăn')) return '💧';
                  if (n.includes('bò')) return '🥩';
                  if (n.includes('gà') || n.includes('vịt')) return '🍗';
                  if (n.includes('heo') || n.includes('lợn') || n.includes('thịt')) return '🍖';
                  if (n.includes('cá') || n.includes('tôm') || n.includes('mực') || n.includes('cua') || n.includes('hải sản')) return '🐟';
                  if (n.includes('cà chua')) return '🍅';
                  if (n.includes('khoai')) return '🥔';
                  if (n.includes('hành') || n.includes('tỏi')) return '🧅';
                  if (n.includes('rau') || n.includes('xà lách') || n.includes('cải')) return '🥬';
                  if (n.includes('gạo') || n.includes('cơm')) return '🍚';
                  if (n.includes('mì') || n.includes('phở') || n.includes('bún')) return '🍜';
                  if (n.includes('đường') || n.includes('muối') || n.includes('tiêu') || n.includes('gia vị')) return '🧂';
                  if (n.includes('nấm')) return '🍄';
                  if (n.includes('đậu') || n.includes('đỗ')) return '🥜';
                  if (n.includes('chanh') || n.includes('quất')) return '🍋';
                  if (n.includes('ớt')) return '🌶️';
                  return '🥦';
                };

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-4 card-shadow flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-lg shadow-sm shrink-0">
                        {getEmoji(item.name)}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-emerald-950 truncate leading-tight">{item.name}</h4>
                        <p className="text-[11px] text-emerald-900/60 font-medium mt-0.5">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemovePantryItem(item.id)}
                      className="p-2 rounded-lg text-emerald-900/50 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Xóa khỏi tủ lạnh"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
