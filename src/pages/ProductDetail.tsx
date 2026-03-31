import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Star, Heart, ShoppingBag, Minus, Plus, Bot, Truck, RotateCcw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/ProductCard';
import { productService } from '@/services/api/productService';
import { SanPham, DanhGiaSanPham } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatPrice, getDiscountPercent, formatDate } from '@/utils/format';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<SanPham | null>(null);
  const [related, setRelated] = useState<SanPham[]>([]);
  const [reviews, setReviews] = useState<DanhGiaSanPham[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    productService.getBySlug(slug).then(p => {
      setProduct(p || null);
      if (p) {
        setSelectedColor(p.mauSac[0]?.ten || '');
        setSelectedSize(p.kichCo[0] || '');
        productService.getRelated(p.id).then(setRelated);
        productService.getReviews(p.id).then(setReviews);
      }
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <MainLayout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Đang tải...</div></MainLayout>;
  if (!product) return <MainLayout><div className="container mx-auto px-4 py-20 text-center"><p className="text-lg font-medium">Không tìm thấy sản phẩm</p><Button asChild className="mt-4"><Link to="/san-pham">Quay lại cửa hàng</Link></Button></div></MainLayout>;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/san-pham" className="hover:text-foreground">Sản phẩm</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{product.ten}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl bg-secondary overflow-hidden">
              <img src={product.hinhAnh[0]} alt={product.ten} className="h-full w-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-lg bg-secondary overflow-hidden border-2 border-transparent hover:border-accent cursor-pointer transition-colors">
                  <img src={product.hinhAnh[0]} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-5">
            {product.badge && <Badge variant={product.badge === 'sale' ? 'destructive' : 'default'}>{product.badge === 'sale' ? 'Sale' : product.badge === 'bestseller' ? 'Bán chạy' : product.badge === 'moi' ? 'Mới' : 'Hot'}</Badge>}
            <h1 className="text-2xl md:text-3xl font-bold">{product.ten}</h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(product.danhGiaTB) ? 'fill-warning text-warning' : 'text-border'}`} />)}
                <span className="text-sm text-muted-foreground ml-1">{product.danhGiaTB} ({product.soDanhGia} đánh giá)</span>
              </div>
              <span className="text-sm text-muted-foreground">Đã bán {product.daBan.toLocaleString()}</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">{formatPrice(product.gia)}</span>
              {product.giaGoc && (
                <>
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.giaGoc)}</span>
                  <Badge variant="destructive">-{getDiscountPercent(product.giaGoc, product.gia)}%</Badge>
                </>
              )}
            </div>

            <p className="text-muted-foreground">{product.moTa}</p>

            {/* Color */}
            <div>
              <p className="text-sm font-medium mb-2">Màu sắc: <span className="text-accent">{selectedColor}</span></p>
              <div className="flex gap-2">
                {product.mauSac.map(m => (
                  <button key={m.ma} onClick={() => setSelectedColor(m.ten)}
                    className={`h-9 w-9 rounded-full border-2 transition-all ${selectedColor === m.ten ? 'border-accent scale-110' : 'border-border'}`}
                    style={{ backgroundColor: m.ma }} title={m.ten} />
                ))}
              </div>
            </div>

            {/* Size */}
            <div>
              <p className="text-sm font-medium mb-2">Kích cỡ: <span className="text-accent">{selectedSize}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.kichCo.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`h-9 min-w-[2.5rem] rounded-lg border px-3 text-sm font-medium transition-all ${selectedSize === s ? 'border-accent bg-accent text-accent-foreground' : 'border-border hover:border-accent/50'}`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium mb-2">Số lượng</p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQuantity(q => q + 1)}><Plus className="h-4 w-4" /></Button>
                <span className="text-sm text-muted-foreground">Còn {product.soLuongTon} sản phẩm</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button size="lg" className="flex-1 gap-2" onClick={() => addItem(product, selectedColor, selectedSize, quantity)}>
                <ShoppingBag className="h-5 w-5" /> Thêm vào giỏ
              </Button>
              <Button size="lg" variant="secondary" className="flex-1">Mua ngay</Button>
              <Button size="lg" variant="outline" className="px-3" onClick={() => isInWishlist(product.id) ? removeWishlist(product.id) : addWishlist(product)}>
                <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-sale text-sale' : ''}`} />
              </Button>
            </div>

            {/* AI Buttons */}
            <div className="border border-accent/20 rounded-xl p-4 bg-accent/5">
              <p className="text-sm font-medium mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-accent" /> Trợ lý AI hỗ trợ bạn</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild><Link to="/ai-tu-van"><Bot className="h-3.5 w-3.5" /> AI tư vấn size</Link></Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild><Link to="/ai-tu-van"><Bot className="h-3.5 w-3.5" /> AI gợi ý phối đồ</Link></Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild><Link to="/ai-tu-van"><Bot className="h-3.5 w-3.5" /> Sản phẩm tương tự</Link></Button>
              </div>
            </div>

            {/* Policies */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Miễn phí ship đơn 500K' },
                { icon: RotateCcw, label: 'Đổi trả 30 ngày' },
                { icon: Shield, label: 'Bảo hành chất lượng' },
              ].map(p => (
                <div key={p.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center">
                  <p.icon className="h-5 w-5 text-accent" />
                  <span className="text-[11px] text-muted-foreground">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4">Mô tả sản phẩm</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>{product.moTaChiTiet}</p>
            <ul className="mt-3">
              <li>Chất liệu: {product.chatLieu}</li>
              <li>Giới tính: {product.gioiTinh === 'nam' ? 'Nam' : product.gioiTinh === 'nu' ? 'Nữ' : 'Unisex'}</li>
              <li>Danh mục: {product.danhMuc}</li>
            </ul>
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Đánh giá ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">{r.khachHangTen[0]}</div>
                    <div>
                      <p className="text-sm font-medium">{r.khachHangTen}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.soSao ? 'fill-warning text-warning' : 'text-border'}`} />)}
                        <span className="text-xs text-muted-foreground ml-1">{formatDate(r.ngayDanhGia)}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.noiDung}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map(p => (
                <ProductCard key={p.id} product={p} onAddToCart={pr => addItem(pr, pr.mauSac[0]?.ten || '', pr.kichCo[0] || '')} onToggleWishlist={pr => isInWishlist(pr.id) ? removeWishlist(pr.id) : addWishlist(pr)} isWishlisted={isInWishlist(p.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
