import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/ProductCard';
import { productService } from '@/services/api/productService';
import { SanPham, ProductFilter } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

const priceRanges = [
  { label: 'Dưới 200K', min: 0, max: 200000 },
  { label: '200K - 400K', min: 200000, max: 400000 },
  { label: '400K - 600K', min: 400000, max: 600000 },
  { label: 'Trên 600K', min: 600000, max: 10000000 },
];

const colors = ['Đen', 'Trắng', 'Xanh navy', 'Xám', 'Hồng', 'Be', 'Xanh dương'];
const sizes = ['S', 'M', 'L', 'XL', 'XXL', '29', '30', '31', '32', '33', '34', 'Free Size'];
const categories = ['Áo Polo', 'Áo Thun', 'Sơ Mi', 'Quần Dài', 'Quần Short', 'Đồ Thể Thao', 'Đồ Lót', 'Váy', 'Áo Khoác', 'Phụ Kiện'];

function FilterPanel({ filter, setFilter }: { filter: ProductFilter; setFilter: (f: ProductFilter) => void }) {
  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Danh mục</h3>
        <div className="space-y-2">
          {categories.map(c => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={filter.danhMuc === c} onCheckedChange={checked => setFilter({ ...filter, danhMuc: checked ? c : undefined })} />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Giới tính</h3>
        <div className="space-y-2">
          {[{ label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }, { label: 'Unisex', value: 'unisex' }].map(g => (
            <label key={g.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={filter.gioiTinh === g.value} onCheckedChange={checked => setFilter({ ...filter, gioiTinh: checked ? g.value : undefined })} />
              {g.label}
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Khoảng giá</h3>
        <div className="space-y-2">
          {priceRanges.map(r => (
            <label key={r.label} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={filter.giaMin === r.min && filter.giaMax === r.max} onCheckedChange={checked => setFilter({ ...filter, giaMin: checked ? r.min : undefined, giaMax: checked ? r.max : undefined })} />
              {r.label}
            </label>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Màu sắc</h3>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <label key={c} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox checked={filter.mauSac?.includes(c)} onCheckedChange={checked => {
                const current = filter.mauSac || [];
                setFilter({ ...filter, mauSac: checked ? [...current, c] : current.filter(x => x !== c) });
              }} />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Kích cỡ</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map(s => (
            <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <Checkbox checked={filter.kichCo?.includes(s)} onCheckedChange={checked => {
                const current = filter.kichCo || [];
                setFilter({ ...filter, kichCo: checked ? [...current, s] : current.filter(x => x !== s) });
              }} />
              {s}
            </label>
          ))}
        </div>
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={() => setFilter({})}>Xóa bộ lọc</Button>
    </div>
  );
}

export default function ProductListing() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilter>(() => {
    const f: ProductFilter = {};
    if (searchParams.get('gioiTinh')) f.gioiTinh = searchParams.get('gioiTinh')!;
    if (searchParams.get('danhMuc')) f.danhMuc = searchParams.get('danhMuc')!;
    if (searchParams.get('khuyenMai')) f.khuyenMai = true;
    if (searchParams.get('timKiem')) f.timKiem = searchParams.get('timKiem')!;
    return f;
  });
  const { addItem } = useCart();
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    setLoading(true);
    productService.getAll(filter).then(p => { setProducts(p); setLoading(false); });
  }, [filter]);

  const title = filter.danhMuc || (filter.gioiTinh === 'nam' ? 'Thời trang Nam' : filter.gioiTinh === 'nu' ? 'Thời trang Nữ' : filter.timKiem ? `Kết quả tìm kiếm: "${filter.timKiem}"` : filter.khuyenMai ? 'Sản phẩm đang Sale' : 'Tất cả sản phẩm');

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{title}</span>
        </nav>

        <div className="flex gap-8">
          {/* Filter sidebar - desktop */}
          <aside className="hidden lg:block w-60 shrink-0">
            <h2 className="text-lg font-semibold mb-4">Bộ lọc</h2>
            <FilterPanel filter={filter} setFilter={setFilter} />
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">{products.length} sản phẩm</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Mobile filter */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="h-4 w-4" /> Bộ lọc
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 overflow-y-auto">
                    <SheetTitle>Bộ lọc</SheetTitle>
                    <div className="mt-4"><FilterPanel filter={filter} setFilter={setFilter} /></div>
                  </SheetContent>
                </Sheet>
                <Select value={filter.sapXep || ''} onValueChange={v => setFilter({ ...filter, sapXep: v as any })}>
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moi_nhat">Mới nhất</SelectItem>
                    <SelectItem value="ban_chay">Bán chạy</SelectItem>
                    <SelectItem value="gia_tang">Giá tăng dần</SelectItem>
                    <SelectItem value="gia_giam">Giá giảm dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active filters */}
            {(filter.danhMuc || filter.gioiTinh || filter.mauSac?.length || filter.kichCo?.length) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filter.danhMuc && <Badge filter={filter.danhMuc} onRemove={() => setFilter({ ...filter, danhMuc: undefined })} />}
                {filter.gioiTinh && <Badge filter={filter.gioiTinh === 'nam' ? 'Nam' : filter.gioiTinh === 'nu' ? 'Nữ' : 'Unisex'} onRemove={() => setFilter({ ...filter, gioiTinh: undefined })} />}
              </div>
            )}

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card animate-pulse">
                    <div className="aspect-[3/4] bg-secondary" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                      <div className="h-4 bg-secondary rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg font-medium text-muted-foreground">Không tìm thấy sản phẩm nào</p>
                <Button variant="outline" className="mt-4" onClick={() => setFilter({})}>Xóa bộ lọc</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={pr => addItem(pr, pr.mauSac[0]?.ten || '', pr.kichCo[0] || '')} onToggleWishlist={pr => isInWishlist(pr.id) ? removeWishlist(pr.id) : addWishlist(pr)} isWishlisted={isInWishlist(p.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function Badge({ filter, onRemove }: { filter: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
      {filter}
      <button onClick={onRemove}><X className="h-3 w-3" /></button>
    </span>
  );
}
