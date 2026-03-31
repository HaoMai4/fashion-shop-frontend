import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, ShoppingBag, Ruler, MessageCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/components/layout/MainLayout';
import { ChatMessage } from '@/types';
import { chatbotService } from '@/services/api/chatbotService';
import { formatPrice } from '@/utils/format';
import { Link } from 'react-router-dom';

const sampleQuestions = [
  'Gợi ý áo polo nam dưới 400k',
  'Mình cần đồ thể thao nữ',
  'Tư vấn outfit đi học',
  'Mình cao 1m72 nặng 68kg mặc size gì?',
  'Có quần short nào đang sale không?',
  'Chính sách đổi trả như thế nào?',
  'Gợi ý quà tặng cho bạn trai',
  'Bao lâu thì nhận được hàng?',
];

const features = [
  { icon: ShoppingBag, title: 'AI gợi ý sản phẩm', desc: 'Gợi ý sản phẩm phù hợp theo phong cách, ngân sách và nhu cầu' },
  { icon: Ruler, title: 'AI tư vấn size', desc: 'Tư vấn size dựa trên chiều cao, cân nặng và kiểu mặc' },
  { icon: MessageCircle, title: 'AI hỗ trợ mua sắm', desc: 'Hỗ trợ phối đồ, tìm sản phẩm tương tự, gợi ý combo' },
  { icon: HelpCircle, title: 'AI giải đáp chính sách', desc: 'Thông tin về giao hàng, đổi trả, thanh toán, thành viên' },
];

export default function AIConsultant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome', role: 'bot',
      content: 'Xin chào! 👋 Mình là trợ lý AI mua sắm của MATEWEAR. Mình sử dụng công nghệ AI thông qua API để hỗ trợ bạn:\n\n🛍️ Gợi ý sản phẩm phù hợp\n📏 Tư vấn size chính xác\n👔 Gợi ý phối đồ\n❓ Giải đáp mọi thắc mắc\n\nBạn cần mình hỗ trợ gì nha?',
      timestamp: new Date().toISOString(),
      suggestions: ['Gợi ý áo polo nam', 'Đồ thể thao nữ', 'Tư vấn size', 'Sản phẩm sale'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date().toISOString() }]);
    setInput('');
    setLoading(true);
    try {
      const response = await chatbotService.sendMessage({ message: text, conversationId: 'page' });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'bot', content: response.reply,
        timestamp: new Date().toISOString(), products: response.recommendedProducts,
        suggestions: response.suggestions, type: response.type,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!', timestamp: new Date().toISOString() }]);
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Intro */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 mb-4">
            <Bot className="h-4 w-4 text-accent" /><span className="text-sm font-medium text-accent">AI Chatbot</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">Trợ lý AI mua sắm MATEWEAR</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Chatbot AI sử dụng API từ mô hình ngôn ngữ lớn (LLM) để tư vấn mua sắm thông minh. Hỏi bất cứ điều gì về sản phẩm, size, phối đồ hay chính sách!</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {features.map(f => (
            <div key={f.title} className="rounded-xl border border-border p-4 text-center hover:shadow-md transition-shadow">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sample questions */}
          <div className="hidden lg:block space-y-3">
            <h3 className="text-sm font-semibold mb-3">Câu hỏi mẫu</h3>
            {sampleQuestions.map(q => (
              <button key={q} onClick={() => sendMessage(q)} className="block w-full text-left rounded-lg border border-border p-3 text-sm hover:bg-secondary/50 hover:border-accent/30 transition-colors">
                {q}
              </button>
            ))}
          </div>

          {/* Chat */}
          <div className="lg:col-span-3 flex flex-col rounded-2xl border border-border overflow-hidden bg-card" style={{ height: '600px' }}>
            <div className="bg-primary px-5 py-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-primary-foreground">MATEWEAR AI Assistant</p>
                <p className="text-xs text-primary-foreground/70">Trợ lý mua sắm thông minh — Powered by LLM API</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === 'user' ? 'bg-accent text-accent-foreground rounded-br-md' : 'bg-secondary text-secondary-foreground rounded-bl-md'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.products.map(p => (
                          <Link key={p.id} to={`/san-pham/${p.slug}`} className="flex gap-3 rounded-lg border border-border bg-background p-3 hover:bg-secondary/50 transition-colors">
                            <img src={p.hinhAnh[0]} alt={p.ten} className="h-16 w-16 rounded-lg object-cover bg-secondary" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-1">{p.ten}</p>
                              <p className="text-sm font-bold text-accent mt-0.5">{formatPrice(p.gia)}</p>
                              {p.giaGoc && <p className="text-xs text-muted-foreground line-through">{formatPrice(p.giaGoc)}</p>}
                              <Button size="sm" className="mt-1.5 h-7 text-xs gap-1"><ShoppingBag className="h-3 w-3" /> Xem sản phẩm</Button>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.suggestions.map(s => (
                          <button key={s} onClick={() => sendMessage(s)} className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors">{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse text-accent" /> AI đang phân tích và trả lời...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="border-t border-border p-4 flex gap-3">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Hỏi AI bất cứ điều gì về thời trang..." className="flex-1 h-10 rounded-full" disabled={loading} />
              <Button type="submit" size="icon" className="h-10 w-10 rounded-full" disabled={!input.trim() || loading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
