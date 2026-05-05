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
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/ProductCard';
import { productService } from '@/services/api/productService';
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
    imagePosition: 'object-center'
  },
  {
    title: 'Năng động hơn\nvới đồ thể thao',
    subtitle: 'Trang phục thoải mái cho tập luyện, di chuyển và sinh hoạt hằng ngày.',
    cta: 'Khám phá',
    link: '/san-pham?danhMuc=Đồ Thể Thao',
    image: hero2,
    imagePosition: 'object-center'
  },
  {
    title: 'Ưu đãi nổi bật\nđang chờ bạn',
    subtitle: 'Chọn nhanh các sản phẩm đang giảm giá tại MATEWEAR.',
    cta: 'Xem sale',
    link: '/san-pham?khuyenMai=true',
    image: hero3,
    imagePosition: 'object-center'
  }
];

function uniqueById(items: SanPham[]) {
  const map = new Map<string, SanPham>();

  items.forEach((item) => {
    if (item?.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

function fillToLimit(primary: SanPham[], fallback: SanPham[], limit = 10) {
  return uniqueById([...primary, ...fallback]).slice(0, limit);
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
  isWishlisted
}: ProductSectionProps) {
  if (!products.length) return null;

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              {icon}
            </div>

            <div>
              <h2 className="text-base md:text-lg font-bold text-foreground leading-tight">
                {title}
              </h2>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-[11px] text-accent hover:text-accent font-semibold hidden sm:flex"
            asChild
          >
            <Link to={viewAllLink}>
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
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
          <Button variant="outline" size="sm" className="rounded-full text-xs" asChild>
            <Link to={viewAllLink}>
              Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const [allProducts, setAllProducts] = useState<SanPham[]>([]);
  const [forYouProducts, setForYouProducts] = useState<SanPham[]>([]);
  const [bestSellers, setBestSellers] = useState<SanPham[]>([]);
  const [newArrivals, setNewArrivals] = useState<SanPham[]>([]);
  const [saleItems, setSaleItems] = useState<SanPham[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [categoryCountsLoaded, setCategoryCountsLoaded] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  const { addItem } = useCart();
  const {
    addItem: addWishlist,
    removeItem: removeWishlist,
    isInWishlist
  } = useWishlist();

  useEffect(() => {
    let mounted = true;

    async function loadHomepageData() {
      const [allResult, forYouResult, bestSellerResult, newArrivalResult, saleResult] =
        await Promise.allSettled([
          productService.getAll(),
          productService.getForYou(10),
          productService.getBestSellers(),
          productService.getNewArrivals(),
          productService.getSaleItems()
        ]);

      if (!mounted) return;

      const all =
        allResult.status === 'fulfilled' && Array.isArray(allResult.value)
          ? allResult.value
          : [];

      setAllProducts(all);

      setForYouProducts(
        forYouResult.status === 'fulfilled' && Array.isArray(forYouResult.value)
          ? forYouResult.value
          : []
      );

      setBestSellers(
        bestSellerResult.status === 'fulfilled' && Array.isArray(bestSellerResult.value)
          ? bestSellerResult.value
          : []
      );

      setNewArrivals(
        newArrivalResult.status === 'fulfilled' && Array.isArray(newArrivalResult.value)
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
    const color = raw.defaultColor || product.mauSac?.[0]?.ten || '';
    const size = raw.defaultSize || product.kichCo?.[0] || '';

    addItem(product, color, size);
  };

  const handleToggleWishlist = (product: SanPham) => {
    if (isInWishlist(product.id)) {
      removeWishlist(product.id);
      return;
    }

    addWishlist(product);
  };

  const slide = heroSlides[heroIndex];

  const forYouDisplayProducts = uniqueById(forYouProducts).slice(0, 10);

  const bestSellerProducts = bestSellers
    .filter((product) => (product.daBan || 0) > 0)
    .sort((a, b) => (b.daBan || 0) - (a.daBan || 0))
    .slice(0, 10);

  const newArrivalProducts = fillToLimit(newArrivals, allProducts, 10);
  const saleProducts = saleItems.slice(0, 10);
  const homepageAllProducts = allProducts.slice(0, 10);

  const visibleCategories = categoryCountsLoaded
    ? danhMucData.filter((cat) => (categoryCounts[cat.ten] ?? 0) > 0)
    : danhMucData.slice(0, 10);

  return (
    <MainLayout>
      <section className="relative h-[420px] md:h-[480px] overflow-hidden bg-primary">
        {heroSlides.map((heroSlide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${index === heroIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
          >
            <img
              src={heroSlide.image}
              alt={heroSlide.title}
              className={`absolute inset-0 w-full h-full object-cover ${heroSlide.imagePosition}`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/92 via-primary/68 to-primary/10" />
          </div>
        ))}

        <div className="relative z-10 container mx-auto h-full flex items-center px-4 md:px-8">
          <div className="max-w-lg">
            <h1 className="text-2xl md:text-4xl lg:text-[3rem] font-extrabold text-primary-foreground leading-[1.1] mb-3 whitespace-pre-line drop-shadow-lg">
              {slide.title}
            </h1>

            <p className="text-sm text-white/85 mb-5 max-w-sm leading-relaxed drop-shadow-sm">
              {slide.subtitle}
            </p>

            <div className="flex gap-2.5">
              <Button
                size="default"
                className="rounded-full px-6 font-bold shadow-lg gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
                asChild
              >
                <Link to={slide.link}>
                  {slide.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="default"
                className="rounded-full px-5 font-semibold bg-white/15 border border-white/30 text-white hover:bg-white/25 backdrop-blur-md transition-all shadow-sm"
                asChild
              >
                <Link to="/ai-tu-van">
                  <Bot className="h-4 w-4 mr-1" /> AI Tư vấn
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
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
          onClick={() => setHeroIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/10 backdrop-blur-md items-center justify-center text-primary-foreground hover:bg-background/20 transition-all hidden md:flex z-20"
          aria-label="Slide trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setHeroIndex((current) => (current + 1) % heroSlides.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/10 backdrop-blur-md items-center justify-center text-primary-foreground hover:bg-background/20 transition-all hidden md:flex z-20"
          aria-label="Slide tiếp theo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <section className="bg-primary text-primary-foreground py-2">
        <div className="container mx-auto flex items-center justify-center gap-6 md:gap-10 text-[11px] font-medium px-4 overflow-x-auto">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Zap className="h-3 w-3 text-warning" /> Miễn phí ship từ 499K
          </span>
          <span className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
            <Gift className="h-3 w-3 text-warning" /> Đổi trả 30 ngày
          </span>
          <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap">
            <Shield className="h-3 w-3 text-warning" /> Chính hãng 100%
          </span>
          <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap">
            <Award className="h-3 w-3 text-warning" /> Tích điểm mỗi đơn
          </span>
        </div>
      </section>

      <ProductSection
        title="Dành cho bạn"
        subtitle="Gợi ý dựa trên giỏ hàng, yêu thích, lịch sử mua và sản phẩm đã xem"
        products={forYouDisplayProducts}
        viewAllLink="/san-pham"
        icon={<Bot className="h-4 w-4 text-accent" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />
      
      <ProductSection
        title="Sản phẩm bán chạy"
        subtitle="Sắp xếp theo số lượng sản phẩm đã bán"
        products={bestSellerProducts}
        viewAllLink="/san-pham?sort=bestseller"
        icon={<Star className="h-4 w-4 fill-warning text-warning" />}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={isInWishlist}
      />

      <ProductSection
        title="Sản phẩm mới về"
        subtitle="Cập nhật những mẫu mới nhất tại MATEWEAR"
        products={newArrivalProducts}
        viewAllLink="/san-pham?sort=newest"
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

      <section className="py-8 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Danh mục sản phẩm</h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                Duyệt nhanh theo từng nhóm sản phẩm
              </p>
            </div>

            <Link
              to="/san-pham"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              Tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {visibleCategories.map((cat) => {
              const count = categoryCounts[cat.ten] ?? 0;

              return (
                <Link
                  key={cat.id}
                  to={`/san-pham?danhMuc=${encodeURIComponent(cat.ten)}`}
                  className="group relative rounded-lg overflow-hidden border border-border bg-card hover:border-accent/30 hover:shadow-sm transition-all"
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
                    <p className="text-[11px] font-semibold text-foreground leading-tight">
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

      <section className="py-8 px-4">
        <div className="container mx-auto grid md:grid-cols-2 gap-3">
          <Link
            to="/san-pham?gioiTinh=nam"
            className="group relative rounded-xl overflow-hidden h-52 md:h-60"
          >
            <img
              src={bannerMen}
              alt="Thời trang Nam"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="mb-1.5 bg-accent/20 text-accent-foreground border-0 backdrop-blur-sm text-[10px]">
                Bộ sưu tập
              </Badge>
              <h3 className="text-lg md:text-xl font-bold text-primary-foreground mb-0.5">
                Thời trang Nam
              </h3>
              <p className="text-primary-foreground/65 text-[11px] mb-2">
                Basic đến smart casual, phong cách gọn gàng và dễ mặc
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent group-hover:gap-1.5 transition-all">
                Khám phá <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          <Link
            to="/san-pham?gioiTinh=nu"
            className="group relative rounded-xl overflow-hidden h-52 md:h-60"
          >
            <img
              src={bannerWomen}
              alt="Thời trang Nữ"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="mb-1.5 bg-accent/20 text-accent-foreground border-0 backdrop-blur-sm text-[10px]">
                Bộ sưu tập
              </Badge>
              <h3 className="text-lg md:text-xl font-bold text-primary-foreground mb-0.5">
                Thời trang Nữ
              </h3>
              <p className="text-primary-foreground/65 text-[11px] mb-2">
                Thanh lịch, trẻ trung, phù hợp đi học, đi làm và dạo phố
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent group-hover:gap-1.5 transition-all">
                Khám phá <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="container mx-auto">
          <div className="relative rounded-xl overflow-hidden h-56 md:h-64">
            <img
              src={bannerSports}
              alt="Đồ thể thao"
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/40 to-transparent" />

            <div className="relative z-10 h-full flex items-center p-5 md:p-10">
              <div className="max-w-md">
                <Badge className="mb-2 bg-warning/20 text-warning border-0 font-semibold text-[10px]">
                  Thể thao
                </Badge>

                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-primary-foreground mb-1.5 leading-tight">
                  Năng động mỗi ngày
                </h2>

                <p className="text-[12px] text-primary-foreground/70 mb-4 max-w-sm">
                  Gym, Yoga, Chạy bộ, trang phục thể thao thoải mái và dễ phối.
                </p>

                <Button
                  size="sm"
                  className="rounded-full px-5 font-bold shadow-lg gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground"
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

      <section className="py-8 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="relative rounded-xl overflow-hidden bg-primary">
            <img
              src={aiAssistant}
              alt="AI Tư vấn"
              className="absolute inset-0 w-full h-full object-cover opacity-20"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/50" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-5 p-5 md:p-8 lg:p-10">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/25 px-2.5 py-1 mb-3">
                  <Bot className="h-3 w-3 text-accent" />
                  <span className="text-[11px] font-semibold text-accent">
                    Trợ lý AI thông minh
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-extrabold text-primary-foreground mb-2 leading-tight">
                  Mua sắm thông minh
                  <br />
                  cùng AI Assistant
                </h2>

                <p className="text-primary-foreground/65 text-[12px] mb-4 max-w-md leading-relaxed">
                  Tìm sản phẩm phù hợp, tư vấn size và giải đáp thắc mắc mua sắm nhanh chóng.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {[
                    'Gợi ý áo polo nam dưới 400k',
                    'Mình cao 1m72 mặc size gì?',
                    'Sản phẩm nào đang sale?'
                  ].map((prompt) => (
                    <Link
                      key={prompt}
                      to="/ai-tu-van"
                      className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/20 transition-colors"
                    >
                      "{prompt}"
                    </Link>
                  ))}
                </div>

                <Button
                  size="sm"
                  className="rounded-full px-5 gap-1.5 font-bold shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground"
                  asChild
                >
                  <Link to="/ai-tu-van">
                    <Bot className="h-3.5 w-3.5" /> Nhờ AI tư vấn
                  </Link>
                </Button>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-2.5">
                {[
                  {
                    icon: Shirt,
                    title: 'Gợi ý sản phẩm',
                    desc: 'Tìm sản phẩm theo nhu cầu và ngân sách'
                  },
                  {
                    icon: Ruler,
                    title: 'Tư vấn size',
                    desc: 'Gợi ý size dựa trên chiều cao, cân nặng'
                  },
                  {
                    icon: MessageCircle,
                    title: 'Hỗ trợ mua sắm',
                    desc: 'Tư vấn nhanh trong quá trình chọn hàng'
                  },
                  {
                    icon: HelpCircle,
                    title: 'Giải đáp chính sách',
                    desc: 'Hỏi về vận chuyển, đổi trả và thanh toán'
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg bg-primary-foreground/8 backdrop-blur-md border border-primary-foreground/10 p-3.5 hover:bg-primary-foreground/12 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 mb-2">
                      <item.icon className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <h3 className="text-[11px] font-bold text-primary-foreground mb-0.5">
                      {item.title}
                    </h3>
                    <p className="text-[10px] text-primary-foreground/55 leading-relaxed">
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