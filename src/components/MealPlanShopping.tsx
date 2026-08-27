import React, { useState } from 'react';
import {
  CalendarCheck2,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Copy,
  Utensils,
  Share2,
  CheckCircle2
} from 'lucide-react';
import { Recipe } from '../types';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  recipeName?: string;
  isBought: boolean;
}

interface MealPlanShoppingProps {
  shoppingList: ShoppingItem[];
  onToggleBuyItem: (id: string) => void;
  onRemoveShoppingItem: (id: string) => void;
  onAddCustomShoppingItem: (name: string, quantity: number, unit: string) => void;
  onClearBought: () => void;
}

export const MealPlanShopping: React.FC<MealPlanShoppingProps> = ({
  shoppingList,
  onToggleBuyItem,
  onRemoveShoppingItem,
  onAddCustomShoppingItem,
  onClearBought
}) => {
  const [activeTab, setActiveTab] = useState<'shopping' | 'planner'>('shopping');

  // Custom Shopping item input
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customUnit, setCustomUnit] = useState('g');

  // 7-day Meal planner state
  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const [mealPlan, setMealPlan] = useState<Record<string, { breakfast: string; lunch: string; dinner: string }>>({
    'Thứ 2': { breakfast: 'Trứng ốp la & Bánh mì', lunch: 'Ức gà áp chảo sốt bơ tỏi', dinner: 'Trứng sốt cà chua' },
    'Thứ 3': { breakfast: 'Yến mạch hoa quả', lunch: 'Thịt heo rang cháy cạnh', dinner: 'Canh bí đỏ thịt bằm' },
    'Thứ 4': { breakfast: 'Mì trứng xào rau cải', lunch: 'Bò xào ớt chuông hành tây', dinner: 'Canh chua cá lóc' },
    'Thứ 5': { breakfast: 'Trứng luộc & Khoai lang', lunch: 'Đậu hũ sốt cà chua', dinner: 'Thịt kho trứng cút' },
    'Thứ 6': { breakfast: 'Bánh mì pate trứng', lunch: 'Gà xào sả ớt', dinner: 'Canh rau muống luộc dầm sấu' },
    'Thứ 7': { breakfast: 'Phở bò gia đình', lunch: 'Bò lúc lắc khoai tây', dinner: 'Lẩu hải sản sum vầy' },
    'Chủ Nhật': { breakfast: 'Bún chả gia đình', lunch: 'Cá hồi sốt cam', dinner: 'Salad ức gà sốt mè rang' }
  });

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    onAddCustomShoppingItem(customName.trim(), customQty, customUnit);
    setCustomName('');
    setCustomQty(1);
  };

  const handleCopyShoppingList = () => {
    const text = shoppingList
      .map(item => `${item.isBought ? '[x]' : '[ ]'} ${item.name}: ${item.quantity} ${item.unit} ${item.recipeName ? `(cho món ${item.recipeName})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(`🛒 DANH SÁCH ĐI CHỢ SMARTMEAL:\n${text}`);
    alert('✅ Đã sao chép danh sách đi chợ vào bộ nhớ tạm!');
  };

  const boughtCount = shoppingList.filter(i => i.isBought).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-[#4A5D4E] text-white rounded-[36px] p-8 sm:p-10 card-shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-[#E9EDC9] text-xs font-semibold mb-3">
            <CalendarCheck2 className="w-4 h-4 text-[#D9AE94]" />
            Kế hoạch bữa ăn & Danh sách đi chợ
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-normal text-white">Thực đơn & Giỏ đi chợ thông minh</h1>
          <p className="mt-1 text-[#E9EDC9] text-xs sm:text-sm">Quản lý thực phẩm cần mua sắm và lịch trình dinh dưỡng lành mạnh cho tuần mới</p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-[#3B4B3F] p-1.5 rounded-full border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('shopping')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'shopping'
                ? 'bg-[#8BA08E] text-white shadow-sm'
                : 'text-[#E9EDC9] hover:text-white'
              }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Giỏ đi chợ ({shoppingList.length})
          </button>
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'planner'
                ? 'bg-[#8BA08E] text-white shadow-sm'
                : 'text-[#E9EDC9] hover:text-white'
              }`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            Thực đơn 7 ngày
          </button>
        </div>
      </div>

      {activeTab === 'shopping' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Add item box (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <form onSubmit={handleAddCustom} className="bg-white border border-[#EAE7E0] rounded-4xl p-6 card-shadow space-y-4">
              <h3 className="font-serif text-base font-bold text-[#3D3D3D] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8BA08E]" />
                Thêm món cần mua
              </h3>

              <div>
                <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">Tên nguyên liệu / đồ cần mua</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nước dừa xiêm, Hạt nêm, Tỏi..."
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={e => setCustomQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3D3D3D] mb-1">Đơn vị</label>
                  <input
                    type="text"
                    placeholder="g, ml, chai, bó..."
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!customName.trim()}
                className="w-full py-3 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-xs card-shadow disabled:opacity-50 transition-colors"
              >
                + Thêm vào danh sách đi chợ
              </button>
            </form>

            <div className="bg-white border border-[#EAE7E0] rounded-4xl p-6 card-shadow space-y-3">
              <h4 className="text-xs font-bold text-[#3D3D3D]">Tiến độ mua sắm</h4>
              <div className="w-full bg-[#F2EDE4] rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#8BA08E] h-2.5 transition-all duration-300 rounded-full"
                  style={{ width: `${shoppingList.length ? (boughtCount / shoppingList.length) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-[#7D857E] text-right font-medium">
                Đã mua {boughtCount}/{shoppingList.length} món
              </p>

              <button
                onClick={handleCopyShoppingList}
                className="w-full py-2.5 rounded-full bg-[#F9F7F2] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-[#3D3D3D] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-[#8BA08E]" />
                Sao chép danh sách đi chợ
              </button>
            </div>
          </div>

          {/* List items (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-[#EAE7E0] rounded-[28px] p-5 card-shadow flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-[#3D3D3D] flex items-center gap-2">
                <span>Cần mua hôm nay ({shoppingList.length})</span>
              </h3>
              {boughtCount > 0 && (
                <button
                  onClick={onClearBought}
                  className="text-xs text-[#8C5D36] hover:text-[#B85244] font-semibold transition-colors"
                >
                  Xóa {boughtCount} món đã mua
                </button>
              )}
            </div>

            {shoppingList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-4xl border border-[#EAE7E0] p-6 card-shadow">
                <ShoppingBag className="w-12 h-12 text-[#A9A296] mx-auto mb-3" />
                <h4 className="font-serif text-base font-bold text-[#3D3D3D]">Giỏ đi chợ đang trống</h4>
                <p className="text-xs text-[#7D857E] max-w-sm mx-auto mt-1 leading-relaxed">
                  Khi bạn xem các món đề xuất thiếu nguyên liệu, hãy bấm nút <strong>+ Thêm vào giỏ đi chợ</strong> để hệ thống tự động gom lại tại đây nhé!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {shoppingList.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-[22px] border flex items-center justify-between transition-all ${item.isBought
                        ? 'bg-[#F9F7F2] border-[#EAE7E0] opacity-65'
                        : 'bg-white border-[#EAE7E0] hover:border-[#D1CEC7] card-shadow'
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        onClick={() => onToggleBuyItem(item.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${item.isBought
                            ? 'bg-[#8BA08E] text-white'
                            : 'border-2 border-[#D1CEC7] hover:border-[#8BA08E]'
                          }`}
                      >
                        {item.isBought && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <span className={`text-xs font-semibold ${item.isBought ? 'line-through text-[#A9A296]' : 'text-[#3D3D3D]'}`}>
                          {item.name}
                        </span>
                        {item.recipeName && (
                          <p className="text-[10px] text-[#7D857E]">Món: {item.recipeName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#8C5D36] bg-[#F2EDE4] px-2.5 py-1 rounded-full">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        onClick={() => onRemoveShoppingItem(item.id)}
                        className="p-1 text-[#A9A296] hover:text-[#B85244]"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 7-DAY MEAL PLANNER VIEW */
        <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-8 card-shadow space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#3D3D3D] flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#8BA08E]" />
              Lịch trình ăn uống tuần này
            </h3>
            <span className="text-xs text-[#7D857E] bg-[#F2EDE4] px-3 py-1 rounded-full font-medium">Gợi ý dinh dưỡng cân bằng</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5">
            {days.map(day => {
              const plan = mealPlan[day];
              return (
                <div key={day} className="bg-[#FDFBF7] border border-[#EAE7E0] rounded-3xl p-4 space-y-3">
                  <div className="text-center font-serif font-bold text-xs text-[#4A5D4E] border-b border-[#EAE7E0] pb-2">
                    {day}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-white border border-[#EAE7E0]">
                      <span className="text-[10px] text-[#7D857E] block font-semibold">Sáng:</span>
                      <p className="text-[#3D3D3D] font-medium truncate">{plan.breakfast}</p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white border border-[#EAE7E0]">
                      <span className="text-[10px] text-[#7D857E] block font-semibold">Trưa:</span>
                      <p className="text-[#4A5D4E] font-medium truncate">{plan.lunch}</p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-white border border-[#EAE7E0]">
                      <span className="text-[10px] text-[#7D857E] block font-semibold">Tối:</span>
                      <p className="text-[#8C5D36] font-medium truncate">{plan.dinner}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
