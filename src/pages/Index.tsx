import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Star, ChevronLeft, ChevronRight, Gift, Award, Shield, Zap, Users, Package, ThumbsUp, Sparkles, Shirt, Ruler, MessageCircle, HelpCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/ProductCard';
import { productService } from '@/services/api/productService';
import { SanPham } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { danhMucData } from '@/data/categories';

import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import hero3 from '@/assets/hero-3.jpg';
import bannerMen from '@/assets/banner-men.jpg';
import bannerWomen from '@/assets/banner-women.jpg';
import bannerSports from '@/assets/banner-sports.jpg';
import aiAssistant from '@/assets/ai-assistant.jpg';
import brandStory from '@/assets/brand-story.jpg';

const heroSlides = [
  { title: 'Mùa hè năng động\ncùng MATEWEAR', subtitle: 'BST Xuân Hè 2024 — Ưu đãi đến 50% cho thành viên mới.', cta: 'Mua ngay', image: hero1 },
  { title: 'Thể thao phong cách\ngiá siêu tốt', subtitle: 'Gym, Yoga, Pickleball — Đồ thể thao cao cấp. Giảm 30%.', cta: 'Khám phá', image: hero2 },
  { title: 'AI tư vấn thời trang\ncho riêng bạn', subtitle: 'Trợ lý AI gợi ý outfit dựa trên phong cách và số đo.', cta: 'Thử AI ngay', image: hero3 },
];

export default function Index() {
  const [featured, setFeatured] = useState<SanPham[]>([]);
  const [bestSellers, setBestSellers] = useState<SanPham[]>([]);
  const [newArrivals, setNewArrivals] = useState<SanPham[]>([]);
  const [saleItems, setSaleItems] = useState<SanPham[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const { addItem } = useCart();
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    productService.getFeatured().then(setFeatured);
    productService.getBestSellers().then(setBestSellers);
    productService.getNewArrivals().then(setNewArrivals);
    productService.getSaleItems().then(setSaleItems);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleAddToCart = (p: SanPham) => addItem(p, p.mauSac[0]?.ten || '', p.kichCo[0] || '');
  const handleToggleWishlist = (p: SanPham) => isInWishlist(p.id) ? removeWishlist(p.id) : addWishlist(p);

  const slide = heroSlides[heroIndex];

  return (
    <MainLayout>
      {/* HERO — reduced height, tighter */}
      <section className="relative h-[420px] md:h-[480px] overflow-hidden bg-primary">
        {heroSlides.map((s, i) => (
          <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === heroIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/50 to-transparent" />
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
              <Button size="default" className="rounded-full px-6 font-bold shadow-lg gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                <Link to="/san-pham">{slide.cta} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="default" className="rounded-full px-5 font-semibold bg-white/15 border border-white/30 text-white hover:bg-white/25 backdrop-blur-md transition-all shadow-sm" asChild>
                <Link to="/ai-tu-van"><Bot className="h-4 w-4 mr-1" /> AI Tư vấn</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setHeroIndex(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-7 bg-accent' : 'w-1.5 bg-primary-foreground/30 hover:bg-primary-foreground/50'}`} />
          ))}
        </div>
        <button onClick={() => setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/10 backdrop-blur-md flex items-center justify-center text-primary-foreground hover:bg-background/20 transition-all hidden md:flex z-20">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button onClick={() => setHeroIndex(i => (i + 1) % heroSlides.length)} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/10 backdrop-blur-md flex items-center justify-center text-primary-foreground hover:bg-background/20 transition-all hidden md:flex z-20">
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      {/* Trust strip */}
      <section className="bg-primary text-primary-foreground py-2">
        <div className="container mx-auto flex items-center justify-center gap-6 md:gap-10 text-[11px] font-medium px-4 overflow-x-auto">
          <span className="flex items-center gap-1.5 whitespace-nowrap"><Zap className="h-3 w-3 text-warning" /> Miễn phí ship từ 499K</span>
          <span className="hidden sm:flex items-center gap-1.5 whitespace-nowrap"><Gift className="h-3 w-3 text-warning" /> Đổi trả 30 ngày</span>
          <span className="hidden md:flex items-center gap-1.5 whitespace-nowrap"><Shield className="h-3 w-3 text-warning" /> Chính hãng 100%</span>
          <span className="hidden lg:flex items-center gap-1.5 whitespace-nowrap"><Award className="h-3 w-3 text-warning" /> Tích điểm mỗi đơn</span>
        </div>
      </section>

      {/* CATEGORIES — functional shopping entry */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Danh mục sản phẩm</h2>
            <Link to="/san-pham" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">Tất cả <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2.5">
            {danhMucData.slice(0, 10).map(cat => (
              <Link key={cat.id} to={`/san-pham?danhMuc=${encodeURIComponent(cat.ten)}`} className="group relative rounded-lg overflow-hidden border border-border bg-card hover:border-accent/30 hover:shadow-sm transition-all">
                <div className="aspect-[4/5] overflow-hidden bg-secondary">
                  <img src={cat.hinhAnh} alt={cat.ten} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-2 text-center">
                  <p className="text-[11px] font-semibold text-foreground leading-tight">{cat.ten}</p>
                  <p className="text-[10px] text-muted-foreground">{cat.soSanPham} SP</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* COLLECTION BANNERS — aspirational */}
      <section className="px-4 pb-2">
        <div className="container mx-auto grid md:grid-cols-2 gap-3">
          <Link to="/san-pham?gioiTinh=nam" className="group relative rounded-xl overflow-hidden h-52 md:h-60">
            <img src={bannerMen} alt="Thời trang Nam" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="mb-1.5 bg-accent/20 text-accent-foreground border-0 backdrop-blur-sm text-[10px]">Bộ sưu tập</Badge>
              <h3 className="text-lg md:text-xl font-bold text-primary-foreground mb-0.5">Thời trang Nam</h3>
              <p className="text-primary-foreground/65 text-[11px] mb-2">Basic đến smart casual — Phong cách lịch lãm</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent group-hover:gap-1.5 transition-all">Khám phá <ArrowRight className="h-3 w-3" /></span>
            </div>
          </Link>
          <Link to="/san-pham?gioiTinh=nu" className="group relative rounded-xl overflow-hidden h-52 md:h-60">
            <img src={bannerWomen} alt="Thời trang Nữ" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="mb-1.5 bg-accent/20 text-accent-foreground border-0 backdrop-blur-sm text-[10px]">Bộ sưu tập</Badge>
              <h3 className="text-lg md:text-xl font-bold text-primary-foreground mb-0.5">Thời trang Nữ</h3>
              <p className="text-primary-foreground/65 text-[11px] mb-2">Thanh lịch, trẻ trung — Công sở & dạo phố</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent group-hover:gap-1.5 transition-all">Khám phá <ArrowRight className="h-3 w-3" /></span>
            </div>
          </Link>
        </div>
      </section>

      {/* FEATURED — curated bestseller, fewer products, editorial feel */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Star className="h-4 w-4 fill-warning text-warning" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-foreground leading-tight">Bán chạy nhất</h2>
                <p className="text-[11px] text-muted-foreground">Top sản phẩm được yêu thích tuần này</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-[11px] text-accent hover:text-accent font-semibold hidden sm:flex" asChild>
              <Link to="/san-pham">Xem tất cả <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
            {featured.slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* SPORTS CAMPAIGN — compact */}
      <section className="px-4 pb-2">
        <div className="container mx-auto">
          <div className="relative rounded-xl overflow-hidden h-56 md:h-64">
            <img src={bannerSports} alt="Đồ thể thao" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/40 to-transparent" />
            <div className="relative z-10 h-full flex items-center p-5 md:p-10">
              <div className="max-w-md">
                <Badge className="mb-2 bg-warning/20 text-warning border-0 font-semibold text-[10px]">⚡ Thể thao</Badge>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-primary-foreground mb-1.5 leading-tight">Năng động mỗi ngày</h2>
                <p className="text-[12px] text-primary-foreground/70 mb-4 max-w-sm">Gym, Yoga, Chạy bộ — Trang phục thể thao cao cấp. Giảm đến 30%.</p>
                <Button size="sm" className="rounded-full px-5 font-bold shadow-lg gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                  <Link to="/san-pham?danhMuc=Đồ Thể Thao">Mua ngay <ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DISCOVER — denser browse grid with tabs */}
      <section className="py-8 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <Tabs defaultValue="ban-chay" className="w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-foreground leading-tight">Khám phá sản phẩm</h2>
                  <p className="text-[11px] text-muted-foreground">Lọc nhanh theo xu hướng</p>
                </div>
              </div>
              <TabsList className="h-auto p-0.5 gap-0.5 bg-background shadow-sm border border-border">
                <TabsTrigger value="ban-chay" className="px-3 py-1.5 text-[11px] font-medium data-[state=active]:shadow-sm">🔥 Bán chạy</TabsTrigger>
                <TabsTrigger value="moi-ve" className="px-3 py-1.5 text-[11px] font-medium data-[state=active]:shadow-sm">✨ Mới về</TabsTrigger>
                <TabsTrigger value="sale" className="px-3 py-1.5 text-[11px] font-medium data-[state=active]:shadow-sm">🏷️ Sale</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="ban-chay">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {bestSellers.slice(0, 10).map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />)}
              </div>
            </TabsContent>
            <TabsContent value="moi-ve">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {newArrivals.slice(0, 10).map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />)}
              </div>
            </TabsContent>
            <TabsContent value="sale">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {saleItems.slice(0, 10).map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* AI SECTION — single premium block */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-xl overflow-hidden bg-primary">
            <img src={aiAssistant} alt="AI Tư vấn" className="absolute inset-0 w-full h-full object-cover opacity-20" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/50" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-5 p-5 md:p-8 lg:p-10">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 border border-accent/25 px-2.5 py-1 mb-3">
                  <Bot className="h-3 w-3 text-accent" />
                  <span className="text-[11px] font-semibold text-accent">Trợ lý AI thông minh</span>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-primary-foreground mb-2 leading-tight">
                  Mua sắm thông minh<br />cùng AI Assistant
                </h2>
                <p className="text-primary-foreground/65 text-[12px] mb-4 max-w-md leading-relaxed">
                  Tìm sản phẩm phù hợp, tư vấn size chính xác, giải đáp mọi thắc mắc — tức thì, 24/7.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {['Gợi ý áo polo nam dưới 400k', 'Mình cao 1m72 mặc size gì?', 'Tư vấn outfit đi học'].map(prompt => (
                    <Link key={prompt} to="/ai-tu-van" className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/20 transition-colors">
                      "{prompt}"
                    </Link>
                  ))}
                </div>
                <Button size="sm" className="rounded-full px-5 gap-1.5 font-bold shadow-lg bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                  <Link to="/ai-tu-van"><Bot className="h-3.5 w-3.5" /> Nhờ AI tư vấn</Link>
                </Button>
              </div>
              <div className="hidden lg:grid grid-cols-2 gap-2.5">
                {[
                  { icon: Shirt, title: 'Gợi ý sản phẩm', desc: 'Outfit phù hợp phong cách & ngân sách' },
                  { icon: Ruler, title: 'Tư vấn size', desc: 'Nhập chiều cao, cân nặng → size chính xác' },
                  { icon: MessageCircle, title: 'Hỗ trợ mua sắm', desc: 'Chính sách, vận chuyển, đổi trả' },
                  { icon: HelpCircle, title: 'Giải đáp nhanh', desc: 'Thanh toán, bảo hành, khuyến mãi' },
                ].map(uc => (
                  <div key={uc.title} className="rounded-lg bg-primary-foreground/8 backdrop-blur-md border border-primary-foreground/10 p-3.5 hover:bg-primary-foreground/12 transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20 mb-2">
                      <uc.icon className="h-3.5 w-3.5 text-accent" />
                    </div>
                    <h3 className="text-[11px] font-bold text-primary-foreground mb-0.5">{uc.title}</h3>
                    <p className="text-[10px] text-primary-foreground/55 leading-relaxed">{uc.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST METRICS — compact horizontal bar, replaces oversized membership */}
      <section className="py-6 px-4 border-y border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Gift, title: 'Tích điểm đổi quà', desc: 'Mỗi đơn hàng tích điểm', color: 'text-accent' },
              { icon: Award, title: 'Ưu đãi VIP', desc: 'Giảm giá riêng cho thành viên', color: 'text-warning' },
              { icon: Zap, title: 'Quà sinh nhật', desc: 'Voucher & quà tặng bất ngờ', color: 'text-success' },
              { icon: Shield, title: 'Hoàn tiền linh hoạt', desc: 'Hoàn trực tiếp vào ví', color: 'text-destructive' },
            ].map(b => (
              <div key={b.title} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                <div className={`flex-shrink-0 h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${b.color}`}>
                  <b.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-foreground">{b.title}</p>
                  <p className="text-[10px] text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: Users, value: '50,000+', label: 'Khách hàng' },
              { icon: Package, value: '10,000+', label: 'Đơn/tháng' },
              { icon: ThumbsUp, value: '95%', label: 'Hài lòng' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-center gap-2 py-2">
                <m.icon className="h-4 w-4 text-accent" />
                <span className="text-sm font-extrabold text-foreground">{m.value}</span>
                <span className="text-[10px] text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BRAND STORY — compact */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-5 gap-5 items-center">
            <div className="md:col-span-2 rounded-xl overflow-hidden">
              <img src={brandStory} alt="Mặc đẹp và sống xanh" className="w-full h-48 md:h-56 object-cover" loading="lazy" />
            </div>
            <div className="md:col-span-3">
              <Sparkles className="h-4 w-4 text-success mb-2" />
              <h2 className="text-lg font-bold mb-2 text-foreground">Mặc đẹp và sống xanh</h2>
              <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
                MATEWEAR cam kết sử dụng chất liệu thân thiện môi trường, quy trình sản xuất bền vững và đóng gói tái chế. Mỗi sản phẩm bạn chọn đều góp phần bảo vệ hành tinh.
              </p>
              <Button variant="outline" size="sm" className="rounded-full gap-1 text-[11px] h-8" asChild>
                <Link to="/">Tìm hiểu thêm <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
