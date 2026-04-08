import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { productService } from '@/services/api/productService';
import { SanPham } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { formatPrice, getDiscountPercent } from '@/utils/format';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<SanPham | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

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

        const firstImage =
          firstVariant?.hinhAnh?.[0] ||
          p.hinhAnhList?.[0] ||
          p.hinhAnh ||
          '/placeholder.svg';

        setProduct(p);
        setSelectedColor(firstColor);
        setSelectedSize(firstSize);
        setSelectedImage(firstImage);
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

  useEffect(() => {
    if (!product) return;

    const selectedVariant =
      product.bienThe?.find((v) => v.mau === selectedColor) ||
      product.bienThe?.[0];

    const variantAvailableSizes =
      selectedVariant?.kichThuoc
        ?.filter((s) => s.stock > 0)
        .map((s) => s.size) || [];

    const mappedSizes = product.colorSizeMap?.[selectedColor] || [];

    const availableSizes =
      variantAvailableSizes.length > 0
        ? variantAvailableSizes
        : mappedSizes.length > 0
        ? mappedSizes
        : product.kichCo || [];

    const uniqueAvailableSizes = Array.from(new Set(availableSizes));

    if (
      uniqueAvailableSizes.length > 0 &&
      !uniqueAvailableSizes.includes(selectedSize)
    ) {
      setSelectedSize(uniqueAvailableSizes[0]);
    }

    const selectedSizeInfo =
      selectedVariant?.kichThuoc?.find((s) => s.size === selectedSize) ||
      selectedVariant?.kichThuoc?.find((s) => s.stock > 0) ||
      selectedVariant?.kichThuoc?.[0];

    const currentStock = selectedSizeInfo?.stock ?? product.soLuongTon ?? 0;

    setQuantity((q) => {
      if (currentStock <= 0) return 1;
      return Math.min(Math.max(q, 1), currentStock);
    });
  }, [product, selectedColor, selectedSize]);

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

  const selectedVariant =
    product.bienThe?.find((v) => v.mau === selectedColor) ||
    product.bienThe?.[0];

  const variantAvailableSizes =
    selectedVariant?.kichThuoc
      ?.filter((s) => s.stock > 0)
      .map((s) => s.size) || [];

  const mappedSizes = product.colorSizeMap?.[selectedColor] || [];

  const availableSizes =
    variantAvailableSizes.length > 0
      ? variantAvailableSizes
      : mappedSizes.length > 0
      ? mappedSizes
      : product.kichCo || [];

  const uniqueAvailableSizes = Array.from(new Set(availableSizes));

  const selectedSizeInfo =
    selectedVariant?.kichThuoc?.find((s) => s.size === selectedSize) ||
    selectedVariant?.kichThuoc?.find((s) => s.stock > 0) ||
    selectedVariant?.kichThuoc?.[0];

  const galleryImagesRaw =
    selectedVariant?.hinhAnh?.length
      ? selectedVariant.hinhAnh
      : product.hinhAnhList?.length
      ? product.hinhAnhList
      : product.hinhAnh
      ? [product.hinhAnh]
      : ['/placeholder.svg'];

  const galleryImages = Array.from(
    new Set(galleryImagesRaw.filter((img): img is string => Boolean(img)))
  );

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
          <span className="font-medium text-foreground">{product.ten}</span>
        </nav>

        <div className="mb-16 grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
              <img
                src={displayImage}
                alt={product.ten}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {galleryImages.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 bg-secondary transition-colors ${
                    displayImage === img
                      ? 'border-accent'
                      : 'border-transparent hover:border-accent'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
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

            <h1 className="text-2xl font-bold md:text-3xl">{product.ten}</h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.danhGia || 0)
                        ? 'fill-warning text-warning'
                        : 'text-border'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm text-muted-foreground">
                  {product.danhGia || 0} ({product.soLuongDanhGia || 0} đánh giá)
                </span>
              </div>

              <span className="text-sm text-muted-foreground">
                Đã bán {(product.daBan || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
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

            <p className="text-muted-foreground">{product.moTa}</p>

            <div>
              <p className="mb-2 text-sm font-medium">
                Màu sắc: <span className="text-accent">{selectedColor}</span>
              </p>
              <div className="flex gap-2">
                {product.mauSac?.map((m) => (
                  <button
                    key={`${m.ten}-${m.ma}`}
                    type="button"
                    onClick={() => {
                      const variant = product.bienThe?.find((v) => v.mau === m.ten);

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
                    className={`h-9 w-9 rounded-full border-2 transition-all ${
                      selectedColor === m.ten
                        ? 'scale-110 border-accent'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: m.ma }}
                    title={m.ten}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">
                Kích cỡ: <span className="text-accent">{selectedSize}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {uniqueAvailableSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSelectedSize(s);
                      setQuantity(1);
                    }}
                    className={`h-9 min-w-[2.5rem] rounded-lg border px-3 text-sm font-medium transition-all ${
                      selectedSize === s
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Số lượng</p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="w-10 text-center font-medium">{quantity}</span>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() =>
                    setQuantity((q) =>
                      Math.min(displayStock > 0 ? displayStock : 1, q + 1)
                    )
                  }
                  disabled={displayStock <= 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>

                <span className="text-sm text-muted-foreground">
                  Còn {displayStock || 0} sản phẩm
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
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
                <ShoppingBag className="h-5 w-5" /> Thêm vào giỏ
              </Button>

              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="flex-1"
                disabled={!canAddToCart}
              >
                Mua ngay
              </Button>

              <Button
                type="button"
                size="lg"
                variant="outline"
                className="px-3"
                onClick={() =>
                  isInWishlist(product.id)
                    ? removeWishlist(product.id)
                    : addWishlist(product)
                }
              >
                <Heart
                  className={`h-5 w-5 ${
                    isInWishlist(product.id) ? 'fill-sale text-sale' : ''
                  }`}
                />
              </Button>
            </div>

            <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4 text-accent" /> Trợ lý AI hỗ trợ bạn
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <Link to="/ai-tu-van">
                    <Bot className="h-3.5 w-3.5" /> AI tư vấn size
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <Link to="/ai-tu-van">
                    <Bot className="h-3.5 w-3.5" /> AI gợi ý phối đồ
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                  <Link to="/ai-tu-van">
                    <Bot className="h-3.5 w-3.5" /> Sản phẩm tương tự
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Miễn phí ship đơn 500K' },
                { icon: RotateCcw, label: 'Đổi trả 30 ngày' },
                { icon: Shield, label: 'Bảo hành chất lượng' },
              ].map((p) => (
                <div
                  key={p.label}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-center"
                >
                  <p.icon className="h-5 w-5 text-accent" />
                  <span className="text-[11px] text-muted-foreground">{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12">
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
      </div>
    </MainLayout>
  );
}