import { useEffect, useState } from 'react';
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

function getOrderPayment(order: OrderRecord) {
  const payment = order.paymentMethod || order.phuongThucThanhToan;

  if (!payment) return 'Chưa rõ';

  if (typeof payment === 'string') return payment;

  if (typeof payment === 'object') {
    return payment.type || payment.method || 'Chưa rõ';
  }

  return 'Chưa rõ';
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

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const res = await orderService.getMyOrders();
        console.log('getMyOrders response:', res);

        const orderList = getOrderList(res);
        console.log('first order:', orderList[0]);

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
          <p className="mb-6 text-muted-foreground">Hãy đăng nhập để xem lịch sử đơn hàng</p>
          <Button onClick={() => navigate('/dang-nhap')}>Đi đến đăng nhập</Button>
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
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">Lịch sử đơn hàng</h1>

        <div className="space-y-4">
          {orders.map((order) => {
            const status = getStatusInfo(getOrderStatus(order));
            const items = getOrderItems(order);
            const orderCode = getOrderCode(order);

            return (
              <div
                key={order._id || order.id || orderCode}
                className="rounded-xl border border-border p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{orderCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {getOrderDate(order) ? formatDate(getOrderDate(order)) : 'Chưa có ngày'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
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
                          <p className="line-clamp-1 text-sm font-medium">{getItemName(item)}</p>
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

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">
                    {getOrderPayment(order)}
                  </span>

                  <div className="flex items-center gap-3">
                    <span className="font-bold">{formatPrice(getOrderTotal(order))}</span>

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
      </div>
    </MainLayout>
  );
}