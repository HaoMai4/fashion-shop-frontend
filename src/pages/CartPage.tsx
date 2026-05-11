import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MainLayout from '@/components/layout/MainLayout';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const SELECTED_CART_ITEM_IDS_KEY = 'matewear_selected_cart_item_ids';

export default function CartPage() {
  const navigate = useNavigate();

  const {
    items,
    removeItem,
    updateQuantity,
    refreshCartPrices,
  } = useCart();

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

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

  useEffect(() => {
    if (!items.length) {
      setSelectedItemIds([]);
      localStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY);
      return;
    }

    setSelectedItemIds((prev) => {
      const validIds = prev.filter((id) =>
        items.some((item) => Number(item.id) === Number(id))
      );

      if (validIds.length > 0) {
        return validIds;
      }

      return items.map((item) => Number(item.id));
    });
  }, [items]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedItemIds.includes(Number(item.id)));
  }, [items, selectedItemIds]);

  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.gia * item.soLuong,
      0
    );
  }, [selectedItems]);

  const selectedShippingFee =
    selectedSubtotal > 0 ? (selectedSubtotal >= 500000 ? 0 : 30000) : 0;

  const selectedTotal = Math.max(0, selectedSubtotal - discount) + selectedShippingFee;

  const allSelected =
    items.length > 0 && selectedItems.length === items.length;

  const toggleSelectItem = (id: number) => {
    setDiscount(0);

    setSelectedItemIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setDiscount(0);

    if (allSelected) {
      setSelectedItemIds([]);
      return;
    }

    setSelectedItemIds(items.map((item) => Number(item.id)));
  };

  const applyCoupon = () => {
    if (selectedSubtotal <= 0) {
      toast.error('Vui lòng chọn sản phẩm trước khi áp dụng mã giảm giá');
      return;
    }

    if (coupon.toUpperCase() === 'MATEWEAR10') {
      setDiscount(Math.round(selectedSubtotal * 0.1));
      toast.success('Áp dụng mã giảm giá thành công! Giảm 10%');
    } else {
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  const handleCheckout = () => {
    if (selectedItemIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }

    localStorage.setItem(
      SELECTED_CART_ITEM_IDS_KEY,
      JSON.stringify(selectedItemIds)
    );

    navigate('/thanh-toan');
  };

  const handleRemoveItem = (id: number) => {
    setDiscount(0);
    setSelectedItemIds((prev) => prev.filter((itemId) => itemId !== Number(id)));
    removeItem(id);
  };

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
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border"
                />
                Chọn tất cả ({items.length} sản phẩm)
              </label>

              <span className="text-sm text-muted-foreground">
                Đã chọn {selectedItems.length} sản phẩm
              </span>
            </div>

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
              const checked = selectedItemIds.includes(Number(item.id));

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelectItem(Number(item.id))}
                  className={`flex cursor-pointer gap-4 rounded-lg border p-4 transition ${checked
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/40'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelectItem(Number(item.id))}
                    className="mt-1 h-4 w-4 cursor-pointer rounded border-border"
                  />

                  <Link
                    to={`/san-pham/${item.sanPham.slug}`}
                    onClick={(e) => e.stopPropagation()}
                  >
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
                      onClick={(e) => e.stopPropagation()}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, item.soLuong - 1);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, item.soLuong + 1);
                        }}
                        disabled={stock > 0 && item.soLuong >= stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
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
                <span className="text-muted-foreground">Sản phẩm đã chọn</span>
                <span>{selectedItems.length}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(selectedSubtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>
                  {selectedShippingFee === 0
                    ? 'Miễn phí'
                    : formatPrice(selectedShippingFee)}
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
              <span className="text-lg">{formatPrice(selectedTotal)}</span>
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

            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleCheckout}
              disabled={selectedItemIds.length === 0}
            >
              Thanh toán <ArrowRight className="h-4 w-4" />
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