import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types';
import { chatbotService } from '@/services/api/chatbotService';
import { formatPrice } from '@/utils/format';
import { Link } from 'react-router-dom';

const DISMISSED_KEY = 'matewear_chat_teaser_dismissed';
const quickPrompts = ['Gợi ý áo polo nam', 'Tư vấn size'];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome', role: 'bot',
      content: 'Xin chào! 👋 Mình là trợ lý AI của MATEWEAR. Bạn cần hỗ trợ gì?',
      timestamp: new Date().toISOString(),
      suggestions: ['Gợi ý áo polo nam', 'Đồ thể thao nữ', 'Sản phẩm đang sale', 'Tư vấn size'],
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show teaser once if not dismissed
  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const timer = setTimeout(() => setShowTeaser(true), 1500);
    const autoHide = setTimeout(() => {
      setShowTeaser(false);
      localStorage.setItem(DISMISSED_KEY, '1');
    }, 8000);
    return () => { clearTimeout(timer); clearTimeout(autoHide); };
  }, []);

  const dismissTeaser = () => {
    setShowTeaser(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

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
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
        {showTeaser && (
          <div className="relative bg-card text-foreground rounded-lg px-3 py-2 shadow-lg border border-border animate-fade-in max-w-[180px]">
            <button onClick={dismissTeaser} className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
              <X className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
            <p className="text-[10px] text-muted-foreground mb-1.5">Hỏi AI về thời trang ✨</p>
            <div className="flex flex-wrap gap-1">
              {quickPrompts.map(p => (
                <button key={p} onClick={() => { dismissTeaser(); setOpen(true); setTimeout(() => sendMessage(p), 300); }}
                  className="text-[9px] rounded-full border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-accent font-medium hover:bg-accent/10 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={() => { dismissTeaser(); setOpen(true); }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-accent/20 transition-all hover:scale-105"
          aria-label="Mở chatbot AI">
          <Bot className="h-4.5 w-4.5" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success border-2 border-card" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden" style={{ height: '500px' }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-primary-foreground leading-none mb-0.5">MATEWEAR AI</p>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <p className="text-[10px] text-primary-foreground/55">Đang hoạt động</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" asChild className="h-7 w-7 text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/ai-tu-van"><MessageCircle className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-7 w-7 text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-secondary/20">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="flex-shrink-0 h-5 w-5 rounded bg-accent/10 flex items-center justify-center mr-1.5 mt-0.5">
                <Bot className="h-2.5 w-2.5 text-accent" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-[12px] ${
              msg.role === 'user'
                ? 'bg-accent text-accent-foreground rounded-br-sm'
                : 'bg-card text-card-foreground rounded-bl-sm border border-border'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
              {msg.products && msg.products.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {msg.products.map(p => (
                    <Link key={p.id} to={`/san-pham/${p.slug}`} className="flex gap-2 rounded-lg border border-border bg-background p-1.5 hover:bg-secondary/50 transition-colors">
                      <img src={p.hinhAnh[0]} alt={p.ten} className="h-12 w-12 rounded object-cover bg-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground line-clamp-1">{p.ten}</p>
                        <p className="text-[11px] font-bold text-accent mt-0.5">{formatPrice(p.gia)}</p>
                        {p.giaGoc && <p className="text-[10px] text-muted-foreground line-through">{formatPrice(p.giaGoc)}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.suggestions.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent/15 transition-colors">
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
            <div className="flex-shrink-0 h-5 w-5 rounded bg-accent/10 flex items-center justify-center mr-1.5 mt-0.5">
              <Bot className="h-2.5 w-2.5 text-accent" />
            </div>
            <div className="bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2 text-[12px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 animate-pulse text-accent" />
              <span className="flex gap-0.5">
                <span className="h-1 w-1 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1 w-1 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1 w-1 rounded-full bg-accent/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="border-t border-border p-2 flex gap-1.5 bg-background">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Hỏi AI về thời trang..."
          className="flex-1 h-8 text-[12px] rounded-lg border-border/50 focus-visible:ring-accent" disabled={loading} />
        <Button type="submit" size="icon" className="h-8 w-8 rounded-lg bg-accent hover:bg-accent/90" disabled={!input.trim() || loading}>
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}