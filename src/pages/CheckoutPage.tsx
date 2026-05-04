import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CheckCircle,
  ArrowLeft,
  MapPin,
  Plus,
  TicketPercent,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import MainLayout from '@/components/layout/MainLayout';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';
import { orderService, type CreateOrderPayload } from '@/services/api/orderService';
import {
  getAddresses,
  getStoredUser,
  isLoggedIn,
  type UserAddress,
} from '@/services/api/userService';
import {
  getMyVouchers,
  type UserVoucher,
} from '@/services/api/voucherService';
import type { ChiTietGioHang } from '@/types';

const BUY_NOW_STORAGE_KEY = 'matewear_buy_now';

type CheckoutForm = {
  hoTen: string;
  sdt: string;
  email: string;
  diaChi: string;
  ghiChu: string;
};

type BuyNowItem = {
  id: string;
  productId: string;
  productSlug?: string;
  variantId: string;
  kichCo: string;
  soLuong: number;
  gia: number;
  mauSac: string;
  hinhAnh?: string;
  sanPham: {
    id: string;
    ten: string;
    hinhAnh?: string;
  };
};

type CheckoutDisplayItem = ChiTietGioHang | BuyNowItem;

function getAddressId(address: UserAddress) {
  return address._id || address.id || '';
}

function formatAddress(address?: UserAddress | null) {
  if (!address) return '';

  return [
    address.addressLine,
    address.ward,
    address.district,
    address.city,
  ]
    .filter(Boolean)
    .join(', ');
}

function getCustomerNameFromAddress(address?: UserAddress | null) {
  return address?.receiverName || '';
}

function getCustomerPhoneFromAddress(address?: UserAddress | null) {
  return address?.phone || '';
}

function calculateVoucherDiscount(voucher: UserVoucher, subtotal: number) {
  if (subtotal <= 0) return 0;

  let discount = 0;

  if (voucher.type === 'percent') {
    discount = Math.floor((subtotal * Number(voucher.value || 0)) / 100);

    if (voucher.maxDiscount && voucher.maxDiscount > 0) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
  }

  if (voucher.type === 'fixed') {
    discount = Number(voucher.value || 0);
  }

  return Math.min(discount, subtotal);
}

function isVoucherUsable(voucher: UserVoucher, subtotal: number) {
  if (voucher.exhausted || voucher.perUserExceeded) return false;
  if (voucher.usable === false) return false;

  const minOrderValue = Number(voucher.minOrderValue || 0);

  if (subtotal < minOrderValue) return false;

  return calculateVoucherDiscount(voucher, subtotal) > 0;
}

function getNeedMoreAmount(voucher: UserVoucher, subtotal: number) {
  const minOrderValue = Number(voucher.minOrderValue || 0);

  if (subtotal >= minOrderValue) return 0;

  return minOrderValue - subtotal;
}

function getVoucherDescription(voucher: UserVoucher) {
  if (voucher.description?.trim()) return voucher.description.trim();

  const minOrderText =
    voucher.minOrderValue && voucher.minOrderValue > 0
      ? ` cho đơn từ ${formatPrice(voucher.minOrderValue)}`
      : '';

  if (voucher.type === 'percent') {
    const maxText =
      voucher.maxDiscount && voucher.maxDiscount > 0
        ? `, tối đa ${formatPrice(voucher.maxDiscount)}`
        : '';

    return `Giảm ${voucher.value}%${maxText}${minOrderText}`;
  }

  return `Giảm ${formatPrice(voucher.value)}${minOrderText}`;
}

export default function CheckoutPage() {
  const location = useLocation();
  const { items, clearCart } = useCart();

  const loggedIn = isLoggedIn();
  const storedUser = getStoredUser();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [shipping, setShipping] = useState<'standard' | 'express'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCode, setOrderCode] = useState('');

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
  const [voucherTouched, setVoucherTouched] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);

  const [form, setForm] = useState<CheckoutForm>({
    hoTen: '',
    sdt: '',
    email: '',
    diaChi: '',
    ghiChu: '',
  });

  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!loggedIn) {
        return;
      }

      try {
        setAddressLoading(true);

        const data = await getAddresses();
        setAddresses(data);

        const defaultAddress = data.find((item) => item.isDefault) || data[0];

        if (defaultAddress) {
          setSelectedAddressId(getAddressId(defaultAddress));
        }
      } catch (error: any) {
        toast.error(error?.message || 'Không thể tải địa chỉ giao hàng');
      } finally {
        setAddressLoading(false);
      }
    };

    loadSavedAddresses();
  }, [loggedIn]);

  useEffect(() => {
    const loadVouchers = async () => {
      if (!loggedIn) return;

      try {
        setVoucherLoading(true);
        const data = await getMyVouchers();
        setVouchers(data);
      } catch (error: any) {
        console.error('Load checkout vouchers error:', error);
        setVouchers([]);
      } finally {
        setVoucherLoading(false);
      }
    };

    loadVouchers();
  }, [loggedIn]);

  const mode = useMemo(() => {
    const queryMode = new URLSearchParams(location.search).get('mode');
    return queryMode === 'buy-now' ? 'buy-now' : 'cart';
  }, [location.search]);

  const buyNowItem = useMemo<BuyNowItem | null>(() => {
    if (mode !== 'buy-now' || typeof window === 'undefined') return null;

    try {
      const raw = localStorage.getItem(BUY_NOW_STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!parsed?.productId || !parsed?.variantId || !parsed?.kichCo) {
        return null;
      }

      return parsed as BuyNowItem;
    } catch (error) {
      console.error('load buy now item error:', error);
      return null;
    }
  }, [mode]);

  const checkoutItems: CheckoutDisplayItem[] =
    mode === 'buy-now' ? (buyNowItem ? [buyNowItem] : []) : items;

  const selectedAddress = useMemo(() => {
    return addresses.find((address) => getAddressId(address) === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + item.gia * item.soLuong, 0);
  }, [checkoutItems]);

  const shippingFee = useMemo(() => {
    if (shipping === 'express') return 50000;
    return subtotal >= 500000 ? 0 : 30000;
  }, [shipping, subtotal]);

  const bestVoucher = useMemo(() => {
    const usableVouchers = vouchers.filter((voucher) =>
      isVoucherUsable(voucher, subtotal)
    );

    if (usableVouchers.length === 0) return null;

    return usableVouchers.reduce((best, current) => {
      const bestDiscount = calculateVoucherDiscount(best, subtotal);
      const currentDiscount = calculateVoucherDiscount(current, subtotal);

      return currentDiscount > bestDiscount ? current : best;
    }, usableVouchers[0]);
  }, [vouchers, subtotal]);

  useEffect(() => {
    if (voucherTouched) return;

    if (bestVoucher) {
      setSelectedVoucherCode(bestVoucher.code);
      return;
    }

    setSelectedVoucherCode('');
  }, [bestVoucher, voucherTouched]);

  useEffect(() => {
    if (!selectedVoucherCode) return;

    const currentVoucher = vouchers.find(
      (voucher) => voucher.code === selectedVoucherCode
    );

    if (!currentVoucher) {
      setSelectedVoucherCode('');
      return;
    }

    if (!isVoucherUsable(currentVoucher, subtotal)) {
      setSelectedVoucherCode('');
      setVoucherTouched(false);
    }
  }, [selectedVoucherCode, subtotal, vouchers]);

  const selectedVoucher = useMemo(() => {
    if (!selectedVoucherCode) return null;

    return (
      vouchers.find((voucher) => voucher.code === selectedVoucherCode) || null
    );
  }, [selectedVoucherCode, vouchers]);

  const voucherDiscount = selectedVoucher
    ? calculateVoucherDiscount(selectedVoucher, subtotal)
    : 0;

  const finalTotal = Math.max(0, subtotal - voucherDiscount) + shippingFee;

  const handleChange =
    (field: keyof CheckoutForm) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const getImage = (item: CheckoutDisplayItem) =>
    item.hinhAnh || item.sanPham.hinhAnh || '/placeholder.svg';

  const backHref =
    mode === 'buy-now' && buyNowItem?.productSlug
      ? `/san-pham/${buyNowItem.productSlug}`
      : '/gio-hang';

  const backLabel =
    mode === 'buy-now' ? 'Quay lại sản phẩm' : 'Quay lại giỏ hàng';

  const validateItems = () => {
    if (checkoutItems.length === 0) {
      toast.error(
        mode === 'buy-now' ? 'Không có sản phẩm mua ngay' : 'Giỏ hàng đang trống'
      );
      return false;
    }

    const invalidItem = checkoutItems.find(
      (item) =>
        !item.productId ||
        !item.variantId ||
        !item.kichCo ||
        item.soLuong <= 0
    );

    if (invalidItem) {
      toast.error('Có sản phẩm chưa đủ dữ liệu biến thể');
      return false;
    }

    return true;
  };

  const validateLoggedInCheckout = () => {
    if (addressLoading) {
      toast.error('Đang tải địa chỉ giao hàng, vui lòng thử lại');
      return false;
    }

    if (addresses.length === 0) {
      toast.error('Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng');
      return false;
    }

    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return false;
    }

    if (!selectedAddress.receiverName?.trim()) {
      toast.error('Địa chỉ giao hàng thiếu tên người nhận');
      return false;
    }

    if (!selectedAddress.phone?.trim()) {
      toast.error('Địa chỉ giao hàng thiếu số điện thoại');
      return false;
    }

    if (!formatAddress(selectedAddress)) {
      toast.error('Địa chỉ giao hàng chưa đầy đủ');
      return false;
    }

    return true;
  };

  const validateGuestCheckout = () => {
    const hoTen = form.hoTen.trim();
    const sdt = form.sdt.trim();
    const email = form.email.trim();
    const diaChi = form.diaChi.trim();

    if (!hoTen) {
      toast.error('Vui lòng nhập họ tên');
      return false;
    }

    if (!sdt) {
      toast.error('Vui lòng nhập số điện thoại');
      return false;
    }

    if (!/^(0|\+84)[0-9]{9,10}$/.test(sdt)) {
      toast.error('Số điện thoại không hợp lệ');
      return false;
    }

    if (!email) {
      toast.error('Vui lòng nhập email');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email không hợp lệ');
      return false;
    }

    if (!diaChi) {
      toast.error('Vui lòng nhập địa chỉ giao hàng');
      return false;
    }

    return true;
  };

  const validateForm = () => {
    if (!validateItems()) return false;

    if (loggedIn) {
      return validateLoggedInCheckout();
    }

    return validateGuestCheckout();
  };

  const handleSelectVoucher = (voucher: UserVoucher) => {
    if (!isVoucherUsable(voucher, subtotal)) {
      const needMore = getNeedMoreAmount(voucher, subtotal);

      if (needMore > 0) {
        toast.info(`Cần đặt thêm ${formatPrice(needMore)} để sử dụng voucher này`);
      } else if (voucher.exhausted) {
        toast.info('Voucher đã hết lượt sử dụng');
      } else if (voucher.perUserExceeded) {
        toast.info('Bạn đã dùng hết lượt cho voucher này');
      } else {
        toast.info('Voucher chưa đủ điều kiện áp dụng');
      }

      return false;
    }

    setVoucherTouched(true);
    setSelectedVoucherCode(voucher.code);
    toast.success(`Đã áp dụng voucher ${voucher.code}`);
    return true;
  };

  const handleRemoveVoucher = () => {
    setVoucherTouched(true);
    setSelectedVoucherCode('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const shippingFullName = loggedIn
        ? getCustomerNameFromAddress(selectedAddress)
        : form.hoTen.trim();

      const shippingPhone = loggedIn
        ? getCustomerPhoneFromAddress(selectedAddress)
        : form.sdt.trim();

      const shippingEmail = loggedIn
        ? storedUser?.email || ''
        : form.email.trim();

      const shippingAddressText = loggedIn
        ? formatAddress(selectedAddress)
        : form.diaChi.trim();

      const payload: CreateOrderPayload & { shippingFee: number } = {
        items: checkoutItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          size: item.kichCo,
          quantity: item.soLuong,
        })),
        shippingAddress: {
          fullName: shippingFullName,
          phone: shippingPhone,
          email: shippingEmail,
          addressLine1: shippingAddressText,
        },
        paymentMethod: {
          type: 'COD',
          note: 'Thanh toán khi nhận hàng',
        },
        guestInfo: {
          fullName: shippingFullName,
          email: shippingEmail,
          phone: shippingPhone,
        },
        customerNote: form.ghiChu.trim(),
        voucherCode: selectedVoucher?.code,
        shippingFee,
      };

      const response: any = await orderService.createOrder(payload);
      const createdOrder = response?.order;

      if (!createdOrder) {
        throw new Error('Backend không trả về thông tin đơn hàng');
      }

      if (mode === 'cart') {
        clearCart();
      }

      localStorage.removeItem(BUY_NOW_STORAGE_KEY);

      setOrderCode(createdOrder.orderCode || createdOrder._id || '');
      setStep('success');
      toast.success('Đặt hàng thành công');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-lg px-4 py-20 text-center animate-fade-in">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-success" />
          <h1 className="mb-2 text-2xl font-bold">Đặt hàng thành công!</h1>
          <p className="mb-2 text-muted-foreground">
            Cảm ơn bạn đã mua sắm tại StyleHub.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            Mã đơn hàng:{' '}
            <span className="font-semibold text-foreground">
              {orderCode || 'Đang cập nhật'}
            </span>
          </p>

          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link to="/">Về trang chủ</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/tra-cuu-don-hang/${orderCode}`}>Xem đơn hàng</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="mb-4 text-lg font-medium">
            {mode === 'buy-now' ? 'Không có sản phẩm mua ngay' : 'Giỏ hàng trống'}
          </p>
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
        <Link
          to={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <h1 className="mb-8 text-2xl font-bold">Thanh toán</h1>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="space-y-4 rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Thông tin giao hàng</h2>
                  <p className="text-xs text-muted-foreground">
                    {loggedIn
                      ? 'Chọn địa chỉ đã lưu trong tài khoản của bạn.'
                      : 'Nhập thông tin giao hàng cho đơn hàng khách.'}
                  </p>
                </div>

                {loggedIn ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dia-chi">
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm địa chỉ
                    </Link>
                  </Button>
                ) : null}
              </div>

              {loggedIn ? (
                <div className="space-y-3">
                  {addressLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Đang tải địa chỉ giao hàng...
                    </p>
                  ) : addresses.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-5 text-center">
                      <MapPin className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                      <p className="font-medium">Bạn chưa có địa chỉ giao hàng</p>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Thêm địa chỉ để tiếp tục đặt hàng.
                      </p>
                      <Button asChild>
                        <Link to="/dia-chi">
                          <Plus className="mr-2 h-4 w-4" />
                          Thêm địa chỉ mới
                        </Link>
                      </Button>
                    </div>
                  ) : selectedAddress ? (
                    <div className="rounded-xl border border-primary bg-primary/5 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {selectedAddress.receiverName}
                            </p>

                            {selectedAddress.isDefault ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                Mặc định
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            Số điện thoại:{' '}
                            <span className="text-foreground">
                              {selectedAddress.phone}
                            </span>
                          </p>

                          <p className="mt-1 text-sm">
                            {formatAddress(selectedAddress)}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAddressModalOpen(true)}
                        >
                          Thay đổi
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddressModalOpen(true)}
                    >
                      Chọn địa chỉ giao hàng
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Họ tên *</Label>
                      <Input
                        required
                        value={form.hoTen}
                        onChange={handleChange('hoTen')}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Số điện thoại *</Label>
                      <Input
                        required
                        value={form.sdt}
                        onChange={handleChange('sdt')}
                        placeholder="0901234567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Email *</Label>
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Địa chỉ giao hàng *</Label>
                    <Input
                      required
                      value={form.diaChi}
                      onChange={handleChange('diaChi')}
                      placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                    />
                  </div>
                </>
              )}

              <div>
                <Label className="text-xs">Ghi chú</Label>
                <Input
                  value={form.ghiChu}
                  onChange={handleChange('ghiChu')}
                  placeholder="Ghi chú cho đơn hàng..."
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TicketPercent className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold">Voucher</h2>
                </div>

                {loggedIn && vouchers.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVoucherModalOpen(true)}
                  >
                    Chọn hoặc đổi
                  </Button>
                ) : null}
              </div>

              {!loggedIn ? (
                <p className="text-sm text-muted-foreground">
                  Đăng nhập để sử dụng voucher trong ví của bạn.
                </p>
              ) : voucherLoading ? (
                <p className="text-sm text-muted-foreground">
                  Đang tải ví voucher...
                </p>
              ) : vouchers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Hiện chưa có voucher khả dụng.
                </p>
              ) : selectedVoucher ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                          {selectedVoucher.code}
                        </span>

                        {bestVoucher?.code === selectedVoucher.code ? (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                            Tốt nhất
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm font-medium">
                        {getVoucherDescription(selectedVoucher)}
                      </p>

                      <p className="mt-1 text-xs text-emerald-700">
                        Đã giảm {formatPrice(voucherDiscount)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="rounded-full p-1 text-slate-500 hover:bg-white hover:text-slate-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Chưa áp dụng voucher nào.
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-border p-5">
              <h2 className="font-semibold">Phương thức vận chuyển</h2>

              <RadioGroup
                value={shipping}
                onValueChange={(value) =>
                  setShipping(value as 'standard' | 'express')
                }
                className="space-y-2"
              >
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="standard" />
                    <div>
                      <p className="text-sm font-medium">Giao hàng tiêu chuẩn</p>
                      <p className="text-xs text-muted-foreground">
                        3-5 ngày làm việc
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {subtotal >= 500000 ? 'Miễn phí' : '30.000₫'}
                  </span>
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="express" />
                    <div>
                      <p className="text-sm font-medium">Giao hàng nhanh</p>
                      <p className="text-xs text-muted-foreground">
                        1-2 ngày làm việc
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium">50.000₫</span>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-3 rounded-xl border border-border p-5">
              <h2 className="font-semibold">Phương thức thanh toán</h2>

              <RadioGroup value="cod" className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/50">
                  <RadioGroupItem value="cod" />
                  <div>
                    <p className="text-sm font-medium">
                      Thanh toán khi nhận hàng (COD)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ưu tiên cho flow demo đồ án
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-20 space-y-4 rounded-xl border border-border p-5">
              <h2 className="font-semibold">
                Đơn hàng ({checkoutItems.length} sản phẩm)
              </h2>

              <div className="max-h-60 space-y-3 overflow-y-auto">
                {checkoutItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={getImage(item)}
                      alt={item.sanPham.ten || 'Sản phẩm'}
                      className="h-14 w-14 rounded-lg bg-secondary object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-medium">
                        {item.sanPham.ten}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.mauSac} / {item.kichCo} x{item.soLuong}
                      </p>
                      <p className="text-xs font-bold">
                        {formatPrice(item.gia * item.soLuong)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-border pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {selectedVoucher ? (
                  <div className="flex justify-between text-emerald-700">
                    <span>Voucher {selectedVoucher.code}</span>
                    <span>-{formatPrice(voucherDiscount)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>
                    {shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || addressLoading}
              >
                {isSubmitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {addressModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chọn địa chỉ giao hàng</h2>
              <button
                type="button"
                onClick={() => setAddressModalOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {addresses.map((address) => {
                const addressId = getAddressId(address);
                const selected = selectedAddressId === addressId;

                return (
                  <button
                    key={addressId}
                    type="button"
                    onClick={() => {
                      setSelectedAddressId(addressId);
                      setAddressModalOpen(false);
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{address.receiverName}</p>

                      {address.isDefault ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Mặc định
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Số điện thoại:{' '}
                      <span className="text-foreground">{address.phone}</span>
                    </p>

                    <p className="mt-1 text-sm">{formatAddress(address)}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <Button type="button" variant="outline" asChild>
                <Link to="/dia-chi">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm địa chỉ
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setAddressModalOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {voucherModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chọn voucher</h2>
              <button
                type="button"
                onClick={() => setVoucherModalOpen(false)}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {vouchers.map((voucher) => {
                const usable = isVoucherUsable(voucher, subtotal);
                const selected = selectedVoucherCode === voucher.code;
                const discount = calculateVoucherDiscount(voucher, subtotal);
                const needMore = getNeedMoreAmount(voucher, subtotal);

                return (
                  <button
                    key={voucher._id}
                    type="button"
                    onClick={() => {
                      const applied = handleSelectVoucher(voucher);

                      if (applied) {
                        setVoucherModalOpen(false);
                      }
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : usable
                          ? 'border-border hover:border-blue-300 hover:bg-blue-50/40'
                          : 'border-dashed border-slate-300 bg-slate-50 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                            {voucher.code}
                          </span>

                          {selected ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                              Đang áp dụng
                            </span>
                          ) : null}

                          {bestVoucher?.code === voucher.code ? (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                              Tốt nhất
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm font-medium">
                          {getVoucherDescription(voucher)}
                        </p>

                        {usable ? (
                          <p className="mt-1 text-xs text-emerald-700">
                            Giảm {formatPrice(discount)}
                          </p>
                        ) : needMore > 0 ? (
                          <p className="mt-1 text-xs text-amber-700">
                            Cần đặt thêm {formatPrice(needMore)} để sử dụng voucher này
                          </p>
                        ) : voucher.perUserExceeded ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Bạn đã dùng hết lượt cho voucher này
                          </p>
                        ) : voucher.exhausted ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Voucher đã hết lượt sử dụng
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            Voucher chưa đủ điều kiện áp dụng
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleRemoveVoucher();
                  setVoucherModalOpen(false);
                }}
              >
                Bỏ voucher
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setVoucherModalOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}