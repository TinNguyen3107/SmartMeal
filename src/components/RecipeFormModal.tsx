import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

interface RecipeFormModalProps {
  onClose: () => void;
  onSubmit: (recipe: any) => void;
  initialData?: any;
}

const normalizeIngredientName = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();

export const RecipeFormModal: React.FC<RecipeFormModalProps> = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    image: initialData?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    cuisine: initialData?.cuisine || 'Vietnamese',
    category: initialData?.category || 'Món chính',
    difficulty: initialData?.difficulty || 'Easy',
    preparationTime: initialData?.preparationTime || 10,
    cookingTime: initialData?.cookingTime || (initialData?.totalTime ? initialData.totalTime - (initialData.preparationTime || 10) : 20),
    calories: initialData?.calories || 300,
    proteinGrams: initialData?.proteinGrams || 25,
    carbGrams: initialData?.carbGrams || 30,
    fatGrams: initialData?.fatGrams || 10,
    nutritionNotes: initialData?.nutritionNotes || '',
    servings: initialData?.servings || 2,
  });

  const [ingredients, setIngredients] = useState(
    initialData?.ingredients?.length ? initialData.ingredients : [{ name: '', quantity: 1, unit: 'g' }]
  );
  const [instructions, setInstructions] = useState(
    initialData?.instructions?.length ? initialData.instructions : [{ stepNumber: 1, instruction: '' }]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = {
      ...formData,
      vietnameseName: formData.name,
      totalTime: formData.preparationTime + formData.cookingTime,
      dietaryTags: ['Vietnamese'],
      ingredients: ingredients.map((i, idx) => ({
        ingredientId: 'ing-manual-' + Date.now() + '-' + idx,
        name: i.name,
        normalizedName: normalizeIngredientName(i.name),
        quantity: Number(i.quantity),
        unit: i.unit,
        importance: i.importance || (idx < 2 ? 'primary' : 'secondary')
      })),
      instructions: instructions.map((ins, i) => ({
        stepNumber: i + 1,
        instruction: ins.instruction
      }))
    };
    onSubmit(recipe);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-zinc-100 p-4 flex justify-between items-center z-10">
          <h2 className="font-bold text-lg text-emerald-950">
            {initialData?.id ? 'Sửa công thức' : initialData?.ingredients?.length ? 'Kiểm duyệt bản nháp công thức' : 'Tạo công thức thủ công'}
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-emerald-950">
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Tên món ăn</label>
              <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded-lg text-sm bg-white" placeholder="VD: Bò hầm tiêu xanh" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Mô tả hấp dẫn</label>
              <input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border p-2 rounded-lg text-sm bg-white" placeholder="Món bò mềm tan..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Link Ảnh Minh Họa</label>
              <input required value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="w-full border p-2 rounded-lg text-sm bg-white" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Thời gian chuẩn bị (phút)</label>
              <input required type="number" min="0" value={formData.preparationTime} onChange={e => setFormData({ ...formData, preparationTime: Number(e.target.value) })} className="w-full border p-2 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Thời gian nấu (phút)</label>
              <input required type="number" min="0" value={formData.cookingTime} onChange={e => setFormData({ ...formData, cookingTime: Number(e.target.value) })} className="w-full border p-2 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Tổng Calo (kcal)</label>
              <input required type="number" min="0" value={formData.calories} onChange={e => setFormData({ ...formData, calories: Number(e.target.value) })} className="w-full border p-2 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Khẩu phần (người)</label>
              <input required type="number" min="1" value={formData.servings} onChange={e => setFormData({ ...formData, servings: Number(e.target.value) })} className="w-full border p-2 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Protein (g)</label>
              <input type="number" min="0" value={formData.proteinGrams} onChange={e => setFormData({ ...formData, proteinGrams: Number(e.target.value) })} className="w-full border p-2 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Carbohydrate (g)</label>
              <input type="number" min="0" value={formData.carbGrams} onChange={e => setFormData({ ...formData, carbGrams: Number(e.target.value) })} className="w-full border p-2 rounded-lg text-sm bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Fat (g)</label>
              <input type="number" min="0" value={formData.fatGrams} onChange={e => setFormData({ ...formData, fatGrams: Number(e.target.value) })} className="w-full border p-2 rounded-lg text-sm bg-white" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Cơ sở khoa học dinh dưỡng (Nutrition Notes)</label>
              <input value={formData.nutritionNotes} onChange={e => setFormData({ ...formData, nutritionNotes: e.target.value })} className="w-full border p-2 rounded-lg text-sm bg-white" placeholder="Giải thích ngắn gọn lý do chọn định lượng & tỷ lệ P/C/F này..." />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-emerald-950">Nguyên liệu chi tiết</label>
              <button type="button" onClick={() => setIngredients([...ingredients, { name: '', quantity: 1, unit: 'g' }])} className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">+ Thêm</button>
            </div>
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input required placeholder="Tên nguyên liệu (VD: Thịt bò)" value={ing.name} onChange={e => { const newI = [...ingredients]; newI[i].name = e.target.value; setIngredients(newI); }} className="flex-1 border p-2 rounded-lg text-sm bg-white text-emerald-950" />
                <input required type="number" min="0" step="0.1" placeholder="SL" value={ing.quantity} onChange={e => { const newI = [...ingredients]; newI[i].quantity = Number(e.target.value); setIngredients(newI); }} className="w-20 border p-2 rounded-lg text-sm bg-white text-emerald-950" />
                <input required placeholder="Đơn vị (g, ml..)" value={ing.unit} onChange={e => { const newI = [...ingredients]; newI[i].unit = e.target.value; setIngredients(newI); }} className="w-24 border p-2 rounded-lg text-sm bg-white text-emerald-950" />
                <button type="button" onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-emerald-950">Các bước thực hiện</label>
              <button type="button" onClick={() => setInstructions([...instructions, { stepNumber: instructions.length + 1, instruction: '' }])} className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">+ Thêm bước</button>
            </div>
            {instructions.map((ins, i) => (
              <div key={i} className="flex gap-2 mb-2 items-start">
                <span className="font-bold text-sm mt-2 text-emerald-900/60 w-5">{i + 1}.</span>
                <textarea required placeholder="Mô tả cách làm..." value={ins.instruction} onChange={e => { const newI = [...instructions]; newI[i].instruction = e.target.value; setInstructions(newI); }} className="flex-1 border p-2 rounded-lg text-sm h-16 bg-white text-emerald-950 resize-none" />
                <button type="button" onClick={() => setInstructions(instructions.filter((_, idx) => idx !== i))} className="p-2 text-red-500 mt-1 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-sm font-bold text-zinc-700 transition-colors">Hủy bỏ</button>
            <button type="submit" className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-colors">Lưu Công Thức</button>
          </div>
        </form>
      </div>
    </div>
  );
};
