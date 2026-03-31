import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/format';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Danh sách yêu thích trống</h1>
          <p className="text-muted-foreground mb-6">Hãy thêm sản phẩm yêu thích để xem lại sau!</p>
          <Button asChild><Link to="/san-pham">Khám phá sản phẩm</Link></Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Sản phẩm yêu thích ({items.length})</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(p => (
            <div key={p.id} className="rounded-lg border border-border overflow-hidden bg-card group">
              <Link to={`/san-pham/${p.slug}`} className="block aspect-[3/4] bg-secondary overflow-hidden">
                <img src={p.hinhAnh[0]} alt={p.ten} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="p-3 space-y-2">
                <Link to={`/san-pham/${p.slug}`} className="text-sm font-medium line-clamp-1 hover:text-accent">{p.ten}</Link>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{formatPrice(p.gia)}</span>
                  {p.giaGoc && <span className="text-xs text-muted-foreground line-through">{formatPrice(p.giaGoc)}</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1 text-xs" onClick={() => { addItem(p, p.mauSac[0]?.ten || '', p.kichCo[0] || ''); removeItem(p.id); }}>
                    <ShoppingBag className="h-3 w-3" /> Thêm giỏ hàng
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => removeItem(p.id)} className="px-2">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
