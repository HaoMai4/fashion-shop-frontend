import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';

const PENDING_PAYOS_ORDER_KEY = 'matewear_pending_payos_order';

export default function PaymentCancelPage() {
    const [searchParams] = useSearchParams();

    const orderCode =
        searchParams.get('orderCode') ||
        searchParams.get('id') ||
        localStorage.getItem(PENDING_PAYOS_ORDER_KEY) ||
        '';

    return (
        <MainLayout>
            <div className="container mx-auto max-w-lg px-4 py-20 text-center">
                <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />

                <h1 className="mb-2 text-2xl font-bold">Thanh toán chưa hoàn tất</h1>

                <p className="mb-6 text-muted-foreground">
                    Bạn đã hủy hoặc chưa hoàn tất thanh toán PayOS. Đơn hàng có thể vẫn đang ở trạng thái chờ thanh toán.
                </p>

                {orderCode ? (
                    <div className="mb-6 rounded-2xl border bg-white p-5 text-sm shadow-sm">
                        Mã đơn hàng:{' '}
                        <span className="font-semibold">{orderCode}</span>
                    </div>
                ) : null}

                <div className="flex justify-center gap-3">
                    <Button asChild>
                        <Link to="/thanh-toan">Quay lại thanh toán</Link>
                    </Button>

                    {orderCode ? (
                        <Button variant="outline" asChild>
                            <Link to={`/tra-cuu-don-hang/${orderCode}`}>Xem đơn hàng</Link>
                        </Button>
                    ) : (
                        <Button variant="outline" asChild>
                            <Link to="/gio-hang">Về giỏ hàng</Link>
                        </Button>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}