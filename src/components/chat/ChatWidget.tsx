import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { chatbotService } from '@/services/api/chatbotService';
import { formatPrice } from '@/utils/format';
import { Link } from 'react-router-dom';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: 'Xin chào! 👋 Mình là trợ lý AI mua sắm của **MATEWEAR**. Bạn cần mình hỗ trợ gì nha?',
      timestamp: new Date().toISOString(),
      suggestions: ['Gợi ý áo polo nam', 'Đồ thể thao nữ', 'Sản phẩm đang sale', 'Tư vấn size'],
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await chatbotService.sendMessage({ message: text, conversationId: 'widget' });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'bot', content: response.reply,
        timestamp: new Date().toISOString(), products: response.recommendedProducts,
        suggestions: response.suggestions, type: response.type,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!', timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
        aria-label="Mở chatbot AI"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden" style={{ height: '520px' }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-foreground">MATEWEAR AI</p>
            <p className="text-[10px] text-primary-foreground/70">Trợ lý mua sắm thông minh</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-accent text-accent-foreground rounded-br-md'
                : 'bg-secondary text-secondary-foreground rounded-bl-md'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>

              {/* Product cards in chat */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-2 space-y-2">
                  {msg.products.map(p => (
                    <Link key={p.id} to={`/san-pham/${p.slug}`} className="flex gap-2 rounded-lg border border-border bg-background p-2 hover:bg-secondary/50 transition-colors">
                      <img src={p.hinhAnh[0]} alt={p.ten} className="h-14 w-14 rounded object-cover bg-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground line-clamp-1">{p.ten}</p>
                        <p className="text-xs font-bold text-accent">{formatPrice(p.gia)}</p>
                        {p.giaGoc && <p className="text-[10px] text-muted-foreground line-through">{formatPrice(p.giaGoc)}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Suggestion chips */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-accent" />
              AI đang suy nghĩ...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="border-t border-border p-3 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Nhắn tin cho AI..."
          className="flex-1 h-9 text-sm rounded-full"
          disabled={loading}
        />
        <Button type="submit" size="icon" className="h-9 w-9 rounded-full" disabled={!input.trim() || loading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
