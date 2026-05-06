import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { SanPham } from '@/types';
import { formatPrice, getDiscountPercent } from '@/utils/format';

interface ProductCardProps {
  product: SanPham;
  onAddToCart?: (product: SanPham) => void;
  onToggleWishlist?: (product: SanPham) => void;
  isWishlisted?: boolean;
}

const badgeConfig: Record<string, { label: string; className: string }> = {
  sale: { label: 'Sale', className: 'bg-destructive text-destructive-foreground' },
  bestseller: { label: 'Bán chạy', className: 'bg-warning text-warning-foreground' },
  moi: { label: 'Mới', className: 'bg-accent text-accent-foreground' },
  hot: { label: 'Hot', className: 'bg-destructive text-destructive-foreground' },
};

export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
}: ProductCardProps) {
  const discount = product.giaGoc ? getDiscountPercent(product.giaGoc, product.gia) : null;

  const imageSrc =
    typeof product.hinhAnh === 'string' && product.hinhAnh.trim() !== ''
      ? product.hinhAnh
      : '/placeholder.svg';

  const isOutOfStock = Number(product.soLuongTon || 0) <= 0;

  return (
    <div className="group relative rounded-lg bg-card border border-border overflow-hidden transition-all duration-300 hover:shadow-md hover:border-accent/20">
      <Link
        to={`/san-pham/${product.slug}`}
        className="block relative aspect-[3/4] overflow-hidden bg-secondary"
      >
        <img
          src={imageSrc}
          alt={product.ten}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isOutOfStock ? 'opacity-70 grayscale-[20%]' : ''
          }`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();

              if (isOutOfStock) {
                return;
              }

              onAddToCart?.(product);
            }}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center gap-1 rounded-md py-2 text-[11px] font-semibold transition-colors shadow-sm ${
              isOutOfStock
                ? 'cursor-not-allowed bg-muted text-muted-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <ShoppingBag className="h-3 w-3" />
            {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </Link>

      <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
        {isOutOfStock && (
          <span className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-bold leading-none bg-muted text-muted-foreground">
            Hết hàng
          </span>
        )}

        {product.badge && badgeConfig[product.badge] && (
          <span
            className={`inline-flex items-center rounded px-1.5 py-px text-[9px] font-bold leading-none ${badgeConfig[product.badge].className}`}
          >
            {badgeConfig[product.badge].label}
          </span>
        )}

        {discount && (
          <span className="inline-flex items-center rounded px-1.5 py-px text-[9px] font-bold leading-none bg-destructive text-destructive-foreground">
            -{discount}%
          </span>
        )}
      </div>

      <button
        onClick={() => onToggleWishlist?.(product)}
        className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors"
      >
        <Heart className={`h-3 w-3 ${isWishlisted ? 'fill-destructive text-destructive' : ''}`} />
      </button>

      <div className="p-2.5">
        <div className="flex items-center gap-0.5 mb-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-2.5 w-2.5 ${
                i < Math.round(product.danhGia || 0)
                  ? 'fill-warning text-warning'
                  : 'fill-muted text-muted'
              }`}
            />
          ))}
          <span className="text-[9px] text-muted-foreground ml-0.5">
            ({product.soLuongDanhGia || 0})
          </span>
        </div>

        <Link to={`/san-pham/${product.slug}`}>
          <h3 className="text-[12px] font-semibold text-foreground line-clamp-2 mb-1 hover:text-accent transition-colors leading-tight min-h-[2rem]">
            {product.ten}
          </h3>
        </Link>

        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-sm font-extrabold text-foreground">
            {formatPrice(product.gia)}
          </span>

          {typeof product.giaGoc === 'number' && product.giaGoc > product.gia && (
            <span className="text-[10px] text-muted-foreground/60 line-through">
              {formatPrice(product.giaGoc)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 mb-1.5">
          {product.mauSac?.slice(0, 4).map((m) => (
            <span
              key={m.ma}
              className="h-3 w-3 rounded-full border border-border"
              style={{ backgroundColor: m.ma }}
              title={m.ten}
            />
          ))}

          {(product.mauSac?.length || 0) > 4 && (
            <span className="text-[9px] text-muted-foreground ml-0.5">
              +{product.mauSac.length - 4}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-0.5">
          {product.kichCo?.slice(0, 4).map((s) => (
            <span
              key={s}
              className="text-[9px] px-1 py-px rounded border border-border text-muted-foreground bg-secondary/50"
            >
              {s}
            </span>
          ))}

          {(product.kichCo?.length || 0) > 4 && (
            <span className="text-[9px] px-0.5 text-muted-foreground">
              +{product.kichCo.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}