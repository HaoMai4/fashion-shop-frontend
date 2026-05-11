import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { orderService } from '@/services/api/orderService';
import { isLoggedIn } from '@/services/api/userService';
import { productService } from '@/services/api/productService';

import { formatDate, formatPrice } from '@/utils/format';
import { toast } from 'sonner';

const REORDER_CHECKOUT_KEY = 'matewear_reorder_checkout';

type PaymentInfo =
  | string
  | {
    type?: string;
    status?: string;
    note?: string;
    method?: string;
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

type CancellationReport = {
  _id?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  reason?: string;
  rejectReason?: string;
  previousStatus?: string;
  processedAt?: string;
  createdAt?: string;
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
    images?: string[];
    sku?: string;
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

  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  voucherDiscount?: number;
  discountAmount?: number;
  totalAmount?: number;
  tongTien?: number;
  finalTotal?: number;

  voucher?: VoucherSnapshot | null;
  voucherCode?: string;

  customerNote?: string;
  guestInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
  };
  shippingAddress?: ShippingAddress;

  cancellationReport?: CancellationReport | null;

  items?: OrderItem[];
  chiTiet?: OrderItem[];
};

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending_payment: { label: 'Chờ thanh toán', variant: 'secondary' },
  pending: { label: 'Chờ xác nhận', variant: 'secondary' },
  confirmed: { label: 'Đã xác nhận', variant: 'default' },
  processing: { label: 'Đang xử lý', variant: 'default' },
  shipped: { label: 'Đang giao', variant: 'default' },
  delivered: { label: 'Đã giao', variant: 'outline' },
  completed: { label: 'Hoàn thành', variant: 'outline' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
  reported: { label: 'Đang chờ duyệt hủy', variant: 'outline' },
};

function getOrderDetail(res: any): OrderRecord | null {
  if (!res) return null;
  if (res?.data && !Array.isArray(res.data)) return res.data;
  if (res?.order && !Array.isArray(res.order)) return res.order;
  if (!Array.isArray(res)) return res;
  return null;
}

function normalizeStatus(raw?: string) {
  if (!raw) return '';

  const value = String(raw).trim().toLowerCase();

  const statusMap: Record<string, string> = {
    pending_payment: 'pending_payment',
    cho_thanh_toan: 'pending_payment',
    'chờ thanh toán': 'pending_payment',

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

function getOrderCode(order?: OrderRecord | null) {
  if (!order) return 'Chưa có mã';
  return order.orderCode || order.maDonHang || 'Chưa có mã';
}

function getOrderDate(order?: OrderRecord | null) {
  if (!order) return '';
  return order.createdAt || order.ngayDat || '';
}

function getOrderStatus(order?: OrderRecord | null) {
  if (!order) return '';

  return normalizeStatus(
    order.status ||
    order.trangThai ||
    order.orderStatus ||
    order.statusOrder ||
    order.fulfillmentStatus ||
    ''
  );
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

function getOrderPayment(order?: OrderRecord | null) {
  if (!order) return 'Chưa rõ';

  const payment = order.paymentMethod || order.phuongThucThanhToan;

  if (!payment) return 'Chưa rõ';

  if (typeof payment === 'string') return normalizePaymentLabel(payment);

  if (typeof payment === 'object') {
    return normalizePaymentLabel(payment.type || payment.method || 'Chưa rõ');
  }

  return 'Chưa rõ';
}

function getPaymentStatus(order?: OrderRecord | null) {
  if (!order) return 'Chưa rõ';

  const payment = order.paymentMethod || order.phuongThucThanhToan;

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

function getOrderItems(order?: OrderRecord | null): OrderItem[] {
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

  if (typeof item.productId === 'object' && Array.isArray(item.productId?.images)) {
    return item.productId.images[0] || '/placeholder.svg';
  }

  return '/placeholder.svg';
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
  return item.finalPrice || item.price || item.gia || 0;
}

function getItemVariantId(item: OrderItem) {
  if (typeof item.variantId === 'string') return item.variantId;

  if (typeof item.variantId === 'object') {
    return item.variantId._id || item.variantId.id || '';
  }

  return '';
}

function findVariantForReorder(product: any, item: OrderItem) {
  const oldVariantId = getItemVariantId(item);
  const oldColor = getItemColor(item);
  const oldSize = getItemSize(item);

  const variants = Array.isArray(product?.variants) ? product.variants : [];

  const matchedVariant =
    variants.find((variant: any) => {
      const variantId = variant?._id || variant?.id || '';
      return oldVariantId && String(variantId) === String(oldVariantId);
    }) ||
    variants.find((variant: any) => {
      return (
        oldColor &&
        String(variant?.color || '').trim().toLowerCase() ===
        String(oldColor).trim().toLowerCase()
      );
    });

  if (!matchedVariant) return null;

  const matchedSize = Array.isArray(matchedVariant.sizes)
    ? matchedVariant.sizes.find((sizeItem: any) => {
      return (
        String(sizeItem?.size || '').trim().toLowerCase() ===
        String(oldSize).trim().toLowerCase()
      );
    })
    : null;

  if (!matchedSize) return null;

  return {
    variant: matchedVariant,
    size: matchedSize,
  };
}

function toMoney(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getVoucher(order?: OrderRecord | null) {
  if (!order?.voucher || typeof order.voucher !== 'object') return null;
  return order.voucher;
}

function getVoucherCode(order?: OrderRecord | null) {
  const voucher = getVoucher(order);
  return voucher?.code || order?.voucherCode || '';
}

function getVoucherDiscount(order?: OrderRecord | null) {
  const voucher = getVoucher(order);

  const snapshotDiscount = toMoney(voucher?.discountAmount);
  if (snapshotDiscount > 0) return snapshotDiscount;

  const voucherDiscount = toMoney(order?.voucherDiscount);
  if (voucherDiscount > 0) return voucherDiscount;

  const discountAmount = toMoney(order?.discountAmount);
  if (discountAmount > 0) return discountAmount;

  return 0;
}

function getSubtotal(order?: OrderRecord | null) {
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

function getShippingFee(order?: OrderRecord | null) {
  return toMoney(order?.shippingFee);
}

function getDiscount(order?: OrderRecord | null) {
  const voucherDiscount = getVoucherDiscount(order);
  if (voucherDiscount > 0) return voucherDiscount;

  return toMoney(order?.discount);
}

function getTotal(order?: OrderRecord | null) {
  if (!order) return 0;

  const explicitTotal = toMoney(order.finalTotal || order.totalAmount || order.tongTien);
  if (explicitTotal > 0) return explicitTotal;

  return Math.max(getSubtotal(order) - getDiscount(order), 0) + getShippingFee(order);
}

function getAddressText(order?: OrderRecord | null) {
  if (!order) return 'Chưa có địa chỉ';

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

function getRecipientName(order?: OrderRecord | null) {
  return order?.shippingAddress?.fullName || order?.guestInfo?.fullName || 'Chưa có tên';
}

function getRecipientPhone(order?: OrderRecord | null) {
  return order?.shippingAddress?.phone || order?.guestInfo?.phone || 'Chưa có số điện thoại';
}

function getRecipientEmail(order?: OrderRecord | null) {
  return order?.shippingAddress?.email || order?.guestInfo?.email || 'Chưa có email';
}

function canRequestCancellation(order?: OrderRecord | null) {
  const status = getOrderStatus(order);
  return status === 'pending' || status === 'confirmed';
}

function isCancellationRequested(order?: OrderRecord | null) {
  return getOrderStatus(order) === 'reported';
}

function isCancelled(order?: OrderRecord | null) {
  return getOrderStatus(order) === 'cancelled';
}

function getCancellationReport(order?: OrderRecord | null) {
  return order?.cancellationReport || null;
}

function getCancellationReportStatus(order?: OrderRecord | null) {
  return String(getCancellationReport(order)?.status || '').trim().toLowerCase();
}

function isCancellationRejected(order?: OrderRecord | null) {
  return getCancellationReportStatus(order) === 'rejected';
}

function isCancellationApproved(order?: OrderRecord | null) {
  return getCancellationReportStatus(order) === 'approved';
}

function getCancellationRejectReason(order?: OrderRecord | null) {
  return getCancellationReport(order)?.rejectReason || '';
}

function getCancellationRequestReason(order?: OrderRecord | null) {
  return getCancellationReport(order)?.reason || '';
}

function isPayOSOrder(order?: OrderRecord | null) {
  const payment = order?.paymentMethod || order?.phuongThucThanhToan;

  if (!payment || typeof payment === 'string') {
    return String(payment || '').toLowerCase() === 'payos';
  }

  return String(payment.type || payment.method || '').toLowerCase() === 'payos';
}

function getRawPaymentStatus(order?: OrderRecord | null) {
  const payment = order?.paymentMethod || order?.phuongThucThanhToan;

  if (!payment || typeof payment === 'string') return '';

  return String(payment.status || '').trim().toLowerCase();
}

function isPayOSCancelled(order?: OrderRecord | null) {
  return isPayOSOrder(order) && getRawPaymentStatus(order) === 'cancelled' && isCancelled(order);
}

function isPayOSPendingPayment(order?: OrderRecord | null) {
  return isPayOSOrder(order) && getRawPaymentStatus(order) === 'pending' && getOrderStatus(order) === 'pending_payment';
}

function canShowReorder(order?: OrderRecord | null) {
  const status = getOrderStatus(order);

  return status === 'completed' || status === 'delivered' || status === 'cancelled';
}

function getReorderButtonLabel(order?: OrderRecord | null) {
  const status = getOrderStatus(order);

  if (status === 'cancelled') {
    return 'Đặt lại đơn';
  }

  return 'Mua lại';
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderCode = '' } = useParams();

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [reordering, setReordering] = useState(false);

  const fetchOrderDetail = async () => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    if (!orderCode) {
      setLoading(false);
      return;
    }

    try {
      const res = await orderService.getMyOrderDetail(orderCode);
      const orderData = getOrderDetail(res);
      setOrder(orderData);
    } catch (error: any) {
      console.error('getMyOrderDetail error:', error);
      toast.error(error?.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderCode]);

  const handleRequestCancellation = async () => {
    const orderId = order?._id || order?.id;

    if (!orderId) {
      toast.error('Không tìm thấy mã đơn nội bộ để gửi yêu cầu hủy');
      return;
    }

    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    setSubmittingCancel(true);

    try {
      const res: any = await orderService.requestOrderCancellation(orderId, {
        reason: cancelReason.trim(),
      });

      toast.success(res?.message || 'Đã gửi yêu cầu hủy đơn');
      setCancelReason('');
      setShowCancelForm(false);
      await fetchOrderDetail();
    } catch (error: any) {
      console.error('requestOrderCancellation error:', error);
      toast.error(error?.message || 'Không thể gửi yêu cầu hủy đơn');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const handleReorder = async () => {
    if (!order) return;

    const orderItems = getOrderItems(order);

    if (!orderItems.length) {
      toast.error('Đơn hàng không có sản phẩm để mua lại');
      return;
    }

    setReordering(true);

    try {
      const reorderItems: any[] = [];
      const failedNames: string[] = [];
      const adjustedNames: string[] = [];

      for (const item of orderItems) {
        try {
          const slug = getItemSlug(item);
          const itemName = getItemName(item);
          const oldQuantity = Math.max(1, Number(getItemQuantity(item) || 1));
          const oldSize = getItemSize(item);

          if (!slug || !oldSize) {
            failedNames.push(itemName);
            continue;
          }

          const product = await productService.getBySlug(slug);

          if (!product) {
            failedNames.push(itemName);
            continue;
          }

          const matched = findVariantForReorder(product as any, item);

          if (!matched) {
            failedNames.push(itemName);
            continue;
          }

          const stock = Number(matched.size?.stock || 0);

          if (stock <= 0) {
            failedNames.push(itemName);
            continue;
          }

          const quantityToBuy = Math.min(oldQuantity, stock);

          if (quantityToBuy < oldQuantity) {
            adjustedNames.push(itemName);
          }

          const variantId = matched.variant?._id || matched.variant?.id || '';
          const color =
            matched.variant?.color ||
            getItemColor(item) ||
            product.defaultColor ||
            '';

          const price = Number(
            matched.size?.finalPrice ||
            matched.size?.discountPrice ||
            matched.size?.price ||
            product.gia ||
            0
          );

          const image =
            Array.isArray(matched.variant?.images) && matched.variant.images.length > 0
              ? matched.variant.images[0]
              : product.hinhAnh;

          if (!variantId || !color || price <= 0) {
            failedNames.push(itemName);
            continue;
          }

          reorderItems.push({
            id: `${product.id}-${variantId}-${oldSize}-${Date.now()}-${reorderItems.length}`,
            productId: product.id,
            productSlug: product.slug,
            variantId,
            kichCo: oldSize,
            soLuong: quantityToBuy,
            gia: price,
            mauSac: color,
            hinhAnh: image,
            sanPham: {
              id: product.id,
              ten: product.ten,
              hinhAnh: image || product.hinhAnh,
            },
          });
        } catch (itemError) {
          console.warn('reorder item error:', itemError);
          failedNames.push(getItemName(item));
        }
      }

      if (reorderItems.length === 0) {
        toast.error('Không có sản phẩm nào trong đơn cũ còn đủ điều kiện để mua lại');
        return;
      }

      const draft = {
        sourceOrderCode: getOrderCode(order),
        items: reorderItems,
        shippingAddress: {
          fullName: order.shippingAddress?.fullName || order.guestInfo?.fullName || '',
          phone: order.shippingAddress?.phone || order.guestInfo?.phone || '',
          email: order.shippingAddress?.email || order.guestInfo?.email || '',
          addressLine1: getAddressText(order),
        },
        customerNote: order.customerNote || '',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(REORDER_CHECKOUT_KEY, JSON.stringify(draft));

      if (adjustedNames.length > 0) {
        toast.info('Một số sản phẩm được điều chỉnh theo số lượng còn lại trong kho');
      }

      if (failedNames.length > 0) {
        toast.info(
          `Đã tạo lại checkout với ${reorderItems.length} sản phẩm. Một số sản phẩm không còn đủ điều kiện mua lại.`
        );
      } else {
        toast.success('Đã tạo lại checkout từ đơn hàng cũ');
      }

      navigate('/thanh-toan?mode=reorder');
    } catch (error: any) {
      console.error('reorder error:', error);
      toast.error(error?.message || 'Không thể mua lại đơn hàng');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          Đang tải chi tiết đơn hàng...
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
          <p className="mb-6 text-muted-foreground">
            Hãy đăng nhập để xem chi tiết đơn hàng
          </p>
          <Button onClick={() => navigate('/dang-nhap')}>
            Đi đến đăng nhập
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
          <h1 className="mb-2 text-2xl font-bold">Không tìm thấy đơn hàng</h1>
          <p className="mb-6 text-muted-foreground">
            Đơn hàng không tồn tại hoặc bạn không có quyền xem.
          </p>
          <Button asChild>
            <Link to="/don-hang">Quay lại đơn hàng của tôi</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status = getStatusInfo(getOrderStatus(order));
  const items = getOrderItems(order);
  const code = getOrderCode(order);
  const date = getOrderDate(order);
  const voucherCode = getVoucherCode(order);
  const subtotal = getSubtotal(order);
  const shippingFee = getShippingFee(order);
  const discount = getDiscount(order);
  const total = getTotal(order);

  const allowRequestCancellation = canRequestCancellation(order);
  const cancellationRequested = isCancellationRequested(order);
  const cancelled = isCancelled(order);
  const cancellationRejected = isCancellationRejected(order);
  const cancellationApproved = isCancellationApproved(order);
  const cancellationRejectReason = getCancellationRejectReason(order);
  const cancellationRequestReason = getCancellationRequestReason(order);

  const payOSCancelled = isPayOSCancelled(order);
  const payOSPendingPayment = isPayOSPendingPayment(order);

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <button
          type="button"
          onClick={() => navigate('/don-hang')}
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại đơn hàng của tôi
        </button>

        <div className="rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Chi tiết đơn hàng</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Mã đơn hàng: <span className="font-semibold text-foreground">{code}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ngày đặt: {date ? formatDate(date) : 'Chưa có ngày'}
              </p>
            </div>

            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border p-5">
              <h2 className="mb-4 text-lg font-semibold">Sản phẩm đã đặt</h2>

              <div className="space-y-4">
                {items.map((item, index) => {
                  const quantity = getItemQuantity(item);
                  const price = getItemPrice(item);
                  const color = getItemColor(item);
                  const size = getItemSize(item);
                  const slug = getItemSlug(item);

                  const content = (
                    <>
                      <img
                        src={getItemImage(item)}
                        alt={getItemName(item)}
                        className="h-20 w-20 rounded-lg bg-secondary object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium">{getItemName(item)}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {color}
                          {color && size ? ' / ' : ''}
                          {size}
                          {` x${quantity}`}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatPrice(price)}
                        </p>
                      </div>

                      <div className="text-right font-semibold">
                        {formatPrice(price * quantity)}
                      </div>
                    </>
                  );

                  if (slug) {
                    return (
                      <Link
                        key={item._id || item.id || `${code}-${index}`}
                        to={`/san-pham/${slug}`}
                        className="flex items-center gap-4 rounded-lg border border-border p-3 transition hover:bg-secondary/40"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={item._id || item.id || `${code}-${index}`}
                      className="flex items-center gap-4 rounded-lg border border-border p-3"
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>

            {payOSCancelled ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <h2 className="mb-1 font-semibold">Thanh toán PayOS đã bị hủy</h2>
                <p>
                  Đơn hàng này đã bị hủy do thanh toán PayOS chưa hoàn tất. Cửa hàng sẽ không xử lý đơn này.
                </p>
              </div>
            ) : payOSPendingPayment ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
                <h2 className="mb-1 font-semibold">Đơn hàng đang chờ thanh toán</h2>
                <p>
                  Bạn cần hoàn tất thanh toán PayOS trước khi cửa hàng xác nhận và xử lý đơn hàng.
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border border-border p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Yêu cầu hủy đơn</h2>

                {cancellationRejected ? (
                  <Badge variant="destructive">Yêu cầu hủy bị từ chối</Badge>
                ) : cancellationRequested ? (
                  <Badge variant="outline">Đã gửi yêu cầu hủy</Badge>
                ) : cancellationApproved || cancelled ? (
                  <Badge variant="destructive">Đơn hàng đã hủy</Badge>
                ) : null}
              </div>

              {cancellationRejected ? (
                <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
                  <p className="font-semibold text-red-700">
                    Yêu cầu hủy đơn của bạn đã bị từ chối.
                  </p>

                  {cancellationRequestReason ? (
                    <div>
                      <p className="text-red-700/80">Lý do bạn đã gửi:</p>
                      <p className="mt-1 font-medium text-red-900">
                        {cancellationRequestReason}
                      </p>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-red-700/80">Phản hồi từ cửa hàng:</p>
                    <p className="mt-1 font-medium text-red-900">
                      {cancellationRejectReason || 'Cửa hàng chưa ghi rõ lý do từ chối.'}
                    </p>
                  </div>
                </div>
              ) : allowRequestCancellation ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Bạn có thể gửi yêu cầu hủy đơn khi đơn hàng đang ở trạng thái chờ xác nhận hoặc đã xác nhận.
                  </p>

                  {showCancelForm ? (
                    <div className="space-y-3">
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Nhập lý do hủy đơn..."
                        rows={4}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="destructive"
                          onClick={handleRequestCancellation}
                          disabled={submittingCancel}
                        >
                          {submittingCancel ? 'Đang gửi yêu cầu...' : 'Xác nhận gửi yêu cầu hủy'}
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCancelForm(false);
                            setCancelReason('');
                          }}
                          disabled={submittingCancel}
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="destructive" onClick={() => setShowCancelForm(true)}>
                      Yêu cầu hủy đơn
                    </Button>
                  )}
                </div>
              ) : cancellationRequested ? (
                <p className="text-sm text-muted-foreground">
                  Yêu cầu hủy đơn của bạn đã được gửi lên hệ thống và đang chờ admin xử lý.
                </p>
              ) : cancelled ? (
                <p className="text-sm text-muted-foreground">
                  Đơn hàng này đã được hủy.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Đơn hàng hiện không còn trong trạng thái có thể gửi yêu cầu hủy.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border p-5">
              <h2 className="mb-4 text-lg font-semibold">Thông tin nhận hàng</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Người nhận</p>
                  <p className="font-medium">{getRecipientName(order)}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{getRecipientPhone(order)}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="break-all font-medium">{getRecipientEmail(order)}</p>
                </div>

                <div>
                  <p className="text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{getAddressText(order)}</p>
                </div>

                {order.customerNote ? (
                  <div>
                    <p className="text-muted-foreground">Ghi chú</p>
                    <p className="font-medium">{order.customerNote}</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-border p-5">
              <h2 className="mb-4 text-lg font-semibold">Thanh toán</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Phương thức</span>
                  <span className="font-medium">{getOrderPayment(order)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span className="font-medium">{getPaymentStatus(order)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                </div>

                {discount > 0 ? (
                  <div className="flex justify-between gap-4 text-emerald-700">
                    <span>
                      Giảm giá
                      {voucherCode ? ` (${voucherCode})` : ''}
                    </span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {canShowReorder(order) ? (
                <Button
                  type="button"
                  className="w-full gap-2"
                  onClick={handleReorder}
                  disabled={reordering}
                >
                  <RotateCcw className="h-4 w-4" />
                  {reordering ? 'Đang tạo checkout...' : getReorderButtonLabel(order)}
                </Button>
              ) : null}

              <Button asChild variant="outline" className="w-full">
                <Link to="/san-pham">Tiếp tục mua sắm</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}