import { Link } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/components/layout/MainLayout';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    refreshCartPrices,
    tongTien,
  } = useCart();

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [refreshingPrices, setRefreshingPrices] = useState(false);

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

  useEffect(() => {
    let mounted = true;

    const syncPrices = async () => {
      if (!items.length) return;

      try {
        setRefreshingPrices(true);

        const result = await refreshCartPrices();

        if (mounted && result.changed) {
          setDiscount(0);
          toast.info(
            'Giá hoặc tồn kho trong giỏ hàng đã được cập nhật theo trạng thái sale hiện tại'
          );
        }
      } catch (error) {
        console.warn('refresh cart prices error:', error);
      } finally {
        if (mounted) {
          setRefreshingPrices(false);
        }
      }
    };

    syncPrices();

    return () => {
      mounted = false;
    };
  }, [items.length, refreshCartPrices]);

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h1 className="mb-2 text-2xl font-bold">Giỏ hàng trống</h1>
          <p className="mb-6 text-muted-foreground">
            Hãy thêm sản phẩm yêu thích vào giỏ hàng!
          </p>
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
        <h1 className="mb-2 text-2xl font-bold">
          Giỏ hàng ({items.length} sản phẩm)
        </h1>

        {refreshingPrices ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Đang kiểm tra lại giá và tồn kho sản phẩm...
          </p>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">
            Giá sản phẩm sẽ được cập nhật theo chương trình sale hiện tại.
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => {
              const cartImage =
                typeof item.hinhAnh === 'string' && item.hinhAnh.trim() !== ''
                  ? item.hinhAnh
                  : typeof item.sanPham.hinhAnh === 'string' &&
                      item.sanPham.hinhAnh.trim() !== ''
                    ? item.sanPham.hinhAnh
                    : '/placeholder.svg';

              const stock = Number(item.sanPham?.soLuongTon || 0);
              const isOutOfStock = stock <= 0;

              return (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-border p-4"
                >
                  <Link to={`/san-pham/${item.sanPham.slug}`}>
                    <img
                      src={cartImage}
                      alt={item.sanPham.ten}
                      className="h-24 w-24 rounded-lg bg-secondary object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/san-pham/${item.sanPham.slug}`}
                      className="line-clamp-1 text-sm font-medium transition-colors hover:text-accent"
                    >
                      {item.sanPham.ten}
                    </Link>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.mauSac} / {item.kichCo}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{formatPrice(item.gia)}</p>

                      {typeof item.sanPham.giaGoc === 'number' &&
                      item.sanPham.giaGoc > item.gia ? (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.sanPham.giaGoc)}
                        </p>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Tồn kho:{' '}
                      <span className={isOutOfStock ? 'text-destructive' : ''}>
                        {stock}
                      </span>
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.soLuong - 1)}
                        disabled={item.soLuong <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>

                      <span className="w-6 text-center text-sm font-medium">
                        {item.soLuong}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.soLuong + 1)}
                        disabled={stock > 0 && item.soLuong >= stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <span className="text-sm font-bold">
                      {formatPrice(item.gia * item.soLuong)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky top-20 h-fit space-y-4 rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold">Tóm tắt đơn hàng</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(tongTien)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>
                  {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between border-t border-border pt-3 font-bold">
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

            <p className="text-[11px] text-muted-foreground">
              Thử mã: MATEWEAR10
            </p>

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