import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { orderService } from '@/services/api/orderService';
import { isLoggedIn } from '@/services/api/userService';
import { formatPrice, formatDate } from '@/utils/format';
import { toast } from 'sonner';

type PaymentInfo =
  | string
  | {
    type?: string;
    status?: string;
    note?: string;
    method?: string;
  };

type OrderItem = {
  _id?: string;
  id?: string;
  productId?: string;
  variantId?: string;
  name?: string;
  productName?: string;
  image?: string;
  color?: string;
  mauSac?: string;
  size?: string;
  kichCo?: string;
  quantity?: number;
  soLuong?: number;
  price?: number;
  gia?: number;
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

  totalAmount?: number;
  tongTien?: number;
  finalTotal?: number;

  items?: OrderItem[];
  chiTiet?: OrderItem[];
};

type OrderTabKey =
  | 'all'
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'reported';

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending_payment: { label: 'Chờ thanh toán', variant: 'secondary' },
  pending: { label: 'Chờ xác nhận', variant: 'secondary' },
  confirmed: { label: 'Đã xác nhận', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'default' },
  shipped: { label: 'Đang giao', variant: 'default' },
  delivered: { label: 'Đã giao', variant: 'outline' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
  reported: { label: 'Yêu cầu hủy', variant: 'outline' },
};

const ORDER_TABS: { key: OrderTabKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending_payment', label: 'Chờ thanh toán' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipped', label: 'Đang giao' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
  { key: 'reported', label: 'Yêu cầu hủy' },
];

function getOrderList(res: any): OrderRecord[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.orders)) return res.orders;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.orders)) return res.data.orders;
  return [];
}

function normalizeStatus(raw?: string) {
  if (!raw) return '';

  const value = String(raw).trim().toLowerCase();

  const statusMap: Record<string, string> = {
    pending_payment: 'pending_payment',
    cho_thanh_toan: 'pending_payment',
    'chờ thanh toán': 'pending_payment',

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

function getOrderCode(order: OrderRecord) {
  return order.orderCode || order.maDonHang || 'Chưa có mã';
}

function getOrderDate(order: OrderRecord) {
  return order.createdAt || order.ngayDat || '';
}

function getOrderStatus(order: OrderRecord) {
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

function getOrderPayment(order: OrderRecord) {
  const payment = order.paymentMethod || order.phuongThucThanhToan;

  if (!payment) return 'Chưa rõ';

  if (typeof payment === 'string') return normalizePaymentLabel(payment);

  if (typeof payment === 'object') {
    return normalizePaymentLabel(payment.type || payment.method || 'Chưa rõ');
  }

  return 'Chưa rõ';
}

function getOrderPaymentStatus(order: OrderRecord) {
  const payment = order.paymentMethod || order.phuongThucThanhToan;

  if (!payment || typeof payment === 'string') return '';

  const value = String(payment.status || '').trim().toLowerCase();

  const map: Record<string, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán thất bại',
    cancelled: 'Đã hủy thanh toán',
  };

  return map[value] || payment.status || '';
}

function getOrderTotal(order: OrderRecord) {
  return order.finalTotal || order.totalAmount || order.tongTien || 0;
}

function getOrderItems(order: OrderRecord): OrderItem[] {
  if (Array.isArray(order.items)) return order.items;
  if (Array.isArray(order.chiTiet)) return order.chiTiet;
  return [];
}

function getItemName(item: OrderItem) {
  return item.name || item.productName || item.product?.name || item.sanPham?.ten || 'Sản phẩm';
}

function getItemImage(item: OrderItem) {
  if (item.image) return item.image;
  if (item.product?.image) return item.product.image;

  const productHinhAnh = item.product?.hinhAnh;
  if (Array.isArray(productHinhAnh)) return productHinhAnh[0] || '/placeholder.svg';
  if (typeof productHinhAnh === 'string') return productHinhAnh;

  const sanPhamHinhAnh = item.sanPham?.hinhAnh;
  if (Array.isArray(sanPhamHinhAnh)) return sanPhamHinhAnh[0] || '/placeholder.svg';
  if (typeof sanPhamHinhAnh === 'string') return sanPhamHinhAnh;

  return '/placeholder.svg';
}

function getItemColor(item: OrderItem) {
  return item.color || item.mauSac || '';
}

function getItemSize(item: OrderItem) {
  return item.size || item.kichCo || '';
}

function getItemQuantity(item: OrderItem) {
  return item.quantity || item.soLuong || 0;
}

function getItemPrice(item: OrderItem) {
  return item.price || item.gia || 0;
}

function orderMatchesTab(order: OrderRecord, tab: OrderTabKey) {
  if (tab === 'all') return true;

  const status = getOrderStatus(order);

  if (tab === 'confirmed') {
    return status === 'confirmed' || status === 'processing';
  }

  if (tab === 'completed') {
    return status === 'completed' || status === 'delivered';
  }

  return status === tab;
}

function getTabCount(orders: OrderRecord[], tab: OrderTabKey) {
  return orders.filter((order) => orderMatchesTab(order, tab)).length;
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderTabKey>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const res = await orderService.getMyOrders({
          all: true,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        const orderList = getOrderList(res);

        setOrders(orderList);
      } catch (error: any) {
        console.error('getMyOrders error:', error);
        toast.error(error?.message || 'Không thể tải lịch sử đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => orderMatchesTab(order, activeTab));
  }, [orders, activeTab]);

  const activeTabLabel =
    ORDER_TABS.find((tab) => tab.key === activeTab)?.label || 'Tất cả';

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          Đang tải lịch sử đơn hàng...
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
          <p className="mb-6 text-muted-foreground">
            Hãy đăng nhập để xem lịch sử đơn hàng
          </p>
          <Button onClick={() => navigate('/dang-nhap')}>
            Đi đến đăng nhập
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (orders.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h1 className="mb-2 text-2xl font-bold">Chưa có đơn hàng</h1>
          <p className="mb-6 text-muted-foreground">Hãy bắt đầu mua sắm ngay</p>
          <Button asChild>
            <Link to="/san-pham">Mua sắm ngay</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Lịch sử đơn hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi trạng thái thanh toán và xử lý đơn hàng của bạn.
          </p>
        </div>

        <div className="mb-5 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-xl border border-border bg-background p-2">
            {ORDER_TABS.map((tab) => {
              const count = getTabCount(orders, tab.key);
              const selected = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${selected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${selected
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h2 className="mb-2 text-lg font-semibold">
              Không có đơn hàng trong mục {activeTabLabel.toLowerCase()}
            </h2>
            <p className="text-sm text-muted-foreground">
              Bạn có thể chuyển sang tab khác để xem các đơn hàng còn lại.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = getStatusInfo(getOrderStatus(order));
              const items = getOrderItems(order);
              const orderCode = getOrderCode(order);
              const paymentStatus = getOrderPaymentStatus(order);

              return (
                <div
                  key={order._id || order.id || orderCode}
                  className="rounded-xl border border-border p-5"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{orderCode}</p>
                      <p className="text-xs text-muted-foreground">
                        {getOrderDate(order)
                          ? formatDate(getOrderDate(order))
                          : 'Chưa có ngày'}
                      </p>
                    </div>

                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="mb-4 space-y-2">
                    {items.map((item, index) => {
                      const quantity = getItemQuantity(item);
                      const price = getItemPrice(item);
                      const color = getItemColor(item);
                      const size = getItemSize(item);

                      return (
                        <div
                          key={item._id || item.id || `${orderCode}-${index}`}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={getItemImage(item)}
                            alt={getItemName(item)}
                            className="h-12 w-12 rounded-lg bg-secondary object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-medium">
                              {getItemName(item)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {color}
                              {color && size ? ' / ' : ''}
                              {size}
                              {` x${quantity}`}
                            </p>
                          </div>

                          <span className="text-sm font-medium">
                            {formatPrice(price * quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">
                      {getOrderPayment(order)}
                      {paymentStatus ? ` · ${paymentStatus}` : ''}
                    </span>

                    <div className="flex items-center gap-3">
                      <span className="font-bold">
                        {formatPrice(getOrderTotal(order))}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => navigate(`/don-hang/${orderCode}`)}
                        disabled={!orderCode || orderCode === 'Chưa có mã'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}