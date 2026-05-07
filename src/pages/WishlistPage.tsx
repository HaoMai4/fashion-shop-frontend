import { Link } from 'react-router-dom';
import { Heart, Loader2, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';

function getImageSrc(image: any) {
  if (typeof image === 'string' && image.trim()) {
    return image;
  }

  if (Array.isArray(image)) {
    const found = image.find((item) => typeof item === 'string' && item.trim());
    return found || '/placeholder.svg';
  }

  return '/placeholder.svg';
}

function getVariantSizes(variant: any) {
  if (Array.isArray(variant?.kichThuoc)) {
    return variant.kichThuoc;
  }

  if (Array.isArray(variant?.sizes)) {
    return variant.sizes;
  }

  return [];
}

function getVariantId(variant: any) {
  return variant?.id || variant?._id || '';
}

function getVariantColor(variant: any) {
  return variant?.mau || variant?.color || '';
}

function getDefaultCartInfo(product: any, imageSrc: string) {
  const detailVariants = Array.isArray(product?.bienThe) ? product.bienThe : [];
  const rawVariants = Array.isArray(product?.variants) ? product.variants : [];
  const variants = detailVariants.length > 0 ? detailVariants : rawVariants;

  const firstAvailableVariant =
    variants.find((variant: any) =>
      getVariantSizes(variant).some((size: any) => Number(size.stock || 0) > 0)
    ) ||
    variants[0] ||
    null;

  const firstAvailableSize =
    getVariantSizes(firstAvailableVariant).find(
      (size: any) => Number(size.stock || 0) > 0
    ) ||
    getVariantSizes(firstAvailableVariant)[0] ||
    null;

  const variantId =
    getVariantId(firstAvailableVariant) ||
    product?.defaultVariantId ||
    product?.variantId ||
    '';

  const color =
    getVariantColor(firstAvailableVariant) ||
    product?.defaultColor ||
    product?.mauSac?.[0]?.ten ||
    '';

  const size =
    firstAvailableSize?.size ||
    product?.defaultSize ||
    product?.kichCo?.[0] ||
    '';

  const price =
    Number(firstAvailableSize?.finalPrice || 0) ||
    Number(firstAvailableSize?.discountPrice || 0) ||
    Number(firstAvailableSize?.price || 0) ||
    Number(product?.defaultPrice || 0) ||
    Number(product?.gia || 0);

  const stock = Number(firstAvailableSize?.stock || product?.soLuongTon || 0);

  const image =
    imageSrc ||
    firstAvailableVariant?.hinhAnh?.[0] ||
    firstAvailableVariant?.images?.[0] ||
    product?.hinhAnh ||
    '/placeholder.svg';

  return {
    variantId: String(variantId),
    color: String(color),
    size: String(size),
    price,
    stock,
    image,
  };
}

export default function WishlistPage() {
  const { items, removeItem, loading } = useWishlist();
  const { addItem } = useCart();

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Đang tải danh sách yêu thích</h1>
          <p className="text-muted-foreground">Vui lòng chờ trong giây lát...</p>
        </div>
      </MainLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Danh sách yêu thích trống</h1>
          <p className="text-muted-foreground mb-6">
            Hãy thêm sản phẩm yêu thích để xem lại sau!
          </p>
          <Button asChild>
            <Link to="/san-pham">Khám phá sản phẩm</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">
          Sản phẩm yêu thích ({items.length})
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => {
            const imageSrc = getImageSrc(p.hinhAnh);
            const cartInfo = getDefaultCartInfo(p, imageSrc);
            const totalStock = Number(p.soLuongTon || 0);
            const optionStock = Number(cartInfo.stock || 0);
            const isOutOfStock = optionStock <= 0 && totalStock <= 0;

            return (
              <div
                key={p.id}
                className="rounded-lg border border-border overflow-hidden bg-card group"
              >
                <Link
                  to={`/san-pham/${p.slug}`}
                  className="relative block aspect-[3/4] bg-secondary overflow-hidden"
                >
                  <img
                    src={imageSrc}
                    alt={p.ten}
                    className={`h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'opacity-70 grayscale-[20%]' : ''
                      }`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />

                  {isOutOfStock ? (
                    <span className="absolute left-2 top-2 rounded bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">
                      Hết hàng
                    </span>
                  ) : null}
                </Link>

                <div className="p-3 space-y-2">
                  <Link
                    to={`/san-pham/${p.slug}`}
                    className="text-sm font-medium line-clamp-1 hover:text-accent"
                  >
                    {p.ten}
                  </Link>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {formatPrice(p.gia)}
                    </span>

                    {p.giaGoc && p.giaGoc > p.gia && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(p.giaGoc)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1 text-xs"
                      disabled={isOutOfStock}
                      onClick={async () => {
                        if (isOutOfStock) {
                          toast.error('Sản phẩm hiện đã hết hàng');
                          return;
                        }

                        if (!cartInfo.variantId) {
                          toast.error('Sản phẩm này chưa có biến thể để thêm vào giỏ hàng');
                          return;
                        }

                        if (!cartInfo.size) {
                          toast.error('Sản phẩm này chưa có size để thêm vào giỏ hàng');
                          return;
                        }

                        addItem(p, cartInfo.size, cartInfo.color, 1, {
                          variantId: cartInfo.variantId,
                          price: cartInfo.price,
                          image: cartInfo.image,
                          stock: cartInfo.stock,
                        });

                        await removeItem(String(p.id));
                      }}
                    >
                      <ShoppingBag className="h-3 w-3" />
                      {isOutOfStock ? 'Hết hàng' : 'Thêm giỏ hàng'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(String(p.id))}
                      className="px-2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}