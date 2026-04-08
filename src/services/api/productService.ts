import { apiRequest } from "./apiClient";
import { SanPham, ProductFilter } from "@/types";

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

  const colors =
    p.colorVariants?.map((v: any) => ({
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

  const image =
    defaultVariant?.images?.[0] ||
    p.images?.[0] ||
    "/placeholder.svg";

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

  const colors = variants
    .map((v: any) => ({
      ten: v.color || "",
      ma: v.colorCode || "#000000",
    }))
    .filter((c: any) => c.ten);

  const uniqueColors = Array.from(
    new Map(colors.map((c: any) => [c.ten, c])).values()
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

export const productService = {
  async getAll(filter?: ProductFilter): Promise<SanPham[]> {
    if (filter?.timKiem) {
      const query = buildSearchQuery(filter);
      const res = await apiRequest<{ products: any[] }>(`/api/products/search?${query}`);
      return (res.products || []).map(mapBackendProductToSanPham);
    }

    if (filter?.gioiTinh) {
      const query = buildSearchQuery(filter);
      const res = await apiRequest<{ products: any[] }>(`/api/products/${filter.gioiTinh}?${query}`);
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
    const res = await apiRequest<{ products: BackendProduct[] }>("/api/products/best-sellers?limit=8");
    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getNewArrivals(): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>("/api/products/new?limit=8");
    return (res.products || []).map(mapBackendProductToSanPham);
  },

  async getBestSellers(): Promise<SanPham[]> {
    const res = await apiRequest<{ products: BackendProduct[] }>("/api/products/best-sellers?limit=8");
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
};