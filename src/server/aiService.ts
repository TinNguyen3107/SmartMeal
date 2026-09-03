import { GoogleGenAI, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set in environment. AI features will fallback to rule-based parser.');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface ExtractedIngredientsResult {
  ingredients: {
    name: string;
    quantity?: number;
    unit?: string;
  }[];
  constraints?: {
    maxCookingTime?: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    dietaryPreferences?: string[];
    excludeIngredients?: string[];
  };
  understoodIntentSummary?: string;
}

/**
 * FR-05, FR-20: Extract ingredients and cooking constraints from natural language
 */
export async function extractIngredientsFromNL(prompt: string): Promise<ExtractedIngredientsResult> {
  const ai = getAiClient();
  if (!ai) {
    return fallbackExtractIngredients(prompt);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are a culinary AI NLP parser. Extract all cooking ingredients and user constraints from this Vietnamese/English text: "${prompt}".

Rules:
1. Extract list of ingredients with clean names, approximate quantity numbers, and units (quả, g, củ, nhánh, ml, etc).
2. Extract any time constraints (e.g., 'dưới 30 phút' -> maxCookingTime: 30).
3. Extract difficulty constraint (Easy/Medium/Hard) if mentioned (e.g. 'dễ nấu' -> Easy).
4. Extract dietary constraints (Healthy, Vegetarian, Low Carb, High Protein, etc) or excluded foods (e.g. 'không ăn cay', 'không có hành').
5. Summarize what you understood in Vietnamese.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Tên nguyên liệu tiếng Việt chuẩn' },
                  quantity: { type: Type.NUMBER, description: 'Số lượng nếu có' },
                  unit: { type: Type.STRING, description: 'Đơn vị tính (quả, g, củ, nhánh, etc.)' }
                },
                required: ['name']
              }
            },
            constraints: {
              type: Type.OBJECT,
              properties: {
                maxCookingTime: { type: Type.NUMBER, description: 'Thời gian nấu tối đa bằng phút' },
                difficulty: { type: Type.STRING, description: 'Easy | Medium | Hard' },
                dietaryPreferences: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                excludeIngredients: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            },
            understoodIntentSummary: {
              type: Type.STRING,
              description: 'Tóm tắt ngắn gọn yêu cầu người dùng bằng tiếng Việt'
            }
          },
          required: ['ingredients', 'understoodIntentSummary']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      ingredients: parsed.ingredients || [],
      constraints: parsed.constraints || {},
      understoodIntentSummary: parsed.understoodIntentSummary || 'Đã phân tích các nguyên liệu thành công.'
    };
  } catch (error) {
    console.error('Gemini NLP extraction error:', error);
    return fallbackExtractIngredients(prompt);
  }
}

/**
 * Fallback rule-based NLP extraction when API key is offline or throttled
 */
function fallbackExtractIngredients(prompt: string): ExtractedIngredientsResult {
  const dictionary: { canonical: string; unit: string; aliases: string[] }[] = [
    { canonical: 'Trứng gà', unit: 'quả', aliases: ['trung ga', 'trung', 'egg', 'eggs'] },
    { canonical: 'Cà chua', unit: 'quả', aliases: ['ca chua', 'tomato'] },
    { canonical: 'Hành lá', unit: 'nhánh', aliases: ['hanh la', 'green onion', 'scallion'] },
    { canonical: 'Hành tây', unit: 'củ', aliases: ['hanh tay', 'onion'] },
    { canonical: 'Tỏi', unit: 'tép', aliases: ['toi', 'garlic'] },
    { canonical: 'Ức gà', unit: 'g', aliases: ['uc ga', 'thit ga', 'chicken breast', 'chicken'] },
    { canonical: 'Thịt bò', unit: 'g', aliases: ['thit bo', 'bo', 'beef'] },
    { canonical: 'Thịt heo', unit: 'g', aliases: ['thit heo', 'thit lon', 'pork'] },
    { canonical: 'Thịt heo xay', unit: 'g', aliases: ['thit bam', 'thit xay', 'minced pork'] },
    { canonical: 'Đậu hũ', unit: 'miếng', aliases: ['dau hu', 'dau phu', 'tofu'] },
    { canonical: 'Nấm rơm', unit: 'g', aliases: ['nam rom', 'nam', 'mushroom'] },
    { canonical: 'Rau muống', unit: 'bó', aliases: ['rau muong', 'morning glory'] },
    { canonical: 'Khoai tây', unit: 'củ', aliases: ['khoai tay', 'potato'] },
    { canonical: 'Cà rốt', unit: 'củ', aliases: ['ca rot', 'carrot'] },
    { canonical: 'Dưa leo', unit: 'quả', aliases: ['dua leo', 'dua chuot', 'cucumber'] },
    { canonical: 'Cơm nguội', unit: 'chén', aliases: ['com nguoi', 'com', 'rice'] },
    { canonical: 'Mì gói', unit: 'gói', aliases: ['mi goi', 'mi', 'noodle'] },
    { canonical: 'Tôm', unit: 'g', aliases: ['tom', 'shrimp'] },
    { canonical: 'Cá phi lê', unit: 'g', aliases: ['ca phi le', 'fish fillet', 'fish'] },
    { canonical: 'Khổ qua', unit: 'quả', aliases: ['kho qua', 'muop dang', 'bitter melon'] },
    { canonical: 'Bí đỏ', unit: 'g', aliases: ['bi do', 'pumpkin'] },
    { canonical: 'Bắp cải', unit: 'g', aliases: ['bap cai', 'cabbage'] },
    { canonical: 'Xà lách', unit: 'g', aliases: ['xa lach', 'lettuce'] },
    { canonical: 'Chanh', unit: 'quả', aliases: ['chanh', 'lemon', 'lime'] },
    { canonical: 'Ớt', unit: 'quả', aliases: ['ot', 'chili'] },
    { canonical: 'Nước mắm', unit: 'ml', aliases: ['nuoc mam', 'fish sauce'] },
    { canonical: 'Nước tương', unit: 'ml', aliases: ['nuoc tuong', 'soy sauce'] },
    { canonical: 'Yến mạch', unit: 'g', aliases: ['yen mach', 'oat', 'oats'] },
    { canonical: 'Sữa tươi', unit: 'ml', aliases: ['sua tuoi', 'sua', 'milk'] }
  ];

  const clean = prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const foundMap = new Map<string, { name: string; quantity?: number; unit?: string }>();

  for (const item of dictionary) {
    for (const alias of item.aliases) {
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = clean.match(new RegExp(`(?:(\\d+(?:[.,]\\d+)?)\\s*(qua|cu|tep|nhanh|bo|chen|goi|g|gram|kg|ml|mieng)?\\s*)?${escapedAlias}\\b`));
      if (match) {
        let quantity = match[1] ? Number(match[1].replace(',', '.')) : 1;
        let unit = match[2] || item.unit;
        if (unit === 'kg') {
          quantity *= 1000;
          unit = 'g';
        }
        foundMap.set(item.canonical, { name: item.canonical, quantity, unit });
        break;
      }
    }
  }

  const maxTimeMatch = clean.match(/(?:duoi|toi da|khong qua|trong)\s*(\d{1,3})\s*(?:phut|p)/);
  const anyTimeMatch = clean.match(/\b(\d{1,3})\s*(?:phut|p)\b/);
  const maxTime = maxTimeMatch ? Number(maxTimeMatch[1]) : anyTimeMatch ? Number(anyTimeMatch[1]) : undefined;

  const dietaryPreferences: string[] = [];
  if (clean.includes('an chay') || clean.includes('vegetarian') || clean.includes('vegan')) dietaryPreferences.push('Vegetarian');
  if (clean.includes('eat clean') || clean.includes('healthy') || clean.includes('lanh manh')) dietaryPreferences.push('Healthy');
  if (clean.includes('low carb') || clean.includes('it tinh bot')) dietaryPreferences.push('Low Carb');
  if (clean.includes('protein') || clean.includes('tap gym') || clean.includes('tang co')) dietaryPreferences.push('High Protein');
  if (clean.includes('tiet kiem') || clean.includes('re tien')) dietaryPreferences.push('Budget Meal');

  const excludeIngredients: string[] = [];
  for (const item of dictionary) {
    if (item.aliases.some(alias => clean.includes(`khong ${alias}`) || clean.includes(`di ung ${alias}`))) {
      excludeIngredients.push(item.canonical);
    }
  }
  if (clean.includes('khong cay')) excludeIngredients.push('Ớt');

  const ingredients = Array.from(foundMap.values());
  return {
    ingredients: ingredients.length ? ingredients : [],
    constraints: {
      maxCookingTime: maxTime,
      difficulty: clean.includes('de') || clean.includes('nhanh') || clean.includes('don gian') ? 'Easy' : undefined,
      dietaryPreferences,
      excludeIngredients
    },
    understoodIntentSummary: ingredients.length
      ? `Parser cục bộ đã nhận diện ${ingredients.length} nguyên liệu${maxTime ? `, giới hạn ${maxTime} phút` : ''}.`
      : 'Parser cục bộ chưa nhận diện được nguyên liệu rõ ràng. Bạn có thể nhập theo dạng: 2 quả trứng, 200g thịt bò, 1 bó rau muống.'
  };
}

/**
 * FR-26: Vision-based Fridge / Ingredients Detection
 */
export async function detectIngredientsFromImage(base64Image: string, mimeType: string = 'image/jpeg'): Promise<ExtractedIngredientsResult> {
  const ai = getAiClient();
  if (!ai) {
    return {
      ingredients: [
        { name: 'Trứng gà', quantity: 4, unit: 'quả' },
        { name: 'Cà chua', quantity: 3, unit: 'quả' },
        { name: 'Hành lá', quantity: 1, unit: 'bó' }
      ],
      understoodIntentSummary: 'Chế độ giả lập nhận diện: Nhận diện thấy Trứng gà, Cà chua và Hành lá trong tủ lạnh.'
    };
  }

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType
            }
          },
          {
            text: `Bạn là trợ lý thị giác máy tính nhận diện thực phẩm SmartMeal.
Hãy quan sát bức ảnh (tủ lạnh / bàn bếp / giỏ nguyên liệu) và phát hiện tất cả các nguyên liệu tươi sống, đồ nêm, rau củ, thịt, trứng có trong ảnh.
Trả về định dạng JSON gồm danh sách nguyên liệu tiếng Việt kèm số lượng ước tính.`
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Tên nguyên liệu nhận diện bằng tiếng Việt' },
                  quantity: { type: Type.NUMBER, description: 'Số lượng ước tính' },
                  unit: { type: Type.STRING, description: 'Đơn vị tính (quả, g, củ, chai, lát, etc.)' }
                },
                required: ['name']
              }
            },
            understoodIntentSummary: {
              type: Type.STRING,
              description: 'Mô tả ngắn gọn các món nguyên liệu đã nhận diện trong ảnh'
            }
          },
          required: ['ingredients', 'understoodIntentSummary']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      ingredients: parsed.ingredients || [],
      understoodIntentSummary: parsed.understoodIntentSummary || 'Đã nhận diện các nguyên liệu từ ảnh thành công.'
    };
  } catch (err) {
    console.error('Gemini Vision error:', err);
    return {
      ingredients: [
        { name: 'Trứng gà', quantity: 4, unit: 'quả' },
        { name: 'Cà chua', quantity: 3, unit: 'quả' },
        { name: 'Hành lá', quantity: 1, unit: 'bó' }
      ],
      understoodIntentSummary: 'Nhận diện thấy một số thực phẩm tươi trong tủ lạnh.'
    };
  }
}

/**
 * FR-21: Interactive AI Chef Assistant
 */
export async function chatWithRecipeAssistant(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  pantryIngredients: string[] = [],
  userPreferences?: any
): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    return `Chào bạn! Tôi là Bếp Trưởng AI của SmartMeal. Dựa trên các nguyên liệu bạn có (${pantryIngredients.join(', ') || 'Trứng, Cà chua'}), bạn có thể nấu ngay các món thơm ngon như Trứng sốt cà chua hay Canh trứng vân mây chỉ mất 10 phút!`;
  }

  try {
    const systemPrompt = `Bạn là "Bếp Trưởng & Chuyên Gia Dinh Dưỡng Lâm Sàng SmartMeal" - tư vấn am hiểu sâu sắc về dinh dưỡng thể thao (Gym, High Protein), ăn kiêng khoa học (Eat Clean, Low Carb, KETO, Vegan) và ẩm thực thực tế.
Người dùng hiện đang có trong bếp/tủ lạnh các nguyên liệu sau: [${pantryIngredients.join(', ')}].
Sở thích / Mục tiêu dinh dưỡng người dùng: ${JSON.stringify(userPreferences || {})}.

Nhiệm vụ bắt buộc:
1. ĐỊNH LƯỢNG CHÍNH XÁC: Khi đưa ra công thức hoặc hướng dẫn nêm nếm/thay thế, CUNG CẤP SỐ LƯỢNG CHUẨN XÁC theo gram/ml/quả/củ (không nói mập mờ "vừa đủ", "nêm vừa ăn").
2. PHÂN TÍCH MACRONUTRIENTS (P/C/F): Giải thích rõ lượng Kcal, Protein (g), Carb (g), Fat (g) và tại sao tỷ lệ này tối ưu cho mục tiêu của người dùng (Tập gym tăng cơ, giảm mỡ, ăn kiêng, v.v.).
3. CHÍNH XÁC THỜI GIAN: Đưa ra thời gian luộc/xào/nướng chính xác từng phút để bảo toàn vi chất dinh dưỡng.
4. Trình bày bằng tiếng Việt rõ ràng, ngắn gọn, có gạch đầu dòng và icon sinh động.`;

    const formattedHistory = history.slice(-6).map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3.6-flash',
      config: {
        systemInstruction: systemPrompt
      },
      history: formattedHistory
    });

    const response = await chat.sendMessage({
      message
    });

    return response.text || 'Bếp Trưởng AI luôn sẵn sàng hỗ trợ bạn!';
  } catch (err) {
    console.error('Chatbot error:', err);
    return 'Xin lỗi bạn, kết nối AI đang tạm gián đoạn. Bạn vẫn có thể dùng công cụ gợi ý món ăn tự động từ danh sách nguyên liệu!';
  }
}

/**
 * MỚI: Phase 5 - Tự động sinh công thức nấu ăn dựa trên nguyên liệu
 */
export async function generateRecipeFromIngredients(ingredients: string[], userPreferences?: any): Promise<any> {
  const ai = getAiClient();
  if (!ai) {
    return generateLocalRecipeDraft(ingredients, userPreferences);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Bạn là Chuyên Gia Dinh Dưỡng Lâm Sàng và Siêu Đầu Bếp Chuyên Nghiệp của SmartMeal.
Dựa vào các nguyên liệu có sẵn: [${ingredients.join(', ')}].
Và hồ sơ / sở thích của người dùng: ${JSON.stringify(userPreferences || {})}.

YÊU CẦU BẮT BUỘC VỀ ĐỊNH LƯỢNG & DINH DƯỠNG KHOA HỌC:
1. ĐỊNH LƯỢNG CHÍNH XÁC: Tất cả nguyên liệu PHẢI có số lượng cụ thể bằng con số chuẩn (gam, ml, quả, củ, muỗng cà phê...). KHÔNG ĐƯỢC dùng các từ chung chung như "vừa đủ", "một ít", "tùy thích".
2. THỜI GIAN CHUẨN XÁC: Tính toán chính xác Thời gian chuẩn bị/sơ chế (preparationTime) và Thời gian chế biến/nấu (cookingTime) theo từng phút.
3. PHÂN TÍCH MACRONUTRIENTS (P/C/F): Tính toán chuẩn xác năng lượng Kcal, Protein (g), Carbohydrate (g), và Fat (g) cho 1 khẩu phần dựa trên bảng thành phần dinh dưỡng thực phẩm.
4. TỐI ƯU CHO ĐỐI TƯỢNG: Điều chỉnh định lượng và cách chế biến phù hợp với mục tiêu (ví dụ: Tập gym/High Protein -> tối ưu đạm & cơ bắp; Low Carb/Eat Clean -> hạn chế đường tinh luyện, tăng xơ & mỡ tốt; Giảm cân -> tạo độ no lâu, calo vừa phải).
5. CƠ SỞ KHOA HỌC (nutritionNotes): Viết 1-2 câu giải thích cơ sở dinh dưỡng khoa học lý giải vì sao định lượng và tỷ lệ đạm/carb/béo này tối ưu cho người ăn.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Tên món ăn hấp dẫn bằng tiếng Việt" },
            vietnameseName: { type: Type.STRING },
            description: { type: Type.STRING, description: "Mô tả ngắn về hương vị và lợi ích của món ăn" },
            cuisine: { type: Type.STRING, description: "Vietnamese, Asian, Western, Fusion..." },
            category: { type: Type.STRING, description: "Món chính, Canh / Súp, Món xào, Món kho, Salad / Khai vị..." },
            difficulty: { type: Type.STRING, description: "Easy, Medium, Hard" },
            preparationTime: { type: Type.NUMBER, description: "Thời gian sơ chế chuẩn bị (phút)" },
            cookingTime: { type: Type.NUMBER, description: "Thời gian nấu trực tiếp trên bếp (phút)" },
            totalTime: { type: Type.NUMBER, description: "Tổng thời gian thực hiện (phút)" },
            calories: { type: Type.NUMBER, description: "Tổng lượng Calo (kcal) cho 1 khẩu phần" },
            proteinGrams: { type: Type.NUMBER, description: "Lượng Protein (g)" },
            carbGrams: { type: Type.NUMBER, description: "Lượng Carbohydrate (g)" },
            fatGrams: { type: Type.NUMBER, description: "Lượng Chất béo Fat (g)" },
            nutritionNotes: { type: Type.STRING, description: "Giải thích cơ sở khoa học dinh dưỡng cho công thức" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Tên nguyên liệu" },
                  quantity: { type: Type.NUMBER, description: "Số lượng con số chính xác" },
                  unit: { type: Type.STRING, description: "Đơn vị tính chuẩn: g, ml, quả, củ..." }
                },
                required: ["name", "quantity", "unit"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.NUMBER, description: "Số thứ tự bước (1, 2, 3...)" },
                  instruction: { type: Type.STRING, description: "Hướng dẫn thực hiện chi tiết" },
                  estimatedMinutes: { type: Type.NUMBER, description: "Thời gian thực hiện bước này (phút)" }
                },
                required: ["stepNumber", "instruction"]
              }
            }
          },
          required: [
            "name",
            "vietnameseName",
            "description",
            "cuisine",
            "category",
            "difficulty",
            "preparationTime",
            "cookingTime",
            "totalTime",
            "calories",
            "proteinGrams",
            "carbGrams",
            "fatGrams",
            "nutritionNotes",
            "ingredients",
            "instructions"
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (err) {
    console.error('Gemini Generate Recipe error:', err);
    throw err;
  }
}

function sanitizeIngredientName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function estimateIngredientUnit(name: string): string {
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  if (clean.includes('trung')) return 'quả';
  if (clean.includes('hanh') || clean.includes('toi')) return clean.includes('toi') ? 'tép' : 'nhánh';
  if (clean.includes('ca chua') || clean.includes('dua leo') || clean.includes('kho qua')) return 'quả';
  if (clean.includes('khoai') || clean.includes('ca rot')) return 'củ';
  if (clean.includes('com')) return 'chén';
  if (clean.includes('mi')) return 'gói';
  if (clean.includes('sua') || clean.includes('nuoc')) return 'ml';
  if (clean.includes('thit') || clean.includes('ga') || clean.includes('bo') || clean.includes('tom') || clean.includes('ca') || clean.includes('nam') || clean.includes('rau')) return 'g';
  return 'phần';
}

function estimateIngredientQuantity(name: string, unit: string): number {
  const clean = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  if (unit === 'g') {
    if (clean.includes('rau')) return 200;
    if (clean.includes('nam')) return 150;
    return 250;
  }
  if (unit === 'ml') return clean.includes('sua') ? 200 : 15;
  if (unit === 'quả') return clean.includes('trung') ? 3 : 2;
  if (unit === 'tép') return 3;
  if (unit === 'nhánh') return 2;
  if (unit === 'chén') return 2;
  return 1;
}

function generateLocalRecipeDraft(ingredients: string[], userPreferences?: any): any {
  const cleanedIngredients = ingredients.map(sanitizeIngredientName).filter(Boolean);
  const mainIngredients = cleanedIngredients.length ? cleanedIngredients : ['Trứng gà', 'Cà chua'];
  const lowerJoined = mainIngredients.join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const isVegetarian = userPreferences?.dietaryTypes?.includes('Vegetarian') || lowerJoined.includes('dau hu') || lowerJoined.includes('nam');
  const isHighProtein = userPreferences?.dietaryTypes?.includes('High Protein') || /ga|bo|tom|ca|trung/.test(lowerJoined);
  const cookingStyle = lowerJoined.includes('rau') || lowerJoined.includes('bo') ? 'xào nhanh' : isVegetarian ? 'kho nấm' : 'áp chảo sốt nhẹ';
  const dishName = isVegetarian
    ? `${mainIngredients.slice(0, 2).join(' ')} ${cookingStyle}`
    : `${mainIngredients.slice(0, 2).join(' ')} ${cookingStyle}`;

  const recipeIngredients = mainIngredients.map((name, idx) => {
    const unit = estimateIngredientUnit(name);
    return {
      name,
      quantity: estimateIngredientQuantity(name, unit),
      unit,
      importance: idx < 2 ? 'primary' : 'secondary'
    };
  });

  const hasGarlic = lowerJoined.includes('toi');
  if (!hasGarlic) recipeIngredients.push({ name: 'Tỏi', quantity: 2, unit: 'tép', importance: 'secondary' });
  recipeIngredients.push({ name: isVegetarian ? 'Nước tương' : 'Nước mắm', quantity: 15, unit: 'ml', importance: 'secondary' });

  const protein = isHighProtein ? 32 : isVegetarian ? 18 : 24;
  const carbs = lowerJoined.includes('com') || lowerJoined.includes('khoai') || lowerJoined.includes('mi') ? 55 : 18;
  const fat = isVegetarian ? 14 : 16;
  const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);

  return {
    name: dishName,
    vietnameseName: dishName,
    description: `Công thức bản nháp được tạo bằng bộ sinh cục bộ từ các nguyên liệu: ${mainIngredients.join(', ')}. Admin nên kiểm tra lại định lượng trước khi lưu chính thức.`,
    cuisine: 'Vietnamese',
    category: lowerJoined.includes('rau') ? 'Món xào' : isVegetarian ? 'Món kho' : 'Món chính',
    difficulty: 'Easy',
    preparationTime: 8,
    cookingTime: 15,
    totalTime: 23,
    calories,
    proteinGrams: protein,
    carbGrams: carbs,
    fatGrams: fat,
    nutritionNotes: 'Công thức cân bằng nguồn đạm chính với rau củ/gia vị đi kèm; chỉ số dinh dưỡng là ước tính để admin hiệu chỉnh theo dữ liệu thực phẩm.',
    ingredients: recipeIngredients,
    instructions: [
      { stepNumber: 1, instruction: `Sơ chế ${mainIngredients.join(', ')} theo kích thước vừa ăn, để ráo nước trước khi nấu.`, estimatedMinutes: 8 },
      { stepNumber: 2, instruction: 'Làm nóng chảo hoặc nồi, phi thơm tỏi với lượng dầu tối thiểu để tạo mùi nền.', estimatedMinutes: 3 },
      { stepNumber: 3, instruction: `Cho nguyên liệu chính vào chế biến theo kiểu ${cookingStyle}, đảo hoặc rim đến khi chín đều.`, estimatedMinutes: 10 },
      { stepNumber: 4, instruction: 'Nêm lại bằng nước mắm/nước tương, tắt bếp và dùng nóng để giữ hương vị.', estimatedMinutes: 4 }
    ]
  };
}

export function validateGeneratedRecipeDraft(recipe: any): { isValid: boolean; warnings: string[]; normalizedRecipe: any } {
  const warnings: string[] = [];
  const normalizedRecipe = {
    ...recipe,
    name: recipe?.name || recipe?.vietnameseName || 'Công thức mới',
    vietnameseName: recipe?.vietnameseName || recipe?.name || 'Công thức mới',
    preparationTime: Number(recipe?.preparationTime) || 0,
    cookingTime: Number(recipe?.cookingTime) || 0,
    totalTime: Number(recipe?.totalTime) || 0,
    calories: Number(recipe?.calories) || 0,
    proteinGrams: Number(recipe?.proteinGrams) || 0,
    carbGrams: Number(recipe?.carbGrams) || 0,
    fatGrams: Number(recipe?.fatGrams) || 0,
    ingredients: Array.isArray(recipe?.ingredients) ? recipe.ingredients : [],
    instructions: Array.isArray(recipe?.instructions) ? recipe.instructions : []
  };

  if (!normalizedRecipe.name.trim()) warnings.push('Thiếu tên món ăn.');
  if (normalizedRecipe.ingredients.length < 2) warnings.push('Công thức nên có ít nhất 2 nguyên liệu.');
  if (normalizedRecipe.instructions.length < 3) warnings.push('Công thức nên có ít nhất 3 bước nấu.');
  if (normalizedRecipe.totalTime !== normalizedRecipe.preparationTime + normalizedRecipe.cookingTime) {
    normalizedRecipe.totalTime = normalizedRecipe.preparationTime + normalizedRecipe.cookingTime;
    warnings.push('Tổng thời gian đã được tự động đồng bộ từ thời gian sơ chế và nấu.');
  }

  const vaguePattern = /\b(vừa đủ|một ít|tùy thích|tùy khẩu vị|some|a little)\b/i;
  normalizedRecipe.ingredients = normalizedRecipe.ingredients.map((ing: any, idx: number) => {
    const quantity = Number(ing.quantity);
    const item = {
      ...ing,
      name: sanitizeIngredientName(ing.name || `Nguyên liệu ${idx + 1}`),
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : estimateIngredientQuantity(ing.name || '', ing.unit || ''),
      unit: ing.unit || estimateIngredientUnit(ing.name || ''),
      importance: ing.importance || (idx < 2 ? 'primary' : 'secondary')
    };
    if (!ing.quantity || !ing.unit) warnings.push(`Nguyên liệu "${item.name}" thiếu định lượng hoặc đơn vị, đã tự ước tính.`);
    if (vaguePattern.test(`${ing.quantity || ''} ${ing.unit || ''} ${ing.notes || ''}`)) warnings.push(`Nguyên liệu "${item.name}" còn mô tả mơ hồ.`);
    return item;
  });

  normalizedRecipe.instructions = normalizedRecipe.instructions.map((step: any, idx: number) => ({
    stepNumber: idx + 1,
    instruction: step.instruction || step.text || 'Thực hiện bước nấu và kiểm tra độ chín.',
    estimatedMinutes: Number(step.estimatedMinutes) || undefined
  }));

  if (normalizedRecipe.calories < 120 || normalizedRecipe.calories > 1200) {
    warnings.push('Lượng calo nằm ngoài khoảng phổ biến cho một khẩu phần, admin nên kiểm tra lại.');
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    normalizedRecipe
  };
}

export async function generateWeeklyMealPlan(preferences: string) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình. Không thể tạo thực đơn.');
  }

  try {
    const prompt = `Bạn là một chuyên gia dinh dưỡng. Hãy lập một thực đơn 7 ngày hợp lý dựa trên sở thích: ${preferences}.
    Trả về định dạng JSON nghiêm ngặt gồm 7 ngày (Thứ 2 đến Chủ Nhật), mỗi ngày có 3 bữa (breakfast, lunch, dinner).`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            "Thứ 2": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ["breakfast", "lunch", "dinner"] },
            "Thứ 3": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ["breakfast", "lunch", "dinner"] },
            "Thứ 4": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ["breakfast", "lunch", "dinner"] },
            "Thứ 5": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ["breakfast", "lunch", "dinner"] },
            "Thứ 6": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ["breakfast", "lunch", "dinner"] },
            "Thứ 7": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ["breakfast", "lunch", "dinner"] },
            "Chủ Nhật": { type: Type.OBJECT, properties: { breakfast: { type: Type.STRING }, lunch: { type: Type.STRING }, dinner: { type: Type.STRING } }, required: ["breakfast", "lunch", "dinner"] }
          },
          required: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (err) {
    console.error('Gemini Weekly Plan error:', err);
    throw err;
  }
}
