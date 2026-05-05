import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  ShoppingBag,
  Ruler,
  MessageCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MainLayout from "@/components/layout/MainLayout";
import { ChatMessage } from "@/types";
import {
  chatbotService,
  type ChatbotFilters,
  type ChatbotConversationMessage,
  type RecommendedChatProduct,
} from "@/services/api/chatbotService";
import { formatPrice } from "@/utils/format";
import { Link } from "react-router-dom";

const sampleQuestions = [
  "Gợi ý áo polo nam dưới 400k",
  "Mình cần đồ thể thao nữ",
  "Tư vấn outfit đi học",
  "Mình cao 1m72 nặng 68kg mặc size gì?",
  "Có quần short nào đang sale không?",
  "Chính sách đổi trả như thế nào?",
  "Gợi ý quà tặng cho bạn trai",
  "Bao lâu thì nhận được hàng?",
];

const features = [
  {
    icon: ShoppingBag,
    title: "AI gợi ý sản phẩm",
    desc: "Gợi ý sản phẩm phù hợp theo phong cách, ngân sách và nhu cầu",
  },
  {
    icon: Ruler,
    title: "AI tư vấn size",
    desc: "Tư vấn size dựa trên chiều cao, cân nặng và kiểu mặc",
  },
  {
    icon: MessageCircle,
    title: "AI hỗ trợ mua sắm",
    desc: "Hỗ trợ phối đồ, tìm sản phẩm tương tự, gợi ý combo",
  },
  {
    icon: HelpCircle,
    title: "AI giải đáp chính sách",
    desc: "Thông tin về giao hàng, đổi trả, thanh toán, thành viên",
  },
];

function getProductImage(product?: RecommendedChatProduct) {
  if (!product) return "/placeholder.svg";
  if (Array.isArray(product.hinhAnh) && product.hinhAnh.length > 0) {
    return product.hinhAnh[0];
  }
  return "/placeholder.svg";
}

export default function AIConsultant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Xin chào! 👋 Mình là trợ lý AI mua sắm của MATEWEAR.\n\nMình có thể hỗ trợ bạn:\n\n🛍️ Tìm sản phẩm theo nhu cầu\n📏 Gợi ý size theo thông tin bạn cung cấp\n🎨 Lọc theo màu, khoảng giá, loại sản phẩm\n❓ Hỗ trợ một số câu hỏi thường gặp\n\nBạn cần mình hỗ trợ gì nha?",
      timestamp: new Date().toISOString(),
      suggestions: [
        "Áo polo nam dưới 400k",
        "Đồ thể thao nữ",
        "Tư vấn size",
        "Sản phẩm sale",
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextFilters, setContextFilters] = useState<ChatbotFilters>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const buildConversationPayload = (
    currentMessages: ChatMessage[],
    nextMessage: ChatMessage
  ): ChatbotConversationMessage[] => {
    return [...currentMessages, nextMessage]
      .filter((message) => message.role === "user" || message.role === "bot")
      .slice(-8)
      .map((message) => ({
        role: message.role === "bot" ? "assistant" : "user",
        content: message.content,
      }));
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const conversationPayload = buildConversationPayload(messages, userMessage);

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage({
        messages: conversationPayload,
        contextFilters,
        limit: 6,
      });

      setContextFilters(response.filters || null);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: response.reply,
        timestamp: new Date().toISOString(),
        products: response.recommendedProducts as any,
        suggestions: response.suggestions,
        type: response.type,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content:
            error?.message || "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại!",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5">
            <Bot className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">AI Chatbot</span>
          </div>
          <h1 className="mb-3 text-3xl font-bold">Trợ lý AI mua sắm MATEWEAR</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Chatbot AI kết hợp LLM API và dữ liệu sản phẩm thực tế để hỗ trợ tìm
            sản phẩm, lọc theo giá, màu, size và nhu cầu mua sắm.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border p-4 text-center transition-shadow hover:shadow-md"
            >
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <feature.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="hidden space-y-3 lg:block">
            <h3 className="mb-3 text-sm font-semibold">Câu hỏi mẫu</h3>
            {sampleQuestions.map((question) => (
              <button
                key={question}
                onClick={() => sendMessage(question)}
                className="block w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:border-accent/30 hover:bg-secondary/50"
              >
                {question}
              </button>
            ))}
          </div>

          <div
            className="lg:col-span-3 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card"
            style={{ height: "600px" }}
          >
            <div className="flex items-center gap-3 bg-primary px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-primary-foreground">
                  MATEWEAR AI Assistant
                </p>
                <p className="text-xs text-primary-foreground/70">
                  Trợ lý mua sắm thông minh — Powered by backend AI search
                </p>
              </div>
            </div>

            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto space-y-4 p-5"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user"
                      ? "rounded-br-md bg-accent text-accent-foreground"
                      : "rounded-bl-md bg-secondary text-secondary-foreground"
                      }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>

                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {(msg.products as any[]).map(
                          (product: RecommendedChatProduct) => (
                            <Link
                              key={product.id}
                              to={`/san-pham/${product.slug}`}
                              className="flex gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-secondary/50"
                            >
                              <img
                                src={getProductImage(product)}
                                alt={product.ten}
                                className="h-16 w-16 rounded-lg bg-secondary object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-sm font-medium text-foreground">
                                  {product.ten}
                                </p>
                                <p className="mt-0.5 text-sm font-bold text-accent">
                                  {formatPrice(product.gia)}
                                </p>
                                {product.giaGoc ? (
                                  <p className="text-xs text-muted-foreground line-through">
                                    {formatPrice(product.giaGoc)}
                                  </p>
                                ) : null}

                                {(product.mauSac || product.kichCo) && (
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {[product.mauSac, product.kichCo]
                                      .filter(Boolean)
                                      .join(" • ")}
                                  </p>
                                )}

                                <Button
                                  size="sm"
                                  className="mt-1.5 h-7 gap-1 text-xs"
                                >
                                  <ShoppingBag className="h-3 w-3" />
                                  Xem sản phẩm
                                </Button>
                              </div>
                            </Link>
                          )
                        )}
                      </div>
                    )}

                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => sendMessage(suggestion)}
                            className="rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-secondary px-4 py-3 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse text-accent" />
                    AI đang phân tích và trả lời...
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-3 border-t border-border p-4"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi AI bất cứ điều gì về thời trang..."
                className="h-10 flex-1 rounded-full"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 rounded-full"
                disabled={!input.trim() || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}