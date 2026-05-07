import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Star,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Bot,
  Truck,
  RotateCcw,
  Shield,
  Send,
  Trash2,
  Pencil,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { productService } from '@/services/api/productService';
import { reviewService, ProductReview } from '@/services/api/reviewService';
import { isLoggedIn, getStoredUser } from '@/services/api/userService';
import { SanPham } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatPrice, getDiscountPercent } from '@/utils/format';
import { toast } from 'sonner';

const BUY_NOW_STORAGE_KEY = 'matewear_buy_now';

type RatingStarsProps = {
  value?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

function RatingStars({ value = 0, size = 'md', className = '' }: RatingStarsProps) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));

  const sizeClass =
    size === 'sm'
      ? 'h-4 w-4'
      : size === 'lg'
        ? 'h-6 w-6'
        : 'h-5 w-5';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const fillPercent = Math.min(Math.max(rating - index, 0), 1) * 100;

        return (
          <span key={index} className={`relative inline-block ${sizeClass}`}>
            <Star className={`absolute inset-0 ${sizeClass} text-border`} />

            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercent}%` }}
            >
              <Star className={`absolute inset-0 ${sizeClass} fill-warning text-warning`} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<SanPham | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  const { addItem } = useCart();
  const {
    addItem: addWishlist,
    removeItem: removeWishlist,
    isInWishlist,
  } = useWishlist();

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;

    const loadProduct = async () => {
      try {
        setLoading(true);

        const p = await productService.getBySlug(slug);

        if (!isMounted) return;

        if (!p) {
          setProduct(null);
          return;
        }

        const firstVariant = p.bienThe?.[0];
        const firstColor = firstVariant?.mau || p.mauSac?.[0]?.ten || '';
        const firstSize =
          firstVariant?.kichThuoc?.find((s) => s.stock > 0)?.size ||
          firstVariant?.kichThuoc?.[0]?.size ||
          p.colorSizeMap?.[firstColor]?.[0] ||
          p.kichCo?.[0] ||
          '';

        const firstImages =
          firstVariant?.hinhAnh?.length
            ? firstVariant.hinhAnh
            : p.hinhAnhList?.length
              ? p.hinhAnhList
              : p.hinhAnh
                ? [p.hinhAnh]
                : ['/placeholder.svg'];

        setProduct(p);
        setSelectedColor(firstColor);
        setSelectedSize(firstSize);
        setSelectedImage(firstImages[0] || '/placeholder.svg');
        setQuantity(1);
      } catch (err) {
        console.error('Load product detail failed:', err);
        if (isMounted) {
          setProduct(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const loadReviews = useCallback(async () => {
    if (!slug) return;

    try {
      setReviewsLoading(true);
      const data = await reviewService.getReviewsBySlug(slug, 1, 10);
      setReviews(data.reviews || []);
      setReviewTotal(data.total || 0);
    } catch (error) {
      console.error('Load reviews failed:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const selectedVariant =
    product?.bienThe?.find((v) => v.mau === selectedColor) ||
    product?.bienThe?.[0];

  const variantAvailableSizes =
    selectedVariant?.kichThuoc
      ?.filter((s) => s.stock > 0)
      .map((s) => s.size) || [];

  const mappedSizes = product?.colorSizeMap?.[selectedColor] || [];

  const availableSizes =
    variantAvailableSizes.length > 0
      ? variantAvailableSizes
      : mappedSizes.length > 0
        ? mappedSizes
        : product?.kichCo || [];

  const uniqueAvailableSizes = Array.from(new Set(availableSizes));

  const selectedSizeInfo =
    selectedVariant?.kichThuoc?.find((s) => s.size === selectedSize) ||
    selectedVariant?.kichThuoc?.find((s) => s.stock > 0) ||
    selectedVariant?.kichThuoc?.[0];

  const galleryImagesRaw =
    selectedVariant?.hinhAnh?.length
      ? selectedVariant.hinhAnh
      : product?.hinhAnhList?.length
        ? product.hinhAnhList
        : product?.hinhAnh
          ? [product.hinhAnh]
          : ['/placeholder.svg'];

  const galleryImages = Array.from(
    new Set(galleryImagesRaw.filter((img): img is string => Boolean(img)))
  );

  useEffect(() => {
    if (!product) return;

    if (uniqueAvailableSizes.length > 0 && !uniqueAvailableSizes.includes(selectedSize)) {
      setSelectedSize(uniqueAvailableSizes[0]);
    }

    const currentStock = selectedSizeInfo?.stock ?? product.soLuongTon ?? 0;

    setQuantity((q) => {
      if (currentStock <= 0) return 1;
      return Math.min(Math.max(q, 1), currentStock);
    });

    if (galleryImages.length > 0 && !galleryImages.includes(selectedImage)) {
      setSelectedImage(galleryImages[0]);
    }
  }, [
    product,
    selectedColor,
    selectedSize,
    selectedImage,
    selectedSizeInfo,
    uniqueAvailableSizes,
    galleryImages,
  ]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
          Đang tải...
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
          <Button asChild className="mt-4">
            <Link to="/san-pham">Quay lại cửa hàng</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const displayImage =
    galleryImages.includes(selectedImage)
      ? selectedImage
      : galleryImages[0] || '/placeholder.svg';

  const displayPrice = selectedSizeInfo?.finalPrice ?? product.gia;

  const displayOriginalPrice =
    typeof selectedSizeInfo?.price === 'number' &&
      displayPrice < selectedSizeInfo.price
      ? selectedSizeInfo.price
      : product.giaGoc;

  const displayStock = selectedSizeInfo?.stock ?? product.soLuongTon ?? 0;

  const discount =
    typeof displayOriginalPrice === 'number' &&
      displayOriginalPrice > displayPrice
      ? getDiscountPercent(displayOriginalPrice, displayPrice)
      : null;

  const canAddToCart = Boolean(displayStock > 0 && selectedSize && selectedVariant?.id);
  const productId = String(product.id);

  const loggedIn = isLoggedIn();
  const currentUser = getStoredUser();
  const currentUserId = currentUser?._id || currentUser?.id || '';
  const currentUserRole = currentUser?.role || '';

  const reviewAverage =
    reviews.length > 0
      ? Number(
        (
          reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      )
      : product.danhGia || 0;

  const reviewCount = reviewTotal || product.soLuongDanhGia || 0;

  const askAiInWidget = (prompt: string) => {
    window.dispatchEvent(
      new CustomEvent('matewear-ai-prompt', {
        detail: { prompt },
      })
    );
  };

  const buildProductAiPrompt = () => {
    const categoryText = product.danhMuc || 'sản phẩm thời trang';
    const brandText = product.thuongHieu || '';
    const materialText = product.chatLieu || '';
    const colorText = selectedColor || '';
    const sizeText = selectedSize || '';
    const priceText = displayPrice ? formatPrice(displayPrice) : '';

    return [
      `Gợi ý cách phối đồ và sản phẩm tương tự cho ${categoryText}.`,
      brandText ? `Thương hiệu: ${brandText}.` : '',
      materialText ? `Chất liệu: ${materialText}.` : '',
      colorText ? `Màu: ${colorText}.` : '',
      sizeText ? `Size: ${sizeText}.` : '',
      priceText ? `Giá khoảng: ${priceText}.` : '',
      'Ưu tiên sản phẩm cùng danh mục hoặc dễ phối cùng, không chỉ tìm lại đúng sản phẩm đang xem.',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const handleBuyNow = () => {
    if (!product || !selectedVariant?.id || !selectedSize || !canAddToCart) {
      toast.error('Vui lòng chọn đầy đủ màu, size và số lượng hợp lệ');
      return;
    }

    const buyNowItem = {
      id: `buy-now-${product.id}-${selectedVariant.id}-${selectedSize}`,
      productId: String(product.id),
      productSlug: slug || '',
      variantId: String(selectedVariant.id),
      kichCo: selectedSize,
      soLuong: quantity,
      gia: displayPrice,
      mauSac: selectedColor,
      hinhAnh: displayImage,
      sanPham: {
        id: String(product.id),
        ten: product.ten,
        hinhAnh: displayImage,
      },
    };

    try {
      localStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify(buyNowItem));
      navigate('/thanh-toan?mode=buy-now');
    } catch (error) {
      console.error('handleBuyNow error:', error);
      toast.error('Không thể xử lý mua ngay');
    }
  };

  const resetReviewForm = () => {
    setEditingReviewId(null);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!product?.id) {
      toast.error('Không tìm thấy sản phẩm để đánh giá');
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast.error('Vui lòng chọn số sao hợp lệ');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setReviewSubmitting(true);

      const payload = {
        rating: reviewRating,
        comment: reviewComment.trim(),
      };

      const result = editingReviewId
        ? await reviewService.updateReview(editingReviewId, payload)
        : await reviewService.createOrUpdateReview(String(product.id), payload);

      toast.success(
        result.message === 'Review updated' || editingReviewId
          ? 'Đã cập nhật đánh giá'
          : 'Đã gửi đánh giá'
      );

      resetReviewForm();
      await loadReviews();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể gửi đánh giá';

      toast.error(message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleEditReview = (review: ProductReview) => {
    setEditingReviewId(review._id);
    setReviewRating(review.rating || 5);
    setReviewComment(review.comment || '');

    const reviewForm = document.getElementById('review-form');
    reviewForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCancelEditReview = () => {
    resetReviewForm();
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa đánh giá này không?');

    if (!confirmed) return;

    try {
      await reviewService.deleteReview(reviewId);
      toast.success('Đã xóa đánh giá');

      if (editingReviewId === reviewId) {
        resetReviewForm();
      }

      await loadReviews();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể xóa đánh giá';

      toast.error(message);
    }
  };

  const getReviewUserName = (review: ProductReview) => {
    const user = review.userId;

    if (typeof user === 'object' && user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return fullName || 'Khách hàng StyleHub';
    }

    return 'Khách hàng StyleHub';
  };

  const getReviewUserId = (review: ProductReview) => {
    const user = review.userId;

    if (typeof user === 'object' && user) {
      return user._id || user.id || '';
    }

    if (typeof user === 'string') {
      return user;
    }

    return '';
  };

  const isOwnReview = (review: ProductReview) => {
    const reviewUserId = getReviewUserId(review);
    return Boolean(loggedIn && currentUserId && reviewUserId === currentUserId);
  };

  const canDeleteReview = (review: ProductReview) => {
    const reviewUserId = getReviewUserId(review);

    return Boolean(
      loggedIn &&
      (currentUserRole === 'admin' || (currentUserId && reviewUserId === currentUserId))
    );
  };

  const formatReviewDate = (date?: string) => {
    if (!date) return '';

    try {
      return new Date(date).toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const renderReviewVariant = (review: ProductReview) => {
    if (!review.color && !review.size) return null;

    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Phân loại:</span>

        {review.colorCode ? (
          <span
            className="h-3.5 w-3.5 rounded-full border border-border"
            style={{ backgroundColor: review.colorCode }}
          />
        ) : null}

        <span>
          {review.color || 'Không rõ màu'}
          {review.size ? ` / Size ${review.size}` : ''}
        </span>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/san-pham" className="hover:text-foreground">
            Sản phẩm
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="line-clamp-1 font-medium text-foreground">{product.ten}</span>
        </nav>

        <div className="mb-16 grid gap-8 lg:grid-cols-[88px_minmax(0,1fr)_520px]">
          <div className="hidden lg:flex lg:max-h-[680px] lg:flex-col lg:gap-3 lg:overflow-y-auto">
            {galleryImages.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`overflow-hidden rounded-xl border-2 bg-secondary transition-all ${displayImage === img
                  ? 'border-primary shadow-sm'
                  : 'border-transparent hover:border-border'
                  }`}
              >
                <img
                  src={img}
                  alt=""
                  className="h-24 w-24 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-secondary">
              <div className="aspect-[4/5] w-full">
                <img
                  src={displayImage}
                  alt={product.ten}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {galleryImages.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`shrink-0 overflow-hidden rounded-xl border-2 bg-secondary transition-all ${displayImage === img
                    ? 'border-primary shadow-sm'
                    : 'border-transparent hover:border-border'
                    }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-20 w-20 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {product.badge && (
              <Badge variant={product.badge === 'sale' ? 'destructive' : 'default'}>
                {product.badge === 'sale'
                  ? 'Sale'
                  : product.badge === 'bestseller'
                    ? 'Bán chạy'
                    : product.badge === 'moi'
                      ? 'Mới'
                      : 'Hot'}
              </Badge>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl font-bold leading-tight md:text-3xl">{product.ten}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <RatingStars value={reviewAverage} size="sm" />
                  <span className="ml-1">
                    {reviewAverage} ({reviewCount} đánh giá)
                  </span>
                </div>

                <span>Đã bán {(product.daBan || 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(displayPrice)}
              </span>

              {typeof displayOriginalPrice === 'number' &&
                displayOriginalPrice > displayPrice && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(displayOriginalPrice)}
                    </span>
                    {discount && <Badge variant="destructive">-{discount}%</Badge>}
                  </>
                )}
            </div>

            <p className="leading-7 text-muted-foreground">{product.moTa}</p>

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Màu sắc: <span className="text-primary">{selectedColor}</span>
              </p>

              <div className="flex flex-wrap gap-3">
                {product.mauSac?.map((m) => (
                  <button
                    key={`${m.ten}-${m.ma}`}
                    type="button"
                    onClick={() => {
                      const variant =
                        product.bienThe?.find((v) => v.mau === m.ten) ||
                        product.bienThe?.[0];

                      const nextAvailableSizes =
                        variant?.kichThuoc
                          ?.filter((s) => s.stock > 0)
                          .map((s) => s.size) ||
                        product.colorSizeMap?.[m.ten] ||
                        product.kichCo ||
                        [];

                      const nextImages =
                        variant?.hinhAnh?.length
                          ? variant.hinhAnh
                          : product.hinhAnhList?.length
                            ? product.hinhAnhList
                            : product.hinhAnh
                              ? [product.hinhAnh]
                              : ['/placeholder.svg'];

                      setSelectedColor(m.ten);
                      setSelectedSize(nextAvailableSizes[0] || '');
                      setSelectedImage(nextImages[0] || '/placeholder.svg');
                      setQuantity(1);
                    }}
                    className={`relative h-10 w-10 rounded-full border-2 transition-all ${selectedColor === m.ten
                      ? 'scale-105 border-primary ring-2 ring-primary/20'
                      : 'border-border'
                      }`}
                    style={{ backgroundColor: m.ma }}
                    title={m.ten}
                  >
                    <span className="sr-only">{m.ten}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  Kích cỡ: <span className="text-primary">{selectedSize || 'Chưa chọn'}</span>
                </p>
                <button type="button" className="text-sm text-primary hover:underline">
                  Hướng dẫn chọn size
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {uniqueAvailableSizes.map((s) => {
                  const optionStock =
                    selectedVariant?.kichThuoc?.find((item) => item.size === s)?.stock ?? 0;
                  const isSelected = selectedSize === s;
                  const isDisabled =
                    selectedVariant?.kichThuoc?.length ? optionStock <= 0 : false;

                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedSize(s);
                        setQuantity(1);
                      }}
                      className={`min-w-[52px] rounded-xl border px-4 py-2 text-sm font-medium transition-all ${isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary'
                        } ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground">
                Còn lại: <span className="font-medium text-foreground">{displayStock}</span>
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Số lượng</p>
              <div className="inline-flex items-center rounded-xl border">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 transition-colors hover:bg-secondary"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="min-w-[52px] text-center font-medium">{quantity}</span>

                <button type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(displayStock || 1, q + 1))
                  }
                  className="p-3 transition-colors hover:bg-secondary"
                  disabled={quantity >= displayStock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                className="gap-2 rounded-xl"
                onClick={() => {
                  if (!product || !selectedVariant?.id || !selectedSize || !canAddToCart) {
                    toast.error('Vui lòng chọn đầy đủ màu, size và số lượng hợp lệ');
                    return;
                  }

                  addItem(product, selectedSize, selectedColor, quantity, {
                    variantId: String(selectedVariant.id),
                    image: displayImage,
                    price: displayPrice,
                    stock: displayStock,
                  });
                }}
                disabled={!canAddToCart}
              >
                <ShoppingBag className="h-5 w-5" />
                Thêm vào giỏ
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="rounded-xl"
                onClick={handleBuyNow}
                disabled={!canAddToCart}
              >
                Mua ngay
              </Button>
            </div>

            <Button
              variant="ghost"
              className="gap-2 px-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if (isInWishlist(product.id)) {
                  removeWishlist(product.id);
                } else {
                  addWishlist(product);
                }
              }}
            >
              <Heart
                className={`h-5 w-5 ${isInWishlist(product.id)
                  ? 'fill-destructive text-destructive'
                  : ''
                  }`}
              />
              {isInWishlist(product.id)
                ? 'Đã thêm vào yêu thích'
                : 'Thêm vào yêu thích'}
            </Button>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className="rounded-xl border p-4">
                <Truck className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-medium">Giao hàng nhanh</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Hỗ trợ giao hàng toàn quốc.
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <RotateCcw className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-medium">Đổi trả linh hoạt</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Đổi trả theo chính sách cửa hàng.
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <Shield className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-medium">Sản phẩm chính hãng</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cam kết thông tin sản phẩm rõ ràng.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-secondary/40 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <p className="font-semibold">Cần tư vấn thêm?</p>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                Bạn có thể hỏi AI để gợi ý cách phối đồ, dịp sử dụng phù hợp hoặc sản phẩm tương tự.
              </p>

              <Button
                variant="outline"
                className="mt-4"
                onClick={() => askAiInWidget(buildProductAiPrompt())}
              >
                Gợi ý phối đồ / sản phẩm tương tự
              </Button>
            </div>
          </div>
        </div>

        <section className="mb-16 rounded-2xl border bg-card p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Mô tả sản phẩm</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Thông tin chi tiết giúp bạn lựa chọn sản phẩm phù hợp.
              </p>
            </div>
          </div>

          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="font-medium">Thương hiệu</p>
              <p className="mt-1 text-muted-foreground">
                {product.thuongHieu || 'StyleHub'}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="font-medium">Danh mục</p>
              <p className="mt-1 text-muted-foreground">
                {product.danhMuc || 'Chưa phân loại'}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="font-medium">Giới tính</p>
              <p className="mt-1 text-muted-foreground">
                {product.gioiTinh === 'nam'
                  ? 'Nam'
                  : product.gioiTinh === 'nu'
                    ? 'Nữ'
                    : 'Unisex'}
              </p>
            </div>

            <div className="rounded-xl bg-secondary/40 p-4">
              <p className="font-medium">Chất liệu</p>
              <p className="mt-1 text-muted-foreground">
                {product.chatLieu || 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          {product.moTaChiTiet ? (
            <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">
              {product.moTaChiTiet}
            </p>
          ) : null}
        </section>

        <section className="mb-16 rounded-2xl border bg-card p-6" id="review-form">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Đánh giá sản phẩm</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {reviewCount} đánh giá từ khách hàng đã mua sản phẩm.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <RatingStars value={reviewAverage} size="sm" />
              <span className="text-sm font-medium">{reviewAverage}/5</span>
            </div>
          </div>

          {loggedIn ? (
            <div className="mb-6 rounded-xl border bg-secondary/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {editingReviewId ? 'Sửa đánh giá của bạn' : 'Viết đánh giá'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chỉ tài khoản đã mua và hoàn thành đơn hàng mới có thể đánh giá.
                  </p>
                </div>

                {editingReviewId ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={handleCancelEditReview}
                  >
                    <X className="h-4 w-4" />
                    Hủy sửa
                  </Button>
                ) : null}
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Số sao:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="rounded-md p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${reviewRating >= star
                          ? 'fill-warning text-warning'
                          : 'text-muted-foreground'
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về chất liệu, form dáng, trải nghiệm sử dụng..."
                className="min-h-[110px] w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/20"
              />

              <Button
                className="mt-3 gap-2"
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
              >
                <Send className="h-4 w-4" />
                {reviewSubmitting
                  ? 'Đang gửi...'
                  : editingReviewId
                    ? 'Lưu đánh giá'
                    : 'Gửi đánh giá'}
              </Button>
            </div>
          ) : (
            <div className="mb-6 rounded-xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
              Vui lòng{' '}
              <Link to="/dang-nhap" className="font-medium text-primary hover:underline">
                đăng nhập
              </Link>{' '}
              để đánh giá sản phẩm.
            </div>
          )}

          {reviewsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Đang tải đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có đánh giá nào cho sản phẩm này.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-xl border p-4">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{getReviewUserName(review)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <RatingStars value={review.rating} size="sm" />
                        {review.createdAt ? (
                          <span className="text-xs text-muted-foreground">
                            {formatReviewDate(review.createdAt)}
                          </span>
                        ) : null}
                      </div>

                      {renderReviewVariant(review)}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {isOwnReview(review) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleEditReview(review)}
                        >
                          <Pencil className="h-4 w-4" />
                          Sửa
                        </Button>
                      ) : null}

                      {canDeleteReview(review) ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => handleDeleteReview(review._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="leading-7 text-muted-foreground">{review.comment}</p>
                  ) : null}

                  {review.adminReply?.message ? (
                    <div className="mt-3 rounded-xl bg-secondary/50 p-3 text-sm">
                      <p className="font-medium">Phản hồi từ StyleHub</p>
                      <p className="mt-1 text-muted-foreground">
                        {review.adminReply.message}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}