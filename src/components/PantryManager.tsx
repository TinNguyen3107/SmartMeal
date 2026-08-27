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

  const categories: { id: string; name: string; icon: string }[] = [
    { id: 'All', name: 'Tất cả', icon: '🍽️' },
    { id: 'EggDairy', name: 'Trứng & Sữa', icon: '🥚' },
    { id: 'Vegetable', name: 'Rau củ', icon: '🥬' },
    { id: 'Meat', name: 'Thịt tươi', icon: '🥩' },
    { id: 'Seafood', name: 'Hải sản', icon: '🦐' },
    { id: 'GrainCarb', name: 'Gạo & Mì', icon: '🍚' },
    { id: 'Condiment', name: 'Gia vị', icon: '🧂' }
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
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchQuery = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header - Forest Tone */}
      <div className="bg-[#4A5D4E] text-white rounded-[36px] p-8 sm:p-10 card-shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-[#E9EDC9] text-xs font-semibold mb-3 tracking-wide">
            <Refrigerator className="w-4 h-4 text-[#D9AE94]" />
            Quản lý kho nguyên liệu gia đình (FR-04)
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-normal text-white tracking-tight">
            Tủ lạnh thông minh của tôi
          </h1>
          <p className="mt-2 text-[#E9EDC9] text-xs sm:text-sm leading-relaxed opacity-95">
            Lưu giữ danh sách thực phẩm đang có trong tủ lạnh. Nhấn "Nấu ngay từ tủ lạnh" để AI tự động tìm công thức ngon nhất!
          </p>
        </div>

        {/* Action Button */}
        <div className="shrink-0 relative z-10">
          <button
            id="cook-from-pantry-btn"
            disabled={pantryItems.length === 0}
            onClick={() => onTriggerRecommendation(pantryItems.map(p => ({ name: p.name, quantity: p.quantity, unit: p.unit })))}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-sm card-shadow flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5 text-[#E9EDC9]" />
            Nấu ngay từ {pantryItems.length} món trong tủ lạnh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: Add Ingredient Form & Quick Add Catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Custom Add Form */}
          <form onSubmit={handleFormSubmit} className="bg-white border border-[#EAE7E0] rounded-4xl p-6 card-shadow space-y-4">
            <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#8BA08E]" />
              Thêm nguyên liệu mới vào tủ
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">Tên thực phẩm</label>
              <input
                type="text"
                placeholder="Ví dụ: Trứng gà, Thịt bò, Nấm rơm..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">Số lượng</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newQty}
                  onChange={e => setNewQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] focus:bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">Đơn vị</label>
                <input
                  type="text"
                  placeholder="quả, g, củ, ml..."
                  value={newUnit}
                  onChange={e => setNewUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] focus:bg-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">Nhóm nguyên liệu</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
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
              className="w-full py-3 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-xs card-shadow disabled:opacity-50 transition-colors"
            >
              + Lưu vào tủ lạnh
            </button>
          </form>

          {/* Quick Add Recommendations */}
          <div className="bg-white border border-[#EAE7E0] rounded-4xl p-6 card-shadow space-y-3">
            <h4 className="text-xs font-bold text-[#7D857E] uppercase tracking-wider">Thêm nhanh từ thư viện</h4>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {allIngredients.slice(0, 16).map(ing => {
                const inPantry = pantryItems.some(p => p.normalizedName === ing.normalizedName);
                return (
                  <button
                    key={ing.id}
                    disabled={inPantry}
                    onClick={() => handleQuickAdd(ing)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors ${inPantry
                        ? 'bg-[#F2EDE4] text-[#A9A296] border-[#EAE7E0] cursor-not-allowed'
                        : 'bg-[#F9F7F2] hover:bg-white text-[#3D3D3D] border-[#EAE7E0] hover:border-[#8BA08E]'
                      }`}
                  >
                    <span>{ing.icon || '🥗'}</span>
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
          <div className="bg-white border border-[#EAE7E0] rounded-[28px] p-5 card-shadow flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat.id
                      ? 'bg-[#4A5D4E] text-white shadow-sm'
                      : 'bg-[#F9F7F2] text-[#686868] hover:text-[#3D3D3D] border border-[#EAE7E0]'
                    }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-[#A9A296] absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Lọc tủ lạnh..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
              />
            </div>
          </div>

          {/* Grid of items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-4xl border border-[#EAE7E0] p-6 card-shadow">
              <Refrigerator className="w-12 h-12 text-[#A9A296] mx-auto mb-3" />
              <h3 className="font-serif text-base font-bold text-[#3D3D3D]">Chưa có nguyên liệu nào trong danh mục này</h3>
              <p className="text-xs text-[#7D857E] max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                Hãy thêm đồ ăn bằng form bên trái để tủ lạnh luôn đầy ắp đồ ngon nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-[#EAE7E0] hover:border-[#D1CEC7] rounded-3xl p-4 card-shadow flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-full bg-[#8BA08E]/20 text-[#4A5D4E] flex items-center justify-center text-lg shrink-0">
                      {item.category === 'EggDairy' ? '🥚' : item.category === 'Meat' ? '🥩' : item.category === 'Seafood' ? '🦐' : item.category === 'Vegetable' ? '🥬' : '🧂'}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-[#3D3D3D] truncate leading-tight">{item.name}</h4>
                      <p className="text-[11px] text-[#8C5D36] font-semibold mt-0.5">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemovePantryItem(item.id)}
                    className="p-2 rounded-full text-[#A9A296] hover:text-[#B85244] hover:bg-[#B85244]/10 transition-colors"
                    title="Xóa khỏi tủ lạnh"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
