import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, RefreshCw, X, XCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type UserInfo = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  fullName?: string;
  hoTen?: string;
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

type OrderInfo = {
  _id?: string;
  id?: string;
  orderCode?: string;
  totalAmount?: number;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  paymentMethod?: string | { type?: string; method?: string };
  shippingAddress?: ShippingAddress;
  guestInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
  };
  userId?: UserInfo | string;
};

type OrderReportRecord = {
  _id?: string;
  id?: string;
  orderId?: OrderInfo | string;
  userId?: UserInfo | string;
  orderCode?: string;
  status?: string;
  trangThai?: string;
  reason?: string;
  lyDo?: string;
  note?: string;
  content?: string;
  description?: string;
  rejectReason?: string;
  previousStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  processedAt?: string;
};

type ReportResponse = {
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  data?: OrderReportRecord[];
  reports?: OrderReportRecord[];
};

const filterTabs = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
] as const;

function getReportList(res: ReportResponse | any): OrderReportRecord[] {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.reports)) return res.reports;
  if (Array.isArray(res)) return res;
  return [];
}

function normalizeReportStatus(raw?: string) {
  if (!raw) return 'pending';

  const value = String(raw).trim().toLowerCase();

  const map: Record<string, string> = {
    pending: 'pending',
    cho_duyet: 'pending',
    chờ_duyệt: 'pending',
    'chờ duyệt': 'pending',

    approved: 'approved',
    da_duyet: 'approved',
    'đã duyệt': 'approved',
    accepted: 'approved',

    rejected: 'rejected',
    tu_choi: 'rejected',
    'từ chối': 'rejected',
    declined: 'rejected',
  };

  return map[value] || value;
}

function getStatusBadgeInfo(status?: string) {
  const normalized = normalizeReportStatus(status);

  const map: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    pending: { label: 'Chờ duyệt', variant: 'secondary' },
    approved: { label: 'Đã duyệt', variant: 'outline' },
    rejected: { label: 'Từ chối', variant: 'destructive' },
  };

  return map[normalized] || {
    label: normalized || 'Không rõ',
    variant: 'outline' as const,
  };
}

function getOrderObject(report: OrderReportRecord): OrderInfo | null {
  if (report.orderId && typeof report.orderId === 'object') return report.orderId;
  return null;
}

function getOrderCode(report: OrderReportRecord) {
  if (report.orderCode) return report.orderCode;
  const order = getOrderObject(report);
  return order?.orderCode || 'Chưa có mã';
}

function getReportReason(report: OrderReportRecord) {
  return (
    report.reason ||
    report.lyDo ||
    report.note ||
    report.content ||
    report.description ||
    'Không có lý do'
  );
}

function getCustomerName(report: OrderReportRecord) {
  const order = getOrderObject(report);

  if (order?.shippingAddress?.fullName) return order.shippingAddress.fullName;
  if (order?.guestInfo?.fullName) return order.guestInfo.fullName;

  if (report.userId && typeof report.userId === 'object') {
    return (
      report.userId.hoTen ||
      report.userId.fullName ||
      `${report.userId.firstName || ''} ${report.userId.lastName || ''}`.trim() ||
      report.userId.email ||
      'Chưa rõ'
    );
  }

  if (order?.userId && typeof order.userId === 'object') {
    return (
      order.userId.hoTen ||
      order.userId.fullName ||
      `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() ||
      order.userId.email ||
      'Chưa rõ'
    );
  }

  return 'Chưa rõ';
}

function getCustomerPhone(report: OrderReportRecord) {
  const order = getOrderObject(report);

  if (order?.shippingAddress?.phone) return order.shippingAddress.phone;
  if (order?.guestInfo?.phone) return order.guestInfo.phone;

  if (report.userId && typeof report.userId === 'object' && report.userId.phone) {
    return report.userId.phone;
  }

  if (order?.userId && typeof order.userId === 'object' && order.userId.phone) {
    return order.userId.phone;
  }

  return 'Chưa rõ';
}

function getCustomerEmail(report: OrderReportRecord) {
  const order = getOrderObject(report);

  if (order?.shippingAddress?.email) return order.shippingAddress.email;
  if (order?.guestInfo?.email) return order.guestInfo.email;

  if (report.userId && typeof report.userId === 'object' && report.userId.email) {
    return report.userId.email;
  }

  if (order?.userId && typeof order.userId === 'object' && order.userId.email) {
    return order.userId.email;
  }

  return 'Chưa rõ';
}

function getAddressText(report: OrderReportRecord) {
  const order = getOrderObject(report);
  const address = order?.shippingAddress;

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

function getOrderTotal(report: OrderReportRecord) {
  const order = getOrderObject(report);
  return order?.totalAmount || 0;
}

function getPaymentType(report: OrderReportRecord) {
  const order = getOrderObject(report);
  const payment = order?.paymentMethod;

  if (!payment) return 'Chưa rõ';
  if (typeof payment === 'string') return payment;

  return payment.type || payment.method || 'Chưa rõ';
}

function getReportId(report?: OrderReportRecord | null) {
  return report?._id || report?.id || '';
}

export default function AdminOrderReportsPage() {
  const [reports, setReports] = useState<OrderReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<OrderReportRecord | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<OrderReportRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const currentSelectedId = useMemo(
    () => selectedReport?._id || selectedReport?.id || null,
    [selectedReport]
  );

  const fetchReports = async (targetPage = page, status = filterStatus) => {
    setLoading(true);

    try {
      const res = (await orderService.getAdminOrderReports({
        page: targetPage,
        limit: 10,
        status: status !== 'all' ? status : undefined,
      })) as ReportResponse;

      const list = getReportList(res);

      setReports(list);
      setPages(res?.meta?.pages || 1);

      if (currentSelectedId) {
        const found = list.find((item) => (item._id || item.id) === currentSelectedId);
        setSelectedReport(found || null);
      }
    } catch (error: any) {
      console.error('getAdminOrderReports error:', error);
      toast.error(error?.message || 'Không thể tải danh sách yêu cầu hủy đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(page, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus]);

  const handleRefresh = async () => {
    await fetchReports(page, filterStatus);
  };

  const handleApprove = async (reportId: string) => {
    setApprovingId(reportId);

    try {
      await orderService.approveOrderReport(reportId);
      toast.success('Duyệt yêu cầu hủy đơn thành công');
      await fetchReports(page, filterStatus);
    } catch (error: any) {
      console.error('approveOrderReport error:', error);
      toast.error(error?.message || 'Không thể duyệt yêu cầu hủy đơn');
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectModal = (report: OrderReportRecord) => {
    setRejectTarget(report);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    if (rejectingId) return;

    setRejectModalOpen(false);
    setRejectTarget(null);
    setRejectReason('');
  };

  const handleSubmitReject = async () => {
    const reportId = getReportId(rejectTarget);
    const trimmedReason = rejectReason.trim();

    if (!reportId) {
      toast.error('Không tìm thấy yêu cầu hủy đơn');
      return;
    }

    if (!trimmedReason) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setRejectingId(reportId);

    try {
      await orderService.rejectOrderReport(reportId, {
        reason: trimmedReason,
      });

      toast.success('Đã từ chối yêu cầu hủy đơn');

      setRejectModalOpen(false);
      setRejectTarget(null);
      setRejectReason('');

      await fetchReports(page, filterStatus);
    } catch (error: any) {
      console.error('rejectOrderReport error:', error);
      toast.error(error?.message || 'Không thể từ chối yêu cầu hủy đơn');
    } finally {
      setRejectingId(null);
    }
  };

  const getReportStatus = (report?: OrderReportRecord | null) => {
    return normalizeReportStatus(report?.status || report?.trangThai);
  };

  const isReportPending = (report?: OrderReportRecord | null) => {
    return getReportStatus(report) === 'pending';
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Yêu cầu hủy đơn</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Các yêu cầu hủy được gắn với đơn hàng gốc. Duyệt yêu cầu sẽ chuyển đơn sang trạng thái Đã hủy, còn từ chối sẽ đưa đơn về trạng thái trước đó và lưu lý do phản hồi cho khách.
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

        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setPage(1);
                setFilterStatus(tab.value);
              }}
              className={`rounded-xl border p-3 text-left transition ${filterStatus === tab.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-secondary/50'
                }`}
            >
              <p className="text-sm font-medium">{tab.label}</p>
            </button>
          ))}
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Danh sách yêu cầu</CardTitle>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Đang tải yêu cầu hủy đơn...
                </div>
              ) : reports.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Không có yêu cầu hủy đơn phù hợp
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Lý do</TableHead>
                        <TableHead>Ngày gửi</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="w-[90px] text-center">Xem</TableHead>
                        <TableHead className="w-[180px] text-center">Xử lý</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {reports.map((report) => {
                        const reportId = getReportId(report);
                        const statusInfo = getStatusBadgeInfo(report.status || report.trangThai);
                        const pending = isReportPending(report);
                        const disabled =
                          approvingId === reportId || rejectingId === reportId;

                        return (
                          <TableRow key={reportId}>
                            <TableCell className="font-medium">
                              {getOrderCode(report)}
                            </TableCell>

                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">
                                  {getCustomerName(report)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {getCustomerPhone(report)}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="max-w-[240px]">
                              <p className="line-clamp-2 text-sm">
                                {getReportReason(report)}
                              </p>
                            </TableCell>

                            <TableCell>
                              <p className="text-sm">
                                {report.createdAt ? formatDate(report.createdAt) : 'Chưa rõ'}
                              </p>
                            </TableCell>

                            <TableCell>
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedReport(report)}
                              >
                                Xem
                              </Button>
                            </TableCell>

                            <TableCell>
                              {pending ? (
                                <div className="flex justify-center gap-2">
                                  <Button
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() => reportId && handleApprove(reportId)}
                                  >
                                    {approvingId === reportId ? 'Đang duyệt' : 'Duyệt'}
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={disabled}
                                    onClick={() => openRejectModal(report)}
                                  >
                                    {rejectingId === reportId ? 'Đang từ chối' : 'Từ chối'}
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-center text-xs text-muted-foreground">
                                  Đã xử lý
                                </p>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Trang {page} / {pages}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        Trước
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={page >= pages}
                        onClick={() => setPage((current) => Math.min(pages, current + 1))}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Chi tiết yêu cầu</CardTitle>
            </CardHeader>

            <CardContent>
              {!selectedReport ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    Chọn một yêu cầu để xem chi tiết
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Mã đơn</p>
                      <p className="font-semibold">{getOrderCode(selectedReport)}</p>
                    </div>

                    <Badge
                      variant={
                        getStatusBadgeInfo(selectedReport.status || selectedReport.trangThai)
                          .variant
                      }
                    >
                      {
                        getStatusBadgeInfo(selectedReport.status || selectedReport.trangThai)
                          .label
                      }
                    </Badge>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Khách hàng</p>
                      <p className="font-medium">{getCustomerName(selectedReport)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Số điện thoại</p>
                      <p className="font-medium">{getCustomerPhone(selectedReport)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="break-all font-medium">
                        {getCustomerEmail(selectedReport)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Địa chỉ</p>
                      <p className="font-medium">{getAddressText(selectedReport)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Thanh toán</p>
                      <p className="font-medium">{getPaymentType(selectedReport)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Tổng tiền đơn hàng</p>
                      <p className="font-semibold">
                        {formatPrice(getOrderTotal(selectedReport))}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <p className="mb-2 text-xs text-muted-foreground">Lý do hủy đơn</p>
                    <p className="font-medium">{getReportReason(selectedReport)}</p>
                  </div>

                  {selectedReport.rejectReason ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="mb-2 text-xs text-red-700/80">Lý do từ chối</p>
                      <p className="font-medium text-red-800">
                        {selectedReport.rejectReason}
                      </p>
                    </div>
                  ) : null}

                  {isReportPending(selectedReport) ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        className="w-full gap-2"
                        disabled={
                          approvingId === getReportId(selectedReport) ||
                          rejectingId === getReportId(selectedReport)
                        }
                        onClick={() => {
                          const reportId = getReportId(selectedReport);
                          if (reportId) handleApprove(reportId);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {approvingId === getReportId(selectedReport)
                          ? 'Đang duyệt'
                          : 'Duyệt hủy'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        disabled={
                          approvingId === getReportId(selectedReport) ||
                          rejectingId === getReportId(selectedReport)
                        }
                        onClick={() => openRejectModal(selectedReport)}
                      >
                        <XCircle className="h-4 w-4" />
                        {rejectingId === getReportId(selectedReport)
                          ? 'Đang từ chối...'
                          : 'Từ chối'}
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                      Yêu cầu này đã được xử lý.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {rejectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Từ chối yêu cầu hủy đơn</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nhập lý do từ chối để khách hàng xem được trong chi tiết đơn hàng.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRejectModal}
                className="rounded-full p-2 text-muted-foreground hover:bg-slate-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!!rejectingId}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-border bg-secondary/30 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Mã đơn</span>
                <span className="font-semibold">
                  {rejectTarget ? getOrderCode(rejectTarget) : 'Chưa rõ'}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-muted-foreground">Lý do khách gửi</p>
                <p className="mt-1 font-medium">
                  {rejectTarget ? getReportReason(rejectTarget) : 'Không có lý do'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Lý do từ chối <span className="text-destructive">*</span>
              </label>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={5}
                placeholder="Ví dụ: Đơn hàng đã được đóng gói và bàn giao cho đơn vị vận chuyển nên không thể hủy ở thời điểm này."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={!!rejectingId}
              />

              <p className="text-xs text-muted-foreground">
                Lý do này sẽ được lưu vào yêu cầu hủy và hiển thị cho khách hàng.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeRejectModal}
                disabled={!!rejectingId}
              >
                Hủy
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={handleSubmitReject}
                disabled={!!rejectingId || !rejectReason.trim()}
              >
                {rejectingId ? 'Đang từ chối...' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}