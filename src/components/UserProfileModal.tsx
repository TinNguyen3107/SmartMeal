import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Heart,
  Save,
  Check
} from 'lucide-react';
import { UserProfile, DietaryType, Difficulty } from '../types';

interface HistoryItem {
  id: string;
  recipeName: string;
  recipeId: string;
  type: 'VIEW' | 'COOKED';
  date: string;
}

interface UserProfileModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onClose,
  onUpdateProfile
}) => {
  const [name, setName] = useState(currentUser.name);
  const [age, setAge] = useState(currentUser.age || 28);
  const [gender, setGender] = useState(currentUser.gender || 'Other');
  const [maxCookingTime, setMaxCookingTime] = useState(currentUser.preferences.maxCookingTime || 30);
  const [preferredDifficulty, setPreferredDifficulty] = useState<Difficulty | 'Any'>(currentUser.preferences.preferredDifficulty || 'Any');
  const [dietaryTypes, setDietaryTypes] = useState<DietaryType[]>(currentUser.preferences.dietaryTypes || ['Vietnamese', 'Healthy']);
  const [allergiesText, setAllergiesText] = useState((currentUser.preferences.allergies || []).join(', '));
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');

  // Load lịch sử thật từ API (FR-15)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryLoading(true);
      fetch('/api/user/history')
        .then(r => r.json())
        .then(data => setHistoryItems(data.history || []))
        .catch(() => setHistoryItems([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab]);

  const availableDiets: DietaryType[] = [
    'Vietnamese',
    'Healthy',
    'Vegetarian',
    'Low Carb',
    'High Protein',
    'Quick Meal',
    'Budget Meal'
  ];

  const handleToggleDiet = (diet: DietaryType) => {
    if (dietaryTypes.includes(diet)) {
      setDietaryTypes(dietaryTypes.filter(d => d !== diet));
    } else {
      setDietaryTypes([...dietaryTypes, diet]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const allergies = allergiesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const updatedData: Partial<UserProfile> = {
      name,
      age: Number(age),
      gender: gender as any,
      preferences: {
        ...currentUser.preferences,
        maxCookingTime,
        preferredDifficulty,
        dietaryTypes,
        allergies
      }
    };

    try {
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      onUpdateProfile(updatedData);
      onClose();
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-emerald-500/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-xl w-full p-6 sm:p-8 card-shadow-lg text-emerald-950 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-emerald-900/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-emerald-950">Hồ sơ & Lịch sử</h2>
              <p className="text-xs text-emerald-900/60">Quản lý sở thích và hoạt động của bạn</p>
            </div>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'info' ? 'bg-white text-emerald-950 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Thông tin
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'history' ? 'bg-white text-emerald-950 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Lịch sử
            </button>
          </div>
        </div>

        {activeTab === 'info' ? (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* General Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-700 font-semibold mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 text-xs focus:outline-none focus:border-zinc-400 font-medium"
              />
            </div>
            <div>
              <label className="block text-zinc-700 font-semibold mb-1.5">Tuổi</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 text-xs focus:outline-none focus:border-zinc-400 font-medium"
              />
            </div>
          </div>

          {/* Max cooking time slider */}
          <div>
            <div className="flex justify-between text-zinc-700 font-semibold mb-1.5">
              <span>Thời gian nấu ưa thích:</span>
              <span className="text-emerald-950 font-bold">{maxCookingTime} phút</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={maxCookingTime}
              onChange={e => setMaxCookingTime(Number(e.target.value))}
              className="w-full accent-black"
            />
          </div>

          {/* Preferred Difficulty */}
          <div>
            <label className="block text-zinc-700 font-semibold mb-1.5">Độ khó ưa thích:</label>
            <div className="grid grid-cols-4 gap-2">
              {['Any', 'Easy', 'Medium', 'Hard'].map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setPreferredDifficulty(d as any)}
                  className={`py-2 rounded-lg font-semibold border text-center transition-colors ${
                    preferredDifficulty === d
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  {d === 'Any' ? 'Bất kỳ' : d === 'Easy' ? 'Dễ làm' : d === 'Medium' ? 'Trung bình' : 'Cầu kỳ'}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Types */}
          <div>
            <label className="block text-zinc-700 font-semibold mb-1.5">Chế độ ăn & Lối sống:</label>
            <div className="flex flex-wrap gap-2">
              {availableDiets.map(diet => {
                const isSelected = dietaryTypes.includes(diet);
                return (
                  <button
                    type="button"
                    key={diet}
                    onClick={() => handleToggleDiet(diet)}
                    className={`px-3.5 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {diet}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-zinc-700 font-semibold mb-1.5">
              Dị ứng / Thực phẩm cần loại trừ (ngăn cách bằng dấu phẩy):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đậu phộng, Hải sản, Hành tây..."
              value={allergiesText}
              onChange={e => setAllergiesText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-emerald-950 placeholder-zinc-400 text-xs focus:outline-none focus:border-zinc-400 font-medium"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-600 font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            <h3 className="text-sm font-bold text-emerald-950 mb-2">Hoạt động gần đây</h3>
            {historyLoading ? (
              <div className="text-center py-4 text-emerald-900/60 text-xs">Đang tải lịch sử...</div>
            ) : historyItems.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 rounded-xl border border-zinc-200">
                <p className="text-zinc-500 text-xs">Chưa có hoạt động nào được ghi nhận.</p>
              </div>
            ) : (
              historyItems.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-zinc-200 flex justify-between items-center bg-zinc-50">
                  <div>
                    <h4 className="font-semibold text-emerald-950">{item.recipeName}</h4>
                    <p className="text-[10px] text-zinc-500">{new Date(item.date).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    item.type === 'COOKED' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {item.type === 'COOKED' ? 'Đã nấu' : 'Đã xem'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
