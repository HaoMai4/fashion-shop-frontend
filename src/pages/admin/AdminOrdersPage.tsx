import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Eye,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { orderService } from '@/services/api/orderService';
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

type UserInfo = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type ShippingAddress = {
  fullName?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  addressLine1?: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city?: string;
  postalCode?: string;
};

type VoucherSnapshot = {
  voucherId?: string;
  code?: string;
  type?: 'percent' | 'fixed' | string;
  value?: number;
  discountAmount?: number;
  totalBeforeVoucher?: number;
  totalAfterVoucher?: number;
  appliedItems?: any[];
  redeemed?: boolean;
  redeemedAt?: string;
};

type OrderItem = {
  _id?: string;
  id?: string;
  slug?: string;
  productSlug?: string;
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
        sku?: string;
        images?: string[];
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
    slug?: string;
    image?: string;
    hinhAnh?: string | string[];
  };
  sanPham?: {
    ten?: string;
    slug?: string;
    hinhAnh?: string | string[];
  };
};

type AdminOrderRecord = {
  _id?: string;
  id?: string;
  orderCode?: string;
  maDonHang?: string;
  createdAt?: string;
  updatedAt?: string;

  orderStatus?: string;
  status?: string;
  statusOrder?: string;
  fulfillmentStatus?: string;

  paymentMethod?: PaymentInfo;
  phuongThucThanhToan?: PaymentInfo;

  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  voucherDiscount?: number;
  discountAmount?: number;
  totalAmount?: number;
  finalTotal?: number;
  tongTien?: number;

  voucher?: VoucherSnapshot | null;
  voucherCode?: string;

  customerNote?: string;
  guestInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
  };
  shippingAddress?: ShippingAddress;
  userId?: UserInfo | string;
  items?: OrderItem[];
  chiTiet?: OrderItem[];
};

type TabsRecord = {
  all?: number;
  pending?: number;
  confirmed?: number;
  reported?: number;
  shipped?: number;
  delivered?: number;
  completed?: number;
  cancelled?: number;
  paid?: number;
  problems?: number;
};

type AdminOrdersResponse = {
  meta?: {
    total?: number;
    totalAmount?: number;
    pageTotal?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  tabs?: TabsRecord;
  data?: AdminOrderRecord[];
};

const statusOptions = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const;

const filterTabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'reported', label: 'Yêu cầu hủy' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const;

type AdminOrderStatus = (typeof statusOptions)[number]['value'];
type OrderFilterStatus = 'all' | AdminOrderStatus | 'reported';

function normalizeOrderStatus(raw?: string) {
  if (!raw) return '';

  const value = String(raw).trim().toLowerCase();

  const map: Record<string, string> = {
    pending: 'pending',
    cho_xac_nhan: 'pending',
    'chờ xác nhận': 'pending',

    confirmed: 'confirmed',
    da_xac_nhan: 'confirmed',
    'đã xác nhận': 'confirmed',

    shipped: 'shipped',
    shipping: 'shipped',
    dang_giao: 'shipped',
    'đang giao': 'shipped',

    delivered: 'delivered',
    da_giao: 'delivered',
    'đã giao': 'delivered',

    completed: 'completed',
    hoan_thanh: 'completed',
    'hoàn thành': 'completed',

    reported: 'reported',
    report: 'reported',
    yeu_cau_huy: 'reported',
    'yêu cầu hủy': 'reported',

    cancelled: 'cancelled',
    canceled: 'cancelled',
    da_huy: 'cancelled',
    'đã hủy': 'cancelled',
  };

  return map[value] || value;
}

function getOrderId(order?: AdminOrderRecord | null) {
  return order?._id || order?.id || '';
}

function getOrderCode(order?: AdminOrderRecord | null) {
  if (!order) return 'Chưa có mã';
  return order.orderCode || order.maDonHang || 'Chưa có mã';
}

function getOrderStatus(order?: AdminOrderRecord | null) {
  if (!order) return '';

  return normalizeOrderStatus(
    order.orderStatus ||
      order.status ||
      order.statusOrder ||
      order.fulfillmentStatus ||
      ''
  );
}

function getStatusBadgeInfo(status?: string) {
  const normalized = normalizeOrderStatus(status);

  const map: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    pending: { label: 'Chờ xác nhận', variant: 'secondary' },
    reported: { label: 'Yêu cầu hủy', variant: 'secondary' },
    confirmed: { label: 'Đã xác nhận', variant: 'default' },
    shipped: { label: 'Đang giao', variant: 'default' },
    delivered: { label: 'Đã giao', variant: 'outline' },
    completed: { label: 'Hoàn thành', variant: 'outline' },
    cancelled: { label: 'Đã hủy', variant: 'destructive' },
  };

  return map[normalized] || { label: normalized || 'Không rõ', variant: 'outline' as const };
}

function getStatusLabel(status?: string) {
  const normalized = normalizeOrderStatus(status);

  const map: Record<string, string> = {
    pending: 'Chờ xác nhận',
    reported: 'Yêu cầu hủy',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  return map[normalized] || 'Cập nhật';
}

function getCustomerName(order: AdminOrderRecord) {
  if (order.shippingAddress?.fullName) return order.shippingAddress.fullName;
  if (order.guestInfo?.fullName) return order.guestInfo.fullName;

  if (order.userId && typeof order.userId === 'object') {
    const fullName = `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (order.userId.email) return order.userId.email;
  }

  return 'Chưa rõ';
}

function getCustomerPhone(order: AdminOrderRecord) {
  if (order.shippingAddress?.phone) return order.shippingAddress.phone;
  if (order.guestInfo?.phone) return order.guestInfo.phone;

  if (order.userId && typeof order.userId === 'object' && order.userId.phone) {
    return order.userId.phone;
  }

  return 'Chưa rõ';
}

function getCustomerEmail(order: AdminOrderRecord) {
  if (order.shippingAddress?.email) return order.shippingAddress.email;
  if (order.guestInfo?.email) return order.guestInfo.email;

  if (order.userId && typeof order.userId === 'object' && order.userId.email) {
    return order.userId.email;
  }

  return 'Chưa rõ';
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

function getPaymentType(payment?: PaymentInfo) {
  if (!payment) return 'Chưa rõ';
  if (typeof payment === 'string') return normalizePaymentLabel(payment);
  return normalizePaymentLabel(payment.type || payment.method || 'Chưa rõ');
}

function getPaymentStatus(payment?: PaymentInfo) {
  if (!payment || typeof payment === 'string') return 'Chưa rõ';

  const value = String(payment.status || '').trim().toLowerCase();

  const map: Record<string, string> = {
    pending: 'Chờ thanh toán',
    paid: 'Đã thanh toán',
    failed: 'Thanh toán thất bại',
    cancelled: 'Đã hủy thanh toán',
  };

  return map[value] || payment.status || 'Chưa rõ';
}

function getOrderItems(order?: AdminOrderRecord | null) {
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

function getItemSlug(item: OrderItem) {
  if (item.productSlug) return item.productSlug;
  if (item.slug) return item.slug;
  if (typeof item.productId === 'object' && item.productId?.slug) return item.productId.slug;
  if (item.product?.slug) return item.product.slug;
  if (item.sanPham?.slug) return item.sanPham.slug;
  return '';
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

  return '/placeholder.svg';
}

function getItemColor(item: OrderItem) {
  if (item.color) return item.color;
  if (item.mauSac) return item.mauSac;
  if (typeof item.variantId === 'object' && item.variantId?.color) return item.variantId.color;
  return '';
}

function getItemColorCode(item: OrderItem) {
  if (typeof item.variantId === 'object' && item.variantId?.colorCode) {
    return item.variantId.colorCode;
  }

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

function getAddressText(order: AdminOrderRecord) {
  const address = order.shippingAddress;
  if (!address) return 'Chưa có địa chỉ';

  const parts = [
    address.addressLine,
    address.addressLine1,
    address.addressLine2,
    address.ward,
    address.district,
    address.city,
    address.postalCode,
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : 'Chưa có địa chỉ';
}

function toMoney(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getVoucher(order?: AdminOrderRecord | null) {
  if (!order?.voucher || typeof order.voucher !== 'object') return null;
  return order.voucher;
}

function getVoucherCode(order?: AdminOrderRecord | null) {
  const voucher = getVoucher(order);
  return voucher?.code || order?.voucherCode || '';
}

function getVoucherDiscount(order?: AdminOrderRecord | null) {
  const voucher = getVoucher(order);

  const snapshotDiscount = toMoney(voucher?.discountAmount);
  if (snapshotDiscount > 0) return snapshotDiscount;

  const voucherDiscount = toMoney(order?.voucherDiscount);
  if (voucherDiscount > 0) return voucherDiscount;

  const discountAmount = toMoney(order?.discountAmount);
  if (discountAmount > 0) return discountAmount;

  return toMoney(order?.discount);
}

function getOrderSubtotal(order?: AdminOrderRecord | null) {
  if (!order) return 0;

  const subtotal = toMoney(order.subtotal);
  if (subtotal > 0) return subtotal;

  const voucher = getVoucher(order);
  const totalBeforeVoucher = toMoney(voucher?.totalBeforeVoucher);
  if (totalBeforeVoucher > 0) return totalBeforeVoucher;

  return getOrderItems(order).reduce((sum, item) => {
    return sum + getItemPrice(item) * getItemQuantity(item);
  }, 0);
}

function getOrderShippingFee(order?: AdminOrderRecord | null) {
  return toMoney(order?.shippingFee);
}

function getOrderTotal(order?: AdminOrderRecord | null) {
  if (!order) return 0;

  const explicitTotal = toMoney(order.finalTotal || order.totalAmount || order.tongTien);
  if (explicitTotal > 0) return explicitTotal;

  return Math.max(getOrderSubtotal(order) - getVoucherDiscount(order), 0) + getOrderShippingFee(order);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [tabs, setTabs] = useState<TabsRecord>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderFilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pageTotalAmount, setPageTotalAmount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const currentSelectedId = useMemo(
    () => getOrderId(selectedOrder),
    [selectedOrder]
  );

  const getDateParams = () => ({
    dateFrom: appliedDateFrom || undefined,
    dateTo: appliedDateTo || undefined,
  });

  const fetchTabCounts = async () => {
    try {
      const dateParams = getDateParams();

      const [res, reportedRes] = await Promise.all([
        orderService.getAdminOrders({
          countsOnly: true,
          ...dateParams,
        }) as Promise<{ tabs?: TabsRecord }>,

        orderService.getAdminOrders({
          page: 1,
          limit: 1,
          status: 'reported',
          ...dateParams,
        }) as Promise<AdminOrdersResponse>,
      ]);

      setTabs({
        ...(res?.tabs || {}),
        reported: reportedRes?.meta?.total || 0,
      });
    } catch (error: any) {
      console.error('getAdminOrders counts error:', error);
    }
  };

  const fetchOrders = async (
    targetPage = page,
    status: OrderFilterStatus = filterStatus
  ) => {
    setLoading(true);

    try {
      const res = (await orderService.getAdminOrders({
        page: targetPage,
        limit: 10,
        status: status !== 'all' ? status : undefined,
        ...getDateParams(),
      })) as AdminOrdersResponse;

      const list = Array.isArray(res?.data) ? res.data : [];

      setOrders(list);
      setPages(res?.meta?.pages || 1);
      setTotalOrders(res?.meta?.total || 0);
      setTotalAmount(res?.meta?.totalAmount || 0);
      setPageTotalAmount(res?.meta?.pageTotal || 0);

      if (currentSelectedId) {
        const found = list.find((item) => getOrderId(item) === currentSelectedId);

        if (found) {
          setSelectedOrder(found);
        }
      }
    } catch (error: any) {
      console.error('getAdminOrders error:', error);
      toast.error(error?.message || 'Không thể tải danh sách đơn hàng admin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedDateFrom, appliedDateTo]);

  useEffect(() => {
    fetchOrders(page, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, appliedDateFrom, appliedDateTo]);

  const handleRefresh = async () => {
    await Promise.all([fetchTabCounts(), fetchOrders(page, filterStatus)]);
  };

  const handleApplyDateFilter = () => {
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      toast.error('Từ ngày không được lớn hơn đến ngày');
      return;
    }

    setPage(1);
    setSelectedOrder(null);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const handleClearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
    setPage(1);
    setSelectedOrder(null);
  };

  const handleChangeStatus = async (
    orderId: string,
    orderStatus: AdminOrderStatus
  ) => {
    if (!orderId) {
      toast.error('Không tìm thấy mã đơn nội bộ');
      return;
    }

    setUpdatingOrderId(orderId);

    try {
      await orderService.updateOrderStatus(orderId, { orderStatus });
      toast.success('Cập nhật trạng thái đơn hàng thành công');
      await Promise.all([fetchTabCounts(), fetchOrders(page, filterStatus)]);
    } catch (error: any) {
      console.error('updateOrderStatus error:', error);
      toast.error(error?.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Xem danh sách đơn, mở chi tiết đơn và cập nhật trạng thái ngay trong trang admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/tra-cuu-don-hang">
                <Search className="h-4 w-4" />
                Tra cứu đơn hàng
              </Link>
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-background p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-sm font-medium">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-sm font-medium">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button onClick={handleApplyDateFilter}>
              Áp dụng
            </Button>

            <Button variant="outline" onClick={handleClearDateFilter}>
              Xóa lọc
            </Button>
          </div>

          {appliedDateFrom || appliedDateTo ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Đang lọc đơn hàng
              {appliedDateFrom ? ` từ ${appliedDateFrom}` : ''}
              {appliedDateTo ? ` đến ${appliedDateTo}` : ''}
            </p>
          ) : null}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setPage(1);
                setFilterStatus(tab.value);
              }}
              className={`rounded-xl border p-3 text-left transition ${
                filterStatus === tab.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-secondary/50'
              }`}
            >
              <p className="text-xs text-muted-foreground">{tab.label}</p>
              <p className="mt-1 text-xl font-bold">
                {tab.value === 'all'
                  ? tabs.all || 0
                  : tabs[tab.value as keyof TabsRecord] || 0}
              </p>
            </button>
          ))}
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Tổng đơn đang lọc</p>
            <p className="mt-1 text-2xl font-bold">{totalOrders}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Tổng doanh thu đang lọc</p>
            <p className="mt-1 text-2xl font-bold">{formatPrice(totalAmount)}</p>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm text-muted-foreground">Doanh thu trang hiện tại</p>
            <p className="mt-1 text-2xl font-bold">{formatPrice(pageTotalAmount)}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh sách đơn hàng</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Đang tải danh sách đơn hàng...
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  Không có đơn hàng phù hợp
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead>Thanh toán</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-[170px] text-center">
                        Cập nhật
                      </TableHead>
                      <TableHead className="w-[90px] text-center">Xem</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {orders.map((order) => {
                      const orderId = getOrderId(order);
                      const normalizedCurrentStatus = getOrderStatus(order);
                      const isReportedOrder = normalizedCurrentStatus === 'reported';
                      const statusBadge = getStatusBadgeInfo(normalizedCurrentStatus);

                      return (
                        <TableRow key={orderId || getOrderCode(order)}>
                          <TableCell className="font-medium">
                            {getOrderCode(order)}
                          </TableCell>

                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {getCustomerName(order)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {getCustomerPhone(order)}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            {order.createdAt ? formatDate(order.createdAt) : 'Chưa có ngày'}
                          </TableCell>

                          <TableCell>
                            <span className="text-sm font-medium">
                              {getPaymentType(order.paymentMethod || order.phuongThucThanhToan)}
                            </span>
                          </TableCell>

                          <TableCell className="font-medium">
                            {formatPrice(getOrderTotal(order))}
                          </TableCell>

                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-center">
                            {isReportedOrder ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mx-auto h-9 min-w-[140px] justify-center gap-2 rounded-lg border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <AlertTriangle className="h-4 w-4" />
                                Yêu cầu hủy
                              </Button>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={updatingOrderId === orderId}
                                    className="mx-auto h-9 min-w-[140px] justify-between gap-2 rounded-lg"
                                  >
                                    <span className="truncate text-left">
                                      {updatingOrderId === orderId
                                        ? 'Đang cập nhật...'
                                        : getStatusLabel(normalizedCurrentStatus)}
                                    </span>
                                    <ChevronDown className="h-4 w-4 shrink-0" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="center" className="w-52">
                                  {statusOptions.map((option) => {
                                    const isCurrent =
                                      normalizedCurrentStatus === option.value;

                                    return (
                                      <DropdownMenuItem
                                        key={option.value}
                                        onClick={() => {
                                          if (!isCurrent) {
                                            handleChangeStatus(orderId, option.value);
                                          }
                                        }}
                                        className="flex items-center justify-between gap-3"
                                      >
                                        <span>{option.label}</span>
                                        {isCurrent ? <Check className="h-4 w-4" /> : null}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Xem
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Trang {page} / {pages}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((prev) => prev - 1)}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pages}
                      onClick={() => setPage((prev) => prev + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {selectedOrder ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6">
            <div className="w-full max-w-5xl rounded-2xl bg-background shadow-2xl">
              <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-border bg-background p-5">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold">Chi tiết đơn hàng</h2>
                    <Badge variant={getStatusBadgeInfo(getOrderStatus(selectedOrder)).variant}>
                      {getStatusBadgeInfo(getOrderStatus(selectedOrder)).label}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Mã đơn hàng:{' '}
                    <span className="font-semibold text-foreground">
                      {getOrderCode(selectedOrder)}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ngày đặt:{' '}
                    <span className="font-medium text-foreground">
                      {selectedOrder.createdAt
                        ? formatDate(selectedOrder.createdAt)
                        : 'Chưa có ngày'}
                    </span>
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-5">
                {getOrderStatus(selectedOrder) === 'reported' ? (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">
                          Đơn hàng này đang có yêu cầu hủy
                        </p>
                        <p className="mt-1">
                          Đây vẫn là đơn hàng gốc. Yêu cầu hủy chỉ là thông tin xử lý đi kèm đơn hàng.
                        </p>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
                          asChild
                        >
                          <Link to="/admin/order-reports">
                            Xem yêu cầu hủy
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
                  <div className="space-y-5">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Sản phẩm trong đơn</CardTitle>
                      </CardHeader>

                      <CardContent>
                        {getOrderItems(selectedOrder).length === 0 ? (
                          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                            Đơn hàng chưa có dữ liệu sản phẩm
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getOrderItems(selectedOrder).map((item, index) => {
                              const itemSlug = getItemSlug(item);
                              const color = getItemColor(item);
                              const colorCode = getItemColorCode(item);
                              const size = getItemSize(item);
                              const quantity = getItemQuantity(item);
                              const price = getItemPrice(item);

                              const content = (
                                <div className="flex gap-4 rounded-xl border border-border p-3 transition hover:bg-secondary/30">
                                  <img
                                    src={getItemImage(item)}
                                    alt={getItemName(item)}
                                    className="h-20 w-20 shrink-0 rounded-lg bg-secondary object-cover"
                                  />

                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 font-semibold">
                                      {getItemName(item)}
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                                      {color ? (
                                        <span className="inline-flex items-center gap-1">
                                          {colorCode ? (
                                            <span
                                              className="h-3 w-3 rounded-full border border-border"
                                              style={{ backgroundColor: colorCode }}
                                            />
                                          ) : null}
                                          Màu: {color}
                                        </span>
                                      ) : null}

                                      {size ? <span>Size: {size}</span> : null}

                                      <span>Số lượng: {quantity}</span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 text-right">
                                    <p className="text-sm text-muted-foreground">
                                      {formatPrice(price)}
                                    </p>
                                    <p className="text-base font-bold">
                                      {formatPrice(price * quantity)}
                                    </p>
                                  </div>
                                </div>
                              );

                              if (itemSlug) {
                                return (
                                  <Link
                                    key={item._id || item.id || `${getOrderCode(selectedOrder)}-${index}`}
                                    to={`/san-pham/${itemSlug}`}
                                    className="block"
                                  >
                                    {content}
                                  </Link>
                                );
                              }

                              return (
                                <div
                                  key={item._id || item.id || `${getOrderCode(selectedOrder)}-${index}`}
                                >
                                  {content}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Ghi chú đơn hàng</CardTitle>
                      </CardHeader>

                      <CardContent>
                        {selectedOrder.customerNote ? (
                          <p className="rounded-xl bg-secondary/40 p-4 text-sm">
                            {selectedOrder.customerNote}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Khách hàng không để lại ghi chú.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-5">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Thông tin khách hàng</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4 text-sm">
                        <div className="flex gap-3">
                          <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Khách hàng</p>
                            <p className="font-semibold">{getCustomerName(selectedOrder)}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Số điện thoại</p>
                            <p className="font-semibold">{getCustomerPhone(selectedOrder)}</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Email</p>
                            <p className="break-all font-semibold">
                              {getCustomerEmail(selectedOrder)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Địa chỉ nhận hàng</p>
                            <p className="font-semibold leading-relaxed">
                              {getAddressText(selectedOrder)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Thanh toán</CardTitle>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Phương thức</span>
                            <span className="text-right font-medium">
                              {getPaymentType(selectedOrder.paymentMethod || selectedOrder.phuongThucThanhToan)}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Trạng thái</span>
                            <span className="text-right font-medium">
                              {getPaymentStatus(selectedOrder.paymentMethod || selectedOrder.phuongThucThanhToan)}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Tạm tính</span>
                            <span className="text-right font-medium">
                              {formatPrice(getOrderSubtotal(selectedOrder))}
                            </span>
                          </div>

                          {getVoucherDiscount(selectedOrder) > 0 ? (
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">
                                {getVoucherCode(selectedOrder)
                                  ? `Mã giảm giá (${getVoucherCode(selectedOrder)})`
                                  : 'Giảm giá'}
                              </span>
                              <span className="text-right font-medium text-emerald-600">
                                - {formatPrice(getVoucherDiscount(selectedOrder))}
                              </span>
                            </div>
                          ) : null}

                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Phí vận chuyển</span>
                            <span className="text-right font-medium">
                              {formatPrice(getOrderShippingFee(selectedOrder))}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold">
                            <span>Tổng cộng</span>
                            <span className="text-right">
                              {formatPrice(getOrderTotal(selectedOrder))}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Cập nhật trạng thái</CardTitle>
                      </CardHeader>

                      <CardContent>
                        {getOrderStatus(selectedOrder) === 'reported' ? (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Đơn hàng đang có yêu cầu hủy. Hãy xử lý ở trang yêu cầu hủy đơn.
                            </p>

                            <Button asChild className="w-full">
                              <Link to="/admin/order-reports">
                                Đi đến yêu cầu hủy
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                                disabled={updatingOrderId === getOrderId(selectedOrder)}
                              >
                                <span>
                                  {updatingOrderId === getOrderId(selectedOrder)
                                    ? 'Đang cập nhật...'
                                    : getStatusLabel(getOrderStatus(selectedOrder))}
                                </span>
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-56">
                              {statusOptions.map((option) => {
                                const isCurrent = getOrderStatus(selectedOrder) === option.value;

                                return (
                                  <DropdownMenuItem
                                    key={option.value}
                                    onClick={() => {
                                      if (!isCurrent) {
                                        handleChangeStatus(getOrderId(selectedOrder), option.value);
                                      }
                                    }}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <span>{option.label}</span>
                                    {isCurrent ? <Check className="h-4 w-4" /> : null}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MainLayout>
  );
}