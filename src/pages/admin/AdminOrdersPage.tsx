import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Eye,
  RefreshCw,
  ShoppingBag,
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
        name?: string;
        slug?: string;
      }
    | string;
  variantId?:
    | {
        _id?: string;
        color?: string;
        sku?: string;
        images?: string[];
      }
    | string;
  name?: string;
  image?: string;
  color?: string;
  mauSac?: string;
  size?: string;
  kichCo?: string;
  quantity?: number;
  soLuong?: number;
  price?: number;
  gia?: number;
};

type AdminOrderRecord = {
  _id?: string;
  id?: string;
  orderCode?: string;
  createdAt?: string;
  updatedAt?: string;
  orderStatus?: string;
  paymentMethod?: PaymentInfo;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  totalAmount?: number;
  customerNote?: string;
  guestInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
  };
  shippingAddress?: ShippingAddress;
  userId?: UserInfo | string;
  items?: OrderItem[];
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

function getPaymentType(payment?: PaymentInfo) {
  if (!payment) return 'Chưa rõ';
  if (typeof payment === 'string') return payment;
  return payment.type || payment.method || 'Chưa rõ';
}

function getOrderItems(order: AdminOrderRecord) {
  return Array.isArray(order.items) ? order.items : [];
}

function getItemName(item: OrderItem) {
  if (item.name) return item.name;
  if (typeof item.productId === 'object' && item.productId?.name) return item.productId.name;
  return 'Sản phẩm';
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
  return item.price || item.gia || 0;
}

function getAddressText(order: AdminOrderRecord) {
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [tabs, setTabs] = useState<TabsRecord>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<OrderFilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const currentSelectedId = useMemo(
    () => selectedOrder?._id || selectedOrder?.id || null,
    [selectedOrder]
  );

  const fetchTabCounts = async () => {
    try {
      const [res, reportedRes] = await Promise.all([
        orderService.getAdminOrders({
          countsOnly: true,
        }) as Promise<{ tabs?: TabsRecord }>,

        orderService.getAdminOrders({
          page: 1,
          limit: 1,
          status: 'reported',
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
      })) as AdminOrdersResponse;

      const list = Array.isArray(res?.data) ? res.data : [];

      setOrders(list);
      setPages(res?.meta?.pages || 1);

      if (currentSelectedId) {
        const found = list.find((item) => (item._id || item.id) === currentSelectedId);

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
  }, []);

  useEffect(() => {
    fetchOrders(page, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus]);

  const handleRefresh = async () => {
    await Promise.all([fetchTabCounts(), fetchOrders(page, filterStatus)]);
  };

  const handleChangeStatus = async (
    orderId: string,
    orderStatus: AdminOrderStatus
  ) => {
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
              Xem danh sách đơn, chi tiết đơn và cập nhật trạng thái.
            </p>
          </div>

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

        <div className="grid items-start gap-6 xl:grid-cols-[1.6fr_0.84fr]">
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
                        <TableHead className="w-[170px] text-center">
                          Cập nhật
                        </TableHead>
                        <TableHead className="w-[90px] text-center">Xem</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {orders.map((order) => {
                        const orderId = order._id || order.id || '';
                        const normalizedCurrentStatus = normalizeOrderStatus(order.orderStatus);
                        const isReportedOrder = normalizedCurrentStatus === 'reported';

                        return (
                          <TableRow key={orderId}>
                            <TableCell className="font-medium">
                              {order.orderCode || 'Chưa có mã'}
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
                                {getPaymentType(order.paymentMethod)}
                              </span>
                            </TableCell>

                            <TableCell className="font-medium">
                              {formatPrice(order.totalAmount || 0)}
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
                                          : getStatusLabel(order.orderStatus)}
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

          <Card className="h-fit self-start xl:sticky xl:top-24">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base leading-tight">
                  Chi tiết đơn hàng
                </CardTitle>

                {selectedOrder ? (
                  <Badge
                    variant={getStatusBadgeInfo(selectedOrder.orderStatus).variant}
                    className="shrink-0 text-[11px]"
                  >
                    {getStatusBadgeInfo(selectedOrder.orderStatus).label}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>

            <CardContent>
              {!selectedOrder ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Chọn một đơn hàng để xem chi tiết
                </div>
              ) : (
                <div className="space-y-4">
                  {normalizeOrderStatus(selectedOrder.orderStatus) === 'reported' ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-semibold">
                            Đơn hàng này đang có yêu cầu hủy
                          </p>
                          <p className="mt-1">
                            Đây vẫn là đơn hàng gốc. Yêu cầu hủy chỉ là thông tin
                            xử lý đi kèm đơn hàng, không phải một đơn mới.
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

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
                      <p className="font-semibold">
                        {selectedOrder.orderCode || 'Chưa có mã'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Ngày đặt</p>
                      <p className="font-semibold">
                        {selectedOrder.createdAt
                          ? formatDate(selectedOrder.createdAt)
                          : 'Chưa có ngày'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Khách hàng</p>
                      <p className="font-medium">{getCustomerName(selectedOrder)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Số điện thoại</p>
                      <p className="font-medium">{getCustomerPhone(selectedOrder)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium break-all">
                        {getCustomerEmail(selectedOrder)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Địa chỉ</p>
                      <p className="font-medium">{getAddressText(selectedOrder)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Thanh toán</p>
                      <p className="font-medium">
                        {getPaymentType(selectedOrder.paymentMethod)}
                      </p>
                    </div>

                    {selectedOrder.customerNote ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Ghi chú</p>
                        <p className="font-medium">{selectedOrder.customerNote}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="mb-3 font-medium">Sản phẩm</p>

                    <div className="space-y-2.5">
                      {getOrderItems(selectedOrder).map((item, index) => (
                        <div
                          key={item._id || item.id || `${selectedOrder.orderCode}-${index}`}
                          className="rounded-lg border border-border p-2.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-sm font-semibold">
                                {getItemName(item)}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {getItemColor(item)}
                                {getItemColor(item) && getItemSize(item) ? ' / ' : ''}
                                {getItemSize(item)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                SL: {getItemQuantity(item)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(getItemPrice(item))}
                              </p>
                              <p className="text-base font-semibold">
                                {formatPrice(getItemPrice(item) * getItemQuantity(item))}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/40 p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tạm tính</span>
                        <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phí vận chuyển</span>
                        <span>{formatPrice(selectedOrder.shippingFee || 0)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Giảm giá</span>
                        <span>- {formatPrice(selectedOrder.discount || 0)}</span>
                      </div>

                      <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                        <span>Tổng cộng</span>
                        <span>{formatPrice(selectedOrder.totalAmount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}