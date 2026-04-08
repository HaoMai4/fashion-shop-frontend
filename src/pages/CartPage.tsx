import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/components/layout/MainLayout';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';
import { useState } from 'react';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, removeItem, updateQuantity, tongTien } = useCart();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);

  const shippingFee = tongTien >= 500000 ? 0 : 30000;
  const total = tongTien - discount + shippingFee;

  const applyCoupon = () => {
    if (coupon.toUpperCase() === 'MATEWEAR10') {
      setDiscount(Math.round(tongTien * 0.1));
      toast.success('Áp dụng mã giảm giá thành công! Giảm 10%');
    } else {
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Giỏ hàng trống</h1>
          <p className="text-muted-foreground mb-6">Hãy thêm sản phẩm yêu thích vào giỏ hàng!</p>
          <Button asChild>
            <Link to="/san-pham">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng ({items.length} sản phẩm)</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const cartImage =
                typeof item.sanPham.hinhAnh === 'string' && item.sanPham.hinhAnh.trim() !== ''
                  ? item.sanPham.hinhAnh
                  : '/placeholder.svg';

              return (
                <div key={item.id} className="flex gap-4 rounded-lg border border-border p-4">
                  <Link to={`/san-pham/${item.sanPham.slug}`}>
                    <img
                      src={cartImage}
                      alt={item.sanPham.ten}
                      className="h-24 w-24 rounded-lg object-cover bg-secondary"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/san-pham/${item.sanPham.slug}`}
                      className="text-sm font-medium hover:text-accent transition-colors line-clamp-1"
                    >
                      {item.sanPham.ten}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.mauSac} / {item.kichCo}
                    </p>
                    <p className="text-sm font-bold mt-1">{formatPrice(item.gia)}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.soLuong - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="text-sm font-medium w-6 text-center">{item.soLuong}</span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.soLuong + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-bold">{formatPrice(item.gia * item.soLuong)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border p-6 h-fit sticky top-20 space-y-4">
            <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(tongTien)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-bold">
              <span>Tổng cộng</span>
              <span className="text-lg">{formatPrice(total)}</span>
            </div>

            <div className="flex gap-2">
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Mã giảm giá"
                className="h-9 text-sm"
              />
              <Button variant="outline" size="sm" onClick={applyCoupon}>
                Áp dụng
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground">Thử mã: MATEWEAR10</p>

            <Button size="lg" className="w-full gap-2" asChild>
              <Link to="/thanh-toan">
                Thanh toán <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}