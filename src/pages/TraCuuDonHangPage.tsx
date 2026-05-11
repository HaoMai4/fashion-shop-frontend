import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  PackageCheck,
  Copy,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { orderService } from '@/services/api/orderService';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';

type OrderItem = {
  _id?: string;
  name?: string;
  color?: string;
  image?: string;
  quantity: number;
  size?: string;
  price: number;
  sku?: string;
  productId?: {
    name?: string;
    slug?: string;
  };
  variantId?: {
    color?: string;
    images?: string[];
    sku?: string;
  };
};

type OrderDetail = {
  _id: string;
  orderCode: string;
  orderStatus: string;
  createdAt: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  customerNote?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
  guestInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
  };
  paymentMethod?: {
    type?: string;
    status?: string;
    note?: string;
  };
  items: OrderItem[];
};

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  pending_payment: {
    label: 'Chờ thanh toán',
    className: 'bg-amber-100 text-amber-700',
  },
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-secondary text-foreground',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-blue-100 text-blue-700',
  },
  shipped: {
    label: 'Đang giao',
    className: 'bg-amber-100 text-amber-700',
  },
  delivered: {
    label: 'Đã giao',
    className: 'bg-emerald-100 text-emerald-700',
  },
  completed: {
    label: 'Hoàn thành',
    className: 'bg-emerald-100 text-emerald-700',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-100 text-red-700',
  },
  reported: {
    label: 'Đang yêu cầu xử lý',
    className: 'bg-orange-100 text-orange-700',
  },
};

const PAYMENT_STATUS_MAP: Record<string, string> = {
  pending: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  cancelled: 'Đã hủy thanh toán',
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  PayOS: 'Thanh toán PayOS',
};

function getOrderStatusMeta(status?: string) {
  if (!status) {
    return {
      label: 'Đang cập nhật',
      className: 'bg-secondary text-foreground',
    };
  }

  return (
    ORDER_STATUS_MAP[status] || {
      label: status,
      className: 'bg-secondary text-foreground',
    }
  );
}

function getPaymentStatusLabel(status?: string) {
  if (!status) return 'Đang cập nhật';
  return PAYMENT_STATUS_MAP[status] || status;
}

function getPaymentMethodLabel(method?: string) {
  if (!method) return 'COD';
  return PAYMENT_METHOD_MAP[method] || method;
}

export default function TraCuuDonHangPage() {
  const { orderCode } = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderCode) {
      setError('Không có mã đơn hàng');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await orderService.getOrderByCode(orderCode);

        if (!isMounted) return;
        setOrder(data as OrderDetail);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Không lấy được thông tin đơn hàng');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  const statusMeta = useMemo(
    () => getOrderStatusMeta(order?.orderStatus),
    [order?.orderStatus]
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          Đang tải thông tin đơn hàng...
        </div>
      </MainLayout>
    );
  }

  if (error || !order) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="mb-3 text-2xl font-bold">Không tìm thấy đơn hàng</h1>
          <p className="mb-6 text-muted-foreground">
            {error || 'Đơn hàng không tồn tại hoặc đã có lỗi xảy ra.'}
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link to="/san-pham">Quay lại mua sắm</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Về trang chủ</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const customerName =
    order.shippingAddress?.fullName || order.guestInfo?.fullName || 'Khách hàng';

  const customerPhone =
    order.shippingAddress?.phone || order.guestInfo?.phone || 'Đang cập nhật';

  const customerEmail =
    order.shippingAddress?.email || order.guestInfo?.email || 'Đang cập nhật';

  const address = [
    order.shippingAddress?.addressLine1,
    order.shippingAddress?.addressLine2,
    order.shippingAddress?.ward,
    order.shippingAddress?.district,
    order.shippingAddress?.city,
  ]
    .filter(Boolean)
    .join(', ');

  const isPayOSOrder = order.paymentMethod?.type === 'PayOS';
  const isPaymentCancelled = order.paymentMethod?.status === 'cancelled';
  const isPaymentPending = order.paymentMethod?.status === 'pending';
  const isOrderCancelled = order.orderStatus === 'cancelled';
  const isPendingPayment = order.orderStatus === 'pending_payment';

  const isCancelledPayOSOrder =
    isPayOSOrder && isPaymentCancelled && isOrderCancelled;

  const isPendingPayOSOrder =
    isPayOSOrder && isPaymentPending && isPendingPayment;

  const handleCopyOrderCode = async () => {
    try {
      await navigator.clipboard.writeText(order.orderCode);
      toast.success('Đã sao chép mã đơn hàng');
    } catch (err) {
      console.error('Copy order code failed:', err);
      toast.error('Không thể sao chép mã đơn hàng');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Về trang chủ
        </Link>

        <div className="mb-6 rounded-xl border border-border p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-success" />
                <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Mã đơn hàng:{' '}
                  <span className="font-semibold text-foreground">
                    {order.orderCode}
                  </span>
                </p>
                <p>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCopyOrderCode}
                >
                  <Copy className="h-4 w-4" />
                  Sao chép mã đơn
                </Button>

                <Button type="button" size="sm" className="gap-2" asChild>
                  <Link to="/san-pham">
                    <ShoppingBag className="h-4 w-4" />
                    Tiếp tục mua sắm
                  </Link>
                </Button>
              </div>
            </div>

            <div
              className={`inline-flex w-fit items-center rounded-lg px-3 py-2 text-sm font-medium ${statusMeta.className}`}
            >
              {statusMeta.label}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-border p-5">
              <h2 className="mb-4 font-semibold">Sản phẩm đã đặt</h2>

              <div className="space-y-4">
                {order.items.map((item, index) => {
                  const image =
                    item.image ||
                    item.variantId?.images?.[0] ||
                    '/placeholder.svg';

                  const name =
                    item.name || item.productId?.name || 'Sản phẩm';

                  const color =
                    item.color || item.variantId?.color || 'Đang cập nhật';

                  const sku =
                    item.sku || item.variantId?.sku;

                  return (
                    <div
                      key={item._id || `${item.productId?.slug || 'item'}-${index}`}
                      className="flex gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0"
                    >
                      <img
                        src={image}
                        alt={name}
                        className="h-20 w-20 rounded-lg bg-secondary object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{name}</p>

                        <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                          <p>Màu: {color}</p>
                          <p>Size: {item.size || 'Đang cập nhật'}</p>
                          <p>Số lượng: {item.quantity}</p>
                          {sku && <p>SKU: {sku}</p>}
                        </div>

                        <p className="mt-2 font-semibold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {order.customerNote && (
              <div className="rounded-xl border border-border p-5">
                <h2 className="mb-2 font-semibold">Ghi chú đơn hàng</h2>
                <p className="text-sm text-muted-foreground">{order.customerNote}</p>
              </div>
            )}

            <div
              className={`rounded-xl border p-5 ${
                isCancelledPayOSOrder
                  ? 'border-red-200 bg-red-50'
                  : isPendingPayOSOrder
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className={`mt-0.5 h-5 w-5 ${
                    isCancelledPayOSOrder
                      ? 'text-red-600'
                      : isPendingPayOSOrder
                        ? 'text-amber-600'
                        : 'text-success'
                  }`}
                />

                <div>
                  {isCancelledPayOSOrder ? (
                    <>
                      <h2 className="font-semibold text-red-700">
                        Thanh toán PayOS đã bị hủy
                      </h2>
                      <p className="mt-1 text-sm text-red-700">
                        Đơn hàng này đã bị hủy do thanh toán PayOS chưa hoàn tất.
                        Cửa hàng sẽ không xử lý đơn này.
                      </p>
                    </>
                  ) : isPendingPayOSOrder ? (
                    <>
                      <h2 className="font-semibold text-amber-700">
                        Đơn hàng đang chờ thanh toán
                      </h2>
                      <p className="mt-1 text-sm text-amber-700">
                        Bạn cần hoàn tất thanh toán PayOS trước khi cửa hàng xác nhận
                        và xử lý đơn hàng.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-semibold">Đơn hàng đã được ghi nhận</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Cửa hàng đã nhận được thông tin đặt hàng của bạn. Bạn có thể
                        dùng mã đơn hàng để tra cứu lại đơn bất cứ lúc nào.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border p-5">
              <h2 className="mb-4 font-semibold">Thông tin nhận hàng</h2>

              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Người nhận:</span>{' '}
                  <span className="font-medium">{customerName}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Số điện thoại:</span>{' '}
                  <span className="font-medium">{customerPhone}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{customerEmail}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Địa chỉ:</span>{' '}
                  <span className="font-medium">{address || 'Đang cập nhật'}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border p-5">
              <h2 className="mb-4 font-semibold">Thanh toán</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Phương thức</span>
                  <span className="text-right">
                    {getPaymentMethodLabel(order.paymentMethod?.type)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span className="text-right">
                    {getPaymentStatusLabel(order.paymentMethod?.status)}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(order.subtotal || 0)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>{formatPrice(order.shippingFee || 0)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Giảm giá</span>
                  <span>{formatPrice(order.discount || 0)}</span>
                </div>

                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(order.totalAmount || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}