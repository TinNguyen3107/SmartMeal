export type SeedNutrition = {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type SeedIngredient = {
  name: string;
  normalizedName: string;
  category: string;
  categoryNameVi: string;
  defaultUnit: string;
  aliases: string[];
  nutrition?: SeedNutrition;
};

const nutrition = (caloriesPer100g: number, proteinPer100g: number, carbsPer100g: number, fatPer100g: number): SeedNutrition => ({
  caloriesPer100g,
  proteinPer100g,
  carbsPer100g,
  fatPer100g
});

// Baseline catalogue for common Vietnamese household ingredients. Values are
// per 100 g edible portion and remain editable by administrators in the app.
export const additionalSeedIngredients: SeedIngredient[] = [
  { name: 'Đùi gà', normalizedName: 'chicken-thigh', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['đùi gà', 'dui ga', 'chicken thigh'], nutrition: nutrition(209, 26, 0, 11) },
  { name: 'Thịt bò', normalizedName: 'beef', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['thịt bò', 'thit bo', 'bò', 'bo', 'beef'], nutrition: nutrition(250, 26, 0, 15) },
  { name: 'Thịt bò xay', normalizedName: 'ground-beef', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['thịt bò xay', 'thit bo xay', 'bò xay', 'bo xay', 'ground beef'], nutrition: nutrition(254, 26, 0, 17) },
  { name: 'Thịt heo xay', normalizedName: 'ground-pork', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['thịt heo xay', 'thit heo xay', 'thịt lợn xay', 'ground pork'], nutrition: nutrition(263, 25, 0, 18) },
  { name: 'Thịt nạc heo', normalizedName: 'pork-loin', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['thịt nạc heo', 'thit nac heo', 'thịt thăn', 'pork loin'], nutrition: nutrition(196, 27, 0, 9) },
  { name: 'Ba chỉ heo', normalizedName: 'pork-belly', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['ba chỉ', 'ba chi', 'ba chỉ heo', 'thịt ba chỉ', 'pork belly'], nutrition: nutrition(518, 9, 0, 53) },
  { name: 'Sườn heo', normalizedName: 'pork-ribs', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['sườn', 'suon', 'sườn heo', 'pork ribs'], nutrition: nutrition(291, 24, 0, 21) },
  { name: 'Cá rô phi', normalizedName: 'tilapia', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['cá rô phi', 'ca ro phi', 'tilapia'], nutrition: nutrition(96, 20, 0, 1.7) },
  { name: 'Cá basa', normalizedName: 'basa-fish', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['cá basa', 'ca basa', 'basa'], nutrition: nutrition(90, 17, 0, 2.5) },
  { name: 'Cá thu', normalizedName: 'mackerel', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['cá thu', 'ca thu', 'mackerel'], nutrition: nutrition(205, 19, 0, 14) },
  { name: 'Cá hồi', normalizedName: 'salmon', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['cá hồi', 'ca hoi', 'salmon'], nutrition: nutrition(208, 20, 0, 13) },
  { name: 'Cá ngừ', normalizedName: 'tuna', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['cá ngừ', 'ca ngu', 'tuna'], nutrition: nutrition(132, 29, 0, 1) },
  { name: 'Cá trứng', normalizedName: 'sardine', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['cá mòi', 'ca moi', 'sardine'], nutrition: nutrition(208, 25, 0, 11) },
  { name: 'Mực', normalizedName: 'squid', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['mực', 'muc', 'squid'], nutrition: nutrition(92, 16, 3.1, 1.4) },
  { name: 'Ngao', normalizedName: 'clam', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['ngao', 'nghêu', 'ngheu', 'clam'], nutrition: nutrition(86, 15, 3.6, 1) },
  { name: 'Cua', normalizedName: 'crab', category: 'protein', categoryNameVi: 'Hải sản', defaultUnit: 'g', aliases: ['cua', 'crab'], nutrition: nutrition(97, 19, 0, 1.5) },
  { name: 'Trứng vịt', normalizedName: 'duck-egg', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'quả', aliases: ['trứng vịt', 'trung vit', 'duck egg'], nutrition: nutrition(185, 13, 1.5, 14) },
  { name: 'Trứng cút', normalizedName: 'quail-egg', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'quả', aliases: ['trứng cút', 'trung cut', 'quail egg'], nutrition: nutrition(158, 13, 0.4, 11) },
  { name: 'Lòng trắng trứng', normalizedName: 'egg-white', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'quả', aliases: ['lòng trắng trứng', 'long trang trung', 'egg white'], nutrition: nutrition(52, 11, 0.7, 0.2) },
  { name: 'Đậu đen', normalizedName: 'black-bean', category: 'protein', categoryNameVi: 'Đạm thực vật', defaultUnit: 'g', aliases: ['đậu đen', 'dau den', 'black bean'], nutrition: nutrition(132, 8.9, 23.7, 0.5) },
  { name: 'Đậu xanh', normalizedName: 'mung-bean', category: 'protein', categoryNameVi: 'Đạm thực vật', defaultUnit: 'g', aliases: ['đậu xanh', 'dau xanh', 'mung bean'], nutrition: nutrition(105, 7, 19.2, 0.4) },
  { name: 'Đậu đỏ', normalizedName: 'kidney-bean', category: 'protein', categoryNameVi: 'Đạm thực vật', defaultUnit: 'g', aliases: ['đậu đỏ', 'dau do', 'red bean', 'kidney bean'], nutrition: nutrition(127, 8.7, 22.8, 0.5) },
  { name: 'Chả cá', normalizedName: 'fish-cake', category: 'protein', categoryNameVi: 'Đạm', defaultUnit: 'g', aliases: ['chả cá', 'cha ca', 'fish cake'], nutrition: nutrition(130, 15, 7, 4) },

  { name: 'Cải thìa', normalizedName: 'bok-choy', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['cải thìa', 'cai thia', 'bok choy', 'pak choi'], nutrition: nutrition(13, 1.5, 2.2, 0.2) },
  { name: 'Cải ngọt', normalizedName: 'choy-sum', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['cải ngọt', 'cai ngot', 'choy sum'], nutrition: nutrition(13, 1.5, 2.2, 0.2) },
  { name: 'Cải xanh', normalizedName: 'mustard-greens', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['cải xanh', 'cai xanh', 'mustard greens'], nutrition: nutrition(27, 2.9, 4.7, 0.4) },
  { name: 'Cải thảo', normalizedName: 'napa-cabbage', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bắp', aliases: ['cải thảo', 'cai thao', 'napa cabbage'], nutrition: nutrition(16, 1.2, 3.2, 0.2) },
  { name: 'Bắp cải', normalizedName: 'cabbage', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bắp', aliases: ['bắp cải', 'bap cai', 'cải bắp', 'cai bap', 'cabbage'], nutrition: nutrition(25, 1.3, 5.8, 0.1) },
  { name: 'Xà lách', normalizedName: 'lettuce', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['xà lách', 'xa lach', 'lettuce'], nutrition: nutrition(15, 1.4, 2.9, 0.2) },
  { name: 'Rau bina', normalizedName: 'spinach', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['rau bina', 'rau bina', 'cải bó xôi', 'cai bo xoi', 'spinach'], nutrition: nutrition(23, 2.9, 3.6, 0.4) },
  { name: 'Cải xoăn', normalizedName: 'kale', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['cải xoăn', 'cai xoan', 'kale'], nutrition: nutrition(49, 4.3, 8.8, 0.9) },
  { name: 'Rau dền', normalizedName: 'amaranth-greens', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['rau dền', 'rau den', 'amaranth'], nutrition: nutrition(23, 2.5, 4, 0.3) },
  { name: 'Mồng tơi', normalizedName: 'malabar-spinach', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['mồng tơi', 'mong toi', 'malabar spinach'], nutrition: nutrition(19, 1.8, 3.4, 0.3) },
  { name: 'Rau cần', normalizedName: 'celery', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'bó', aliases: ['rau cần', 'rau can', 'cần tây', 'can tay', 'celery'], nutrition: nutrition(16, 0.7, 3, 0.2) },
  { name: 'Giá đỗ', normalizedName: 'bean-sprouts', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', aliases: ['giá', 'gia', 'giá đỗ', 'gia do', 'bean sprouts'], nutrition: nutrition(30, 3, 5.9, 0.2) },
  { name: 'Đậu que', normalizedName: 'green-beans', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', aliases: ['đậu que', 'dau que', 'đậu cô ve', 'green beans'], nutrition: nutrition(31, 1.8, 7, 0.2) },
  { name: 'Đậu bắp', normalizedName: 'okra', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'g', aliases: ['đậu bắp', 'dau bap', 'okra'], nutrition: nutrition(33, 1.9, 7.5, 0.2) },
  { name: 'Cà tím', normalizedName: 'eggplant', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', aliases: ['cà tím', 'ca tim', 'eggplant'], nutrition: nutrition(25, 1, 6, 0.2) },
  { name: 'Ớt chuông', normalizedName: 'bell-pepper', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', aliases: ['ớt chuông', 'ot chuong', 'bell pepper', 'ớt ngọt'], nutrition: nutrition(31, 1, 6, 0.3) },
  { name: 'Ớt', normalizedName: 'chili', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', aliases: ['ớt', 'ot', 'chili', 'chilli'], nutrition: nutrition(40, 1.9, 8.8, 0.4) },
  { name: 'Cà rốt', normalizedName: 'carrot', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'củ', aliases: ['cà rốt', 'ca rot', 'carrot'], nutrition: nutrition(41, 0.9, 9.6, 0.2) },
  { name: 'Củ cải trắng', normalizedName: 'daikon', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'củ', aliases: ['củ cải', 'cu cai', 'củ cải trắng', 'daikon'], nutrition: nutrition(18, 0.6, 4.1, 0.1) },
  { name: 'Khoai tây', normalizedName: 'potato', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'củ', aliases: ['khoai tây', 'khoai tay', 'potato'], nutrition: nutrition(77, 2, 17, 0.1) },
  { name: 'Bí đỏ', normalizedName: 'pumpkin', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'miếng', aliases: ['bí đỏ', 'bi do', 'pumpkin'], nutrition: nutrition(26, 1, 6.5, 0.1) },
  { name: 'Bí xanh', normalizedName: 'winter-melon', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'miếng', aliases: ['bí xanh', 'bi xanh', 'bí đao', 'bi dao', 'winter melon'], nutrition: nutrition(13, 0.4, 3, 0.2) },
  { name: 'Mướp', normalizedName: 'loofah', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', aliases: ['mướp', 'muop', 'loofah'], nutrition: nutrition(20, 1.2, 4.3, 0.2) },
  { name: 'Khổ qua', normalizedName: 'bitter-melon', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', aliases: ['khổ qua', 'kho qua', 'mướp đắng', 'muop dang', 'bitter melon'], nutrition: nutrition(17, 1, 3.7, 0.2) },
  { name: 'Bắp', normalizedName: 'corn', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'trái', aliases: ['bắp', 'bap', 'ngô', 'ngo', 'corn'], nutrition: nutrition(86, 3.4, 19, 1.2) },
  { name: 'Su su', normalizedName: 'chayote', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', aliases: ['su su', 'chayote'], nutrition: nutrition(19, 0.8, 4.5, 0.1) },
  { name: 'Cà chua bi', normalizedName: 'cherry-tomato', category: 'vegetable', categoryNameVi: 'Rau củ', defaultUnit: 'quả', aliases: ['cà chua bi', 'ca chua bi', 'cherry tomato'], nutrition: nutrition(18, 0.9, 3.9, 0.2) },

  { name: 'Bún tươi', normalizedName: 'rice-vermicelli', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'g', aliases: ['bún', 'bun', 'bún tươi', 'bun tuoi', 'rice vermicelli'], nutrition: nutrition(109, 1.8, 24, 0.2) },
  { name: 'Phở', normalizedName: 'pho-noodles', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'g', aliases: ['phở', 'pho', 'bánh phở', 'banh pho', 'pho noodles'], nutrition: nutrition(109, 1.8, 24, 0.2) },
  { name: 'Mì gói', normalizedName: 'instant-noodles', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'gói', aliases: ['mì', 'mi', 'mì gói', 'mi goi', 'instant noodles'], nutrition: nutrition(452, 9, 63, 18) },
  { name: 'Mì Ý', normalizedName: 'pasta', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'g', aliases: ['mì ý', 'mi y', 'pasta', 'spaghetti'], nutrition: nutrition(158, 5.8, 31, 0.9) },
  { name: 'Yến mạch', normalizedName: 'oats', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'g', aliases: ['yến mạch', 'yen mach', 'oats', 'oatmeal'], nutrition: nutrition(389, 17, 66, 7) },
  { name: 'Bánh mì', normalizedName: 'bread', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'lát', aliases: ['bánh mì', 'banh mi', 'bread'], nutrition: nutrition(265, 9, 49, 3.2) },
  { name: 'Gạo lứt', normalizedName: 'brown-rice', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'chén', aliases: ['gạo lứt', 'gao lut', 'cơm gạo lứt', 'brown rice'], nutrition: nutrition(123, 2.7, 25.6, 1) },
  { name: 'Hạt quinoa', normalizedName: 'quinoa', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'g', aliases: ['quinoa', 'hạt quinoa', 'hat quinoa'], nutrition: nutrition(120, 4.4, 21.3, 1.9) },
  { name: 'Khoai mì', normalizedName: 'cassava', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'củ', aliases: ['khoai mì', 'khoai mi', 'sắn', 'san', 'cassava'], nutrition: nutrition(160, 1.4, 38, 0.3) },
  { name: 'Miến', normalizedName: 'glass-noodles', category: 'carb', categoryNameVi: 'Tinh bột', defaultUnit: 'g', aliases: ['miến', 'mien', 'miến dong', 'glass noodles'], nutrition: nutrition(351, 0.2, 87, 0.1) },

  { name: 'Chuối', normalizedName: 'banana', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'quả', aliases: ['chuối', 'chuoi', 'banana'], nutrition: nutrition(89, 1.1, 23, 0.3) },
  { name: 'Táo', normalizedName: 'apple', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'quả', aliases: ['táo', 'tao', 'apple'], nutrition: nutrition(52, 0.3, 14, 0.2) },
  { name: 'Cam', normalizedName: 'orange', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'quả', aliases: ['cam', 'orange'], nutrition: nutrition(47, 0.9, 12, 0.1) },
  { name: 'Bơ', normalizedName: 'avocado', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'quả', aliases: ['bơ', 'bo', 'avocado'], nutrition: nutrition(160, 2, 8.5, 14.7) },
  { name: 'Xoài', normalizedName: 'mango', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'quả', aliases: ['xoài', 'xoai', 'mango'], nutrition: nutrition(60, 0.8, 15, 0.4) },
  { name: 'Dứa', normalizedName: 'pineapple', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'miếng', aliases: ['dứa', 'dua', 'thơm', 'thom', 'pineapple'], nutrition: nutrition(50, 0.5, 13, 0.1) },
  { name: 'Dưa hấu', normalizedName: 'watermelon', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'miếng', aliases: ['dưa hấu', 'dua hau', 'watermelon'], nutrition: nutrition(30, 0.6, 7.6, 0.2) },
  { name: 'Nho', normalizedName: 'grape', category: 'fruit', categoryNameVi: 'Trái cây', defaultUnit: 'chùm', aliases: ['nho', 'grape', 'grapes'], nutrition: nutrition(69, 0.7, 18, 0.2) },

  { name: 'Sữa tươi không đường', normalizedName: 'milk', category: 'dairy', categoryNameVi: 'Sữa', defaultUnit: 'ml', aliases: ['sữa tươi', 'sua tuoi', 'sữa', 'sua', 'milk'], nutrition: nutrition(61, 3.2, 4.8, 3.3) },
  { name: 'Sữa chua không đường', normalizedName: 'yogurt', category: 'dairy', categoryNameVi: 'Sữa', defaultUnit: 'hộp', aliases: ['sữa chua', 'sua chua', 'yogurt'], nutrition: nutrition(61, 3.5, 4.7, 3.3) },
  { name: 'Sữa chua Hy Lạp', normalizedName: 'greek-yogurt', category: 'dairy', categoryNameVi: 'Sữa', defaultUnit: 'hộp', aliases: ['sữa chua hy lạp', 'sua chua hy lap', 'greek yogurt'], nutrition: nutrition(97, 9, 3.9, 5) },
  { name: 'Phô mai', normalizedName: 'cheese', category: 'dairy', categoryNameVi: 'Sữa', defaultUnit: 'lát', aliases: ['phô mai', 'pho mai', 'cheese'], nutrition: nutrition(402, 25, 1.3, 33) },
  { name: 'Dầu ăn', normalizedName: 'cooking-oil', category: 'fat', categoryNameVi: 'Chất béo', defaultUnit: 'muỗng canh', aliases: ['dầu ăn', 'dau an', 'dầu', 'dau', 'cooking oil'], nutrition: nutrition(884, 0, 0, 100) },
  { name: 'Dầu ô liu', normalizedName: 'olive-oil', category: 'fat', categoryNameVi: 'Chất béo', defaultUnit: 'muỗng canh', aliases: ['dầu ô liu', 'dau o liu', 'olive oil'], nutrition: nutrition(884, 0, 0, 100) },
  { name: 'Bơ lạt', normalizedName: 'butter', category: 'fat', categoryNameVi: 'Chất béo', defaultUnit: 'g', aliases: ['bơ lạt', 'bo lat', 'butter'], nutrition: nutrition(717, 0.9, 0.1, 81) },

  { name: 'Muối', normalizedName: 'salt', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'muỗng cà phê', aliases: ['muối', 'muoi', 'salt'], nutrition: nutrition(0, 0, 0, 0) },
  { name: 'Tiêu', normalizedName: 'black-pepper', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'muỗng cà phê', aliases: ['tiêu', 'tieu', 'hạt tiêu', 'hat tieu', 'black pepper'], nutrition: nutrition(251, 10, 64, 3.3) },
  { name: 'Đường', normalizedName: 'sugar', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'muỗng cà phê', aliases: ['đường', 'duong', 'sugar'], nutrition: nutrition(387, 0, 100, 0) },
  { name: 'Hành tím', normalizedName: 'shallot', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'củ', aliases: ['hành tím', 'hanh tim', 'shallot'], nutrition: nutrition(72, 2.5, 16.8, 0.1) },
  { name: 'Gừng', normalizedName: 'ginger', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'củ', aliases: ['gừng', 'gung', 'ginger'], nutrition: nutrition(80, 1.8, 18, 0.8) },
  { name: 'Sả', normalizedName: 'lemongrass', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'cây', aliases: ['sả', 'sa', 'lemongrass'], nutrition: nutrition(99, 1.8, 25, 0.5) },
  { name: 'Nghệ', normalizedName: 'turmeric', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'củ', aliases: ['nghệ', 'nghe', 'turmeric'], nutrition: nutrition(312, 9.7, 67, 3.3) },
  { name: 'Rau mùi', normalizedName: 'cilantro', category: 'seasoning', categoryNameVi: 'Rau gia vị', defaultUnit: 'bó', aliases: ['rau mùi', 'rau mui', 'ngò rí', 'ngo ri', 'cilantro', 'coriander'], nutrition: nutrition(23, 2.1, 3.7, 0.5) },
  { name: 'Thì là', normalizedName: 'dill', category: 'seasoning', categoryNameVi: 'Rau gia vị', defaultUnit: 'bó', aliases: ['thì là', 'thi la', 'dill'], nutrition: nutrition(43, 3.5, 7, 1.1) },
  { name: 'Húng quế', normalizedName: 'basil', category: 'seasoning', categoryNameVi: 'Rau gia vị', defaultUnit: 'bó', aliases: ['húng quế', 'hung que', 'basil'], nutrition: nutrition(23, 3.2, 2.7, 0.6) },
  { name: 'Nước tương', normalizedName: 'soy-sauce', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'ml', aliases: ['nước tương', 'nuoc tuong', 'xì dầu', 'xi dau', 'soy sauce'], nutrition: nutrition(53, 8.1, 4.9, 0.6) },
  { name: 'Dầu hào', normalizedName: 'oyster-sauce', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'ml', aliases: ['dầu hào', 'dau hao', 'oyster sauce'], nutrition: nutrition(51, 1.4, 11, 0.2) },
  { name: 'Tương ớt', normalizedName: 'chili-sauce', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'ml', aliases: ['tương ớt', 'tuong ot', 'chili sauce'], nutrition: nutrition(106, 1.2, 25, 0.5) },
  { name: 'Giấm gạo', normalizedName: 'rice-vinegar', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'ml', aliases: ['giấm', 'giam', 'giấm gạo', 'rice vinegar'], nutrition: nutrition(18, 0, 0.1, 0) },
  { name: 'Chanh', normalizedName: 'lime', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'quả', aliases: ['chanh', 'lime'], nutrition: nutrition(30, 0.7, 10.5, 0.2) },
  { name: 'Nước cốt dừa', normalizedName: 'coconut-milk', category: 'seasoning', categoryNameVi: 'Gia vị', defaultUnit: 'ml', aliases: ['nước cốt dừa', 'nuoc cot dua', 'coconut milk'], nutrition: nutrition(230, 2.3, 5.5, 24) },
  { name: 'Đậu phộng', normalizedName: 'peanut', category: 'fat', categoryNameVi: 'Hạt', defaultUnit: 'g', aliases: ['đậu phộng', 'dau phong', 'lạc', 'lac', 'peanut'], nutrition: nutrition(567, 25.8, 16.1, 49.2) },
  { name: 'Mè', normalizedName: 'sesame', category: 'fat', categoryNameVi: 'Hạt', defaultUnit: 'muỗng canh', aliases: ['mè', 'me', 'vừng', 'vung', 'sesame'], nutrition: nutrition(573, 17.7, 23.4, 49.7) },
  { name: 'Dầu mè', normalizedName: 'sesame-oil', category: 'fat', categoryNameVi: 'Chất béo', defaultUnit: 'muỗng cà phê', aliases: ['dầu mè', 'dau me', 'sesame oil'], nutrition: nutrition(884, 0, 0, 100) }
];
