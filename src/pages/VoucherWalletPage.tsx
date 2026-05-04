import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  Loader2,
  TicketPercent,
  X,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isLoggedIn } from '@/services/api/userService';
import {
  getMyVouchers,
  type UserVoucher,
} from '@/services/api/voucherService';

function formatCurrency(value?: number | null) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return date.toLocaleDateString('vi-VN');
}

function getVoucherDescription(voucher: UserVoucher) {
  if (voucher.description?.trim()) return voucher.description.trim();

  const minOrderText =
    voucher.minOrderValue && voucher.minOrderValue > 0
      ? ` cho đơn hàng từ ${formatCurrency(voucher.minOrderValue)}`
      : '';

  if (voucher.type === 'percent') {
    const maxText =
      voucher.maxDiscount && voucher.maxDiscount > 0
        ? `, tối đa ${formatCurrency(voucher.maxDiscount)}`
        : '';

    return `Giảm ${voucher.value}%${maxText}${minOrderText}`;
  }

  return `Giảm ${formatCurrency(voucher.value)}${minOrderText}`;
}

function getVoucherDetail(voucher: UserVoucher) {
  if (voucher.detail?.trim()) return voucher.detail.trim();

  return getVoucherDescription(voucher);
}

function getVoucherCondition(voucher: UserVoucher) {
  if (voucher.terms?.trim()) return voucher.terms.trim();

  if (voucher.minOrderValue && voucher.minOrderValue > 0) {
    return `Đơn hàng từ ${formatCurrency(voucher.minOrderValue)} trở lên.`;
  }

  return 'Áp dụng theo điều kiện của hệ thống.';
}

export default function VoucherWalletPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<UserVoucher | null>(null);

  useEffect(() => {
    const loadVouchers = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const data = await getMyVouchers();
        setVouchers(data);
      } catch (error: any) {
        console.error('Load vouchers error:', error);
        toast.error(error?.message || 'Không thể tải ví voucher');
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    loadVouchers();
  }, []);

  const sortedVouchers = useMemo(() => {
    return [...vouchers].sort((a, b) => {
      const aTime = a.endAt ? new Date(a.endAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.endAt ? new Date(b.endAt).getTime() : Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    });
  }, [vouchers]);

  if (!isLoggedIn()) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Ví voucher</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn cần đăng nhập để xem ví voucher.
            </p>

            <Button className="mt-4" onClick={() => navigate('/dang-nhap')}>
              Đi đến đăng nhập
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-slate-50 py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Button
                type="button"
                variant="ghost"
                className="mb-2 px-0"
                onClick={() => navigate('/tai-khoan')}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Quay lại tài khoản
              </Button>

              <h1 className="text-3xl font-bold">Ví Voucher</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Xem toàn bộ mã giảm giá hiện có trong tài khoản của bạn.
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <TicketPercent className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            {loading ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-slate-500" />
                <p className="text-sm text-muted-foreground">
                  Đang tải ví voucher...
                </p>
              </div>
            ) : sortedVouchers.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-lg font-semibold">Chưa có voucher nào</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hiện tại tài khoản của bạn chưa có voucher khả dụng.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedVouchers.map((voucher) => (
                  <button
                    key={voucher._id}
                    type="button"
                    onClick={() => setSelectedVoucher(voucher)}
                    className="group relative overflow-hidden rounded-xl bg-slate-50 p-5 text-left transition hover:bg-slate-100"
                  >
                    <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />
                    <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white" />

                    <div className="border-l border-dashed border-slate-300 pl-4">
                      <h2 className="text-lg font-bold text-slate-950">
                        {voucher.code}
                      </h2>

                      <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-5 text-slate-700">
                        {getVoucherDescription(voucher)}
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        <span>HSD: {formatDate(voucher.endAt)}</span>
                      </div>

                      <p className="mt-3 text-sm font-medium text-blue-600 group-hover:underline">
                        Điều kiện
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedVoucher ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-7 shadow-xl">
            <button
              type="button"
              onClick={() => setSelectedVoucher(null)}
              className="absolute -right-4 -top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-lg"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="pr-8 text-3xl font-bold text-slate-950">
              {selectedVoucher.code}
            </h2>

            <div className="mt-7 space-y-6">
              <div>
                <h3 className="mb-2 font-bold text-slate-950">Chi tiết</h3>
                <p className="leading-7 text-slate-700">
                  {getVoucherDetail(selectedVoucher)}
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-bold text-slate-950">
                  Thời gian áp dụng
                </h3>
                <p className="leading-7 text-slate-700">
                  {formatDate(selectedVoucher.startAt)} - {formatDate(selectedVoucher.endAt)}
                </p>
              </div>

              <div>
                <h3 className="mb-2 font-bold text-slate-950">Điều kiện</h3>
                <p className="leading-7 text-slate-700">
                  - {getVoucherCondition(selectedVoucher)}
                </p>
                <p className="mt-2 leading-7 text-slate-700">
                  - Mã giảm giá không có giá trị quy đổi ra tiền mặt.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}