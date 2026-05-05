import { apiRequest } from "./apiClient";
import { SanPham, ProductFilter } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8686";
const TOKEN_KEY = "stylehub_token";
const LEGACY_TOKEN_KEY = "token";

type BackendProduct = {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  material?: string;
  gender?: string;
  gioiTinh?: string;
  tags?: string[];
  rating?: {
    average?: number;
    count?: number;
  };
  category?: {
    _id?: string;
    name?: string;
    slug?: string;
  };
  categoryId?: string | {
    _id?: string;
    name?: string;
    slug?: string;
  };
  price?: number;
  discountPrice?: number;
  finalPrice?: number;
  images?: string[];
  soldQuantity?: number;
  createdAt?: string;
  availableColors?: string[];
  availableSizes?: string[];
  colorVariants?: Array<{
    color: string;
    colorCode: string;
    images?: string[];
  }>;
  variants?: any[];
  defaultVariant?: any;
};

export type AdminCategoryRecord = {
  _id: string;
  name: string;
  slug: string;
  path?: string;
};

export type AdminVariantSizeRecord = {
  _id?: string;
  size?: string;
  sku?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
};

export type AdminVariantRecord = {
  _id?: string;
  color?: string;
  colorCode?: string;
  images?: string[];
  sizes?: AdminVariantSizeRecord[];
};

export type AdminProductRecord = {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  brand?: string;
  material?: string;
  gender?: string;
  tags?: string[];
  categoryId?: string | { _id?: string; name?: string; slug?: string };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  variants?: AdminVariantRecord[];
  defaultVariant?: AdminVariantRecord | null;
  variantsCount?: number;
};

export type AdminVariantSizePayload = {
  size: string;
  price: number;
  discountPrice?: number;
  stock: number;
};

export type UpdateAdminVariantPayload = {
  color?: string;
  colorCode?: string;
  images?: File[];
  action?: "merge" | "replace";
};

export type SearchHistoryItem = {
  _id: string;
  keyword: string;
  normalizedKeyword: string;
  count?: number;
  lastSearchedAt?: string;
};

export type SearchSuggestionResponse = {
  query: string;
  products: SanPham[];
  keywordSuggestions: string[];
};

type ProductColorOption = {
  ten: string;
  ma: string;
};

function inferGenderFromSlug(slug?: string): "nam" | "nu" | "unisex" {
  const normalized = normalizeText(slug || "");

  if (normalized.includes("nam")) return "nam";
  if (normalized.includes("nu")) return "nu";

  return "unisex";
}

function normalizeText(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isProductOnSale(product: SanPham) {
  return typeof product.giaGoc === "number" && product.giaGoc > product.gia;
}

function matchCategory(product: SanPham, category: string) {
  const target = normalizeText(category);

  const values = [
    product.danhMuc,
    product.ten,
    product.moTa,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ].map(normalizeText);

  if (values.some((value) => value.includes(target))) {
    return true;
  }

  if (target === "do the thao") {
    return values.some(
      (value) =>
        value.includes("the thao") ||
        value.includes("sport") ||
        value.includes("chay bo") ||
        value.includes("training")
    );
  }

  return false;
}

function matchColor(product: SanPham, colors: string[]) {
  if (!colors.length) return true;

  const productColors = product.mauSac.map((color) => normalizeText(color.ten));

  return colors.some((color) => productColors.includes(normalizeText(color)));
}

function matchSize(product: SanPham, sizes: string[]) {
  if (!sizes.length) return true;

  const productSizes = product.kichCo.map((size) => normalizeText(size));

  return sizes.some((size) => productSizes.includes(normalizeText(size)));
}

function matchSearchKeyword(product: SanPham, rawKeyword: string) {
  const keyword = normalizeText(rawKeyword);

  if (!keyword) return true;

  const searchableText = [
    product.ten,
    product.slug,
    product.moTa,
    product.moTaChiTiet,
    product.danhMuc,
    product.thuongHieu,
    product.chatLieu,
    product.gioiTinh,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ]
    .map(normalizeText)
    .join(" ");

  if (searchableText.includes(keyword)) {
    return true;
  }

  const keywordVariants = Array.from(
    new Set(
      [
        keyword,
        keyword.replace(/^(ao|quan|do)\s+/g, "").trim(),
        keyword.replace(/\b(ao|quan|do|san|pham)\b/g, " ").replace(/\s+/g, " ").trim(),
      ].filter(Boolean)
    )
  );

  if (keywordVariants.some((variant) => searchableText.includes(variant))) {
    return true;
  }

  const tokens = keyword
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (!tokens.length) return true;

  const stopWords = ["ao", "quan", "do", "san", "pham"];
  const meaningfulTokens = tokens.filter((token) => !stopWords.includes(token));
  const tokensToCheck = meaningfulTokens.length ? meaningfulTokens : tokens;

  return tokensToCheck.every((token) => searchableText.includes(token));
}

function applyLocalFilters(products: SanPham[], filter?: ProductFilter) {
  if (!filter) return products;

  let result = [...products];

  if (filter.timKiem) {
    result = result.filter((product) =>
      matchSearchKeyword(product, filter.timKiem!)
    );
  }

  if (filter.gioiTinh) {
    result = result.filter((product) => product.gioiTinh === filter.gioiTinh);
  }

  if (filter.danhMuc) {
    result = result.filter((product) => matchCategory(product, filter.danhMuc!));
  }

  if (filter.khuyenMai) {
    result = result.filter(isProductOnSale);
  }

  if (filter.giaMin !== undefined) {
    result = result.filter((product) => product.gia >= Number(filter.giaMin));
  }

  if (filter.giaMax !== undefined) {
    result = result.filter((product) => product.gia <= Number(filter.giaMax));
  }

  if (filter.mauSac?.length) {
    result = result.filter((product) => matchColor(product, filter.mauSac || []));
  }

  if (filter.kichCo?.length) {
    result = result.filter((product) => matchSize(product, filter.kichCo || []));
  }

  if (filter.sapXep) {
    switch (filter.sapXep) {
      case "gia_tang":
        result.sort((a, b) => a.gia - b.gia);
        break;

      case "gia_giam":
        result.sort((a, b) => b.gia - a.gia);
        break;

      case "moi_nhat":
        result.sort(
          (a, b) =>
            new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime()
        );
        break;

      case "ban_chay":
        result = result
          .filter((product) => (product.daBan || 0) > 0)
          .sort((a, b) => (b.daBan || 0) - (a.daBan || 0));
        break;
    }
  }

  return result;
}

function mapBackendProductToSanPham(p: any): SanPham {
  const variants = Array.isArray(p.variants) ? p.variants : [];

  const defaultVariant =
    p.defaultVariant ||
    variants.find((v: any) => Array.isArray(v?.images) && v.images.length > 0) ||
    variants[0] ||
    null;

  const defaultSize =
    defaultVariant?.sizes?.find((s: any) => (s.stock ?? 0) > 0) ||
    defaultVariant?.sizes?.[0] ||
    null;

  const image =
    p.images?.[0] ||
    defaultVariant?.images?.[0] ||
    p.colorVariants?.[0]?.images?.[0] ||
    "/placeholder.svg";

  const sizePrice = Number(defaultSize?.price || 0);
  const sizeDiscountPrice = Number(defaultSize?.discountPrice || 0);

  const currentPrice =
    Number(p.finalPrice || 0) ||
    Number(p.discountPrice || 0) ||
    (sizeDiscountPrice > 0 ? sizeDiscountPrice : 0) ||
    Number(defaultSize?.finalPrice || 0) ||
    sizePrice ||
    Number(p.price || 0) ||
    0;

  const originalPrice =
    sizePrice > 0 && currentPrice > 0 && currentPrice < sizePrice
      ? sizePrice
      : typeof p.price === "number" && currentPrice < p.price
        ? p.price
        : undefined;

  const category =
    p.category ||
    (p.categoryId && typeof p.categoryId === "object" ? p.categoryId : null);

  const categoryName = category?.name || "";
  const categorySlug = category?.slug || "";

  const variantColors: ProductColorOption[] = variants
    .map((v: any): ProductColorOption | null => {
      const ten = typeof v.color === "string" ? v.color.trim() : "";
      if (!ten) return null;

      return {
        ten,
        ma:
          typeof v.colorCode === "string" && v.colorCode.trim()
            ? v.colorCode
            : "#000000",
      };
    })
    .filter((c): c is ProductColorOption => c !== null);

  const colorVariantColors: ProductColorOption[] = Array.isArray(p.colorVariants)
    ? p.colorVariants
      .map((v: any): ProductColorOption | null => {
        const ten = typeof v.color === "string" ? v.color.trim() : "";
        if (!ten) return null;

        return {
          ten,
          ma:
            typeof v.colorCode === "string" && v.colorCode.trim()
              ? v.colorCode
              : "#000000",
        };
      })
      .filter((c): c is ProductColorOption => c !== null)
    : [];

  const colors = Array.from(
    new Map(
      [...colorVariantColors, ...variantColors].map((color) => [color.ten, color])
    ).values()
  );

  const productSizes =
    Array.isArray(p.availableSizes) && p.availableSizes.length > 0
      ? p.availableSizes
      : Array.from(
        new Set(
          variants.flatMap((variant: any) =>
            Array.isArray(variant?.sizes)
              ? variant.sizes.map((s: any) => s.size).filter(Boolean)
              : []
          )
        )
      );

  const genderRaw =
    p.gender ||
    p.gioiTinh ||
    inferGenderFromSlug(categorySlug || categoryName || "");

  const gioiTinh =
    genderRaw === "nam" || genderRaw === "nu" || genderRaw === "unisex"
      ? genderRaw
      : "unisex";

  return {
    id: p._id,
    ten: p.name,
    slug: p.slug,
    moTa: p.shortDescription || "",
    moTaChiTiet: p.description || "",
    gia: currentPrice,
    giaGoc: originalPrice,
    hinhAnh: image,
    danhMuc: categoryName,
    danhMucId:
      category?._id ||
      (typeof p.categoryId === "string" ? p.categoryId : "") ||
      "",
    gioiTinh,
    thuongHieu: p.brand || "",
    tags: Array.isArray(p.tags) ? p.tags : [],
    daBan: p.soldQuantity || 0,
    ngayTao: p.createdAt || new Date().toISOString(),
    mauSac: colors,
    kichCo: productSizes,
    badge: originalPrice && originalPrice > currentPrice ? "sale" : undefined,
    danhGia: p.rating?.average || 0,
    soLuongDanhGia: p.rating?.count || 0,
    chatLieu: p.material || "",
    donHang: 0,
    soLuongTon:
      variants.reduce((sum: number, variant: any) => {
        if (!Array.isArray(variant?.sizes)) return sum;

        return (
          sum +
          variant.sizes.reduce(
            (sizeSum: number, size: any) => sizeSum + Number(size.stock || 0),
            0
          )
        );
      }, 0) || 0,

    variants,
    defaultVariantId: defaultVariant?._id || defaultVariant?.id || "",
    defaultColor: defaultVariant?.color || "",
    defaultSize: defaultSize?.size || "",
    defaultPrice: currentPrice,

    bienThe: variants.map((v: any) => ({
      id: v._id,
      mau: v.color || "",
      maMau: v.colorCode || "#000000",
      hinhAnh: Array.isArray(v.images) ? v.images : [],
      kichThuoc: Array.isArray(v.sizes)
        ? v.sizes.map((s: any) => ({
          size: s.size,
          sku: s.sku || "",
          price: s.price,
          discountPrice: s.discountPrice,
          finalPrice:
            typeof s.finalPrice === "number"
              ? s.finalPrice
              : s.discountPrice && s.discountPrice > 0
                ? s.discountPrice
                : s.price,
          stock: s.stock || 0,
        }))
        : [],
    })),
  } as SanPham;
}

function mapProductDetailToSanPham(p: any): SanPham {
  const variants = Array.isArray(p.variants) ? p.variants : [];

  const defaultVariant =
    variants.find((v: any) => Array.isArray(v?.images) && v.images.length > 0) ||
    variants[0] ||
    null;

  const defaultSize =
    defaultVariant?.sizes?.find((s: any) => (s.stock ?? 0) > 0) ||
    defaultVariant?.sizes?.[0] ||
    null;

  const image = defaultVariant?.images?.[0] || p.images?.[0] || "/placeholder.svg";

  const imageList =
    Array.isArray(defaultVariant?.images) && defaultVariant.images.length > 0
      ? defaultVariant.images
      : Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : ["/placeholder.svg"];

  const currentPrice =
    p.minPrice ??
    defaultSize?.finalPrice ??
    defaultSize?.discountPrice ??
    defaultSize?.price ??
    0;

  const originalPrice =
    typeof defaultSize?.price === "number" && currentPrice < defaultSize.price
      ? defaultSize.price
      : undefined;

  const colors: ProductColorOption[] = variants
    .map((v: any): ProductColorOption | null => {
      const ten = typeof v.color === "string" ? v.color.trim() : "";
      if (!ten) return null;

      return {
        ten,
        ma:
          typeof v.colorCode === "string" && v.colorCode.trim()
            ? v.colorCode
            : "#000000",
      };
    })
    .filter((c): c is ProductColorOption => c !== null);

  const uniqueColors: ProductColorOption[] = Array.from(
    new Map<string, ProductColorOption>(colors.map((c) => [c.ten, c])).values()
  );

  const productSizes =
    Array.isArray(p.availableSizes) && p.availableSizes.length > 0
      ? p.availableSizes
      : defaultVariant?.sizes?.map((s: any) => s.size).filter(Boolean) || [];

  const category = p.categoryId || p.category || null;
  const categoryName = category?.name || "";
  const categorySlug = category?.slug || "";

  const genderRaw =
    p.gender ||
    p.gioiTinh ||
    inferGenderFromSlug(categorySlug || categoryName || "");

  const gioiTinh =
    genderRaw === "nam" || genderRaw === "nu" || genderRaw === "unisex"
      ? genderRaw
      : "unisex";

  return {
    id: p._id,
    ten: p.name,
    slug: p.slug,
    moTa: p.shortDescription || "",
    moTaChiTiet: p.description || "",
    gia: currentPrice,
    giaGoc: originalPrice,
    hinhAnh: image,
    hinhAnhList: imageList,
    danhMuc: categoryName,
    danhMucId: category?._id || "",
    gioiTinh,
    thuongHieu: p.brand || "",
    tags: p.tags || [],
    daBan: p.soldQuantity || 0,
    ngayTao: p.createdAt || new Date().toISOString(),
    mauSac: uniqueColors,
    kichCo: productSizes,
    badge: originalPrice && originalPrice > currentPrice ? "sale" : undefined,
    danhGia: p.reviewsSummary?.average || p.rating?.average || 0,
    soLuongDanhGia: p.reviewsSummary?.count || p.rating?.count || 0,
    chatLieu: p.material || "",
    donHang: 0,
    soLuongTon: p.totalStock || 0,

    variants,
    defaultVariantId: defaultVariant?._id || defaultVariant?.id || "",
    defaultColor: defaultVariant?.color || "",
    defaultSize: defaultSize?.size || "",
    defaultPrice: currentPrice,

    bienThe: variants.map((v: any) => ({
      id: v._id,
      mau: v.color || "",
      maMau: v.colorCode || "#000000",
      hinhAnh: Array.isArray(v.images) ? v.images : [],
      kichThuoc: Array.isArray(v.sizes)
        ? v.sizes.map((s: any) => ({
          size: s.size,
          sku: s.sku || "",
          price: s.price,
          discountPrice: s.discountPrice,
          finalPrice:
            typeof s.finalPrice === "number"
              ? s.finalPrice
              : s.discountPrice && s.discountPrice > 0
                ? s.discountPrice
                : s.price,
          stock: s.stock || 0,
        }))
        : [],
    })),

    colorSizeMap: p.colorSizeMap || {},
  } as SanPham;
}

function buildSearchQuery(filter?: ProductFilter) {
  const params = new URLSearchParams();

  if (!filter) return params.toString();

  if (filter.timKiem) params.set("q", filter.timKiem);
  if (filter.giaMin !== undefined) params.set("minPrice", String(filter.giaMin));
  if (filter.giaMax !== undefined) params.set("maxPrice", String(filter.giaMax));

  if (filter.mauSac?.length) {
    params.set("color", filter.mauSac[0]);
  }

  if (filter.kichCo?.length) {
    params.set("size", filter.kichCo[0]);
  }

  if (filter.sapXep) {
    switch (filter.sapXep) {
      case "gia_tang":
        params.set("sortBy", "price");
        params.set("sortOrder", "asc");
        break;
      case "gia_giam":
        params.set("sortBy", "price");
        params.set("sortOrder", "desc");
        break;
      case "moi_nhat":
        params.set("sortBy", "createdAt");
        params.set("sortOrder", "desc");
        break;
      case "ban_chay":
        break;
    }
  }

  return params.toString();
}

async function apiFormRequest(path: string, formData: FormData, method = "POST") {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "API request failed");
  }

  return data;
}

function buildVariantFormData(payload: UpdateAdminVariantPayload) {
  const formData = new FormData();

  if (typeof payload.color === "string") {
    formData.append("color", payload.color);
  }

  if (typeof payload.colorCode === "string") {
    formData.append("colorCode", payload.colorCode);
  }

  if (typeof payload.action === "string") {
    formData.append("action", payload.action);
  }

  if (Array.isArray(payload.images) && payload.images.length > 0) {
    payload.images.forEach((file) => {
      formData.append("images", file);
    });
  }

  return formData;
}

export const productService = {
  async getAll(filter?: ProductFilter): Promise<SanPham[]> {
    if (filter?.sapXep === "ban_chay") {
      const { sapXep, ...restFilter } = filter;
      const bestSellers = await productService.getBestSellers(50);

      return applyLocalFilters(bestSellers, restFilter);
    }

    const res = await apiRequest<{ data?: any[]; products?: any[] }>(
      "/api/products/all?limit=100"
    );

    const rawProducts = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.products)
        ? res.products
        : [];

    const mappedProducts = rawProducts.map(mapBackendProductToSanPham);

    return applyLocalFilters(mappedProducts, filter);
  },

  async getBySlug(slug: string): Promise<SanPham | null> {
    const res = await apiRequest<any>(`/api/products/details/${slug}`);

    if (!res) return null;

    return mapProductDetailToSanPham(res);
  },

  async getFeatured(limit = 10): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>(
      `/api/products/best-sellers?limit=${limit}`
    );

    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getNewArrivals(limit = 10): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>(
      `/api/products/new?limit=${limit}`
    );

    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getBestSellers(limit = 10): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>(
      `/api/products/best-sellers?limit=${limit}`
    );

    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getForYou(limit = 10): Promise<SanPham[]> {
    try {
      const res = await apiRequest<{ products?: BackendProduct[] }>(
        `/api/products/for-you?limit=${limit}`,
        {
          auth: true,
        }
      );

      return (res.products || []).map(mapBackendProductToSanPham);
    } catch (error) {
      console.warn("getForYou error:", error);
      return [];
    }
  },

  async getSaleItems(limit = 10): Promise<SanPham[]> {
    const saleItems = await productService.getAll({ khuyenMai: true });

    return saleItems.slice(0, limit);
  },

  async search(query: string): Promise<SanPham[]> {
    const allProducts = await productService.getAll({ timKiem: query });
    return allProducts;
  },

  async getSearchSuggestions(
    query: string,
    limit = 6
  ): Promise<SearchSuggestionResponse> {
    const qs = new URLSearchParams();

    if (query.trim()) {
      qs.set("q", query.trim());
    }

    qs.set("limit", String(limit));

    const res = await apiRequest<{
      query?: string;
      products?: BackendProduct[];
      keywordSuggestions?: string[];
    }>(`/api/products/suggestions?${qs.toString()}`);

    return {
      query: res.query || query,
      products: (res.products || []).map(mapBackendProductToSanPham),
      keywordSuggestions: Array.isArray(res.keywordSuggestions)
        ? res.keywordSuggestions
        : [],
    };
  },

  async getSearchHistory(limit = 8): Promise<SearchHistoryItem[]> {
    try {
      const res = await apiRequest<{ history?: SearchHistoryItem[] }>(
        `/api/products/search-history?limit=${limit}`,
        {
          auth: true,
        }
      );

      return Array.isArray(res.history) ? res.history : [];
    } catch (error) {
      console.warn("getSearchHistory error:", error);
      return [];
    }
  },

  async saveSearchHistory(keyword: string) {
    const trimmed = keyword.trim();

    if (!trimmed || trimmed.length < 2) {
      return null;
    }

    try {
      return await apiRequest("/api/products/search-history", {
        method: "POST",
        body: JSON.stringify({ keyword: trimmed }),
        auth: true,
      });
    } catch (error) {
      console.warn("saveSearchHistory error:", error);
      return null;
    }
  },

  async clearSearchHistory() {
    try {
      return await apiRequest("/api/products/search-history", {
        method: "DELETE",
        auth: true,
      });
    } catch (error) {
      console.warn("clearSearchHistory error:", error);
      return null;
    }
  },

  async deleteSearchHistoryItem(id: string) {
    if (!id) return null;

    try {
      return await apiRequest(
        `/api/products/search-history/item/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          auth: true,
        }
      );
    } catch (error) {
      console.warn("deleteSearchHistoryItem error:", error);
      return null;
    }
  },

  async getVariantDetails(variantId: string, size?: string) {
    const qs = new URLSearchParams({ variantId });
    if (size) qs.set("size", size);
    return apiRequest(`/api/products/variant/details?${qs.toString()}`);
  },

  async getReviews(slug: string) {
    return apiRequest(`/api/products/details/${slug}/reviews`);
  },

  async getCategories() {
    return apiRequest<AdminCategoryRecord[]>("/api/categories");
  },

  async getAdminProducts() {
    return apiRequest<{ status?: string; message?: string; data?: AdminProductRecord[] }>(
      "/api/products",
      {
        auth: true,
      }
    );
  },

  async createProduct(payload: {
    name: string;
    slug: string;
    shortDescription?: string;
    brand?: string;
    tags?: string[];
    categoryId: string;
    gender?: string;
    material?: string;
  }) {
    return apiRequest("/api/products/add-product", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    });
  },

  async createVariant(formData: FormData) {
    return apiFormRequest("/api/variants/add-variant", formData, "POST");
  },

  async updateProduct(
    productId: string,
    payload: {
      name?: string;
      slug?: string;
      shortDescription?: string;
      brand?: string;
      tags?: string[];
      categoryId?: string;
      status?: string;
      gender?: string;
      material?: string;
    }
  ) {
    return apiRequest(`/api/products/${encodeURIComponent(productId)}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      auth: true,
    });
  },

  async updateVariant(variantId: string, payload: UpdateAdminVariantPayload) {
    const formData = buildVariantFormData(payload);
    return apiFormRequest(
      `/api/variants/update-variant/${encodeURIComponent(variantId)}`,
      formData,
      "PUT"
    );
  },

  async addVariantSize(variantId: string, payload: AdminVariantSizePayload) {
    return apiRequest(`/api/variants/${encodeURIComponent(variantId)}/sizes`, {
      method: "POST",
      body: JSON.stringify(payload),
      auth: true,
    });
  },

  async updateVariantImages(
    variantId: string,
    files: File[],
    action: "append" | "replace" = "replace"
  ) {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("images", file);
    });

    return apiFormRequest(
      `/api/variants/${encodeURIComponent(variantId)}/images?action=${action}`,
      formData,
      "PUT"
    );
  },

  async updateVariantSize(
    variantId: string,
    sizeId: string,
    payload: Partial<AdminVariantSizePayload>
  ) {
    return apiRequest(
      `/api/variants/${encodeURIComponent(variantId)}/sizes/${encodeURIComponent(sizeId)}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
        auth: true,
      }
    );
  },

  async removeVariantSize(variantId: string, sizeId: string) {
    return apiRequest(
      `/api/variants/${encodeURIComponent(variantId)}/sizes/${encodeURIComponent(sizeId)}`,
      {
        method: "DELETE",
        auth: true,
      }
    );
  },

  async deleteVariant(variantId: string) {
    return apiRequest(`/api/variants/${encodeURIComponent(variantId)}`, {
      method: "DELETE",
      auth: true,
    });
  },

  async deleteProduct(productId: string) {
    return apiRequest(`/api/products/${encodeURIComponent(productId)}`, {
      method: "DELETE",
      auth: true,
    });
  },

  async reorderVariantImages(variantId: string, images: string[]) {
    return apiRequest(`/api/variants/${encodeURIComponent(variantId)}/reorder-images`, {
      method: "PUT",
      body: JSON.stringify({ images }),
      auth: true,
    });
  },
};