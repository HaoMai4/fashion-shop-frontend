const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8686";
const CHAT_SEARCH_PATH = "/api/chat/search";
const TOKEN_KEY = "stylehub_token";
const LEGACY_TOKEN_KEY = "token";

export type ChatbotConversationMessage = {
  role: "user" | "assistant" | "bot";
  content: string;
};

export type ChatbotFilters = Record<string, any> | null;

export type RecommendedChatProduct = {
  id: string;
  ten: string;
  slug: string;
  gia: number;
  giaGoc?: number;
  hinhAnh: string[];
  mauSac?: string;
  kichCo?: string;
};

export type ChatbotSendRequest = {
  messages: ChatbotConversationMessage[];
  contextFilters?: ChatbotFilters;
  page?: number;
  limit?: number;
  sortBy?: "price" | "relevance" | "discount";
  sortOrder?: "asc" | "desc";
};

export type ChatbotSendResponse = {
  reply: string;
  recommendedProducts: RecommendedChatProduct[];
  suggestions: string[];
  type: "text" | "product_recommendation";
  filters: ChatbotFilters;
  metrics?: {
    total: number;
    page: number;
    limit: number;
  };
};

type BackendChatProduct = {
  _id?: string;
  name?: string;
  slug?: string;
  finalPrice?: number;
  originalPrice?: number;
  discountPrice?: number;
  variant?: {
    images?: string[];
    color?: string;
    colorCode?: string;
    chosenSize?: {
      size?: string;
      price?: number;
      discountPrice?: number;
      finalPrice?: number;
    };
  };
};

type BackendChatResponse = {
  reply?: string;
  filters?: ChatbotFilters;
  products?: BackendChatProduct[];
  metrics?: {
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
};

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

function normalizeRole(role: ChatbotConversationMessage["role"]) {
  if (role === "bot") return "assistant";
  return role;
}

function mapBackendProduct(product: BackendChatProduct): RecommendedChatProduct {
  const images =
    Array.isArray(product.variant?.images) && product.variant.images.length > 0
      ? product.variant.images
      : ["/placeholder.svg"];

  const gia =
    typeof product.finalPrice === "number"
      ? product.finalPrice
      : typeof product.variant?.chosenSize?.finalPrice === "number"
        ? product.variant.chosenSize.finalPrice
        : typeof product.discountPrice === "number"
          ? product.discountPrice
          : typeof product.originalPrice === "number"
            ? product.originalPrice
            : 0;

  const giaGoc =
    typeof product.originalPrice === "number" && product.originalPrice > gia
      ? product.originalPrice
      : undefined;

  return {
    id: product._id || crypto.randomUUID(),
    ten: product.name || "Sản phẩm",
    slug: product.slug || "",
    gia,
    giaGoc,
    hinhAnh: images,
    mauSac: product.variant?.color,
    kichCo: product.variant?.chosenSize?.size,
  };
}

function buildSuggestions(
  filters: ChatbotFilters,
  products: RecommendedChatProduct[]
): string[] {
  const suggestions = new Set<string>();

  if (products.length > 0) {
    if (!filters?.size) suggestions.add("Tư vấn size");
    if (!filters?.minPrice && !filters?.maxPrice) suggestions.add("Áo polo nam dưới 400k");
    if (!filters?.categorySlug) suggestions.add("Đồ thể thao nữ");
    suggestions.add("Sản phẩm sale");
  } else {
    suggestions.add("Áo polo nam dưới 400k");
    suggestions.add("Đồ thể thao nữ");
    suggestions.add("Tư vấn size");
    suggestions.add("Sản phẩm sale");
  }

  return Array.from(suggestions).slice(0, 4);
}

export const chatbotService = {
  async sendMessage(request: ChatbotSendRequest): Promise<ChatbotSendResponse> {
    const payload = {
      messages: (request.messages || []).map((message) => ({
        role: normalizeRole(message.role),
        content: message.content,
      })),
      contextFilters: request.contextFilters || undefined,
      page: request.page ?? 1,
      limit: request.limit ?? 6,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    };

    const token = getAuthToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${CHAT_SEARCH_PATH}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data: BackendChatResponse = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data?.message || "Không thể gọi AI backend");
    }

    const recommendedProducts = Array.isArray(data.products)
      ? data.products.map(mapBackendProduct)
      : [];

    const filters = data.filters || null;

    return {
      reply:
        data.reply ||
        (recommendedProducts.length
          ? "Mình đã tìm thấy một số sản phẩm phù hợp cho bạn."
          : "Mình chưa tìm thấy sản phẩm phù hợp. Bạn thử đổi màu, size hoặc khoảng giá nhé."),
      recommendedProducts,
      suggestions: buildSuggestions(filters, recommendedProducts),
      type: recommendedProducts.length > 0 ? "product_recommendation" : "text",
      filters,
      metrics: data.metrics,
    };
  },
};