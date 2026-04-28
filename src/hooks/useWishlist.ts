import { useCallback, useEffect, useState } from 'react';
import { SanPham } from '@/types';
import { toast } from 'sonner';
import {
  addToWishlist as addToWishlistApi,
  getWishlist as getWishlistApi,
  isLoggedIn,
  removeFromWishlist as removeFromWishlistApi,
} from '@/services/api/userService';

const WISHLIST_KEY = 'matewear_wishlist';
const WISHLIST_UPDATED_EVENT = 'stylehub_wishlist_updated';

function notifyWishlistUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
  }
}

function loadWishlist(): SanPham[] {
  try {
    const data = localStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: SanPham[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
}

function firstString(...values: any[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
          return item;
        }

        if (item && typeof item === 'object') {
          const found =
            item.url ||
            item.secure_url ||
            item.src ||
            item.image ||
            item.path ||
            item.hinhAnh;

          if (typeof found === 'string' && found.trim()) {
            return found;
          }
        }
      }
    }

    if (value && typeof value === 'object') {
      const found =
        value.url ||
        value.secure_url ||
        value.src ||
        value.image ||
        value.path ||
        value.hinhAnh;

      if (typeof found === 'string' && found.trim()) {
        return found;
      }
    }
  }

  return '';
}

function getProductImage(raw: any): string {
  const directImage = firstString(
    raw?.hinhAnh,
    raw?.image,
    raw?.thumbnail,
    raw?.mainImage,
    raw?.images,
    raw?.hinhAnhList,
    raw?.defaultVariant?.images,
    raw?.defaultVariant?.image,
    raw?.defaultVariant?.hinhAnh
  );

  if (directImage) {
    return directImage;
  }

  const variants = Array.isArray(raw?.variants)
    ? raw.variants
    : Array.isArray(raw?.bienThe)
      ? raw.bienThe
      : [];

  for (const variant of variants) {
    const image = firstString(
      variant?.images,
      variant?.image,
      variant?.hinhAnh,
      variant?.hinhAnhList
    );

    if (image) {
      return image;
    }
  }

  return '/placeholder.svg';
}

function getVariantSizes(raw: any): any[] {
  const variants = Array.isArray(raw?.variants) ? raw.variants : [];

  return variants.flatMap((variant) => {
    if (!Array.isArray(variant?.sizes)) {
      return [];
    }

    return variant.sizes;
  });
}

function getDisplayPrice(raw: any): number {
  const directPrice =
    raw?.gia ??
    raw?.price ??
    raw?.giaTien ??
    raw?.finalPrice ??
    raw?.discountPrice;

  if (typeof directPrice === 'number' && directPrice > 0) {
    return directPrice;
  }

  const sizes = getVariantSizes(raw);

  const prices = sizes
    .map((size) => {
      const discountPrice = Number(size?.discountPrice || 0);
      const price = Number(size?.price || size?.gia || 0);

      if (discountPrice > 0) return discountPrice;
      return price;
    })
    .filter((price) => price > 0);

  return prices.length > 0 ? Math.min(...prices) : 0;
}

function getOriginalPrice(raw: any): number | undefined {
  const directOriginal =
    raw?.giaGoc ??
    raw?.originalPrice ??
    raw?.compareAtPrice;

  if (typeof directOriginal === 'number' && directOriginal > 0) {
    return directOriginal;
  }

  const sizes = getVariantSizes(raw);

  const prices = sizes
    .map((size) => Number(size?.price || size?.gia || 0))
    .filter((price) => price > 0);

  const currentPrice = getDisplayPrice(raw);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  if (maxPrice > currentPrice) {
    return maxPrice;
  }

  return undefined;
}

function getColors(raw: any) {
  const variants = Array.isArray(raw?.variants) ? raw.variants : [];
  const map = new Map<string, { ten: string; ma: string }>();

  variants.forEach((variant) => {
    const ten = String(variant?.color || variant?.ten || '').trim();
    const ma = String(variant?.colorCode || variant?.ma || '#d1d5db').trim();

    if (!ten && !ma) return;

    const key = `${ten}-${ma}`;
    if (!map.has(key)) {
      map.set(key, {
        ten: ten || 'Màu mặc định',
        ma: ma || '#d1d5db',
      });
    }
  });

  if (map.size === 0 && Array.isArray(raw?.mauSac)) {
    raw.mauSac.forEach((color: any) => {
      const ten = String(color?.ten || color?.color || '').trim();
      const ma = String(color?.ma || color?.colorCode || '#d1d5db').trim();

      if (!ten && !ma) return;

      const key = `${ten}-${ma}`;
      if (!map.has(key)) {
        map.set(key, {
          ten: ten || 'Màu mặc định',
          ma: ma || '#d1d5db',
        });
      }
    });
  }

  return Array.from(map.values());
}

function getSizes(raw: any): string[] {
  const sizes = getVariantSizes(raw)
    .map((size) => {
      if (typeof size === 'string') return size;
      return size?.size || size?.name || size?.kichCo || '';
    })
    .filter(Boolean)
    .map(String);

  if (sizes.length > 0) {
    return Array.from(new Set(sizes));
  }

  if (Array.isArray(raw?.kichCo)) {
    return raw.kichCo.map(String);
  }

  return [];
}

function normalizeWishlistProduct(raw: any): SanPham {
  const id = String(raw?._id || raw?.id || raw?.productId || '');
  const ten = raw?.ten || raw?.name || raw?.title || 'Sản phẩm';
  const slug = raw?.slug || id;
  const gia = getDisplayPrice(raw);
  const giaGoc = getOriginalPrice(raw);

  const variants = Array.isArray(raw?.variants) ? raw.variants : [];
  const firstVariant = variants[0];
  const firstSize = Array.isArray(firstVariant?.sizes) ? firstVariant.sizes[0] : null;

  const product = {
    id,
    ten,
    slug,
    moTa: raw?.moTa || raw?.description || raw?.shortDescription || '',
    gia,
    giaGoc,
    hinhAnh: getProductImage(raw),
    danhMuc: raw?.danhMuc || raw?.categoryName || raw?.categoryId?.name || '',
    danhMucId: raw?.danhMucId || raw?.categoryId?._id || raw?.categoryId || '',
    gioiTinh: raw?.gioiTinh || raw?.gender || 'unisex',
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    mauSac: getColors(raw),
    kichCo: getSizes(raw),
    badge: raw?.badge,
    danhGia: raw?.danhGia || raw?.rating?.average || 0,
    soLuongDanhGia: raw?.soLuongDanhGia || raw?.rating?.count || 0,

    daBan: raw?.daBan || raw?.sold || raw?.soldCount || 0,
    ngayTao: raw?.ngayTao || raw?.createdAt || new Date().toISOString(),

    variants,
    defaultVariantId: firstVariant?._id || firstVariant?.id || '',
    defaultColor: firstVariant?.color || '',
    defaultSize: firstSize?.size || '',
    defaultPrice: Number(firstSize?.discountPrice || firstSize?.price || gia || 0),
  };

  return product as unknown as SanPham;
}

function normalizeWishlist(rawItems: any[]): SanPham[] {
  return rawItems
    .map(normalizeWishlistProduct)
    .filter((item) => item.id);
}

export function useWishlist() {
  const [items, setItems] = useState<SanPham[]>(() => {
    return isLoggedIn() ? [] : loadWishlist();
  });

  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setItems(loadWishlist());
      return;
    }

    try {
      setLoading(true);
      const rawWishlist = await getWishlistApi();
      const normalized = normalizeWishlist(rawWishlist);
      setItems(normalized);
    } catch (error) {
      console.error('Load wishlist error:', error);
      toast.error('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleWishlistUpdated = () => {
      refresh();
    };

    window.addEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdated);
    window.addEventListener('storage', handleWishlistUpdated);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, handleWishlistUpdated);
      window.removeEventListener('storage', handleWishlistUpdated);
    };
  }, [refresh]);

  const addItem = useCallback(async (product: SanPham) => {
    const productId = String(product.id || '');

    if (!productId) {
      toast.error('Không tìm thấy mã sản phẩm');
      return;
    }

    if (!isLoggedIn()) {
      setItems((prev) => {
        if (prev.find((p) => String(p.id) === productId)) {
          toast.info('Sản phẩm đã có trong danh sách yêu thích!');
          return prev;
        }

        const next = [...prev, product];
        saveWishlist(next);
        notifyWishlistUpdated();
        toast.success(`Đã thêm ${product.ten} vào yêu thích!`);
        return next;
      });

      return;
    }

    try {
      const rawWishlist = await addToWishlistApi(productId);
      const normalized = normalizeWishlist(rawWishlist);
      setItems(normalized);
      notifyWishlistUpdated();
      toast.success(`Đã thêm ${product.ten} vào yêu thích!`);
    } catch (error) {
      console.error('Add wishlist error:', error);
      toast.error('Không thể thêm vào danh sách yêu thích');
    }
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    const id = String(productId || '');

    if (!id) {
      toast.error('Không tìm thấy mã sản phẩm');
      return;
    }

    if (!isLoggedIn()) {
      setItems((prev) => {
        const next = prev.filter((p) => String(p.id) !== id);
        saveWishlist(next);
        notifyWishlistUpdated();
        toast.success('Đã xóa khỏi danh sách yêu thích');
        return next;
      });

      return;
    }

    try {
      const rawWishlist = await removeFromWishlistApi(id);
      const normalized = normalizeWishlist(rawWishlist);
      setItems(normalized);
      notifyWishlistUpdated();
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } catch (error) {
      console.error('Remove wishlist error:', error);
      toast.error('Không thể xóa khỏi danh sách yêu thích');
    }
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((p) => String(p.id) === String(productId));
    },
    [items]
  );

  const toggleItem = useCallback(
    async (product: SanPham) => {
      const productId = String(product.id || '');

      if (!productId) {
        toast.error('Không tìm thấy mã sản phẩm');
        return;
      }

      if (isInWishlist(productId)) {
        await removeItem(productId);
      } else {
        await addItem(product);
      }
    },
    [addItem, isInWishlist, removeItem]
  );

  return {
    items,
    wishlist: items,
    loading,
    isLoading: loading,
    addItem,
    removeItem,
    toggleItem,
    toggleWishlist: toggleItem,
    isInWishlist,
    refresh,
  };
}