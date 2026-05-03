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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { productService } from '@/services/api/productService';
import { reviewService, ProductReview } from '@/services/api/reviewService';
import { SanPham } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatPrice, getDiscountPercent } from '@/utils/format';
import { toast } from 'sonner';

const BUY_NOW_STORAGE_KEY = 'matewear_buy_now';

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

      const result = await reviewService.createOrUpdateReview(String(product.id), {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      toast.success(
        result.message === 'Review updated'
          ? 'Đã cập nhật đánh giá'
          : 'Đã gửi đánh giá'
      );

      setReviewComment('');
      setReviewRating(5);

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

  const getReviewUserName = (review: ProductReview) => {
    const user = review.userId;

    if (typeof user === 'object' && user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return fullName || 'Khách hàng StyleHub';
    }

    return 'Khách hàng StyleHub';
  };

  const formatReviewDate = (date?: string) => {
    if (!date) return '';

    try {
      return new Date(date).toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
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
                className={`overflow-hidden rounded-xl border-2 bg-secondary transition-all ${
                  displayImage === img
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
                  className={`shrink-0 overflow-hidden rounded-xl border-2 bg-secondary transition-all ${
                    displayImage === img
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
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(reviewAverage)
                          ? 'fill-warning text-warning'
                          : 'text-border'
                      }`}
                    />
                  ))}
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
                    className={`relative h-10 w-10 rounded-full border-2 transition-all ${
                      selectedColor === m.ten
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
                      className={`min-w-[52px] rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : isDisabled
                            ? 'cursor-not-allowed border-border bg-muted text-muted-foreground opacity-60'
                            : 'border-border bg-background hover:border-primary/50'
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Số lượng</p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-xl border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-r-none"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <span className="flex h-11 min-w-[52px] items-center justify-center font-medium">
                    {quantity}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-l-none"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(displayStock > 0 ? displayStock : 1, q + 1)
                      )
                    }
                    disabled={displayStock <= 0}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <span className="text-sm text-muted-foreground">
                  Còn {displayStock || 0} sản phẩm
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                size="lg"
                className="flex-1 gap-2"
                disabled={!canAddToCart}
                onClick={() => {
                  if (!selectedVariant?.id) return;

                  addItem(
                    {
                      ...product,
                      hinhAnh: displayImage,
                      gia: displayPrice,
                    },
                    selectedColor,
                    selectedSize,
                    quantity,
                    {
                      variantId: selectedVariant.id,
                      price: displayPrice,
                      image: displayImage,
                    }
                  );
                }}
              >
                <ShoppingBag className="h-5 w-5" />
                Thêm vào giỏ
              </Button>

              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="flex-1"
                disabled={!canAddToCart}
                onClick={handleBuyNow}
              >
                Mua ngay
              </Button>

              <Button
                type="button"
                size="lg"
                variant="outline"
                className="px-3"
                onClick={() =>
                  isInWishlist(productId)
                    ? removeWishlist(productId)
                    : addWishlist(product)
                }
              >
                <Heart
                  className={`h-5 w-5 ${isInWishlist(productId) ? 'fill-sale text-sale' : ''}`}
                />
              </Button>
            </div>

            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4 text-accent" />
                Trợ lý AI hỗ trợ bạn
              </p>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    askAiInWidget(
                      `Tư vấn size cho sản phẩm "${product.ten}". Màu đang xem: ${selectedColor || 'chưa chọn'}, size đang chọn: ${selectedSize || 'chưa chọn'}, giá hiện tại: ${formatPrice(displayPrice)}.`
                    )
                  }
                >
                  <Bot className="h-3.5 w-3.5" />
                  AI tư vấn size
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    askAiInWidget(
                      `Gợi ý phối đồ với sản phẩm "${product.ten}" màu ${selectedColor || 'hiện tại'}.`
                    )
                  }
                >
                  <Bot className="h-3.5 w-3.5" />
                  AI gợi ý phối đồ
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() =>
                    askAiInWidget(
                      `Gợi ý sản phẩm tương tự với "${product.ten}", màu ${selectedColor || 'hiện tại'}, mức giá khoảng ${formatPrice(displayPrice)}.`
                    )
                  }
                >
                  <Bot className="h-3.5 w-3.5" />
                  Sản phẩm tương tự
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Miễn phí ship đơn 500K' },
                { icon: RotateCcw, label: 'Đổi trả 30 ngày' },
                { icon: Shield, label: 'Bảo hành chất lượng' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center"
                >
                  <item.icon className="h-5 w-5 text-accent" />
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-bold">Mô tả sản phẩm</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>{product.moTaChiTiet || product.moTa}</p>
            <ul className="mt-3">
              <li>Chất liệu: {product.chatLieu || 'Đang cập nhật'}</li>
              <li>
                Giới tính:{' '}
                {product.gioiTinh === 'nam'
                  ? 'Nam'
                  : product.gioiTinh === 'nu'
                    ? 'Nữ'
                    : 'Unisex'}
              </li>
              <li>Danh mục: {product.danhMuc}</li>
            </ul>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Đánh giá sản phẩm</h2>
              <p className="text-sm text-muted-foreground">
                {reviewCount > 0
                  ? `${reviewCount} đánh giá từ khách hàng`
                  : 'Chưa có đánh giá nào cho sản phẩm này'}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(reviewAverage)
                      ? 'fill-warning text-warning'
                      : 'text-border'
                  }`}
                />
              ))}
              <span className="ml-2 text-sm font-medium">
                {reviewAverage}/5
              </span>
            </div>
          </div>

          <div className="mb-8 rounded-2xl bg-secondary/40 p-4">
            <h3 className="mb-3 font-semibold">Viết đánh giá của bạn</h3>

            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Chọn số sao:</span>

              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starValue = i + 1;

                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setReviewRating(starValue)}
                      className="rounded p-0.5 transition hover:scale-105"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          starValue <= reviewRating
                            ? 'fill-warning text-warning'
                            : 'text-border'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về chất lượng, form dáng, chất liệu..."
              className="min-h-[110px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Chỉ tài khoản đã mua sản phẩm và có đơn hoàn thành mới có thể đánh giá.
              </p>

              <Button
                type="button"
                className="gap-2"
                disabled={reviewSubmitting}
                onClick={handleSubmitReview}
              >
                <Send className="h-4 w-4" />
                {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </div>
          </div>

          {reviewsLoading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Đang tải đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Sản phẩm chưa có đánh giá nào.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="rounded-2xl border p-4">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{getReviewUserName(review)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating
                              ? 'fill-warning text-warning'
                              : 'text-border'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="leading-7 text-muted-foreground">
                    {review.comment || 'Khách hàng chưa để lại nhận xét.'}
                  </p>

                  {review.adminReply?.message && (
                    <div className="mt-3 rounded-xl bg-accent/10 p-3">
                      <p className="mb-1 text-sm font-medium text-accent">
                        Phản hồi từ StyleHub
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {review.adminReply.message}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}