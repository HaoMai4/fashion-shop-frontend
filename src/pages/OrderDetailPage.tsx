import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { orderService } from '@/services/api/orderService';
import { isLoggedIn } from '@/services/api/userService';
import { formatDate, formatPrice } from '@/utils/format';
import { toast } from 'sonner';

type PaymentInfo =
  | string
  | {
      type?: string;
      status?: string;
      note?: string;
      method?: string;
    };

type ShippingAddress = {
  fullName?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city?: string;
  postalCode?: string;
};

type OrderItem = {
  _id?: string;
  id?: string;
  productId?:
    | {
        _id?: string;
        id?: string;
        name?: string;
        slug?: string;
        images?: string[];
      }
    | string;
  variantId?:
    | {
        _id?: string;
        id?: string;
        color?: string;
        colorCode?: string;
        images?: string[];
        sku?: string;
      }
    | string;
  name?: string;
  productName?: string;
  image?: string;
  images?: string[];
  color?: string;
  mauSac?: string;
  size?: string;
  kichCo?: string;
  quantity?: number;
  soLuong?: number;
  price?: number;
  gia?: number;
  finalPrice?: number;
  product?: {
    name?: string;
    image?: string;
    hinhAnh?: string | string[];
  };
  sanPham?: {
    ten?: string;
    hinhAnh?: string | string[];
  };
};

type OrderRecord = {
  _id?: string;
  id?: string;
  orderCode?: string;
  maDonHang?: string;
  createdAt?: string;
  ngayDat?: string;

  status?: string;
  trangThai?: string;
  orderStatus?: string;
  statusOrder?: string;
  fulfillmentStatus?: string;

  paymentMethod?: PaymentInfo;
  phuongThucThanhToan?: PaymentInfo;

  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  totalAmount?: number;
  tongTien?: number;
  finalTotal?: number;

  customerNote?: string;
  guestInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
  };
  shippingAddress?: ShippingAddress;

  items?: OrderItem[];
  chiTiet?: OrderItem[];
};

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Chờ xác nhận', variant: 'secondary' },
  confirmed: { label: 'Đã xác nhận', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'default' },
  shipped: { label: 'Đang giao', variant: 'default' },
  delivered: { label: 'Đã giao', variant: 'outline' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
  reported: { label: 'Đang chờ duyệt hủy', variant: 'outline' },
};

function getOrderDetail(res: any): OrderRecord | null {
  if (!res) return null;
  if (res?.data && !Array.isArray(res.data)) return res.data;
  if (res?.order && !Array.isArray(res.order)) return res.order;
  if (!Array.isArray(res)) return res;
  return null;
}

function normalizeStatus(raw?: string) {
  if (!raw) return '';

  const value = String(raw).trim().toLowerCase();

  const statusMap: Record<string, string> = {
    pending: 'pending',
    cho_xac_nhan: 'pending',
    'chờ xác nhận': 'pending',
    pending_confirmation: 'pending',
    awaiting_confirmation: 'pending',

    confirmed: 'confirmed',
    da_xac_nhan: 'confirmed',
    'đã xác nhận': 'confirmed',

    processing: 'processing',
    dang_xu_ly: 'processing',
    'đang xử lý': 'processing',

    shipped: 'shipped',
    shipping: 'shipped',
    dang_giao: 'shipped',
    delivering: 'shipped',
    'đang giao': 'shipped',

    delivered: 'delivered',
    da_giao: 'delivered',
    'đã giao': 'delivered',

    completed: 'completed',
    hoan_thanh: 'completed',
    'hoàn thành': 'completed',

    cancelled: 'cancelled',
    canceled: 'cancelled',
    da_huy: 'cancelled',
    'đã hủy': 'cancelled',

    reported: 'reported',
  };

  return statusMap[value] || value;
}

function getStatusInfo(status?: string) {
  const normalized = normalizeStatus(status);

  if (!normalized) {
    return { label: 'Không xác định', variant: 'outline' as const };
  }

  return (
    statusConfig[normalized] || {
      label: normalized,
      variant: 'outline' as const,
    }
  );
}

function getOrderCode(order?: OrderRecord | null) {
  if (!order) return 'Chưa có mã';
  return order.orderCode || order.maDonHang || 'Chưa có mã';
}

function getOrderDate(order?: OrderRecord | null) {
  if (!order) return '';
  return order.createdAt || order.ngayDat || '';
}

function getOrderStatus(order?: OrderRecord | null) {
  if (!order) return '';
  return normalizeStatus(
    order.status ||
      order.trangThai ||
      order.orderStatus ||
      order.statusOrder ||
      order.fulfillmentStatus ||
      ''
  );
}

function normalizePaymentLabel(raw?: string) {
  if (!raw) return 'Chưa rõ';

  const value = String(raw).trim().toLowerCase();

  const map: Record<string, string> = {
    cod: 'COD',
    cash: 'COD',
    cash_on_delivery: 'COD',
    payos: 'PayOS',
    momo: 'MoMo',
    vnpay: 'VNPay',
    bank_transfer: 'Chuyển khoản',
    transfer: 'Chuyển khoản',
  };

  return map[value] || raw;
}

function getOrderPayment(order?: OrderRecord | null) {
  if (!order) return 'Chưa rõ';

  const payment = order.paymentMethod || order.phuongThucThanhToan;

  if (!payment) return 'Chưa rõ';

  if (typeof payment === 'string') return normalizePaymentLabel(payment);

  if (typeof payment === 'object') {
    return normalizePaymentLabel(payment.type || payment.method || 'Chưa rõ');
  }

  return 'Chưa rõ';
}

function getPaymentStatus(order?: OrderRecord | null) {
  if (!order) return 'Chưa rõ';

  const payment = order.paymentMethod || order.phuongThucThanhToan;
  if (!payment || typeof payment === 'string') return 'Chưa rõ';

  const value = String(payment.status || '').trim().toLowerCase();

  const map: Record<string, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán thất bại',
    cancelled: 'Đã hủy thanh toán',
  };

  return map[value] || (payment.status || 'Chưa rõ');
}

function getOrderItems(order?: OrderRecord | null): OrderItem[] {
  if (!order) return [];
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.chiTiet)) return order.chiTiet;
  return [];
}

function getItemName(item: OrderItem) {
  if (item.name) return item.name;
  if (item.productName) return item.productName;
  if (typeof item.productId === 'object' && item.productId?.name) return item.productId.name;
  if (item.product?.name) return item.product.name;
  if (item.sanPham?.ten) return item.sanPham.ten;
  return 'Sản phẩm';
}

function getItemImage(item: OrderItem) {
  if (item.image) return item.image;
  if (Array.isArray(item.images) && item.images[0]) return item.images[0];

  if (typeof item.variantId === 'object' && Array.isArray(item.variantId?.images)) {
    return item.variantId.images[0] || '/placeholder.svg';
  }

  if (item.product?.image) return item.product.image;

  const productHinhAnh = item.product?.hinhAnh;
  if (Array.isArray(productHinhAnh)) return productHinhAnh[0] || '/placeholder.svg';
  if (typeof productHinhAnh === 'string') return productHinhAnh;

  const sanPhamHinhAnh = item.sanPham?.hinhAnh;
  if (Array.isArray(sanPhamHinhAnh)) return sanPhamHinhAnh[0] || '/placeholder.svg';
  if (typeof sanPhamHinhAnh === 'string') return sanPhamHinhAnh;

  if (typeof item.productId === 'object' && Array.isArray(item.productId?.images)) {
    return item.productId.images[0] || '/placeholder.svg';
  }

  return '/placeholder.svg';
}

function getItemColor(item: OrderItem) {
  if (item.color) return item.color;
  if (item.mauSac) return item.mauSac;
  if (typeof item.variantId === 'object' && item.variantId?.color) return item.variantId.color;
  return '';
}

function getItemSize(item: OrderItem) {
  return item.size || item.kichCo || '';
}

function getItemQuantity(item: OrderItem) {
  return item.quantity || item.soLuong || 0;
}

function getItemPrice(item: OrderItem) {
  return item.finalPrice || item.price || item.gia || 0;
}

function getSubtotal(order?: OrderRecord | null) {
  return order?.subtotal || 0;
}

function getShippingFee(order?: OrderRecord | null) {
  return order?.shippingFee || 0;
}

function getDiscount(order?: OrderRecord | null) {
  return order?.discount || 0;
}

function getTotal(order?: OrderRecord | null) {
  if (!order) return 0;
  return order.finalTotal || order.totalAmount || order.tongTien || 0;
}

function getAddressText(order?: OrderRecord | null) {
  if (!order) return 'Chưa có địa chỉ';

  const address = order.shippingAddress;
  if (!address) return 'Chưa có địa chỉ';

  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.ward,
    address.district,
    address.city,
    address.postalCode,
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : 'Chưa có địa chỉ';
}

function getRecipientName(order?: OrderRecord | null) {
  return order?.shippingAddress?.fullName || order?.guestInfo?.fullName || 'Chưa có tên';
}

function getRecipientPhone(order?: OrderRecord | null) {
  return order?.shippingAddress?.phone || order?.guestInfo?.phone || 'Chưa có số điện thoại';
}

function getRecipientEmail(order?: OrderRecord | null) {
  return order?.shippingAddress?.email || order?.guestInfo?.email || 'Chưa có email';
}

function canRequestCancellation(order?: OrderRecord | null) {
  const status = getOrderStatus(order);
  return status === 'pending' || status === 'confirmed';
}

function isCancellationRequested(order?: OrderRecord | null) {
  return getOrderStatus(order) === 'reported';
}

function isCancelled(order?: OrderRecord | null) {
  return getOrderStatus(order) === 'cancelled';
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderCode = '' } = useParams();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchOrderDetail = async () => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    if (!orderCode) {
      setLoading(false);
      return;
    }

    try {
      const res = await orderService.getMyOrderDetail(orderCode);
      const orderData = getOrderDetail(res);
      setOrder(orderData);
    } catch (error: any) {
      console.error('getMyOrderDetail error:', error);
      toast.error(error?.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderCode]);

  const handleRequestCancellation = async () => {
    const orderId = order?._id || order?.id;

    if (!orderId) {
      toast.error('Không tìm thấy mã đơn nội bộ để gửi yêu cầu hủy');
      return;
    }

    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    setSubmittingCancel(true);

    try {
      const res: any = await orderService.requestOrderCancellation(orderId, {
        reason: cancelReason.trim(),
      });

      toast.success(res?.message || 'Đã gửi yêu cầu hủy đơn');
      setCancelReason('');
      setShowCancelForm(false);
      await fetchOrderDetail();
    } catch (error: any) {
      console.error('requestOrderCancellation error:', error);
      toast.error(error?.message || 'Không thể gửi yêu cầu hủy đơn');
    } finally {
      setSubmittingCancel(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          Đang tải chi tiết đơn hàng...
        </div>
      </MainLayout>
    );
  }

  if (!isLoggedIn()) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h1 className="mb-2 text-2xl font-bold">Bạn chưa đăng nhập</h1>
          <p className="mb-6 text-muted-foreground">Hãy đăng nhập để xem chi tiết đơn hàng</p>
          <Button onClick={() => navigate('/dang-nhap')}>Đi đến đăng nhập</Button>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h1 className="mb-2 text-2xl font-bold">Không tìm thấy đơn hàng</h1>
          <p className="mb-6 text-muted-foreground">
            Đơn hàng không tồn tại hoặc không thuộc tài khoản này
          </p>
          <Button onClick={() => navigate('/don-hang')}>Quay lại đơn hàng</Button>
        </div>
      </MainLayout>
    );
  }

  const status = getStatusInfo(getOrderStatus(order));
  const items = getOrderItems(order);
  const allowRequestCancellation = canRequestCancellation(order);
  const cancellationRequested = isCancellationRequested(order);
  const cancelled = isCancelled(order);

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate('/don-hang')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
              <p className="text-sm text-muted-foreground">{getOrderCode(order)}</p>
            </div>
          </div>

          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border p-5">
            <h2 className="mb-4 text-lg font-semibold">Thông tin đơn hàng</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <span className="font-medium">{getOrderCode(order)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ngày đặt</span>
                <span className="font-medium">
                  {getOrderDate(order) ? formatDate(getOrderDate(order)) : 'Chưa có ngày'}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Phương thức thanh toán</span>
                <span className="font-medium">{getOrderPayment(order)}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Trạng thái thanh toán</span>
                <span className="font-medium">{getPaymentStatus(order)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-5">
            <h2 className="mb-4 text-lg font-semibold">Thông tin nhận hàng</h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Người nhận</p>
                <p className="font-medium">{getRecipientName(order)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Số điện thoại</p>
                <p className="font-medium">{getRecipientPhone(order)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{getRecipientEmail(order)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Địa chỉ</p>
                <p className="font-medium">{getAddressText(order)}</p>
              </div>

              {order.customerNote ? (
                <div>
                  <p className="text-muted-foreground">Ghi chú</p>
                  <p className="font-medium">{order.customerNote}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Yêu cầu hủy đơn</h2>

            {cancellationRequested ? (
              <Badge variant="outline">Đã gửi yêu cầu hủy</Badge>
            ) : cancelled ? (
              <Badge variant="destructive">Đơn hàng đã hủy</Badge>
            ) : null}
          </div>

          {allowRequestCancellation ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bạn có thể gửi yêu cầu hủy đơn khi đơn hàng đang ở trạng thái chờ xác nhận hoặc đã xác nhận.
              </p>

              {showCancelForm ? (
                <div className="space-y-3">
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy đơn..."
                    rows={4}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleRequestCancellation}
                      disabled={submittingCancel}
                    >
                      {submittingCancel ? 'Đang gửi yêu cầu...' : 'Xác nhận gửi yêu cầu hủy'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCancelForm(false);
                        setCancelReason('');
                      }}
                      disabled={submittingCancel}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="destructive" onClick={() => setShowCancelForm(true)}>
                  Yêu cầu hủy đơn
                </Button>
              )}
            </div>
          ) : cancellationRequested ? (
            <p className="text-sm text-muted-foreground">
              Yêu cầu hủy đơn của bạn đã được gửi lên hệ thống và đang chờ admin xử lý.
            </p>
          ) : cancelled ? (
            <p className="text-sm text-muted-foreground">
              Đơn hàng này đã được hủy.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Chỉ có thể gửi yêu cầu hủy đơn khi đơn đang ở trạng thái chờ xác nhận hoặc đã xác nhận.
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-border p-5">
          <h2 className="mb-4 text-lg font-semibold">Sản phẩm đã đặt</h2>

          <div className="space-y-4">
            {items.map((item, index) => {
              const quantity = getItemQuantity(item);
              const price = getItemPrice(item);
              const color = getItemColor(item);
              const size = getItemSize(item);

              return (
                <div
                  key={item._id || item.id || `${getOrderCode(order)}-${index}`}
                  className="flex items-center gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0"
                >
                  <img
                    src={getItemImage(item)}
                    alt={getItemName(item)}
                    className="h-16 w-16 rounded-lg bg-secondary object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium">{getItemName(item)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {color}
                      {color && size ? ' / ' : ''}
                      {size}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Số lượng: {quantity}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatPrice(price)}</p>
                    <p className="font-semibold">{formatPrice(price * quantity)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 ml-auto w-full rounded-xl border border-border p-5 md:max-w-md">
          <h2 className="mb-4 text-lg font-semibold">Tổng kết</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatPrice(getSubtotal(order))}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span>{formatPrice(getShippingFee(order))}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Giảm giá</span>
              <span>- {formatPrice(getDiscount(order))}</span>
            </div>

            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <span>Tổng cộng</span>
              <span>{formatPrice(getTotal(order))}</span>
            </div>
          </div>

          <div className="mt-5">
            <Button asChild className="w-full">
              <Link to="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}