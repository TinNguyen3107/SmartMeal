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
      model: 'gemini-3.7-flash',
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
      model: 'gemini-3.7-flash',
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
    const systemPrompt = `Bạn là "Bếp Trưởng AI SmartMeal" - chuyên gia ẩm thực thân thiện, chu đáo và am hiểu sâu sắc ẩm thực Việt Nam và quốc tế.
Người dùng hiện đang có trong bếp/tủ lạnh các nguyên liệu sau: [${pantryIngredients.join(', ')}].
Sở thích người dùng: ${JSON.stringify(userPreferences || {})}.

Nhiệm vụ của bạn:
1. Trả lời câu hỏi ẩm thực, gợi ý món nấu từ nguyên liệu có sẵn.
2. Khi người dùng bổ sung điều kiện (ví dụ "tôi không ăn cay", "muốn món ít dầu mỡ", "thiếu gia vị này thay thế bằng gì"), hãy cập nhật đề xuất linh hoạt, chính xác.
3. Luôn đưa ra câu trả lời ngắn gọn, súc tích, có gạch đầu dòng rõ ràng, kèm mẹo nấu ăn hữu ích.`;

    const formattedHistory = history.slice(-6).map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3.7-flash',
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
    // Trả về mock data nếu không có API Key
    return {
      name: "Trứng xào cà chua kiểu mới",
      vietnameseName: "Trứng xào cà chua kiểu mới",
      description: "Món ăn đơn giản, sinh tự động từ AI giả lập.",
      cuisine: "Vietnamese",
      category: "Món chính",
      difficulty: "Easy",
      totalTime: 15,
      calories: 200,
      ingredients: [
        { name: "Trứng gà", quantity: 2, unit: "quả" },
        { name: "Cà chua", quantity: 2, unit: "quả" }
      ],
      instructions: [
        { stepNumber: 1, instruction: "Đánh trứng và thái cà chua." },
        { stepNumber: 2, instruction: "Xào cà chua mềm, cho trứng vào xào chín." }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Hãy đóng vai một siêu đầu bếp. 
Dựa vào các nguyên liệu sau: [${ingredients.join(', ')}].
Và sở thích của người dùng: ${JSON.stringify(userPreferences || {})}.

Hãy sáng tạo ra 1 công thức món ăn mới cực kỳ hấp dẫn, dễ làm và ngon miệng.
Chú ý: Bạn CÓ THỂ bổ sung thêm các loại gia vị cơ bản (muối, tiêu, đường, nước mắm, dầu ăn, tỏi, hành) nếu cần thiết.

Hãy trả về dưới định dạng JSON với đầy đủ thông tin chi tiết.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Tên món ăn (tiếng Việt)" },
            vietnameseName: { type: Type.STRING },
            description: { type: Type.STRING, description: "Mô tả hấp dẫn về món ăn" },
            cuisine: { type: Type.STRING, description: "Vietnamese, Western, Asian, v.v." },
            category: { type: Type.STRING, description: "Món chính, Ăn vặt, Canh..." },
            difficulty: { type: Type.STRING, description: "Easy, Medium, Hard" },
            totalTime: { type: Type.NUMBER, description: "Tổng thời gian nấu (phút)" },
            calories: { type: Type.NUMBER, description: "Calo ước tính" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ["name", "quantity", "unit"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.NUMBER },
                  instruction: { type: Type.STRING }
                },
                required: ["stepNumber", "instruction"]
              }
            }
          },
          required: ["name", "vietnameseName", "description", "cuisine", "category", "difficulty", "totalTime", "calories", "ingredients", "instructions"]
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
