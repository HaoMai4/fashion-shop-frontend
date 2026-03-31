import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { SanPham } from '@/types';
import { formatPrice, getDiscountPercent } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: SanPham;
  onAddToCart?: (product: SanPham) => void;
  onToggleWishlist?: (product: SanPham) => void;
  isWishlisted?: boolean;
}

const badgeLabels: Record<string, string> = {
  sale: 'Sale',
  bestseller: 'Bán chạy',
  moi: 'Mới',
  hot: 'Hot',
};

export default function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted }: ProductCardProps) {
  return (
    <div className="group relative rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-lg animate-fade-in">
      {/* Image */}
      <Link to={`/san-pham/${product.slug}`} className="block aspect-[3/4] overflow-hidden bg-secondary">
        <img
          src={product.hinhAnh[0]}
          alt={product.ten}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {product.badge && (
          <Badge variant={product.badge === 'sale' ? 'destructive' : 'default'} className="text-xs">
            {badgeLabels[product.badge]}
          </Badge>
        )}
        {product.giaGoc && (
          <Badge variant="destructive" className="text-xs">-{getDiscountPercent(product.giaGoc, product.gia)}%</Badge>
        )}
      </div>

      {/* Wishlist */}
      <button
        onClick={() => onToggleWishlist?.(product)}
        className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur text-foreground/60 hover:text-sale transition-colors"
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-sale text-sale' : ''}`} />
      </button>

      {/* Info */}
      <div className="p-3">
        <Link to={`/san-pham/${product.slug}`}>
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1 hover:text-accent transition-colors">{product.ten}</h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1.5">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="text-xs text-muted-foreground">{product.danhGiaTB} ({product.soDanhGia})</span>
        </div>

        {/* Colors */}
        <div className="flex gap-1 mb-2">
          {product.mauSac.slice(0, 4).map(m => (
            <span key={m.ma} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: m.ma }} title={m.ten} />
          ))}
          {product.mauSac.length > 4 && <span className="text-xs text-muted-foreground">+{product.mauSac.length - 4}</span>}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-foreground">{formatPrice(product.gia)}</span>
          {product.giaGoc && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.giaGoc)}</span>
          )}
        </div>

        {/* Sizes */}
        <div className="flex flex-wrap gap-1 mb-2">
          {product.kichCo.slice(0, 4).map(s => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">{s}</span>
          ))}
        </div>

        {/* Quick add */}
        <Button
          size="sm"
          className="w-full gap-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onAddToCart?.(product)}
        >
          <ShoppingBag className="h-3.5 w-3.5" /> Thêm vào giỏ
        </Button>
      </div>
    </div>
  );
}
