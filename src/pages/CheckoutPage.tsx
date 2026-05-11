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
const PENDING_PAYOS_ORDER_KEY = 'matewear_pending_payos_order';
const PENDING_PAYOS_SOURCE_KEY = 'matewear_pending_payos_source';
const PENDING_PAYOS_BUY_NOW_SLUG_KEY = 'matewear_pending_payos_buy_now_slug';
const SELECTED_CART_ITEM_IDS_KEY = 'matewear_selected_cart_item_ids';
const REORDER_CHECKOUT_KEY = 'matewear_reorder_checkout';
const PENDING_PAYOS_CHECKOUT_DRAFT_KEY = 'matewear_pending_payos_checkout_draft';

type PaymentType = 'COD' | 'PayOS';

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

type ReorderCheckoutDraft = {
  sourceOrderCode?: string;
  items: BuyNowItem[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    email?: string;
    addressLine1?: string;
  };
  customerNote?: string;
  createdAt?: string;
};

type CheckoutDisplayItem = ChiTietGioHang | BuyNowItem;

function getAddressId(address: UserAddress) {
  return address._id || address.id || '';
}

function formatAddress(address?: UserAddress | null) {
  if (!address) return '';

  return [address.addressLine, address.ward, address.district, address.city]
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

function formatVoucherDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return date.toLocaleDateString('vi-VN');
}

function getVoucherDetail(voucher: UserVoucher) {
  if (voucher.detail?.trim()) return voucher.detail.trim();

  return getVoucherDescription(voucher);
}

function getVoucherCondition(voucher: UserVoucher) {
  if (voucher.terms?.trim()) return voucher.terms.trim();

  if (voucher.minOrderValue && voucher.minOrderValue > 0) {
    return `Đơn hàng từ ${formatPrice(voucher.minOrderValue)} trở lên.`;
  }

  return 'Áp dụng theo điều kiện của hệ thống.';
}

function getUserRemainingUses(voucher: UserVoucher) {
  if (typeof voucher.userRemainingUses === 'number') {
    return Math.max(0, voucher.userRemainingUses);
  }

  if (voucher.perUserLimit === null || voucher.perUserLimit === undefined) {
    return null;
  }

  return Math.max(
    0,
    Number(voucher.perUserLimit || 0) - Number(voucher.perUserUsed || 0)
  );
}

function getVoucherUsageText(voucher: UserVoucher) {
  const remaining = getUserRemainingUses(voucher);

  if (remaining === null) {
    return 'Không giới hạn lượt dùng cho tài khoản';
  }

  if (remaining <= 0) {
    return 'Bạn đã dùng hết lượt voucher này';
  }

  return `Bạn còn ${remaining} lượt dùng`;
}

function readSelectedCartItemIds() {
  try {
    const raw = localStorage.getItem(SELECTED_CART_ITEM_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

function readReorderCheckoutDraft(): ReorderCheckoutDraft | null {
  try {
    const raw = localStorage.getItem(REORDER_CHECKOUT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return null;
    }

    return parsed as ReorderCheckoutDraft;
  } catch {
    return null;
  }
}

export default function CheckoutPage() {
  const location = useLocation();
  const { items, clearCart, removeItems, refreshCartPrices } = useCart();

  const loggedIn = isLoggedIn();
  const storedUser = getStoredUser();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [shipping, setShipping] = useState<'standard' | 'express'>('standard');
  const [paymentType, setPaymentType] = useState<PaymentType>('COD');
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
  const [expandedVoucherCode, setExpandedVoucherCode] = useState<string | null>(null);

  const [selectedCartItemIds, setSelectedCartItemIds] = useState<number[]>([]);

  const [form, setForm] = useState<CheckoutForm>({
    hoTen: '',
    sdt: '',
    email: '',
    diaChi: '',
    ghiChu: '',
  });

  const mode = useMemo<'cart' | 'buy-now' | 'reorder'>(() => {
    const queryMode = new URLSearchParams(location.search).get('mode');

    if (queryMode === 'buy-now') return 'buy-now';
    if (queryMode === 'reorder') return 'reorder';

    return 'cart';
  }, [location.search]);

  const useManualShippingForm = !loggedIn || mode === 'reorder';

  useEffect(() => {
    if (mode !== 'cart') {
      setSelectedCartItemIds([]);
      return;
    }

    setSelectedCartItemIds(readSelectedCartItemIds());
  }, [mode]);

  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!loggedIn) return;

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

  const reorderDraft = useMemo<ReorderCheckoutDraft | null>(() => {
    if (mode !== 'reorder' || typeof window === 'undefined') return null;
    return readReorderCheckoutDraft();
  }, [mode]);

  useEffect(() => {
    if (mode !== 'reorder' || !reorderDraft) return;

    setForm((prev) => ({
      ...prev,
      hoTen: reorderDraft.shippingAddress?.fullName || '',
      sdt: reorderDraft.shippingAddress?.phone || '',
      email: reorderDraft.shippingAddress?.email || storedUser?.email || '',
      diaChi: reorderDraft.shippingAddress?.addressLine1 || '',
      ghiChu: reorderDraft.customerNote || '',
    }));
  }, [mode, reorderDraft, storedUser?.email]);

  const checkoutItems: CheckoutDisplayItem[] =
    mode === 'buy-now'
      ? buyNowItem
        ? [buyNowItem]
        : []
      : mode === 'reorder'
        ? reorderDraft?.items || []
        : items.filter((item) => selectedCartItemIds.includes(Number(item.id)));

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
      : mode === 'reorder' && reorderDraft?.sourceOrderCode
        ? `/don-hang/${reorderDraft.sourceOrderCode}`
        : '/gio-hang';

  const backLabel =
    mode === 'buy-now'
      ? 'Quay lại sản phẩm'
      : mode === 'reorder'
        ? 'Quay lại đơn hàng cũ'
        : 'Quay lại giỏ hàng';

  const validateItems = () => {
    if (checkoutItems.length === 0) {
      const message =
        mode === 'buy-now'
          ? 'Không có sản phẩm mua ngay'
          : mode === 'reorder'
            ? 'Không có dữ liệu mua lại đơn hàng'
            : 'Giỏ hàng đang trống';

      toast.error(message);
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

    if (useManualShippingForm) {
      return validateGuestCheckout();
    }

    return validateLoggedInCheckout();
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

  const getPaidCartItemIds = () => {
    const ids =
      selectedCartItemIds.length > 0
        ? selectedCartItemIds
        : checkoutItems.map((item) => Number(item.id));

    return ids.filter((id) => Number.isFinite(id));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (!validateForm()) return;

    if (mode === 'cart') {
      const result = await refreshCartPrices();

      if (result.changed) {
        toast.info('Giá hoặc tồn kho trong giỏ hàng vừa được cập nhật. Vui lòng kiểm tra lại trước khi đặt hàng.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const shippingFullName = useManualShippingForm
        ? form.hoTen.trim()
        : getCustomerNameFromAddress(selectedAddress);

      const shippingPhone = useManualShippingForm
        ? form.sdt.trim()
        : getCustomerPhoneFromAddress(selectedAddress);

      const shippingEmail = useManualShippingForm
        ? form.email.trim()
        : storedUser?.email || '';

      const shippingAddressText = useManualShippingForm
        ? form.diaChi.trim()
        : formatAddress(selectedAddress);

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
          type: paymentType,
          note:
            paymentType === 'COD'
              ? 'Thanh toán khi nhận hàng'
              : 'Thanh toán online qua PayOS',
        },
        returnUrl:
          paymentType === 'PayOS'
            ? `${window.location.origin}/payment/success`
            : undefined,
        cancelUrl:
          paymentType === 'PayOS'
            ? `${window.location.origin}/payment/cancel`
            : undefined,
        finalize: false,
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

      if (paymentType === 'PayOS') {
        const checkoutUrl = response?.payment?.checkoutUrl;
        const payosOrderCode = createdOrder.orderCode || createdOrder._id || '';

        if (!checkoutUrl) {
          throw new Error('Backend không trả về link thanh toán PayOS');
        }

        if (payosOrderCode) {
          localStorage.setItem(PENDING_PAYOS_ORDER_KEY, payosOrderCode);
        }

        localStorage.setItem(PENDING_PAYOS_SOURCE_KEY, mode);

        const pendingCheckoutItems = checkoutItems.map((item) => {
          const productSlug =
            'productSlug' in item && item.productSlug
              ? item.productSlug
              : 'sanPham' in item && item.sanPham && 'slug' in item.sanPham
                ? String((item.sanPham as any).slug || '')
                : '';

          const image = item.hinhAnh || item.sanPham?.hinhAnh || '';

          return {
            id: String(item.id),
            productId: item.productId,
            productSlug,
            variantId: item.variantId,
            kichCo: item.kichCo,
            soLuong: item.soLuong,
            gia: item.gia,
            mauSac: item.mauSac,
            hinhAnh: image,
            sanPham: {
              id: item.sanPham.id,
              ten: item.sanPham.ten,
              hinhAnh: image,
            },
          };
        });

        localStorage.setItem(
          PENDING_PAYOS_CHECKOUT_DRAFT_KEY,
          JSON.stringify({
            source: mode,
            sourceOrderCode: reorderDraft?.sourceOrderCode || payosOrderCode || '',
            items: pendingCheckoutItems,
            shippingAddress: {
              fullName: shippingFullName,
              phone: shippingPhone,
              email: shippingEmail,
              addressLine1: shippingAddressText,
            },
            customerNote: form.ghiChu.trim(),
            createdAt: new Date().toISOString(),
          })
        );

        if (mode === 'cart') {
          localStorage.setItem(
            SELECTED_CART_ITEM_IDS_KEY,
            JSON.stringify(getPaidCartItemIds())
          );
        }

        if (mode === 'buy-now' && buyNowItem?.productSlug) {
          localStorage.setItem(PENDING_PAYOS_BUY_NOW_SLUG_KEY, buyNowItem.productSlug);
        } else {
          localStorage.removeItem(PENDING_PAYOS_BUY_NOW_SLUG_KEY);
        }

        localStorage.removeItem(BUY_NOW_STORAGE_KEY);

        toast.success('Đã tạo yêu cầu thanh toán, đang chuyển đến PayOS...');
        window.location.href = checkoutUrl;
        return;
      }

      if (mode === 'cart') {
        const paidCartItemIds = getPaidCartItemIds();

        if (paidCartItemIds.length > 0) {
          removeItems(paidCartItemIds);
          localStorage.removeItem(SELECTED_CART_ITEM_IDS_KEY);
        } else {
          clearCart();
        }
      }

      if (mode === 'reorder') {
        localStorage.removeItem(REORDER_CHECKOUT_KEY);
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
              <Link to={`/don-hang/${orderCode}`}>Xem đơn hàng</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (checkoutItems.length === 0) {
    const emptyTitle =
      mode === 'buy-now'
        ? 'Không có sản phẩm mua ngay'
        : mode === 'reorder'
          ? 'Không có dữ liệu mua lại đơn hàng'
          : 'Không có sản phẩm nào được chọn để thanh toán';

    const emptyHref =
      mode === 'buy-now'
        ? '/san-pham'
        : mode === 'reorder'
          ? '/don-hang'
          : '/gio-hang';

    const emptyLabel =
      mode === 'buy-now'
        ? 'Mua sắm ngay'
        : mode === 'reorder'
          ? 'Quay lại đơn hàng của tôi'
          : 'Quay lại giỏ hàng';

    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="mb-4 text-lg font-medium">{emptyTitle}</p>

          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link to={emptyHref}>{emptyLabel}</Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to="/san-pham">Tiếp tục mua sắm</Link>
            </Button>
          </div>
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
                    {mode === 'reorder'
                      ? 'Thông tin nhận hàng được lấy từ đơn cũ, bạn có thể kiểm tra lại trước khi đặt.'
                      : loggedIn
                        ? 'Chọn địa chỉ đã lưu trong tài khoản của bạn.'
                        : 'Nhập thông tin giao hàng cho đơn hàng khách.'}
                  </p>
                </div>

                {!useManualShippingForm && loggedIn ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/dia-chi">
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm địa chỉ
                    </Link>
                  </Button>
                ) : null}
              </div>

              {!useManualShippingForm ? (
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
                      <p className="mt-1 text-xs text-slate-500">
                        {getVoucherUsageText(selectedVoucher)}
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

              <RadioGroup
                value={paymentType}
                onValueChange={(value) => setPaymentType(value as PaymentType)}
                className="space-y-2"
              >
                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="COD" />

                    <div>
                      <p className="text-sm font-medium">Thanh toán khi nhận hàng</p>
                      <p className="text-xs text-muted-foreground">
                        Thanh toán bằng tiền mặt khi nhận sản phẩm.
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-medium">COD</span>
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="PayOS" />

                    <div>
                      <p className="text-sm font-medium">Thanh toán online qua PayOS</p>
                      <p className="text-xs text-muted-foreground">
                        Chuyển khoản/QR qua cổng thanh toán PayOS.
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-medium">PayOS</span>
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
                disabled={isSubmitting || (!useManualShippingForm && addressLoading)}
              >
                {isSubmitting
                  ? paymentType === 'PayOS'
                    ? 'Đang tạo link thanh toán...'
                    : 'Đang đặt hàng...'
                  : paymentType === 'PayOS'
                    ? 'Thanh toán qua PayOS'
                    : 'Đặt hàng'}
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
                    className={`w-full rounded-xl border p-4 text-left transition ${selected
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
              <div>
                <h2 className="text-xl font-bold">Chọn voucher</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Chọn voucher phù hợp với giá trị đơn hàng hiện tại.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setVoucherModalOpen(false);
                  setExpandedVoucherCode(null);
                }}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-3 overflow-y-auto">
              {vouchers.map((voucher) => {
                const usable = isVoucherUsable(voucher, subtotal);
                const selected = selectedVoucherCode === voucher.code;
                const needMore = getNeedMoreAmount(voucher, subtotal);
                const expanded = expandedVoucherCode === voucher.code;

                return (
                  <div
                    key={voucher._id || voucher.code}
                    className={`w-full rounded-xl border p-4 text-left transition ${selected
                      ? 'border-blue-500 bg-blue-50'
                      : usable
                        ? 'border-border hover:bg-secondary/50'
                        : 'border-border bg-slate-50 opacity-80'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const ok = handleSelectVoucher(voucher);
                          if (ok) {
                            setVoucherModalOpen(false);
                            setExpandedVoucherCode(null);
                          }
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                            {voucher.code}
                          </span>

                          {bestVoucher?.code === voucher.code ? (
                            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                              Tốt nhất
                            </span>
                          ) : null}

                          {selected ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                              Đang áp dụng
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm font-medium">
                          {getVoucherDescription(voucher)}
                        </p>

                        {usable ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-emerald-700">
                              Giảm {formatPrice(calculateVoucherDiscount(voucher, subtotal))}
                            </p>

                            <p className="text-xs text-slate-500">
                              {getVoucherUsageText(voucher)}
                            </p>
                          </div>
                        ) : needMore > 0 ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-amber-700">
                              Cần mua thêm {formatPrice(needMore)} để sử dụng.
                            </p>

                            <p className="text-xs text-slate-500">
                              {getVoucherUsageText(voucher)}
                            </p>
                          </div>
                        ) : voucher.exhausted ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-red-600">
                              Voucher đã hết lượt sử dụng.
                            </p>

                            <p className="text-xs text-slate-500">
                              {getVoucherUsageText(voucher)}
                            </p>
                          </div>
                        ) : voucher.perUserExceeded ? (
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-red-600">
                              Bạn đã dùng hết lượt cho voucher này.
                            </p>

                            <p className="text-xs text-slate-500">
                              {getVoucherUsageText(voucher)}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Voucher chưa đủ điều kiện áp dụng.
                            </p>

                            <p className="text-xs text-slate-500">
                              {getVoucherUsageText(voucher)}
                            </p>
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExpandedVoucherCode(expanded ? null : voucher.code);
                        }}
                        className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white"
                      >
                        {expanded ? 'Ẩn chi tiết' : 'Chi tiết'}
                      </button>
                    </div>

                    {expanded ? (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-slate-900">Chi tiết ưu đãi</p>
                            <p className="mt-1 leading-6 text-slate-600">
                              {getVoucherDetail(voucher)}
                            </p>
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">Điều kiện áp dụng</p>
                            <p className="mt-1 leading-6 text-slate-600">
                              {getVoucherCondition(voucher)}
                            </p>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="font-semibold text-slate-900">Lượt sử dụng</p>
                              <p
                                className={`mt-1 ${getUserRemainingUses(voucher) === 0
                                  ? 'text-red-600'
                                  : 'text-emerald-700'
                                  }`}
                              >
                                {getVoucherUsageText(voucher)}
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">Hạn sử dụng</p>
                              <p className="mt-1 text-slate-600">
                                {formatVoucherDate(voucher.startAt)} - {formatVoucherDate(voucher.endAt)}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs leading-5 text-slate-500">
                            Mã giảm giá không có giá trị quy đổi ra tiền mặt.
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              {selectedVoucher ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleRemoveVoucher();
                    setVoucherModalOpen(false);
                    setExpandedVoucherCode(null);
                  }}
                >
                  Bỏ áp dụng
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setVoucherModalOpen(false);
                  setExpandedVoucherCode(null);
                }}
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