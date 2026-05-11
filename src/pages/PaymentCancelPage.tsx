import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, PackageSearch, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { orderService, type PaymentStatusResponse } from '@/services/api/orderService';
import { formatPrice } from '@/utils/format';

const PENDING_PAYOS_ORDER_KEY = 'matewear_pending_payos_order';
const PENDING_PAYOS_SOURCE_KEY = 'matewear_pending_payos_source';
const PENDING_PAYOS_BUY_NOW_SLUG_KEY = 'matewear_pending_payos_buy_now_slug';
const REORDER_CHECKOUT_KEY = 'matewear_reorder_checkout';
const PENDING_PAYOS_CHECKOUT_DRAFT_KEY = 'matewear_pending_payos_checkout_draft';

function getRemainingSeconds(expiresAt?: string | null) {
    if (!expiresAt) return 0;

    const expiredTime = new Date(expiresAt).getTime();

    if (Number.isNaN(expiredTime)) return 0;

    return Math.max(0, Math.floor((expiredTime - Date.now()) / 1000));
}

function formatCountdown(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getPaymentStatusText(status?: string) {
    switch (status) {
        case 'paid':
            return 'Đã thanh toán';
        case 'pending':
            return 'Đang chờ thanh toán';
        case 'failed':
            return 'Thanh toán thất bại';
        case 'cancelled':
            return 'Đã hủy thanh toán';
        default:
            return 'Đang cập nhật';
    }
}

function getOrderStatusText(status?: string) {
    switch (status) {
        case 'pending_payment':
            return 'Chờ thanh toán';
        case 'pending':
            return 'Chờ xác nhận';
        case 'confirmed':
            return 'Đã xác nhận';
        case 'shipped':
            return 'Đang giao';
        case 'delivered':
            return 'Đã giao';
        case 'completed':
            return 'Hoàn thành';
        case 'cancelled':
            return 'Đã hủy';
        case 'reported':
            return 'Đang xử lý yêu cầu';
        default:
            return 'Đang cập nhật';
    }
}

export default function PaymentCancelPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const [syncingExpired, setSyncingExpired] = useState(false);

    const orderCode = useMemo(() => {
        return (
            searchParams.get('orderCode') ||
            searchParams.get('id') ||
            localStorage.getItem(PENDING_PAYOS_ORDER_KEY) ||
            ''
        );
    }, [searchParams]);

    const payosSource = useMemo(() => {
        return localStorage.getItem(PENDING_PAYOS_SOURCE_KEY) || 'cart';
    }, []);

    const buyNowProductSlug = useMemo(() => {
        return localStorage.getItem(PENDING_PAYOS_BUY_NOW_SLUG_KEY) || '';
    }, []);

    const pendingCheckoutDraft = useMemo(() => {
        return localStorage.getItem(PENDING_PAYOS_CHECKOUT_DRAFT_KEY);
    }, []);

    const canRetryCheckout = Boolean(pendingCheckoutDraft);

    const fallbackHref =
        payosSource === 'buy-now'
            ? buyNowProductSlug
                ? `/san-pham/${buyNowProductSlug}`
                : '/san-pham'
            : '/gio-hang';

    const fallbackLabel =
        payosSource === 'buy-now'
            ? buyNowProductSlug
                ? 'Quay lại sản phẩm'
                : 'Tiếp tục mua sắm'
            : 'Quay lại giỏ hàng';

    useEffect(() => {
        const loadPaymentStatus = async () => {
            if (!orderCode) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const data = await orderService.checkPaymentStatus(orderCode);
                setPayment(data);

                if (data.paymentStatus === 'paid' || data.paymentStatus === 'cancelled') {
                    localStorage.removeItem(PENDING_PAYOS_ORDER_KEY);
                }
            } catch (error) {
                console.error('checkPaymentStatus cancel error:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPaymentStatus();
    }, [orderCode]);

    useEffect(() => {
        if (!payment?.expiresAt || payment.paymentStatus !== 'pending') {
            setRemainingSeconds(0);
            return;
        }

        const updateRemaining = () => {
            setRemainingSeconds(getRemainingSeconds(payment.expiresAt));
        };

        updateRemaining();

        const timer = window.setInterval(updateRemaining, 1000);

        return () => window.clearInterval(timer);
    }, [payment?.expiresAt, payment?.paymentStatus]);

    useEffect(() => {
        if (
            !orderCode ||
            !payment?.expiresAt ||
            payment.paymentStatus !== 'pending' ||
            syncingExpired
        ) {
            return;
        }

        const isExpired = getRemainingSeconds(payment.expiresAt) <= 0;

        if (!isExpired || remainingSeconds !== 0) {
            return;
        }

        const syncExpiredPayment = async () => {
            try {
                setSyncingExpired(true);

                const data = await orderService.checkPaymentStatus(orderCode);
                setPayment(data);

                if (data.paymentStatus === 'paid' || data.paymentStatus === 'cancelled') {
                    localStorage.removeItem(PENDING_PAYOS_ORDER_KEY);
                }
            } catch (error) {
                console.error('sync expired payment error:', error);
            } finally {
                setSyncingExpired(false);
            }
        };

        syncExpiredPayment();
    }, [
        orderCode,
        payment?.expiresAt,
        payment?.paymentStatus,
        remainingSeconds,
        syncingExpired,
    ]);

    const canContinuePayment =
        payment?.paymentStatus === 'pending' &&
        Boolean(payment?.invoiceUrl) &&
        remainingSeconds > 0;

    const handleRetryCheckout = () => {
        const draft = localStorage.getItem(PENDING_PAYOS_CHECKOUT_DRAFT_KEY);

        if (!draft) {
            toast.error('Không tìm thấy dữ liệu thanh toán để tạo lại checkout');
            return;
        }

        localStorage.setItem(REORDER_CHECKOUT_KEY, draft);
        navigate('/thanh-toan?mode=reorder');
    };

    return (
        <MainLayout>
            <div className="container mx-auto max-w-lg px-4 py-20 text-center">
                <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />

                <h1 className="mb-2 text-2xl font-bold">Thanh toán chưa hoàn tất</h1>

                <p className="mb-6 text-muted-foreground">
                    Bạn đã hủy hoặc chưa hoàn tất thanh toán PayOS. Đơn hàng sẽ chỉ được xử lý sau khi thanh toán thành công.
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
                                <span className="text-muted-foreground">Trạng thái đơn</span>
                                <span className="font-semibold">
                                    {getOrderStatusText(payment?.orderStatus)}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="text-muted-foreground">Trạng thái thanh toán</span>
                                <span className="font-semibold">
                                    {getPaymentStatusText(payment?.paymentStatus)}
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

                            {canContinuePayment ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
                                    <p className="font-medium">
                                        Mã thanh toán còn hiệu lực trong {formatCountdown(remainingSeconds)}
                                    </p>
                                    <p className="mt-1 text-xs">
                                        Bạn có thể tiếp tục thanh toán bằng liên kết PayOS hiện tại.
                                    </p>
                                </div>
                            ) : payment?.paymentStatus === 'pending' && payment?.expiresAt ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                    <p className="font-medium">Mã thanh toán đã hết hạn.</p>
                                    <p className="mt-1 text-xs">
                                        Bạn có thể tạo lại checkout với thông tin đơn hàng vừa rồi.
                                    </p>
                                </div>
                            ) : payment?.paymentStatus === 'cancelled' ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                                    <p className="font-medium">Thanh toán đã bị hủy.</p>
                                    <p className="mt-1 text-xs">
                                        Bạn có thể thanh toán lại bằng cách tạo lại checkout.
                                    </p>
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

                <div className="flex flex-wrap justify-center gap-3">
                    {canContinuePayment && payment?.invoiceUrl ? (
                        <Button asChild>
                            <a href={payment.invoiceUrl}>Tiếp tục thanh toán</a>
                        </Button>
                    ) : canRetryCheckout ? (
                        <Button type="button" onClick={handleRetryCheckout}>
                            Thanh toán lại đơn này
                        </Button>
                    ) : (
                        <Button asChild>
                            <Link to={fallbackHref}>{fallbackLabel}</Link>
                        </Button>
                    )}

                    {orderCode ? (
                        <Button variant="outline" asChild>
                            <Link to={`/don-hang/${orderCode}`}>Xem đơn hàng</Link>
                        </Button>
                    ) : null}
                </div>
            </div>
        </MainLayout>
    );
}