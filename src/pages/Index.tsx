import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Star,
  ChevronLeft,
  ChevronRight,
  Gift,
  Award,
  Shield,
  Zap,
  Shirt,
  Ruler,
  MessageCircle,
  HelpCircle,
  Clock,
  Tags,
  Package,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/ProductCard';
import {
  productService,
  type SearchHistoryItem,
} from '@/services/api/productService';
import { orderService } from '@/services/api/orderService';
import {
  getMe,
  getStoredUser,
  isLoggedIn,
  type UserProfile,
} from '@/services/api/userService';
import { SanPham } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { danhMucData } from '@/data/categories';

import hero1 from '@/assets/hero-main.png';
import hero2 from '@/assets/hero-sport.png';
import hero3 from '@/assets/hero-sale.png';
import bannerMen from '@/assets/banner-men.jpg';
import bannerWomen from '@/assets/banner-women.jpg';
import bannerSports from '@/assets/banner-sports.jpg';
import aiAssistant from '@/assets/ai-assistant.jpg';

const heroSlides = [
  {
    title: 'Phong cách mới\ncho mỗi ngày',
    subtitle: 'Khám phá các thiết kế dễ mặc, dễ phối và phù hợp nhiều hoàn cảnh.',
    cta: 'Mua ngay',
    link: '/san-pham',
    image: hero1,
    imagePosition: 'object-center',
  },
  {
    title: 'Năng động hơn\nvới đồ thể thao',
    subtitle: 'Trang phục thoải mái cho tập luyện, di chuyển và sinh hoạt hằng ngày.',
    cta: 'Khám phá',
    link: '/san-pham?danhMuc=Đồ Thể Thao',
    image: hero2,
    imagePosition: 'object-center',
  },
  {
    title: 'Ưu đãi nổi bật\nđang chờ bạn',
    subtitle: 'Chọn nhanh các sản phẩm đang giảm giá tại MATEWEAR.',
    cta: 'Xem sale',
    link: '/san-pham?khuyenMai=true',
    image: hero3,
    imagePosition: 'object-center',
  },
];

const RECENTLY_VIEWED_PRODUCTS_KEY = 'matewear_recently_viewed_products';
const RECENTLY_VIEWED_UPDATED_EVENT = 'stylehub_recently_viewed_updated';

type HomepageOrderItem = {
  _id?: string;
  id?: string;
  productId?: string | { _id?: string; id?: string };
  product?: {
    _id?: string;
    id?: string;
  };
  sanPham?: {
    id?: string;
    _id?: string;
  };
};

type HomepageOrderRecord = {
  status?: string;
  trangThai?: string;
  orderStatus?: string;
  statusOrder?: string;
  fulfillmentStatus?: string;
  items?: HomepageOrderItem[];
  chiTiet?: HomepageOrderItem[];
};

function getOrderListFromResponse(res: any): HomepageOrderRecord[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.orders)) return res.orders;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.orders)) return res.data.orders;
  return [];
}

function normalizeOrderStatus(raw?: string) {
  if (!raw) return '';

  const value = String(raw).trim().toLowerCase();

  const statusMap: Record<string, string> = {
    delivered: 'delivered',
    da_giao: 'delivered',
    'đã giao': 'delivered',

    completed: 'completed',
    hoan_thanh: 'completed',
    'hoàn thành': 'completed',
  };

  return statusMap[value] || value;
}

function getHomepageOrderStatus(order: HomepageOrderRecord) {
  return normalizeOrderStatus(
    order.status ||
    order.trangThai ||
    order.orderStatus ||
    order.statusOrder ||
    order.fulfillmentStatus ||
    ''
  );
}

function isCompletedOrder(order: HomepageOrderRecord) {
  const status = getHomepageOrderStatus(order);
  return status === 'completed' || status === 'delivered';
}

function getHomepageOrderItems(order: HomepageOrderRecord): HomepageOrderItem[] {
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.chiTiet)) return order.chiTiet;
  return [];
}

function getOrderItemProductId(item: HomepageOrderItem) {
  const rawProductId = item.productId;

  if (typeof rawProductId === 'string') {
    return rawProductId;
  }

  if (rawProductId && typeof rawProductId === 'object') {
    return rawProductId._id || rawProductId.id || '';
  }

  return (
    item.product?._id ||
    item.product?.id ||
    item.sanPham?._id ||
    item.sanPham?.id ||
    ''
  );
}

function extractCompletedOrderProductIds(orders: HomepageOrderRecord[]) {
  return Array.from(
    new Set(
      orders
        .filter(isCompletedOrder)
        .flatMap((order) => getHomepageOrderItems(order))
        .map(getOrderItemProductId)
        .filter(Boolean)
        .map(String)
    )
  );
}

function uniqueById(items: SanPham[]) {
  const map = new Map<string, SanPham>();

  items.forEach((item) => {
    if (item?.id && !map.has(String(item.id))) {
      map.set(String(item.id), item);
    }
  });

  return Array.from(map.values());
}

function fillToLimit(primary: SanPham[], fallback: SanPham[], limit = 10) {
  return uniqueById([...primary, ...fallback]).slice(0, limit);
}

function loadRecentlyViewedProducts() {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_PRODUCTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed)
      ? (parsed.filter((item) => item?.id) as SanPham[])
      : [];
  } catch {
    return [];
  }
}

function filterProductsByGender(
  products: SanPham[],
  gender: 'nam' | 'nu',
  limit = 10
) {
  return products
    .filter((product) => product.gioiTinh === gender)
    .slice(0, limit);
}

function sortProductsByNewest(products: SanPham[]) {
  return [...products].sort(
    (a, b) =>
      new Date(b.ngayTao || '').getTime() - new Date(a.ngayTao || '').getTime()
  );
}

function normalizeUserGender(gender?: string) {
  const normalized = String(gender || '').trim().toLowerCase();

  if (normalized === 'nam' || normalized === 'male') return 'nam';
  if (normalized === 'nu' || normalized === 'female') return 'nu';

  return 'khac';
}

function isKnownGender(gender?: string) {
  const normalized = normalizeUserGender(gender);
  return normalized === 'nam' || normalized === 'nu';
}

function getForYouSubtitle(gender?: string) {
  const normalized = normalizeUserGender(gender);

  if (normalized === 'nam') {
    return 'Gợi ý dựa trên sản phẩm bạn quan tâm, có ưu tiên phong cách nam.';
  }

  if (normalized === 'nu') {
    return 'Gợi ý dựa trên sản phẩm bạn quan tâm, có ưu tiên phong cách nữ.';
  }

  return 'Gợi ý dựa trên sản phẩm bạn đã quan tâm trên MATEWEAR.';
}

function normalizeKeyword(value: any) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getProductSearchText(product: SanPham) {
  return [
    product.ten,
    product.slug,
    product.moTa,
    product.moTaChiTiet,
    product.danhMuc,
    product.danhMucSlug,
    product.danhMucPath,
    product.thuongHieu,
    product.chatLieu,
    product.gioiTinh,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ]
    .map(normalizeKeyword)
    .join(' ');
}

function getProductSignals(product?: SanPham | null) {
  if (!product) {
    return {
      categoryIds: [] as string[],
      categories: [] as string[],
      brands: [] as string[],
      tags: [] as string[],
    };
  }

  return {
    categoryIds: [product.danhMucId].filter(Boolean).map(String),
    categories: [product.danhMuc, product.danhMucSlug, product.danhMucPath]
      .filter(Boolean)
      .map(normalizeKeyword),
    brands: [product.thuongHieu].filter(Boolean).map(normalizeKeyword),
    tags: Array.isArray(product.tags) ? product.tags.map(normalizeKeyword) : [],
  };
}

function buildForYouProducts(params: {
  allProducts: SanPham[];
  bestSellers: SanPham[];
  newArrivals: SanPham[];
  wishlistItems: SanPham[];
  cartItems: any[];
  searchHistory: SearchHistoryItem[];
  purchasedProductIds: string[];
  recentlyViewedItems: SanPham[];
  gender?: string;
  limit?: number;
}) {
  const {
    allProducts,
    bestSellers,
    newArrivals,
    wishlistItems,
    cartItems,
    searchHistory,
    purchasedProductIds,
    recentlyViewedItems,
    gender,
    limit = 10,
  } = params;

  const normalizedGender = normalizeUserGender(gender);

  const wishlistIds = new Set(
    wishlistItems.map((item) => String(item.id)).filter(Boolean)
  );

  const cartIds = new Set(
    cartItems
      .map((item) => String(item.productId || item.sanPham?.id || ''))
      .filter(Boolean)
  );

  const purchasedIds = new Set(
    purchasedProductIds.map((item) => String(item)).filter(Boolean)
  );

  const recentlyViewedIds = new Set(
    recentlyViewedItems.map((item) => String(item.id)).filter(Boolean)
  );

  const purchasedProducts = allProducts.filter((product) =>
    purchasedIds.has(String(product.id))
  );

  const behaviorProducts = uniqueById([
    ...wishlistItems,
    ...cartItems.map((item) => item.sanPham).filter(Boolean),
    ...purchasedProducts,
    ...recentlyViewedItems,
  ]);

  const behaviorSignals = behaviorProducts.reduce(
    (acc, product) => {
      const signals = getProductSignals(product);

      signals.categoryIds.forEach((item) => acc.categoryIds.add(item));
      signals.categories.forEach((item) => acc.categories.add(item));
      signals.brands.forEach((item) => acc.brands.add(item));
      signals.tags.forEach((item) => acc.tags.add(item));

      return acc;
    },
    {
      categoryIds: new Set<string>(),
      categories: new Set<string>(),
      brands: new Set<string>(),
      tags: new Set<string>(),
    }
  );

  const searchKeywords = searchHistory
    .map((item) => item.normalizedKeyword || item.keyword)
    .map(normalizeKeyword)
    .filter((item) => item.length >= 2);

  const scoredProducts = allProducts
    .map((product, index) => {
      let score = 0;

      const productId = String(product.id);
      const productText = getProductSearchText(product);
      const productCategoryId = String(product.danhMucId || '');
      const productCategoryValues = [
        product.danhMuc,
        product.danhMucSlug,
        product.danhMucPath,
      ]
        .filter(Boolean)
        .map(normalizeKeyword);

      const productBrand = normalizeKeyword(product.thuongHieu);
      const productTags = Array.isArray(product.tags)
        ? product.tags.map(normalizeKeyword)
        : [];

      if (wishlistIds.has(productId)) score += 120;
      if (cartIds.has(productId)) score += 110;
      if (purchasedIds.has(productId)) score += 80;
      if (recentlyViewedIds.has(productId)) score += 70;

      if (
        productCategoryId &&
        behaviorSignals.categoryIds.has(productCategoryId)
      ) {
        score += 55;
      }

      if (
        productCategoryValues.some((item) => behaviorSignals.categories.has(item))
      ) {
        score += 40;
      }

      if (productBrand && behaviorSignals.brands.has(productBrand)) {
        score += 25;
      }

      const matchedTags = productTags.filter((tag) =>
        behaviorSignals.tags.has(tag)
      );

      score += Math.min(matchedTags.length * 15, 45);

      searchKeywords.forEach((keyword, keywordIndex) => {
        if (!keyword) return;

        if (productText.includes(keyword)) {
          score += Math.max(40 - keywordIndex * 4, 18);
          return;
        }

        const tokens = keyword
          .split(/\s+/)
          .map((token) => token.trim())
          .filter((token) => token.length >= 2);

        const matchedTokenCount = tokens.filter((token) =>
          productText.includes(token)
        ).length;

        if (matchedTokenCount > 0) {
          score += Math.min(matchedTokenCount * 8, 24);
        }
      });

      if (
        isKnownGender(gender) &&
        (product.gioiTinh === normalizedGender || product.gioiTinh === 'unisex')
      ) {
        score += 10;
      }

      return {
        product,
        score,
        index,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const dateA = new Date(a.product.ngayTao || '').getTime();
      const dateB = new Date(b.product.ngayTao || '').getTime();

      if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateB !== dateA) {
        return dateB - dateA;
      }

      return a.index - b.index;
    })
    .map((item) => item.product);

  if (scoredProducts.length > 0) {
    return uniqueById(scoredProducts).slice(0, limit);
  }

  if (isKnownGender(gender)) {
    const genderProducts = allProducts.filter(
      (product) =>
        product.gioiTinh === normalizedGender || product.gioiTinh === 'unisex'
    );

    return fillToLimit(
      genderProducts,
      [...bestSellers, ...newArrivals, ...allProducts],
      limit
    );
  }

  return fillToLimit(bestSellers, [...newArrivals, ...allProducts], limit);
}



type ProductSectionProps = {
  title: string;
  subtitle: string;
  products: SanPham[];
  viewAllLink: string;
  icon: ReactNode;
  onAddToCart: (product: SanPham) => void;
  onToggleWishlist: (product: SanPham) => void;
  isWishlisted: (productId: string) => boolean;
};

function ProductSection({
  title,
  subtitle,
  products,
  viewAllLink,
  icon,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}: ProductSectionProps) {
  if (!products.length) return null;

  return (
    <section className="px-4 py-8">
      <div className="container mx-auto">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              {icon}
            </div>

            <div>
              <h2 className="text-base font-bold leading-tight text-foreground md:text-lg">
                {title}
              </h2>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <Link
            to={viewAllLink}
            className="hidden h-9 items-center gap-1 rounded-full px-3 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/10 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:inline-flex"
          >
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 md:gap-3 lg:grid-cols-5">
          {products.slice(0, 10).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              isWishlisted={isWishlisted(product.id)}
            />
          ))}
        </div>

        <div className="mt-5 flex justify-center sm:hidden">
          <Link
            to={viewAllLink}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-border bg-background px-4 text-xs font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            Xem tất cả <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const [allProducts, setAllProducts] = useState<SanPham[]>([]);
  const [bestSellers, setBestSellers] = useState<SanPham[]>([]);
  const [newArrivals, setNewArrivals] = useState<SanPham[]>([]);
  const [saleItems, setSaleItems] = useState<SanPham[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [categoryCountsLoaded, setCategoryCountsLoaded] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    getStoredUser()
  );
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [completedOrderProductIds, setCompletedOrderProductIds] = useState<string[]>([]);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState<SanPham[]>([]);

  const { items: cartItems, addItem } = useCart();
  const {
    items: wishlistItems,
    addItem: addWishlist,
    removeItem: removeWishlist,
    isInWishlist,
  } = useWishlist();

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      let storedUser = getStoredUser();

      if (isLoggedIn()) {
        try {
          storedUser = await getMe();
        } catch (error) {
          console.warn('Load current user for homepage failed:', error);
        }
      }

      if (mounted) {
        setCurrentUser(storedUser);
      }
    }

    loadCurrentUser();

    const handleUserUpdated = () => {
      loadCurrentUser();
    };

    window.addEventListener('stylehub_user_updated', handleUserUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('stylehub_user_updated', handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSearchHistory() {
      if (!isLoggedIn()) {
        setSearchHistory([]);
        return;
      }

      try {
        const history = await productService.getSearchHistory(10);

        if (mounted) {
          setSearchHistory(history);
        }
      } catch (error) {
        console.warn('Load homepage search history failed:', error);

        if (mounted) {
          setSearchHistory([]);
        }
      }
    }

    loadSearchHistory();

    const handleSearchHistoryUpdated = () => {
      loadSearchHistory();
    };

    window.addEventListener(
      'stylehub_search_history_updated',
      handleSearchHistoryUpdated
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        'stylehub_search_history_updated',
        handleSearchHistoryUpdated
      );
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCompletedOrderProductIds() {
      if (!isLoggedIn()) {
        setCompletedOrderProductIds([]);
        return;
      }

      try {
        const res = await orderService.getMyOrders({
          all: true,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        const orders = getOrderListFromResponse(res);
        const productIds = extractCompletedOrderProductIds(orders);

        if (mounted) {
          setCompletedOrderProductIds(productIds);
        }
      } catch (error) {
        console.warn('Load completed order products failed:', error);

        if (mounted) {
          setCompletedOrderProductIds([]);
        }
      }
    }

    loadCompletedOrderProductIds();

    const handleUserUpdated = () => {
      loadCompletedOrderProductIds();
    };

    window.addEventListener('stylehub_user_updated', handleUserUpdated);

    return () => {
      mounted = false;
      window.removeEventListener('stylehub_user_updated', handleUserUpdated);
    };
  }, []);

  useEffect(() => {
    function refreshRecentlyViewedProducts() {
      if (!isLoggedIn()) {
        setRecentlyViewedItems([]);
        return;
      }

      setRecentlyViewedItems(loadRecentlyViewedProducts());
    }

    refreshRecentlyViewedProducts();

    window.addEventListener(
      RECENTLY_VIEWED_UPDATED_EVENT,
      refreshRecentlyViewedProducts
    );

    window.addEventListener('storage', refreshRecentlyViewedProducts);

    return () => {
      window.removeEventListener(
        RECENTLY_VIEWED_UPDATED_EVENT,
        refreshRecentlyViewedProducts
      );

      window.removeEventListener('storage', refreshRecentlyViewedProducts);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadHomepageData() {
      const [allResult, bestSellerResult, newArrivalResult, saleResult] =
        await Promise.allSettled([
          productService.getAll(),
          productService.getBestSellers(),
          productService.getNewArrivals(),
          productService.getSaleItems(),
        ]);

      if (!mounted) return;

      const all =
        allResult.status === 'fulfilled' && Array.isArray(allResult.value)
          ? allResult.value
          : [];

      setAllProducts(all);

      setBestSellers(
        bestSellerResult.status === 'fulfilled' &&
          Array.isArray(bestSellerResult.value)
          ? bestSellerResult.value
          : []
      );

      setNewArrivals(
        newArrivalResult.status === 'fulfilled' &&
          Array.isArray(newArrivalResult.value)
          ? newArrivalResult.value
          : []
      );

      setSaleItems(
        saleResult.status === 'fulfilled' && Array.isArray(saleResult.value)
          ? saleResult.value
          : []
      );

      const countEntries = await Promise.all(
        danhMucData.slice(0, 10).map(async (cat) => {
          try {
            const products = await productService.getAll({ danhMuc: cat.ten });
            return [cat.ten, products.length] as const;
          } catch {
            return [cat.ten, 0] as const;
          }
        })
      );

      if (mounted) {
        setCategoryCounts(Object.fromEntries(countEntries));
        setCategoryCountsLoaded(true);
      }
    }

    loadHomepageData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (product: SanPham) => {
    const raw = product as any;

    const variantId =
      raw.defaultVariantId ||
      raw.bienThe?.[0]?.id ||
      raw.variants?.[0]?._id ||
      raw.variants?.[0]?.id ||
      '';

    const color =
      raw.defaultColor ||
      raw.bienThe?.[0]?.mau ||
      product.mauSac?.[0]?.ten ||
      '';

    const size =
      raw.defaultSize ||
      raw.bienThe?.[0]?.kichThuoc?.find(
        (item: any) => Number(item.stock || 0) > 0
      )?.size ||
      raw.bienThe?.[0]?.kichThuoc?.[0]?.size ||
      product.kichCo?.[0] ||
      '';

    const price = Number(raw.defaultPrice || product.gia || 0);
    const image = product.hinhAnh || '/placeholder.svg';
    const stock = Number(product.soLuongTon || 0);

    addItem(product, size, color, 1, {
      variantId,
      price,
      image,
      stock,
    });
  };

  const handleToggleWishlist = (product: SanPham) => {
    if (isInWishlist(product.id)) {
      removeWishlist(product.id);
      return;
    }

    addWishlist(product);
  };

  const slide = heroSlides[heroIndex];

  const bestSellerProducts = bestSellers
    .filter((product) => (product.daBan || 0) > 0)
    .sort((a, b) => (b.daBan || 0) - (a.daBan || 0));

  const maleBestSellerProducts = filterProductsByGender(
    bestSellerProducts,
    'nam',
    10
  );

  const femaleBestSellerProducts = filterProductsByGender(
    bestSellerProducts,
    'nu',
    10
  );

  const isAuthenticated = isLoggedIn();

  const forYouProducts = isAuthenticated
    ? buildForYouProducts({
      allProducts,
      bestSellers,
      newArrivals,
      wishlistItems,
      cartItems,
      searchHistory,
      purchasedProductIds: completedOrderProductIds,
      recentlyViewedItems,
      gender: currentUser?.gender,
      limit: 10,
    })
    : [];

  const newArrivalBase = sortProductsByNewest(
    uniqueById([...newArrivals, ...allProducts])
  );

  const maleNewArrivalProducts = filterProductsByGender(
    newArrivalBase,
    'nam',
    10
  );

  const femaleNewArrivalProducts = filterProductsByGender(
    newArrivalBase,
    'nu',
    10
  );

  const saleProducts = saleItems.slice(0, 10);
  const homepageAllProducts = allProducts.slice(0, 10);

  const visibleCategories = categoryCountsLoaded
    ? danhMucData.filter((cat) => (categoryCounts[cat.ten] ?? 0) > 0)
    : danhMucData.slice(0, 10);

  return (
    <MainLayout>
      <section className="relative h-[420px] overflow-hidden bg-primary md:h-[480px]">
        {heroSlides.map((heroSlide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${index === heroIndex ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
          >
            <img
              src={heroSlide.image}
              alt={heroSlide.title}
              className={`absolute inset-0 h-full w-full object-cover ${heroSlide.imagePosition}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/92 via-primary/68 to-primary/10" />
          </div>
        ))}

        <div className="container relative z-10 mx-auto flex h-full items-center px-4 md:px-8">
          <div className="max-w-lg">
            <h1 className="mb-3 whitespace-pre-line text-2xl font-extrabold leading-[1.1] text-primary-foreground drop-shadow-lg md:text-4xl lg:text-[3rem]">
              {slide.title}
            </h1>

            <p className="mb-5 max-w-sm text-sm leading-relaxed text-white/85 drop-shadow-sm">
              {slide.subtitle}
            </p>

            <div className="flex gap-2.5">
              <Button
                size="default"
                className="gap-1.5 rounded-full bg-accent px-6 font-bold text-accent-foreground shadow-lg hover:bg-accent/90"
                asChild
              >
                <Link to={slide.link}>
                  {slide.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="default"
                className="rounded-full border border-white/30 bg-white/15 px-5 font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/25"
                asChild
              >
                <Link to="/ai-tu-van">
                  <Bot className="mr-1 h-4 w-4" /> AI Tư vấn
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setHeroIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${index === heroIndex
                ? 'w-7 bg-accent'
                : 'w-1.5 bg-primary-foreground/30 hover:bg-primary-foreground/50'
                }`}
              aria-label={`Chuyển đến slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setHeroIndex(
              (current) => (current - 1 + heroSlides.length) % heroSlides.length
            )
          }
          className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/10 text-primary-foreground backdrop-blur-md transition-all hover:bg-background/20 md:flex"
          aria-label="Slide trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            setHeroIndex((current) => (current + 1) % heroSlides.length)
          }
          className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-background/10 text-primary-foreground backdrop-blur-md transition-all hover:bg-background/20 md:flex"
          aria-label="Slide tiếp theo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <section className="bg-primary py-2 text-primary-foreground">
        <div className="container mx-auto flex items-center justify-center gap-6 overflow-x-auto px-4 text-[11px] font-medium md:gap-10">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Zap className="h-3 w-3 text-warning" /> Miễn phí ship từ 499K
          </span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap sm:flex">
            <Gift className="h-3 w-3 text-warning" /> Đổi trả 30 ngày
          </span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap md:flex">
            <Shield className="h-3 w-3 text-warning" /> Chính hãng 100%
          </span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap lg:flex">
            <Award className="h-3 w-3 text-warning" /> Tích điểm mỗi đơn
          </span>
        </div>
      </section>

      {isAuthenticated && forYouProducts.length > 0 ? (
        <ProductSection
          title="Dành cho bạn"
          subtitle={getForYouSubtitle(currentUser?.gender)}
          products={forYouProducts}
          viewAllLink="/san-pham"
          icon={<Sparkles className="h-4 w-4 text-accent" />}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={isInWishlist}
        />
      ) : null}

      <ProductSection
        title="Sản phẩm nam bán chạy"
        subtitle="Những sản phẩm nam được mua nhiều tại MATEWEAR"
        products={maleBestSellerProducts}
        viewAllLink="/san-pham?gioiTinh=nam&sort=bestseller"
        icon={<Star className="h-4 w-4 fill-warning text-warning" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />

      <ProductSection
        title="Sản phẩm nữ bán chạy"
        subtitle="Những sản phẩm nữ được mua nhiều tại MATEWEAR"
        products={femaleBestSellerProducts}
        viewAllLink="/san-pham?gioiTinh=nu&sort=bestseller"
        icon={<Star className="h-4 w-4 fill-warning text-warning" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />

      <ProductSection
        title="Sản phẩm nam mới về"
        subtitle="Các mẫu nam mới được cập nhật tại MATEWEAR"
        products={maleNewArrivalProducts}
        viewAllLink="/san-pham?gioiTinh=nam&sort=newest"
        icon={<Clock className="h-4 w-4 text-accent" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />

      <ProductSection
        title="Sản phẩm nữ mới về"
        subtitle="Các mẫu nữ mới được cập nhật tại MATEWEAR"
        products={femaleNewArrivalProducts}
        viewAllLink="/san-pham?gioiTinh=nu&sort=newest"
        icon={<Clock className="h-4 w-4 text-accent" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />

      <ProductSection
        title="Sản phẩm đang sale"
        subtitle="Ưu đãi nổi bật trong thời gian giới hạn"
        products={saleProducts}
        viewAllLink="/san-pham?khuyenMai=true"
        icon={<Tags className="h-4 w-4 text-destructive" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />

      <ProductSection
        title="Tất cả sản phẩm"
        subtitle="Khám phá toàn bộ sản phẩm đang có"
        products={homepageAllProducts}
        viewAllLink="/san-pham"
        icon={<Package className="h-4 w-4 text-accent" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />

      <section className="bg-secondary/30 px-4 py-8">
        <div className="container mx-auto">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Danh mục sản phẩm
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Duyệt nhanh theo từng nhóm sản phẩm
              </p>
            </div>

            <Link
              to="/san-pham"
              className="flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visibleCategories.map((cat) => {
              const count = categoryCounts[cat.ten] ?? 0;

              return (
                <Link
                  key={cat.id}
                  to={`/san-pham?danhMuc=${encodeURIComponent(cat.ten)}`}
                  className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-accent/30 hover:shadow-sm"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-secondary">
                    <img
                      src={cat.hinhAnh}
                      alt={cat.ten}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-2 text-center">
                    <p className="text-[11px] font-semibold leading-tight text-foreground">
                      {cat.ten}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {count} SP
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="container mx-auto grid gap-3 md:grid-cols-2">
          <Link
            to="/san-pham?gioiTinh=nam"
            className="group relative h-52 overflow-hidden rounded-xl md:h-60"
          >
            <img
              src={bannerMen}
              alt="Thời trang Nam"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="mb-1.5 border-0 bg-accent/20 text-[10px] text-accent-foreground backdrop-blur-sm">
                Bộ sưu tập
              </Badge>
              <h3 className="mb-0.5 text-lg font-bold text-primary-foreground md:text-xl">
                Thời trang Nam
              </h3>
              <p className="mb-2 text-[11px] text-primary-foreground/65">
                Basic đến smart casual, phong cách gọn gàng và dễ mặc
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent transition-all group-hover:gap-1.5">
                Khám phá <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          <Link
            to="/san-pham?gioiTinh=nu"
            className="group relative h-52 overflow-hidden rounded-xl md:h-60"
          >
            <img
              src={bannerWomen}
              alt="Thời trang Nữ"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="mb-1.5 border-0 bg-accent/20 text-[10px] text-accent-foreground backdrop-blur-sm">
                Bộ sưu tập
              </Badge>
              <h3 className="mb-0.5 text-lg font-bold text-primary-foreground md:text-xl">
                Thời trang Nữ
              </h3>
              <p className="mb-2 text-[11px] text-primary-foreground/65">
                Thanh lịch, trẻ trung, phù hợp đi học, đi làm và dạo phố
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent transition-all group-hover:gap-1.5">
                Khám phá <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <div className="relative h-56 overflow-hidden rounded-xl md:h-64">
            <img
              src={bannerSports}
              alt="Đồ thể thao"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/40 to-transparent" />

            <div className="relative z-10 flex h-full items-center p-5 md:p-10">
              <div className="max-w-md">
                <Badge className="mb-2 border-0 bg-warning/20 text-[10px] font-semibold text-warning">
                  Thể thao
                </Badge>

                <h2 className="mb-1.5 text-xl font-extrabold leading-tight text-primary-foreground md:text-2xl lg:text-3xl">
                  Năng động mỗi ngày
                </h2>

                <p className="mb-4 max-w-sm text-[12px] text-primary-foreground/70">
                  Gym, Yoga, Chạy bộ, trang phục thể thao thoải mái và dễ phối.
                </p>

                <Button
                  size="sm"
                  className="gap-1.5 rounded-full bg-accent px-5 font-bold text-accent-foreground shadow-lg hover:bg-accent/90"
                  asChild
                >
                  <Link to="/san-pham?danhMuc=Đồ Thể Thao">
                    Mua ngay <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/30 px-4 py-8">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-xl bg-primary">
            <img
              src={aiAssistant}
              alt="AI Tư vấn"
              className="absolute inset-0 h-full w-full object-cover opacity-20"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/50" />

            <div className="relative z-10 grid gap-5 p-5 md:p-8 lg:grid-cols-2 lg:p-10">
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/15 px-2.5 py-1">
                  <Bot className="h-3 w-3 text-accent" />
                  <span className="text-[11px] font-semibold text-accent">
                    Trợ lý AI thông minh
                  </span>
                </div>

                <h2 className="mb-2 text-xl font-extrabold leading-tight text-primary-foreground md:text-2xl">
                  Mua sắm thông minh
                  <br />
                  cùng AI Assistant
                </h2>

                <p className="mb-4 max-w-md text-[12px] leading-relaxed text-primary-foreground/65">
                  Tìm sản phẩm phù hợp, tư vấn size và giải đáp thắc mắc mua sắm nhanh chóng.
                </p>

                <div className="mb-5 flex flex-wrap gap-1.5">
                  {[
                    'Gợi ý áo polo nam dưới 400k',
                    'Mình cao 1m72 mặc size gì?',
                    'Sản phẩm nào đang sale?',
                  ].map((prompt) => (
                    <Link
                      key={prompt}
                      to="/ai-tu-van"
                      className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      "{prompt}"
                    </Link>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="gap-1.5 rounded-full bg-accent px-5 font-bold text-accent-foreground shadow-lg hover:bg-accent/90"
                  asChild
                >
                  <Link to="/ai-tu-van">
                    <Bot className="h-3.5 w-3.5" /> Nhờ AI tư vấn
                  </Link>
                </Button>
              </div>

              <div className="hidden grid-cols-2 gap-2.5 lg:grid">
                {[
                  {
                    icon: Shirt,
                    title: 'Gợi ý sản phẩm',
                    desc: 'Tìm sản phẩm theo nhu cầu và ngân sách',
                  },
                  {
                    icon: Ruler,
                    title: 'Tư vấn size',
                    desc: 'Gợi ý size dựa trên chiều cao, cân nặng',
                  },
                  {
                    icon: MessageCircle,
                    title: 'Hỗ trợ mua sắm',
                    desc: 'Tư vấn nhanh trong quá trình chọn hàng',
                  },
                  {
                    icon: HelpCircle,
                    title: 'Giải đáp chính sách',
                    desc: 'Hỏi về vận chuyển, đổi trả và thanh toán',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-primary-foreground/10 bg-primary-foreground/8 p-3.5 backdrop-blur-md transition-colors hover:bg-primary-foreground/12"
                  >
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                      <item.icon className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <h3 className="mb-0.5 text-[11px] font-bold text-primary-foreground">
                      {item.title}
                    </h3>
                    <p className="text-[10px] leading-relaxed text-primary-foreground/55">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}