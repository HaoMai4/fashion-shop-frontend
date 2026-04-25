import { useEffect, useRef, useState, useCallback } from "react";
import { Bot, X, Send, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "@/types";
import {
  chatbotService,
  type RecommendedChatProduct,
} from "@/services/api/chatbotService";
import { formatPrice } from "@/utils/format";
import { Link } from "react-router-dom";

const DISMISSED_KEY = "matewear_chat_teaser_dismissed";
const quickPrompts = ["Áo polo nam dưới 400k", "Tư vấn size"];

type MatewearAiPromptDetail = {
  prompt: string;
};

function getProductImage(product?: RecommendedChatProduct) {
  if (!product) return "/placeholder.svg";
  if (Array.isArray(product.hinhAnh) && product.hinhAnh.length > 0) {
    return product.hinhAnh[0];
  }
  return "/placeholder.svg";
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Xin chào! 👋 Mình là trợ lý AI của MATEWEAR. Bạn cần hỗ trợ gì?",
      timestamp: new Date().toISOString(),
      suggestions: [
        "Áo polo nam dưới 400k",
        "Đồ thể thao nữ",
        "Sản phẩm sale",
        "Tư vấn size",
      ],
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setShowTeaser(true), 1500);
    const autoHide = setTimeout(() => {
      setShowTeaser(false);
      localStorage.setItem(DISMISSED_KEY, "1");
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHide);
    };
  }, []);

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, open]);

  const dismissTeaser = () => {
    setShowTeaser(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const response = await chatbotService.sendMessage({
          messages: [{ role: "user", content: trimmed }],
          limit: 4,
        });

        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content: response.reply,
          timestamp: new Date().toISOString(),
          products: response.recommendedProducts as any,
          suggestions: response.suggestions,
          type: response.type,
        };

        setMessages((prev) => [...prev, botMsg]);
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
    },
    [loading]
  );

  useEffect(() => {
    const handleExternalPrompt = (event: Event) => {
      const customEvent = event as CustomEvent<MatewearAiPromptDetail>;
      const prompt = customEvent.detail?.prompt?.trim();

      if (!prompt) return;

      dismissTeaser();
      setOpen(true);

      setTimeout(() => {
        sendMessage(prompt);
      }, 150);
    };

    window.addEventListener(
      "matewear-ai-prompt",
      handleExternalPrompt as EventListener
    );

    return () => {
      window.removeEventListener(
        "matewear-ai-prompt",
        handleExternalPrompt as EventListener
      );
    };
  }, [sendMessage]);

  if (!open) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1.5">
        {showTeaser && (
          <div className="relative max-w-[180px] animate-fade-in rounded-lg border border-border bg-card px-3 py-2 text-foreground shadow-lg">
            <button
              onClick={dismissTeaser}
              className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted-foreground/20"
            >
              <X className="h-2.5 w-2.5 text-muted-foreground" />
            </button>
            <p className="mb-1.5 text-[10px] text-muted-foreground">
              Hỏi AI về thời trang ✨
            </p>
            <div className="flex flex-wrap gap-1">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    dismissTeaser();
                    setOpen(true);
                    setTimeout(() => sendMessage(prompt), 300);
                  }}
                  className="rounded-full border border-accent/20 bg-accent/5 px-1.5 py-0.5 text-[9px] font-medium text-accent transition-colors hover:bg-accent/10"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            dismissTeaser();
            setOpen(true);
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-all hover:scale-105 hover:shadow-accent/20"
          aria-label="Mở chatbot AI"
        >
          <Bot className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
      style={{ height: "500px" }}
    >
      <div className="flex items-center justify-between bg-primary px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <p className="mb-0.5 text-[13px] font-bold leading-none text-primary-foreground">
              MATEWEAR AI
            </p>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <p className="text-[10px] text-primary-foreground/55">
                Đang hoạt động
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="h-7 w-7 text-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <Link to="/ai-tu-van">
              <MessageCircle className="h-3.5 w-3.5" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-7 w-7 text-primary-foreground/50 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 space-y-2.5 overflow-y-auto bg-secondary/20 p-3"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "bot" && (
              <div className="mr-1.5 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-accent/10">
                <Bot className="h-2.5 w-2.5 text-accent" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-[12px] ${
                msg.role === "user"
                  ? "rounded-br-sm bg-accent text-accent-foreground"
                  : "rounded-bl-sm border border-border bg-card text-card-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {msg.content.replace(/\*\*(.*?)\*\*/g, "$1")}
              </p>

              {msg.products && msg.products.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {(msg.products as any[]).map(
                    (product: RecommendedChatProduct) => (
                      <Link
                        key={product.id}
                        to={`/san-pham/${product.slug}`}
                        className="flex gap-2 rounded-lg border border-border bg-background p-1.5 transition-colors hover:bg-secondary/50"
                      >
                        <img
                          src={getProductImage(product)}
                          alt={product.ten}
                          className="h-12 w-12 rounded bg-secondary object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-[11px] font-semibold text-foreground">
                            {product.ten}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold text-accent">
                            {formatPrice(product.gia)}
                          </p>
                          {product.giaGoc ? (
                            <p className="text-[10px] text-muted-foreground line-through">
                              {formatPrice(product.giaGoc)}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    )
                  )}
                </div>
              )}

              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-[10px] font-semibold text-accent transition-colors hover:bg-accent/15"
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
            <div className="mr-1.5 mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-accent/10">
              <Bot className="h-2.5 w-2.5 text-accent" />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl rounded-bl-sm border border-border bg-card px-3 py-2 text-[12px] text-muted-foreground">
              <Sparkles className="h-3 w-3 animate-pulse text-accent" />
              <span className="flex gap-0.5">
                <span
                  className="h-1 w-1 animate-bounce rounded-full bg-accent/40"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1 w-1 animate-bounce rounded-full bg-accent/40"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1 w-1 animate-bounce rounded-full bg-accent/40"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-1.5 border-t border-border bg-background p-2"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi AI về thời trang..."
          className="h-8 flex-1 rounded-lg border-border/50 text-[12px] focus-visible:ring-accent"
          disabled={loading}
        />
        <Button
          type="submit"
          size="icon"
          className="h-8 w-8 rounded-lg bg-accent hover:bg-accent/90"
          disabled={!input.trim() || loading}
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}