import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Star, ShoppingBag, ChevronLeft, ChevronRight, Gift, Award, Shield, Zap, Users, Package, ThumbsUp, Leaf } from 'lucide-react';
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
import { formatPrice } from '@/utils/format';

const heroSlides = [
  { title: 'Mùa hè năng động cùng MATEWEAR', subtitle: 'Bộ sưu tập Xuân Hè 2024 đã có mặt. Ưu đãi đến 50% cho thành viên mới.', cta: 'Mua ngay', bg: 'from-primary/90 to-accent/90' },
  { title: 'Thể thao phong cách, giá siêu tốt', subtitle: 'Đồ thể thao cao cấp — Gym, Yoga, Pickleball. Giảm ngay 30%.', cta: 'Khám phá', bg: 'from-accent/90 to-primary/80' },
  { title: 'AI tư vấn thời trang cho bạn', subtitle: 'Để trợ lý AI gợi ý outfit hoàn hảo dựa trên phong cách và số đo của bạn.', cta: 'Thử AI ngay', bg: 'from-primary to-accent/70' },
];

const recentActivities = [
  'Ngọc Anh vừa mua Áo Polo Basic Nam',
  'Minh Khang đánh giá 5 sao cho Quần Short Thể Thao',
  'Thu Hà thêm Set Đồ Thể Thao Nữ vào giỏ hàng',
  'Đức Huy vừa đặt hàng Quần Jean Slim Fit',
  'Phương Linh đánh giá 5 sao cho Legging Thể Thao Nữ',
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
      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className={`bg-gradient-to-br ${slide.bg} transition-all duration-700 py-20 md:py-32 px-4`}>
          <div className="container mx-auto max-w-3xl text-center text-primary-foreground animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{slide.title}</h1>
            <p className="text-lg md:text-xl mb-8 text-primary-foreground/80">{slide.subtitle}</p>
            <Button size="lg" variant="secondary" className="gap-2 font-semibold text-base rounded-full px-8" asChild>
              <Link to="/san-pham">{slide.cta} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setHeroIndex(i)} className={`h-2 rounded-full transition-all ${i === heroIndex ? 'w-8 bg-primary-foreground' : 'w-2 bg-primary-foreground/40'}`} />
          ))}
        </div>
        <button onClick={() => setHeroIndex(i => (i - 1 + heroSlides.length) % heroSlides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/20 flex items-center justify-center text-primary-foreground hover:bg-background/40 transition-colors hidden md:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => setHeroIndex(i => (i + 1) % heroSlides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/20 flex items-center justify-center text-primary-foreground hover:bg-background/40 transition-colors hidden md:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      </section>

      {/* 2. Quick Categories */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Danh mục sản phẩm</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {danhMucData.slice(0, 10).map(cat => (
              <Link key={cat.id} to={`/san-pham?danhMuc=${encodeURIComponent(cat.ten)}`} className="group rounded-xl border border-border bg-card p-4 text-center hover:shadow-md hover:border-accent/30 transition-all">
                <div className="mx-auto mb-3 h-16 w-16 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <ShoppingBag className="h-7 w-7 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground">{cat.ten}</p>
                <p className="text-xs text-muted-foreground">{cat.soSanPham} sản phẩm</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Dual Promo Banners */}
      <section className="py-8 px-4">
        <div className="container mx-auto grid md:grid-cols-2 gap-4">
          <Link to="/san-pham?gioiTinh=nam" className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-8 md:p-12 text-primary-foreground hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-bold mb-2">Thời trang Nam</h3>
            <p className="text-primary-foreground/80 mb-4">Phong cách lịch lãm, nam tính</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">Khám phá <ArrowRight className="h-4 w-4" /></span>
          </Link>
          <Link to="/san-pham?gioiTinh=nu" className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent to-accent/80 p-8 md:p-12 text-accent-foreground hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-bold mb-2">Thời trang Nữ</h3>
            <p className="text-accent-foreground/80 mb-4">Thanh lịch, trẻ trung, tự tin</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">Khám phá <ArrowRight className="h-4 w-4" /></span>
          </Link>
        </div>
      </section>

      {/* 4. Sports Campaign */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="rounded-2xl bg-gradient-to-r from-accent to-accent/70 p-8 md:p-14 text-accent-foreground">
            <Badge className="mb-4 bg-accent-foreground/20 text-accent-foreground border-0">⚡ Thể thao</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Năng động mỗi ngày</h2>
            <p className="text-lg text-accent-foreground/80 mb-6 max-w-lg">Gym, Yoga, Pickleball, Chạy bộ — Trang phục thể thao cao cấp với công nghệ vải hiện đại. Giảm đến 30%!</p>
            <Button size="lg" variant="secondary" className="rounded-full px-8 font-semibold" asChild>
              <Link to="/san-pham?danhMuc=Đồ Thể Thao">Mua đồ thể thao <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Featured Products */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Sản phẩm nổi bật</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Product Tabs */}
      <section className="py-12 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <Tabs defaultValue="ban-chay" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="h-auto p-1 gap-1">
                <TabsTrigger value="ban-chay" className="px-6 py-2">🔥 Bán chạy</TabsTrigger>
                <TabsTrigger value="moi-ve" className="px-6 py-2">✨ Mới về</TabsTrigger>
                <TabsTrigger value="sale" className="px-6 py-2">🏷️ Sale hot</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="ban-chay">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {bestSellers.slice(0, 8).map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />)}
              </div>
            </TabsContent>
            <TabsContent value="moi-ve">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {newArrivals.slice(0, 8).map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />)}
              </div>
            </TabsContent>
            <TabsContent value="sale">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {saleItems.slice(0, 8).map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} isWishlisted={isInWishlist(p.id)} />)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* 7. AI Recommendation */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 mb-4">
            <Bot className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Tính năng AI</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">AI gợi ý cho bạn</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Trợ lý AI thông minh sẽ gợi ý sản phẩm phù hợp với phong cách và nhu cầu của bạn.</p>
          <Button size="lg" className="rounded-full px-8 gap-2" asChild>
            <Link to="/ai-tu-van"><Bot className="h-5 w-5" /> Nhờ AI tư vấn</Link>
          </Button>
        </div>
      </section>

      {/* 8. Membership */}
      <section className="py-12 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Đặc quyền thành viên</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Gift, title: 'Tích điểm', desc: 'Mỗi đơn hàng tích điểm đổi voucher' },
              { icon: Award, title: 'Ưu đãi VIP', desc: 'Giảm giá riêng cho thành viên' },
              { icon: Zap, title: 'Quà sinh nhật', desc: 'Voucher đặc biệt ngày sinh nhật' },
              { icon: Shield, title: 'Hoàn tiền', desc: 'Hoàn tiền khi tích đủ điểm' },
            ].map(b => (
              <div key={b.title} className="rounded-xl border border-border bg-card p-5 text-center hover:shadow-md transition-shadow">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <b.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
          {/* Trust metrics */}
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: Users, value: '50,000+', label: 'Khách hàng' },
              { icon: Package, value: '10,000+', label: 'Đơn hàng' },
              { icon: ThumbsUp, value: '95%', label: 'Hài lòng' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-3">
                <m.icon className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-xl font-bold text-foreground">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Brand Story */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <Leaf className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">Sống xanh</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">Mặc đẹp và sống xanh</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">MATEWEAR cam kết sử dụng chất liệu thân thiện với môi trường, quy trình sản xuất bền vững và đóng gói tái chế. Cùng MATEWEAR lan tỏa lối sống xanh qua thời trang hàng ngày.</p>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/">Tìm hiểu thêm</Link>
          </Button>
        </div>
      </section>

      {/* 10. Social Proof */}
      <section className="py-10 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-lg font-semibold text-center mb-6">Hoạt động mua sắm gần đây</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {recentActivities.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <Star className="h-3.5 w-3.5 text-warning" />
                <span className="text-muted-foreground">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
