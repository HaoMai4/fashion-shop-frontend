import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, PackageSearch } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { orderService, type PaymentStatusResponse } from '@/services/api/orderService';
import { formatPrice } from '@/utils/format';

const PENDING_PAYOS_ORDER_KEY = 'matewear_pending_payos_order';

function getStatusText(status?: string) {
  switch (status) {
    case 'paid':
      return 'Đã thanh toán';
    case 'pending':
      return 'Đang chờ xác nhận thanh toán';
    case 'failed':
      return 'Thanh toán thất bại';
    case 'cancelled':
      return 'Đã hủy thanh toán';
    default:
      return 'Đang cập nhật';
  }
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const orderCode = useMemo(() => {
    return (
      searchParams.get('orderCode') ||
      searchParams.get('orderCodeId') ||
      searchParams.get('id') ||
      localStorage.getItem(PENDING_PAYOS_ORDER_KEY) ||
      ''
    );
  }, [searchParams]);

  useEffect(() => {
    const loadPaymentStatus = async () => {
      if (!orderCode) {
        setLoading(false);
        return;
      }

      try {
        const data = await orderService.checkPaymentStatus(orderCode);
        setPayment(data);

        if (data.paymentStatus === 'paid') {
          localStorage.removeItem(PENDING_PAYOS_ORDER_KEY);
        }
      } catch (error) {
        console.error('checkPaymentStatus success error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentStatus();
  }, [orderCode]);

  return (
    <MainLayout>
      <div className="container mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />

        <h1 className="mb-2 text-2xl font-bold">Đã quay lại từ PayOS</h1>

        <p className="mb-6 text-muted-foreground">
          Hệ thống đang cập nhật trạng thái thanh toán cho đơn hàng của bạn.
        </p>

        <div className="mb-6 rounded-2xl border bg-white p-5 text-left shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang kiểm tra trạng thái thanh toán...
            </div>
          ) : orderCode ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <span className="font-semibold">{orderCode}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Trạng thái thanh toán</span>
                <span className="font-semibold">
                  {getStatusText(payment?.paymentStatus)}
                </span>
              </div>

              {payment?.totalAmount !== undefined ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tổng tiền</span>
                  <span className="font-semibold">
                    {formatPrice(payment.totalAmount)}
                  </span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <PackageSearch className="h-4 w-4" />
              Không tìm thấy mã đơn hàng để kiểm tra.
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>

          {orderCode ? (
            <Button variant="outline" asChild>
              <Link to={`/tra-cuu-don-hang/${orderCode}`}>Xem đơn hàng</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/don-hang">Lịch sử đơn hàng</Link>
            </Button>
          )}
        </div>
      </div>
    </MainLayout>
  );
}