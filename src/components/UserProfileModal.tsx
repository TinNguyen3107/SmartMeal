import React, { useState } from 'react';
import {
  X,
  User,
  Heart,
  Save,
  Check
} from 'lucide-react';
import { UserProfile, DietaryType, Difficulty } from '../types';

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#EAE7E0] rounded-[36px] max-w-xl w-full p-6 sm:p-8 card-shadow-lg text-[#3D3D3D] relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F9F7F2] hover:bg-[#F2EDE4] text-[#7D857E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#8BA08E]/20 text-[#4A5D4E] flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#3D3D3D]">Hồ sơ & Sở thích cá nhân (FR-03)</h2>
            <p className="text-xs text-[#7D857E]">Tùy chỉnh để hệ thống cá nhân hóa gợi ý món ăn chuẩn xác nhất</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* General Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#3D3D3D] font-semibold mb-1.5">Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
              />
            </div>
            <div>
              <label className="block text-[#3D3D3D] font-semibold mb-1.5">Tuổi</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
              />
            </div>
          </div>

          {/* Max cooking time slider */}
          <div>
            <div className="flex justify-between text-[#3D3D3D] font-semibold mb-1.5">
              <span>Thời gian nấu ưa thích mặc định:</span>
              <span className="text-[#8BA08E] font-bold">{maxCookingTime} phút</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={maxCookingTime}
              onChange={e => setMaxCookingTime(Number(e.target.value))}
              className="w-full accent-[#8BA08E]"
            />
          </div>

          {/* Preferred Difficulty */}
          <div>
            <label className="block text-[#3D3D3D] font-semibold mb-1.5">Độ khó ưa thích:</label>
            <div className="grid grid-cols-4 gap-2">
              {['Any', 'Easy', 'Medium', 'Hard'].map(d => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setPreferredDifficulty(d as any)}
                  className={`py-2 rounded-xl font-semibold border text-center transition-colors ${
                    preferredDifficulty === d
                      ? 'bg-[#8BA08E] text-white border-[#8BA08E]'
                      : 'bg-[#F9F7F2] text-[#7D857E] border-[#EAE7E0] hover:border-[#D1CEC7]'
                  }`}
                >
                  {d === 'Any' ? 'Bất kỳ' : d === 'Easy' ? 'Dễ làm' : d === 'Medium' ? 'Trung bình' : 'Cầu kỳ'}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Types */}
          <div>
            <label className="block text-[#3D3D3D] font-semibold mb-1.5">Chế độ ăn & Lối sống:</label>
            <div className="flex flex-wrap gap-2">
              {availableDiets.map(diet => {
                const isSelected = dietaryTypes.includes(diet);
                return (
                  <button
                    type="button"
                    key={diet}
                    onClick={() => handleToggleDiet(diet)}
                    className={`px-3.5 py-1.5 rounded-full font-medium border flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-[#8BA08E] text-white border-[#8BA08E]'
                        : 'bg-[#F9F7F2] text-[#7D857E] border-[#EAE7E0] hover:border-[#D1CEC7]'
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
            <label className="block text-[#3D3D3D] font-semibold mb-1.5">
              Dị ứng / Thực phẩm cần loại trừ (ngăn cách bằng dấu phẩy):
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Đậu phộng, Hải sản, Hành tây..."
              value={allergiesText}
              onChange={e => setAllergiesText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
            />
          </div>

          <div className="pt-4 border-t border-[#EAE7E0] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-[#F9F7F2] hover:bg-[#F2EDE4] text-[#7D857E] font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold flex items-center gap-2 card-shadow transition-colors"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
