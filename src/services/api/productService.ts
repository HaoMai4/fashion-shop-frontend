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
  brand?: string;
  rating?: {
    average?: number;
    count?: number;
  };
  category?: {
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

type ProductColorOption = {
  ten: string;
  ma: string;
};

function inferGenderFromSlug(slug?: string): "nam" | "nu" | "unisex" {
  if (!slug) return "unisex";
  if (slug.includes("nam")) return "nam";
  if (slug.includes("nu")) return "nu";
  return "unisex";
}

function mapBackendProductToSanPham(p: any): SanPham {
  const defaultVariant =
    p.defaultVariant ||
    p.variants?.find((v: any) => Array.isArray(v?.images) && v.images.length > 0) ||
    p.variants?.[0] ||
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

  const currentPrice =
    p.finalPrice ??
    p.discountPrice ??
    defaultSize?.discountPrice ??
    defaultSize?.price ??
    p.price ??
    0;

  const originalPrice =
    defaultSize?.originalPrice ??
    (typeof p.price === "number" && currentPrice < p.price ? p.price : undefined);

  const colors: ProductColorOption[] =
    p.colorVariants?.map((v: any): ProductColorOption => ({
      ten: v.color,
      ma: v.colorCode,
    })) ||
    (defaultVariant
      ? [
        {
          ten: defaultVariant.color || "",
          ma: defaultVariant.colorCode || "#000000",
        },
      ]
      : []);

  const sizes =
    p.availableSizes ||
    defaultVariant?.sizes?.map((s: any) => s.size).filter(Boolean) ||
    [];

  return {
    id: p._id,
    ten: p.name,
    slug: p.slug,
    moTa: p.shortDescription || "",
    moTaChiTiet: "",
    gia: currentPrice,
    giaGoc: originalPrice,
    hinhAnh: image,
    danhMuc: p.category?.name || "",
    danhMucId: p.category?._id || p.categoryId || "",
    gioiTinh: inferGenderFromSlug(p.category?.slug || ""),
    thuongHieu: p.brand || "",
    tags: p.tags || [],
    daBan: p.soldQuantity || 0,
    ngayTao: p.createdAt || new Date().toISOString(),
    mauSac: colors,
    kichCo: sizes,
    badge: undefined,
    danhGia: p.rating?.average || 0,
    soLuongDanhGia: p.rating?.count || 0,
    chatLieu: "",
    donHang: 0,
    soLuongTon:
      defaultVariant?.sizes?.reduce((sum: number, s: any) => sum + (s.stock || 0), 0) || 0,
  };
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

  const sizes =
    Array.isArray(p.availableSizes) && p.availableSizes.length > 0
      ? p.availableSizes
      : defaultVariant?.sizes?.map((s: any) => s.size).filter(Boolean) || [];

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
    danhMuc: p.categoryId?.name || "",
    danhMucId: p.categoryId?._id || "",
    gioiTinh: inferGenderFromSlug(p.categoryId?.slug || ""),
    thuongHieu: p.brand || "",
    tags: p.tags || [],
    daBan: p.soldQuantity || 0,
    ngayTao: p.createdAt || new Date().toISOString(),
    mauSac: uniqueColors,
    kichCo: sizes,
    badge: undefined,
    danhGia: p.reviewsSummary?.average || p.rating?.average || 0,
    soLuongDanhGia: p.reviewsSummary?.count || p.rating?.count || 0,
    chatLieu: p.material || "",
    donHang: 0,
    soLuongTon: p.totalStock || 0,

    bienThe: variants.map((v: any) => ({
      id: v._id,
      mau: v.color || "",
      maMau: v.colorCode || "#000000",
      hinhAnh: Array.isArray(v.images) ? v.images : [],
      kichThuoc: Array.isArray(v.sizes)
        ? v.sizes.map((s: any) => ({
          size: s.size,
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
  };
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
    if (filter?.timKiem) {
      const query = buildSearchQuery(filter);
      const res = await apiRequest<{ products: any[] }>(`/api/products/search?${query}`);
      return (res.products || []).map(mapBackendProductToSanPham);
    }

    if (filter?.gioiTinh) {
      const query = buildSearchQuery(filter);
      const res = await apiRequest<{ products: any[] }>(
        `/api/products/${filter.gioiTinh}?${query}`
      );
      return (res.products || []).map(mapBackendProductToSanPham);
    }

    if (filter?.danhMuc) {
      const categorySlugMap: Record<string, string> = {
        "Áo Polo": "ao-polo",
        "Áo Thun": "ao-thun",
        "Sơ Mi": "ao-so-mi",
        "Quần Dài": "quan-dai",
        "Quần Short": "quan-short",
        "Đồ Thể Thao": "do-the-thao",
        "Đồ Lót": "do-lot",
        "Váy": "vay",
        "Áo Khoác": "ao-khoac",
        "Phụ Kiện": "phu-kien",
      };

      const slug = categorySlugMap[filter.danhMuc];
      if (!slug) return [];

      const query = buildSearchQuery(filter);
      const res = await apiRequest<{ products: any[] }>(`/api/products/${slug}?${query}`);
      return (res.products || []).map(mapBackendProductToSanPham);
    }

    const res = await apiRequest<{ data: any[] }>("/api/products/all");
    return (res.data || []).map(mapBackendProductToSanPham);
  },

  async getBySlug(slug: string): Promise<SanPham | null> {
    const res = await apiRequest<any>(`/api/products/details/${slug}`);

    if (!res) return null;

    return mapProductDetailToSanPham(res);
  },

  async getFeatured(): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>(
      "/api/products/best-sellers?limit=8"
    );
    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getNewArrivals(): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>("/api/products/new?limit=8");
    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getBestSellers(): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>(
      "/api/products/best-sellers?limit=8"
    );
    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getSaleItems(): Promise<SanPham[]> {
    const all = await productService.getAll();
    return all
      .filter((p) => typeof p.giaGoc === "number" && p.giaGoc > p.gia)
      .slice(0, 8);
  },

  async search(query: string): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>(
      `/api/products/search?q=${encodeURIComponent(query)}`
    );
    return (res.products || []).map(mapBackendProductToSanPham);
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