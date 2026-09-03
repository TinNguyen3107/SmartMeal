import { Ingredient, Recipe, UserProfile, TestCaseResult } from '../types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing-egg', name: 'Trứng gà', normalizedName: 'TRUNG_GA', category: 'EggDairy', categoryNameVi: 'Trứng & Sữa', defaultUnit: 'quả', icon: '🥚', aliases: ['trứng', 'trung', 'egg', 'eggs'], approximateCaloriesPerUnit: 70 },
  { id: 'ing-tomato', name: 'Cà chua', normalizedName: 'CA_CHUA', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', icon: '🍅', aliases: ['ca chua', 'tomato', 'tomatoes'], approximateCaloriesPerUnit: 22 },
  { id: 'ing-scallion', name: 'Hành lá', normalizedName: 'HANH_LA', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'nhánh', icon: '🧅', aliases: ['hanh la', 'hành', 'green onion', 'scallion'], approximateCaloriesPerUnit: 5 },
  { id: 'ing-garlic', name: 'Tỏi', normalizedName: 'TOI', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'tép', icon: '🧄', aliases: ['toi', 'garlic'], approximateCaloriesPerUnit: 5 },
  { id: 'ing-onion', name: 'Hành tây', normalizedName: 'HANH_TAY', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'củ', icon: '🧅', aliases: ['hanh tay', 'onion'], approximateCaloriesPerUnit: 45 },
  { id: 'ing-chicken-breast', name: 'Ức gà', normalizedName: 'UC_GA', category: 'Meat', categoryNameVi: 'Thịt tươi', defaultUnit: 'g', icon: '🍗', aliases: ['uc ga', 'thịt gà', 'thit ga', 'chicken breast', 'chicken'], approximateCaloriesPerUnit: 1.65 },
  { id: 'ing-beef', name: 'Thịt bò', normalizedName: 'THIT_BO', category: 'Meat', categoryNameVi: 'Thịt tươi', defaultUnit: 'g', icon: '🥩', aliases: ['thit bo', 'beef', 'bò'], approximateCaloriesPerUnit: 2.5 },
  { id: 'ing-pork', name: 'Thịt heo', normalizedName: 'THIT_HEO', category: 'Meat', categoryNameVi: 'Thịt tươi', defaultUnit: 'g', icon: '🥩', aliases: ['thit heo', 'thịt lợn', 'pork'], approximateCaloriesPerUnit: 2.4 },
  { id: 'ing-minced-pork', name: 'Thịt heo xay', normalizedName: 'THIT_HEO_XAY', category: 'Meat', categoryNameVi: 'Thịt tươi', defaultUnit: 'g', icon: '🥩', aliases: ['thit bam', 'thịt băm', 'minced pork', 'ground pork'], approximateCaloriesPerUnit: 2.5 },
  { id: 'ing-tofu', name: 'Đậu hũ', normalizedName: 'DAU_HU', category: 'EggDairy', categoryNameVi: 'Trứng & Sữa', defaultUnit: 'miếng', icon: '🥜', aliases: ['dau hu', 'đậu phụ', 'tofu'], approximateCaloriesPerUnit: 90 },
  { id: 'ing-mushroom', name: 'Nấm rơm', normalizedName: 'NAM_ROM', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', icon: '🍄', aliases: ['nam', 'nấm', 'mushroom'], approximateCaloriesPerUnit: 0.22 },
  { id: 'ing-water-spinach', name: 'Rau muống', normalizedName: 'RAU_MUONG', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', icon: '🥬', aliases: ['rau muong', 'morning glory'], approximateCaloriesPerUnit: 35 },
  { id: 'ing-potato', name: 'Khoai tây', normalizedName: 'KHOAI_TAY', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'củ', icon: '🥔', aliases: ['khoai tay', 'potato'], approximateCaloriesPerUnit: 110 },
  { id: 'ing-carrot', name: 'Cà rốt', normalizedName: 'CA_ROT', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'củ', icon: '🥕', aliases: ['ca rot', 'carrot'], approximateCaloriesPerUnit: 35 },
  { id: 'ing-cucumber', name: 'Dưa leo', normalizedName: 'DUA_LEO', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', icon: '🥒', aliases: ['dua leo', 'dưa chuột', 'cucumber'], approximateCaloriesPerUnit: 20 },
  { id: 'ing-rice', name: 'Cơm nguội', normalizedName: 'COM_NGUOI', category: 'GrainCarb', categoryNameVi: 'Gạo & Mì', defaultUnit: 'chén', icon: '🍚', aliases: ['com', 'cơm', 'rice', 'leftover rice'], approximateCaloriesPerUnit: 200 },
  { id: 'ing-noodle', name: 'Mì gói', normalizedName: 'MI_GOI', category: 'GrainCarb', categoryNameVi: 'Gạo & Mì', defaultUnit: 'gói', icon: '🍜', aliases: ['mi', 'mì', 'instant noodle', 'noodle'], approximateCaloriesPerUnit: 350 },
  { id: 'ing-shrimp', name: 'Tôm', normalizedName: 'TOM', category: 'Seafood', categoryNameVi: 'Hải sản', defaultUnit: 'g', icon: '🦐', aliases: ['tom', 'shrimp', 'prawn'], approximateCaloriesPerUnit: 1 },
  { id: 'ing-fish', name: 'Cá phi lê', normalizedName: 'CA_PHI_LE', category: 'Seafood', categoryNameVi: 'Hải sản', defaultUnit: 'g', icon: '🐟', aliases: ['ca phi le', 'fish fillet', 'fish'], approximateCaloriesPerUnit: 1.4 },
  { id: 'ing-bitter-melon', name: 'Khổ qua', normalizedName: 'KHO_QUA', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', icon: '🥒', aliases: ['kho qua', 'mướp đắng', 'bitter melon'], approximateCaloriesPerUnit: 25 },
  { id: 'ing-pumpkin', name: 'Bí đỏ', normalizedName: 'BI_DO', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', icon: '🎃', aliases: ['bi do', 'pumpkin'], approximateCaloriesPerUnit: 0.26 },
  { id: 'ing-cabbage', name: 'Bắp cải', normalizedName: 'BAP_CAI', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', icon: '🥬', aliases: ['bap cai', 'cabbage'], approximateCaloriesPerUnit: 0.25 },
  { id: 'ing-lettuce', name: 'Xà lách', normalizedName: 'XA_LACH', category: 'Vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', icon: '🥬', aliases: ['xa lach', 'lettuce', 'salad'], approximateCaloriesPerUnit: 0.15 },
  { id: 'ing-lemon', name: 'Chanh', normalizedName: 'CHANH', category: 'Fruit', categoryNameVi: 'Trái cây', defaultUnit: 'quả', icon: '🍋', aliases: ['chanh', 'lemon', 'lime'], approximateCaloriesPerUnit: 15 },
  { id: 'ing-chili', name: 'Ớt', normalizedName: 'OT', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'quả', icon: '🌶️', aliases: ['ot', 'ớt', 'chili', 'chilli'], approximateCaloriesPerUnit: 5 },
  { id: 'ing-fish-sauce', name: 'Nước mắm', normalizedName: 'NUOC_MAM', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'ml', icon: '🧂', aliases: ['nuoc mam', 'fish sauce'], approximateCaloriesPerUnit: 0.6 },
  { id: 'ing-soy-sauce', name: 'Nước tương', normalizedName: 'NUOC_TUONG', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'ml', icon: '🧂', aliases: ['nuoc tuong', 'soy sauce'], approximateCaloriesPerUnit: 0.5 },
  { id: 'ing-salt', name: 'Muối', normalizedName: 'MUOI', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'g', icon: '🧂', aliases: ['muoi', 'salt'], approximateCaloriesPerUnit: 0 },
  { id: 'ing-pepper', name: 'Tiêu', normalizedName: 'TIEU', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'g', icon: '🧂', aliases: ['tieu', 'pepper'], approximateCaloriesPerUnit: 2.5 },
  { id: 'ing-cooking-oil', name: 'Dầu ăn', normalizedName: 'DAU_AN', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'ml', icon: '🫙', aliases: ['dau an', 'oil', 'cooking oil'], approximateCaloriesPerUnit: 8.8 },
  { id: 'ing-sugar', name: 'Đường', normalizedName: 'DUONG', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'g', icon: '🧂', aliases: ['duong', 'sugar'], approximateCaloriesPerUnit: 4 },
  { id: 'ing-ginger', name: 'Gừng', normalizedName: 'GUNG', category: 'Condiment', categoryNameVi: 'Gia vị', defaultUnit: 'g', icon: '🫚', aliases: ['gung', 'ginger'], approximateCaloriesPerUnit: 0.8 },
  { id: 'ing-milk', name: 'Sữa tươi', normalizedName: 'SUA_TUOI', category: 'EggDairy', categoryNameVi: 'Trứng & Sữa', defaultUnit: 'ml', icon: '🥛', aliases: ['sua', 'sữa', 'milk'], approximateCaloriesPerUnit: 0.6 },
  { id: 'ing-oat', name: 'Yến mạch', normalizedName: 'YEN_MACH', category: 'GrainCarb', categoryNameVi: 'Gạo & Mì', defaultUnit: 'g', icon: '🥣', aliases: ['yen mach', 'oat', 'oats'], approximateCaloriesPerUnit: 3.8 }
];

const today = new Date().toISOString();

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-tomato-egg',
    name: 'Trứng sốt cà chua',
    vietnameseName: 'Trứng sốt cà chua',
    description: 'Món nhanh gọn, mềm béo từ trứng và vị chua nhẹ của cà chua, phù hợp bữa sáng hoặc bữa tối ít thời gian.',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Vietnamese',
    category: 'Món xào',
    dietaryTags: ['Vietnamese', 'Quick Meal', 'Budget Meal'],
    difficulty: 'Easy',
    preparationTime: 5,
    cookingTime: 10,
    totalTime: 15,
    calories: 310,
    proteinGrams: 18,
    carbGrams: 13,
    fatGrams: 21,
    nutritionNotes: 'Trứng cung cấp đạm hoàn chỉnh, cà chua bổ sung chất xơ và lycopene; lượng dầu vừa phải giúp cân bằng năng lượng.',
    servings: 2,
    rating: 4.8,
    reviewCount: 31,
    popularityScore: 92,
    ingredients: [
      { ingredientId: 'ing-egg', name: 'Trứng gà', normalizedName: 'TRUNG_GA', quantity: 3, unit: 'quả', importance: 'primary' },
      { ingredientId: 'ing-tomato', name: 'Cà chua', normalizedName: 'CA_CHUA', quantity: 2, unit: 'quả', importance: 'primary' },
      { ingredientId: 'ing-scallion', name: 'Hành lá', normalizedName: 'HANH_LA', quantity: 2, unit: 'nhánh', importance: 'secondary' },
      { ingredientId: 'ing-cooking-oil', name: 'Dầu ăn', normalizedName: 'DAU_AN', quantity: 10, unit: 'ml', isOptional: true, importance: 'optional' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Rửa cà chua, cắt múi cau; hành lá cắt nhỏ. Đánh tan trứng với một ít muối.', estimatedMinutes: 5 },
      { stepNumber: 2, instruction: 'Làm nóng chảo với dầu, cho trứng vào đảo nhanh đến khi vừa đông rồi lấy ra.', estimatedMinutes: 3 },
      { stepNumber: 3, instruction: 'Xào cà chua đến khi mềm, thêm 30 ml nước để tạo sốt.', estimatedMinutes: 4 },
      { stepNumber: 4, instruction: 'Cho trứng trở lại chảo, đảo đều 2 phút, rắc hành lá và dùng nóng.', estimatedMinutes: 3 }
    ],
    createdAt: today
  },
  {
    id: 'rec-scallion-omelette',
    name: 'Trứng chiên hành lá',
    description: 'Công thức tối giản, dễ nấu, dùng tốt khi trong bếp chỉ còn trứng và hành lá.',
    image: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Vietnamese',
    category: 'Món chiên / nướng',
    dietaryTags: ['Vietnamese', 'Quick Meal', 'Budget Meal'],
    difficulty: 'Easy',
    preparationTime: 3,
    cookingTime: 7,
    totalTime: 10,
    calories: 260,
    proteinGrams: 17,
    carbGrams: 4,
    fatGrams: 20,
    nutritionNotes: 'Tỷ lệ đạm và béo từ trứng giúp tạo cảm giác no, phù hợp bữa nhanh nhưng vẫn đủ năng lượng.',
    servings: 2,
    rating: 4.7,
    reviewCount: 44,
    popularityScore: 88,
    ingredients: [
      { ingredientId: 'ing-egg', name: 'Trứng gà', normalizedName: 'TRUNG_GA', quantity: 3, unit: 'quả', importance: 'primary' },
      { ingredientId: 'ing-scallion', name: 'Hành lá', normalizedName: 'HANH_LA', quantity: 3, unit: 'nhánh', importance: 'primary' },
      { ingredientId: 'ing-fish-sauce', name: 'Nước mắm', normalizedName: 'NUOC_MAM', quantity: 5, unit: 'ml', isOptional: true, importance: 'optional' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Đánh trứng với nước mắm, cho hành lá cắt nhỏ vào trộn đều.', estimatedMinutes: 3 },
      { stepNumber: 2, instruction: 'Làm nóng chảo chống dính, tráng trứng thành lớp đều.', estimatedMinutes: 2 },
      { stepNumber: 3, instruction: 'Chiên lửa vừa đến khi mặt dưới vàng, lật nhẹ và chiên thêm 2 phút.', estimatedMinutes: 5 }
    ],
    createdAt: today
  },
  {
    id: 'rec-chicken-tomato',
    name: 'Ức gà áp chảo sốt cà chua',
    description: 'Món giàu protein, ít dầu, hợp người tập luyện hoặc muốn bữa chính gọn nhẹ.',
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Fusion',
    category: 'Món chính',
    dietaryTags: ['Healthy', 'High Protein', 'Low Carb'],
    difficulty: 'Medium',
    preparationTime: 8,
    cookingTime: 17,
    totalTime: 25,
    calories: 420,
    proteinGrams: 46,
    carbGrams: 15,
    fatGrams: 18,
    nutritionNotes: 'Ức gà có mật độ protein cao, sốt cà chua giúp tăng hương vị mà không cần dùng nhiều chất béo.',
    servings: 2,
    rating: 4.9,
    reviewCount: 27,
    popularityScore: 86,
    ingredients: [
      { ingredientId: 'ing-chicken-breast', name: 'Ức gà', normalizedName: 'UC_GA', quantity: 300, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-tomato', name: 'Cà chua', normalizedName: 'CA_CHUA', quantity: 2, unit: 'quả', importance: 'primary' },
      { ingredientId: 'ing-garlic', name: 'Tỏi', normalizedName: 'TOI', quantity: 2, unit: 'tép', importance: 'secondary' },
      { ingredientId: 'ing-cooking-oil', name: 'Dầu ăn', normalizedName: 'DAU_AN', quantity: 10, unit: 'ml', importance: 'secondary' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Cắt ức gà thành miếng dày 1.5 cm, ướp với muối, tiêu và tỏi băm.', estimatedMinutes: 8 },
      { stepNumber: 2, instruction: 'Áp chảo gà mỗi mặt 4-5 phút đến khi chín vàng.', estimatedMinutes: 10 },
      { stepNumber: 3, instruction: 'Xào cà chua băm với 50 ml nước đến khi sệt thành sốt.', estimatedMinutes: 5 },
      { stepNumber: 4, instruction: 'Cho gà vào sốt, rim thêm 2 phút để thấm vị.', estimatedMinutes: 2 }
    ],
    createdAt: today
  },
  {
    id: 'rec-beef-water-spinach',
    name: 'Thịt bò xào rau muống tỏi',
    description: 'Món xào quen thuộc, giòn xanh, giàu đạm và sắt, phù hợp bữa cơm gia đình.',
    image: 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Vietnamese',
    category: 'Món xào',
    dietaryTags: ['Vietnamese', 'High Protein'],
    difficulty: 'Medium',
    preparationTime: 10,
    cookingTime: 10,
    totalTime: 20,
    calories: 390,
    proteinGrams: 32,
    carbGrams: 12,
    fatGrams: 24,
    nutritionNotes: 'Thịt bò bổ sung đạm và sắt, rau muống tăng chất xơ; xào nhanh giúp giữ độ giòn và màu xanh.',
    servings: 2,
    rating: 4.8,
    reviewCount: 38,
    popularityScore: 91,
    ingredients: [
      { ingredientId: 'ing-beef', name: 'Thịt bò', normalizedName: 'THIT_BO', quantity: 250, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-water-spinach', name: 'Rau muống', normalizedName: 'RAU_MUONG', quantity: 1, unit: 'bó', importance: 'primary' },
      { ingredientId: 'ing-garlic', name: 'Tỏi', normalizedName: 'TOI', quantity: 4, unit: 'tép', importance: 'secondary' },
      { ingredientId: 'ing-soy-sauce', name: 'Nước tương', normalizedName: 'NUOC_TUONG', quantity: 10, unit: 'ml', isOptional: true, importance: 'optional' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Thái mỏng thịt bò, ướp với tỏi băm, nước tương và tiêu.', estimatedMinutes: 8 },
      { stepNumber: 2, instruction: 'Chần rau muống 30 giây rồi vớt ra để giữ màu xanh.', estimatedMinutes: 2 },
      { stepNumber: 3, instruction: 'Xào bò lửa lớn 2-3 phút, cho rau muống vào đảo nhanh.', estimatedMinutes: 5 },
      { stepNumber: 4, instruction: 'Nêm lại vừa ăn và tắt bếp ngay để rau không bị mềm.', estimatedMinutes: 2 }
    ],
    createdAt: today
  },
  {
    id: 'rec-egg-fried-rice',
    name: 'Cơm chiên trứng',
    description: 'Tận dụng cơm nguội và trứng để có món no bụng, nhanh, dễ biến tấu với rau củ còn dư.',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Asian',
    category: 'Món ăn nhanh',
    dietaryTags: ['Quick Meal', 'Budget Meal', 'Asian'],
    difficulty: 'Easy',
    preparationTime: 5,
    cookingTime: 10,
    totalTime: 15,
    calories: 460,
    proteinGrams: 18,
    carbGrams: 68,
    fatGrams: 14,
    nutritionNotes: 'Cơm cung cấp năng lượng chính, trứng bổ sung đạm; thêm rau củ giúp cân bằng chất xơ.',
    servings: 2,
    rating: 4.6,
    reviewCount: 52,
    popularityScore: 90,
    ingredients: [
      { ingredientId: 'ing-rice', name: 'Cơm nguội', normalizedName: 'COM_NGUOI', quantity: 2, unit: 'chén', importance: 'primary' },
      { ingredientId: 'ing-egg', name: 'Trứng gà', normalizedName: 'TRUNG_GA', quantity: 2, unit: 'quả', importance: 'primary' },
      { ingredientId: 'ing-carrot', name: 'Cà rốt', normalizedName: 'CA_ROT', quantity: 0.5, unit: 'củ', isOptional: true, importance: 'optional' },
      { ingredientId: 'ing-scallion', name: 'Hành lá', normalizedName: 'HANH_LA', quantity: 2, unit: 'nhánh', importance: 'secondary' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Đánh trứng, cắt nhỏ hành lá và cà rốt nếu dùng.', estimatedMinutes: 5 },
      { stepNumber: 2, instruction: 'Xào trứng vừa chín tới, cho cơm nguội vào đảo tơi.', estimatedMinutes: 5 },
      { stepNumber: 3, instruction: 'Nêm nước tương hoặc muối, đảo thêm 3-4 phút đến khi hạt cơm săn.', estimatedMinutes: 5 }
    ],
    createdAt: today
  },
  {
    id: 'rec-tofu-mushroom',
    name: 'Đậu hũ kho nấm',
    description: 'Món chay đậm đà, mềm thơm, phù hợp người ăn chay hoặc muốn bữa nhẹ ít dầu mỡ.',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Vietnamese',
    category: 'Món kho',
    dietaryTags: ['Vietnamese', 'Vegetarian', 'Healthy', 'Budget Meal'],
    difficulty: 'Easy',
    preparationTime: 8,
    cookingTime: 15,
    totalTime: 23,
    calories: 330,
    proteinGrams: 20,
    carbGrams: 18,
    fatGrams: 20,
    nutritionNotes: 'Đậu hũ cung cấp đạm thực vật, nấm tăng umami và chất xơ, phù hợp bữa chay cân bằng.',
    servings: 2,
    rating: 4.7,
    reviewCount: 24,
    popularityScore: 78,
    ingredients: [
      { ingredientId: 'ing-tofu', name: 'Đậu hũ', normalizedName: 'DAU_HU', quantity: 2, unit: 'miếng', importance: 'primary' },
      { ingredientId: 'ing-mushroom', name: 'Nấm rơm', normalizedName: 'NAM_ROM', quantity: 150, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-soy-sauce', name: 'Nước tương', normalizedName: 'NUOC_TUONG', quantity: 20, unit: 'ml', importance: 'secondary' },
      { ingredientId: 'ing-sugar', name: 'Đường', normalizedName: 'DUONG', quantity: 5, unit: 'g', isOptional: true, importance: 'optional' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Cắt đậu hũ miếng vừa ăn, nấm rửa sạch và cắt đôi.', estimatedMinutes: 6 },
      { stepNumber: 2, instruction: 'Áp chảo đậu hũ cho vàng nhẹ hai mặt.', estimatedMinutes: 6 },
      { stepNumber: 3, instruction: 'Cho nấm, nước tương và 80 ml nước vào kho lửa nhỏ.', estimatedMinutes: 10 },
      { stepNumber: 4, instruction: 'Kho đến khi nước sánh lại, rắc tiêu và dùng với cơm nóng.', estimatedMinutes: 3 }
    ],
    createdAt: today
  },
  {
    id: 'rec-bitter-melon-soup',
    name: 'Canh khổ qua nhồi thịt',
    description: 'Món canh thanh mát, có vị đắng nhẹ đặc trưng, hợp bữa cơm gia đình.',
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Vietnamese',
    category: 'Canh / Súp',
    dietaryTags: ['Vietnamese', 'Healthy'],
    difficulty: 'Hard',
    preparationTime: 18,
    cookingTime: 25,
    totalTime: 43,
    calories: 360,
    proteinGrams: 27,
    carbGrams: 16,
    fatGrams: 21,
    nutritionNotes: 'Khổ qua giàu chất xơ, phần thịt nhồi cung cấp protein giúp món canh no lâu hơn.',
    servings: 3,
    rating: 4.5,
    reviewCount: 19,
    popularityScore: 72,
    ingredients: [
      { ingredientId: 'ing-bitter-melon', name: 'Khổ qua', normalizedName: 'KHO_QUA', quantity: 2, unit: 'quả', importance: 'primary' },
      { ingredientId: 'ing-minced-pork', name: 'Thịt heo xay', normalizedName: 'THIT_HEO_XAY', quantity: 250, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-scallion', name: 'Hành lá', normalizedName: 'HANH_LA', quantity: 2, unit: 'nhánh', importance: 'secondary' },
      { ingredientId: 'ing-pepper', name: 'Tiêu', normalizedName: 'TIEU', quantity: 2, unit: 'g', isOptional: true, importance: 'optional' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Bổ khổ qua, bỏ ruột, ngâm nước muối loãng 10 phút để giảm đắng.', estimatedMinutes: 12 },
      { stepNumber: 2, instruction: 'Trộn thịt heo xay với hành lá, tiêu và một ít nước mắm.', estimatedMinutes: 6 },
      { stepNumber: 3, instruction: 'Nhồi thịt vào khổ qua, nấu trong nước sôi lửa vừa 20-25 phút.', estimatedMinutes: 25 }
    ],
    createdAt: today
  },
  {
    id: 'rec-pumpkin-soup',
    name: 'Canh bí đỏ thịt băm',
    description: 'Món canh ngọt dịu, mềm dễ ăn, phù hợp bữa cơm nhẹ và người cần bổ sung năng lượng lành mạnh.',
    image: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Vietnamese',
    category: 'Canh / Súp',
    dietaryTags: ['Vietnamese', 'Healthy'],
    difficulty: 'Easy',
    preparationTime: 8,
    cookingTime: 18,
    totalTime: 26,
    calories: 290,
    proteinGrams: 19,
    carbGrams: 25,
    fatGrams: 13,
    nutritionNotes: 'Bí đỏ giàu beta-carotene và carb phức hợp, thịt băm bổ sung đạm để món canh cân bằng hơn.',
    servings: 3,
    rating: 4.6,
    reviewCount: 22,
    popularityScore: 75,
    ingredients: [
      { ingredientId: 'ing-pumpkin', name: 'Bí đỏ', normalizedName: 'BI_DO', quantity: 300, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-minced-pork', name: 'Thịt heo xay', normalizedName: 'THIT_HEO_XAY', quantity: 150, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-scallion', name: 'Hành lá', normalizedName: 'HANH_LA', quantity: 2, unit: 'nhánh', importance: 'secondary' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Gọt bí đỏ, cắt miếng 2 cm; ướp thịt băm với muối và tiêu.', estimatedMinutes: 8 },
      { stepNumber: 2, instruction: 'Phi thơm hành, xào thịt băm đến khi săn.', estimatedMinutes: 4 },
      { stepNumber: 3, instruction: 'Thêm 700 ml nước và bí đỏ, nấu 15 phút đến khi bí mềm.', estimatedMinutes: 15 },
      { stepNumber: 4, instruction: 'Nêm lại, rắc hành lá rồi tắt bếp.', estimatedMinutes: 2 }
    ],
    createdAt: today
  },
  {
    id: 'rec-shrimp-cucumber-salad',
    name: 'Salad tôm dưa leo',
    description: 'Món tươi nhẹ, giàu protein, hợp bữa tối ít tinh bột hoặc thực đơn eat clean.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Fusion',
    category: 'Salad / Khai vị',
    dietaryTags: ['Healthy', 'Low Carb', 'High Protein'],
    difficulty: 'Easy',
    preparationTime: 12,
    cookingTime: 5,
    totalTime: 17,
    calories: 240,
    proteinGrams: 28,
    carbGrams: 12,
    fatGrams: 9,
    nutritionNotes: 'Tôm giàu đạm nạc, dưa leo nhiều nước và ít năng lượng, phù hợp mục tiêu giảm calo.',
    servings: 2,
    rating: 4.5,
    reviewCount: 16,
    popularityScore: 70,
    ingredients: [
      { ingredientId: 'ing-shrimp', name: 'Tôm', normalizedName: 'TOM', quantity: 200, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-cucumber', name: 'Dưa leo', normalizedName: 'DUA_LEO', quantity: 2, unit: 'quả', importance: 'primary' },
      { ingredientId: 'ing-lettuce', name: 'Xà lách', normalizedName: 'XA_LACH', quantity: 100, unit: 'g', importance: 'secondary' },
      { ingredientId: 'ing-lemon', name: 'Chanh', normalizedName: 'CHANH', quantity: 1, unit: 'quả', importance: 'secondary' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Luộc tôm 3-4 phút, bóc vỏ và để nguội.', estimatedMinutes: 5 },
      { stepNumber: 2, instruction: 'Cắt dưa leo lát mỏng, rửa xà lách và để ráo.', estimatedMinutes: 7 },
      { stepNumber: 3, instruction: 'Trộn tôm, rau và nước cốt chanh; nêm muối tiêu vừa ăn.', estimatedMinutes: 5 }
    ],
    createdAt: today
  },
  {
    id: 'rec-fish-ginger',
    name: 'Cá hấp gừng',
    description: 'Món cá mềm ngọt, ít dầu, thơm mùi gừng, phù hợp bữa ăn lành mạnh.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Asian',
    category: 'Món chính',
    dietaryTags: ['Healthy', 'High Protein', 'Low Carb', 'Asian'],
    difficulty: 'Medium',
    preparationTime: 10,
    cookingTime: 15,
    totalTime: 25,
    calories: 300,
    proteinGrams: 35,
    carbGrams: 6,
    fatGrams: 14,
    nutritionNotes: 'Hấp giúp hạn chế dầu, cá cung cấp đạm dễ tiêu và chất béo tốt.',
    servings: 2,
    rating: 4.7,
    reviewCount: 21,
    popularityScore: 76,
    ingredients: [
      { ingredientId: 'ing-fish', name: 'Cá phi lê', normalizedName: 'CA_PHI_LE', quantity: 300, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-ginger', name: 'Gừng', normalizedName: 'GUNG', quantity: 15, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-scallion', name: 'Hành lá', normalizedName: 'HANH_LA', quantity: 2, unit: 'nhánh', importance: 'secondary' },
      { ingredientId: 'ing-soy-sauce', name: 'Nước tương', normalizedName: 'NUOC_TUONG', quantity: 15, unit: 'ml', importance: 'secondary' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Thấm khô cá, xếp gừng thái sợi lên mặt cá.', estimatedMinutes: 5 },
      { stepNumber: 2, instruction: 'Hấp cá 12-15 phút tùy độ dày miếng cá.', estimatedMinutes: 15 },
      { stepNumber: 3, instruction: 'Rưới nước tương, rắc hành lá và dùng nóng.', estimatedMinutes: 3 }
    ],
    createdAt: today
  },
  {
    id: 'rec-chicken-potato',
    name: 'Gà kho khoai tây cà rốt',
    description: 'Món kho mềm thơm, đủ đạm và tinh bột, phù hợp bữa chính gia đình.',
    image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Vietnamese',
    category: 'Món kho',
    dietaryTags: ['Vietnamese'],
    difficulty: 'Medium',
    preparationTime: 12,
    cookingTime: 28,
    totalTime: 40,
    calories: 520,
    proteinGrams: 38,
    carbGrams: 42,
    fatGrams: 22,
    nutritionNotes: 'Gà cung cấp protein, khoai tây và cà rốt bổ sung carb cùng vi chất cho bữa chính đầy đủ.',
    servings: 3,
    rating: 4.6,
    reviewCount: 18,
    popularityScore: 74,
    ingredients: [
      { ingredientId: 'ing-chicken-breast', name: 'Ức gà', normalizedName: 'UC_GA', quantity: 350, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-potato', name: 'Khoai tây', normalizedName: 'KHOAI_TAY', quantity: 2, unit: 'củ', importance: 'primary' },
      { ingredientId: 'ing-carrot', name: 'Cà rốt', normalizedName: 'CA_ROT', quantity: 1, unit: 'củ', importance: 'secondary' },
      { ingredientId: 'ing-garlic', name: 'Tỏi', normalizedName: 'TOI', quantity: 3, unit: 'tép', importance: 'secondary' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Cắt gà, khoai tây và cà rốt thành miếng vừa ăn.', estimatedMinutes: 10 },
      { stepNumber: 2, instruction: 'Ướp gà với nước mắm, tỏi, tiêu trong 10 phút.', estimatedMinutes: 10 },
      { stepNumber: 3, instruction: 'Xào săn gà, thêm khoai tây, cà rốt và 300 ml nước.', estimatedMinutes: 8 },
      { stepNumber: 4, instruction: 'Kho lửa vừa 20 phút đến khi khoai mềm và nước sánh.', estimatedMinutes: 20 }
    ],
    createdAt: today
  },
  {
    id: 'rec-oat-milk',
    name: 'Yến mạch sữa trứng',
    description: 'Bữa sáng mềm thơm, giàu năng lượng vừa phải, chuẩn bị nhanh và dễ định lượng.',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=900&auto=format&fit=crop&q=80',
    cuisine: 'Western',
    category: 'Món ăn nhanh',
    dietaryTags: ['Healthy', 'Quick Meal', 'High Protein'],
    difficulty: 'Easy',
    preparationTime: 3,
    cookingTime: 7,
    totalTime: 10,
    calories: 380,
    proteinGrams: 22,
    carbGrams: 45,
    fatGrams: 12,
    nutritionNotes: 'Yến mạch cung cấp carb hấp thu chậm, sữa và trứng bổ sung đạm cho bữa sáng no lâu.',
    servings: 1,
    rating: 4.4,
    reviewCount: 12,
    popularityScore: 68,
    ingredients: [
      { ingredientId: 'ing-oat', name: 'Yến mạch', normalizedName: 'YEN_MACH', quantity: 50, unit: 'g', importance: 'primary' },
      { ingredientId: 'ing-milk', name: 'Sữa tươi', normalizedName: 'SUA_TUOI', quantity: 200, unit: 'ml', importance: 'primary' },
      { ingredientId: 'ing-egg', name: 'Trứng gà', normalizedName: 'TRUNG_GA', quantity: 1, unit: 'quả', importance: 'secondary' }
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Đun sữa lửa nhỏ, cho yến mạch vào khuấy đều.', estimatedMinutes: 3 },
      { stepNumber: 2, instruction: 'Khi yến mạch mềm, hạ lửa và cho trứng đã đánh tan vào khuấy nhanh.', estimatedMinutes: 3 },
      { stepNumber: 3, instruction: 'Nấu thêm 1 phút đến khi hỗn hợp sánh, dùng nóng.', estimatedMinutes: 1 }
    ],
    createdAt: today
  }
];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'user-demo-01',
    email: 'user@gmail.com',
    password: 'user123',
    name: 'User',
    role: 'user',
    preferences: {
      dietaryTypes: ['Vietnamese', 'Healthy'],
      preferredCuisine: ['Vietnamese'],
      maxCookingTime: 30,
      preferredDifficulty: 'Any',
      spiceLevel: 'Mild',
      allergies: []
    },
    createdAt: today
  },
  {
    id: 'admin-demo-01',
    email: 'admin@gmail.com',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
    preferences: {
      dietaryTypes: ['Vietnamese'],
      preferredCuisine: ['Vietnamese'],
      maxCookingTime: 30,
      preferredDifficulty: 'Any',
      spiceLevel: 'Mild',
      allergies: []
    },
    createdAt: today
  }
];

export const INITIAL_TEST_CASES: TestCaseResult[] = [
  {
    id: 'TC-01',
    name: 'Ức gà & Cà chua',
    description: 'Gợi ý món giàu protein khi có ức gà và cà chua',
    inputIngredients: ['Ức gà', 'Cà chua', 'Tỏi'],
    expectedOutcome: 'Ức gà áp chảo sốt cà chua',
    actualTopResult: '',
    passed: false
  },
  {
    id: 'TC-02',
    name: 'Trứng & Hành lá',
    description: 'Gợi ý món nhanh khi có trứng và hành lá',
    inputIngredients: ['Trứng gà', 'Hành lá'],
    expectedOutcome: 'Trứng chiên hành lá',
    actualTopResult: '',
    passed: false
  },
  {
    id: 'TC-03',
    name: 'Thịt bò & Rau muống',
    description: 'Gợi ý món xào từ thịt bò, rau muống và tỏi',
    inputIngredients: ['Thịt bò', 'Rau muống', 'Tỏi'],
    expectedOutcome: 'Thịt bò xào rau muống tỏi',
    actualTopResult: '',
    passed: false
  },
  {
    id: 'TC-04',
    name: 'Cơm nguội & Trứng',
    description: 'Gợi ý món tận dụng cơm nguội và trứng',
    inputIngredients: ['Cơm nguội', 'Trứng gà'],
    expectedOutcome: 'Cơm chiên trứng',
    actualTopResult: '',
    passed: false
  },
  {
    id: 'TC-05',
    name: 'Đậu hũ & Nấm',
    description: 'Gợi ý món chay từ đậu hũ và nấm',
    inputIngredients: ['Đậu hũ', 'Nấm rơm'],
    filterConditions: { dietaryTypes: ['Vegetarian'] },
    expectedOutcome: 'Đậu hũ kho nấm',
    actualTopResult: '',
    passed: false
  },
  {
    id: 'TC-06',
    name: 'Tôm & Dưa leo',
    description: 'Gợi ý món ít tinh bột, giàu đạm',
    inputIngredients: ['Tôm', 'Dưa leo', 'Chanh'],
    filterConditions: { dietaryTypes: ['Low Carb', 'High Protein'] },
    expectedOutcome: 'Salad tôm dưa leo',
    actualTopResult: '',
    passed: false
  }
];
