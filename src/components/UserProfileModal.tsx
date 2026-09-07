import React, { useState } from 'react';
import {
  X,
  User,
  Heart,
  Save,
  Check
} from 'lucide-react';
import { UserProfile, DietaryType, Difficulty, NutritionGoal, ActivityLevel } from '../types';

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
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal>(currentUser.preferences.nutritionGoal || 'BALANCED');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(currentUser.preferences.activityLevel || 'LIGHT');
  const [heightCm, setHeightCm] = useState(currentUser.preferences.heightCm || 165);
  const [weightKg, setWeightKg] = useState(currentUser.preferences.weightKg || 60);
  const [targetCalories, setTargetCalories] = useState(currentUser.preferences.targetCalories || 1900);
  const [targetProtein, setTargetProtein] = useState(currentUser.preferences.targetProtein || 75);
  const [targetCarbs, setTargetCarbs] = useState(currentUser.preferences.targetCarbs || 210);
  const [targetFat, setTargetFat] = useState(currentUser.preferences.targetFat || 55);
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
        nutritionGoal,
        activityLevel,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        targetCalories: Number(targetCalories),
        targetProtein: Number(targetProtein),
        targetCarbs: Number(targetCarbs),
        targetFat: Number(targetFat),
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

          <div>
            <label className="block text-[#3D3D3D] font-semibold mb-1.5">Mục tiêu dinh dưỡng:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {([
                ['BALANCED', 'Cân bằng'],
                ['WEIGHT_LOSS', 'Giảm cân'],
                ['MUSCLE_GAIN', 'Tập gym'],
                ['LOW_CARB', 'Low carb'],
                ['VEGETARIAN', 'Ăn chay']
              ] as [NutritionGoal, string][]).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setNutritionGoal(value)}
                  className={`py-2 rounded-xl font-semibold border text-center transition-colors ${
                    nutritionGoal === value
                      ? 'bg-[#4A5D4E] text-white border-[#4A5D4E]'
                      : 'bg-[#F9F7F2] text-[#7D857E] border-[#EAE7E0] hover:border-[#D1CEC7]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#3D3D3D] font-semibold mb-1.5">Chiều cao (cm)</label>
              <input
                type="number"
                value={heightCm}
                onChange={e => setHeightCm(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
              />
            </div>
            <div>
              <label className="block text-[#3D3D3D] font-semibold mb-1.5">Cân nặng (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={e => setWeightKg(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] text-xs focus:outline-none focus:border-[#8BA08E] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#3D3D3D] font-semibold mb-1.5">Mức vận động:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                ['SEDENTARY', 'Ít vận động'],
                ['LIGHT', 'Nhẹ'],
                ['MODERATE', 'Vừa'],
                ['ACTIVE', 'Cao']
              ] as [ActivityLevel, string][]).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setActivityLevel(value)}
                  className={`py-2 rounded-xl font-semibold border text-center transition-colors ${
                    activityLevel === value
                      ? 'bg-[#8BA08E] text-white border-[#8BA08E]'
                      : 'bg-[#F9F7F2] text-[#7D857E] border-[#EAE7E0] hover:border-[#D1CEC7]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[#3D3D3D] font-semibold mb-1.5">Mục tiêu macro mỗi ngày:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <input type="number" value={targetCalories} onChange={e => setTargetCalories(Number(e.target.value))} className="px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs focus:outline-none focus:border-[#8BA08E] font-medium" placeholder="kcal" />
              <input type="number" value={targetProtein} onChange={e => setTargetProtein(Number(e.target.value))} className="px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs focus:outline-none focus:border-[#8BA08E] font-medium" placeholder="Protein g" />
              <input type="number" value={targetCarbs} onChange={e => setTargetCarbs(Number(e.target.value))} className="px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs focus:outline-none focus:border-[#8BA08E] font-medium" placeholder="Carb g" />
              <input type="number" value={targetFat} onChange={e => setTargetFat(Number(e.target.value))} className="px-3.5 py-2.5 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-xs focus:outline-none focus:border-[#8BA08E] font-medium" placeholder="Fat g" />
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
