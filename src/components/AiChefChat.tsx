import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  RefreshCw,
  Lightbulb,
  ChefHat,
  Refrigerator
} from 'lucide-react';
import { UserIngredient } from '../types';

interface AiChefChatProps {
  pantryItems: UserIngredient[];
  onOpenRecipeModal?: (recipeId: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AiChefChat: React.FC<AiChefChatProps> = ({ pantryItems }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'model',
      text: `Xin chào! Tôi là **Bếp Trưởng AI SmartMeal**. 🍳
Tôi biết trong tủ lạnh bạn đang có: **${pantryItems.map(p => p.name).join(', ') || 'Trứng gà, Cà chua, Hành lá'}**.

Bạn muốn tôi gợi ý món ăn, hướng dẫn nêm nếm gia vị hay tìm cách thay thế nguyên liệu nào hôm nay?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          pantryIngredients: pantryItems.map(p => p.name),
          history: messages.slice(-6).map(m => ({ role: m.role, text: m.text }))
        })
      });
      const data = await res.json();
      const aiReply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: data.reply || 'Rất vui được hỗ trợ bạn nấu ăn!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiReply]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          role: 'model',
          text: 'Xin lỗi, kết nối tới AI đang gián đoạn. Bạn thử lại sau giây lát nhé!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Tối nay ăn gì nhanh gọn dưới 20 phút từ tủ lạnh?',
    'Gợi ý 3 món Eat Clean ít dầu mỡ',
    'Nếu không có nước dừa khi kho thịt thì thay bằng gì?',
    'Mẹo chiên trứng cuộn mềm xốp không bị khô'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-[#4A5D4E] text-white rounded-[36px] p-8 card-shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 text-[#E9EDC9] flex items-center justify-center">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-normal text-white flex items-center gap-2">
              Bếp Trưởng AI SmartMeal
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[#E9EDC9] text-[10px] uppercase font-bold tracking-wide">
                Gemini 3.7 Flash (FR-21)
              </span>
            </h1>
            <p className="text-xs text-[#E9EDC9] flex items-center gap-1.5 mt-1 opacity-90">
              <Refrigerator className="w-3.5 h-3.5 text-[#D9AE94]" />
              Đang đồng bộ với {pantryItems.length} món trong tủ lạnh của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area Container */}
      <div className="bg-white border border-[#EAE7E0] rounded-[36px] p-6 sm:p-8 card-shadow flex flex-col h-145">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-9 h-9 rounded-full bg-[#8BA08E]/20 text-[#4A5D4E] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-[#8BA08E] text-white rounded-tr-none card-shadow'
                    : 'bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] rounded-tl-none whitespace-pre-line'
                  }`}
              >
                <div>{msg.text}</div>
                <div
                  className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-white/80' : 'text-[#7D857E]'
                    }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-9 h-9 rounded-full bg-[#C87D55]/20 text-[#8C5D36] flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-[#4A5D4E] bg-[#F2EDE4] border border-[#EAE7E0] p-3.5 rounded-2xl max-w-sm font-medium">
              <RefreshCw className="w-4 h-4 animate-spin text-[#8BA08E]" />
              <span>Bếp Trưởng AI đang suy nghĩ thực đơn...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips */}
        <div className="pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-none border-t border-[#F2EDE4]">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] px-3 py-1.5 rounded-full bg-[#F9F7F2] hover:bg-[#F2EDE4] text-[#3D3D3D] hover:text-[#4A5D4E] border border-[#EAE7E0] whitespace-nowrap transition-colors flex items-center gap-1.5 font-medium"
            >
              <Lightbulb className="w-3 h-3 text-[#D9AE94]" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="pt-2 flex gap-2.5">
          <input
            id="ai-chef-chat-input"
            type="text"
            placeholder="Nhập câu hỏi ẩm thực, món cần nấu, hoặc mẹo chế biến..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 px-4 py-3 rounded-2xl bg-[#F9F7F2] border border-[#EAE7E0] text-[#3D3D3D] placeholder-[#A9A296] text-xs sm:text-sm focus:outline-none focus:border-[#8BA08E] font-medium"
          />

          <button
            id="ai-chef-send-btn"
            disabled={isLoading || !inputMessage.trim()}
            onClick={() => handleSendMessage()}
            className="px-6 py-3 rounded-full bg-[#8BA08E] hover:bg-[#798E7C] text-white font-bold text-sm card-shadow disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
