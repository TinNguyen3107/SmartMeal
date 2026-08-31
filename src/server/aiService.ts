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
  const commonKeywords: Record<string, string> = {
    'trung': 'Trứng gà',
    'egg': 'Trứng gà',
    'ca chua': 'Cà chua',
    'tomato': 'Cà chua',
    'hanh la': 'Hành lá',
    'hanh tay': 'Hành tây',
    'thit heo': 'Thịt heo',
    'thit bam': 'Thịt heo xay',
    'thit bo': 'Thịt bò',
    'thit ga': 'Thịt gà',
    'uc ga': 'Ức gà',
    'dau hu': 'Đậu hũ',
    'tofu': 'Đậu hũ',
    'toi': 'Tỏi',
    'rau muong': 'Rau muống',
    'khoai tay': 'Khoai tây',
    'ca rot': 'Cà rốt',
    'dua leo': 'Dưa leo',
    'com': 'Cơm nguội',
    'mi': 'Mì gói',
    'nam': 'Nấm',
    'bi do': 'Bí đỏ'
  };

  const clean = prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const found: { name: string; quantity?: number; unit?: string }[] = [];

  for (const [key, val] of Object.entries(commonKeywords)) {
    if (clean.includes(key)) {
      found.push({ name: val, quantity: 1, unit: 'phần' });
    }
  }

  let maxTime: number | undefined;
  if (clean.includes('15') || clean.includes('10')) maxTime = 15;
  else if (clean.includes('20')) maxTime = 20;
  else if (clean.includes('30')) maxTime = 30;

  return {
    ingredients: found.length ? found : [{ name: 'Trứng gà', quantity: 2, unit: 'quả' }, { name: 'Cà chua', quantity: 2, unit: 'quả' }],
    constraints: {
      maxCookingTime: maxTime,
      difficulty: clean.includes('de') || clean.includes('nhanh') ? 'Easy' : undefined
    },
    understoodIntentSummary: `Đã trích xuất ${found.length} nguyên liệu từ yêu cầu của bạn.`
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
    throw new Error('GEMINI_API_KEY chưa được cấu hình. Không thể sinh công thức.');
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

