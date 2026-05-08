import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import MainLayout from '@/components/layout/MainLayout';
import ProductCard from '@/components/ProductCard';
import {
  productService,
  type AdminCategoryRecord,
} from '@/services/api/productService';
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

const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

function parseNumberParam(value: string | null) {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseListParam(value: string | null) {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFilterFromSearchParams(searchParams: URLSearchParams): ProductFilter {
  const nextFilter: ProductFilter = {};

  const gioiTinh = searchParams.get('gioiTinh');
  const danhMuc = searchParams.get('danhMuc');
  const khuyenMai = searchParams.get('khuyenMai');
  const timKiem = searchParams.get('timKiem');
  const sort = searchParams.get('sort');
  const giaMin = parseNumberParam(searchParams.get('giaMin'));
  const giaMax = parseNumberParam(searchParams.get('giaMax'));
  const mauSac = parseListParam(searchParams.get('mauSac'));
  const kichCo = parseListParam(searchParams.get('kichCo'));

  if (gioiTinh) nextFilter.gioiTinh = gioiTinh;
  if (danhMuc) nextFilter.danhMuc = danhMuc;
  if (khuyenMai === 'true') nextFilter.khuyenMai = true;
  if (timKiem) nextFilter.timKiem = timKiem;
  if (giaMin !== undefined) nextFilter.giaMin = giaMin;
  if (giaMax !== undefined) nextFilter.giaMax = giaMax;
  if (mauSac.length > 0) nextFilter.mauSac = mauSac;
  if (kichCo.length > 0) nextFilter.kichCo = kichCo;

  if (sort === 'bestseller') {
    nextFilter.sapXep = 'ban_chay';
  }

  if (sort === 'newest') {
    nextFilter.sapXep = 'moi_nhat';
  }

  if (sort === 'price_asc') {
    nextFilter.sapXep = 'gia_tang';
  }

  if (sort === 'price_desc') {
    nextFilter.sapXep = 'gia_giam';
  }

  return nextFilter;
}

function buildSearchParamsFromFilter(filter: ProductFilter) {
  const params = new URLSearchParams();

  if (filter.danhMuc) params.set('danhMuc', filter.danhMuc);
  if (filter.gioiTinh) params.set('gioiTinh', filter.gioiTinh);
  if (filter.khuyenMai) params.set('khuyenMai', 'true');
  if (filter.timKiem) params.set('timKiem', filter.timKiem);
  if (filter.giaMin !== undefined) params.set('giaMin', String(filter.giaMin));
  if (filter.giaMax !== undefined) params.set('giaMax', String(filter.giaMax));

  if (filter.mauSac?.length) {
    params.set('mauSac', filter.mauSac.join(','));
  }

  if (filter.kichCo?.length) {
    params.set('kichCo', filter.kichCo.join(','));
  }

  if (filter.sapXep) {
    const sortMap: Record<NonNullable<ProductFilter['sapXep']>, string> = {
      ban_chay: 'bestseller',
      moi_nhat: 'newest',
      gia_tang: 'price_asc',
      gia_giam: 'price_desc',
    };

    params.set('sort', sortMap[filter.sapXep]);
  }

  return params;
}

function normalizeText(value: string) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatCategoryPath(path?: string) {
  if (!path) return '';

  return path
    .split('/')
    .filter(Boolean)
    .map((part) =>
      part
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(' / ');
}

function findCategoryBySlugOrId(
  categories: AdminCategoryRecord[],
  value?: string
): AdminCategoryRecord | null {
  if (!value) return null;

  const target = normalizeText(value);

  for (const category of categories) {
    const matched =
      normalizeText(category._id) === target ||
      normalizeText(category.slug) === target ||
      normalizeText(category.name) === target ||
      normalizeText(category.path || '') === target;

    if (matched) return category;

    const found = findCategoryBySlugOrId(category.children || [], value);
    if (found) return found;
  }

  return null;
}

function collectCategoryIds(category: AdminCategoryRecord | null): string[] {
  if (!category?._id) return [];

  const childIds = (category.children || []).flatMap((child) =>
    collectCategoryIds(child)
  );

  return [category._id, ...childIds];
}

function getAncestorIds(
  categories: AdminCategoryRecord[],
  targetValue?: string,
  ancestors: string[] = []
): string[] {
  if (!targetValue) return [];

  const target = normalizeText(targetValue);

  for (const category of categories) {
    const matched =
      normalizeText(category._id) === target ||
      normalizeText(category.slug) === target ||
      normalizeText(category.name) === target ||
      normalizeText(category.path || '') === target;

    if (matched) {
      return ancestors;
    }

    const found = getAncestorIds(
      category.children || [],
      targetValue,
      category._id ? [...ancestors, category._id] : ancestors
    );

    if (found.length > 0) return found;
  }

  return [];
}

function getTitle(filter: ProductFilter, selectedCategory?: AdminCategoryRecord | null) {
  if (selectedCategory?.name) return selectedCategory.name;
  if (filter.danhMuc) return formatCategoryPath(filter.danhMuc) || filter.danhMuc;
  if (filter.gioiTinh === 'nam') return 'Thời trang Nam';
  if (filter.gioiTinh === 'nu') return 'Thời trang Nữ';
  if (filter.gioiTinh === 'unisex') return 'Thời trang Unisex';
  if (filter.timKiem) return `Kết quả tìm kiếm: "${filter.timKiem}"`;
  if (filter.khuyenMai) return 'Sản phẩm đang sale';
  if (filter.sapXep === 'ban_chay') return 'Sản phẩm bán chạy';
  if (filter.sapXep === 'moi_nhat') return 'Sản phẩm mới về';

  return 'Tất cả sản phẩm';
}

function getSortLabel(sort?: ProductFilter['sapXep']) {
  switch (sort) {
    case 'ban_chay':
      return 'Bán chạy';
    case 'moi_nhat':
      return 'Mới nhất';
    case 'gia_tang':
      return 'Giá tăng dần';
    case 'gia_giam':
      return 'Giá giảm dần';
    default:
      return '';
  }
}

function getPriceLabel(filter: ProductFilter) {
  const matched = priceRanges.find(
    (range) => filter.giaMin === range.min && filter.giaMax === range.max
  );

  return matched?.label || '';
}

function getDefaultCartInfo(product: any) {
  const firstAvailableVariant =
    product?.bienThe?.find((variant: any) =>
      variant?.kichThuoc?.some((size: any) => Number(size.stock || 0) > 0)
    ) ||
    product?.bienThe?.[0] ||
    product?.variants?.find((variant: any) =>
      variant?.sizes?.some((size: any) => Number(size.stock || 0) > 0)
    ) ||
    product?.variants?.[0] ||
    null;

  const firstAvailableSize =
    firstAvailableVariant?.kichThuoc?.find(
      (size: any) => Number(size.stock || 0) > 0
    ) ||
    firstAvailableVariant?.sizes?.find(
      (size: any) => Number(size.stock || 0) > 0
    ) ||
    null;

  const variantId =
    firstAvailableVariant?.id ||
    firstAvailableVariant?._id ||
    product?.defaultVariantId ||
    product?.variantId ||
    '';

  const color =
    firstAvailableVariant?.mau ||
    firstAvailableVariant?.color ||
    product?.defaultColor ||
    product?.mauSac?.[0]?.ten ||
    '';

  const size =
    firstAvailableSize?.size ||
    product?.defaultSize ||
    '';

  const price =
    Number(firstAvailableSize?.finalPrice || 0) ||
    Number(firstAvailableSize?.discountPrice || 0) ||
    Number(firstAvailableSize?.price || 0) ||
    Number(product?.defaultPrice || 0) ||
    Number(product?.gia || 0);

  const stock = Number(firstAvailableSize?.stock || 0);

  return {
    variantId: String(variantId),
    color: String(color),
    size: String(size),
    price,
    stock,
    image: product?.hinhAnh || '/placeholder.svg',
  };
}

type CategoryTreeFilterProps = {
  categories: AdminCategoryRecord[];
  selectedValue?: string;
  loading?: boolean;
  onSelect: (category: AdminCategoryRecord | null) => void;
};

function CategoryTreeFilter({
  categories,
  selectedValue,
  loading,
  onSelect,
}: CategoryTreeFilterProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ancestorIds = getAncestorIds(categories, selectedValue);

    if (!ancestorIds.length) return;

    setExpandedIds((prev) => {
      const next = new Set(prev);

      ancestorIds.forEach((id) => {
        next.add(id);
      });

      return next;
    });
  }, [categories, selectedValue]);

  const toggleExpand = (categoryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  };

  const renderNode = (category: AdminCategoryRecord, depth = 0) => {
    const children = Array.isArray(category.children) ? category.children : [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(category._id);
    const isSelected =
      selectedValue === category.slug ||
      selectedValue === category._id ||
      selectedValue === category.path;

    return (
      <div key={category._id}>
        <div
          className={[
            'flex items-center gap-2 rounded-md py-1.5 text-sm transition hover:bg-muted/60',
            isSelected ? 'bg-muted font-semibold text-foreground' : 'text-foreground/80',
          ].join(' ')}
          style={{ paddingLeft: `${depth * 14}px` }}
        >
          <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-background"
            onClick={(event) => {
              event.stopPropagation();

              if (hasChildren) {
                toggleExpand(category._id);
              }
            }}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )
            ) : (
              <span className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
            onClick={() => {
              if (hasChildren) {
                if (isSelected) {
                  toggleExpand(category._id);
                  return;
                }

                onSelect(category);

                setExpandedIds((prev) => {
                  const next = new Set(prev);
                  next.add(category._id);
                  return next;
                });

                return;
              }

              if (isSelected) {
                return;
              }

              onSelect(category);
            }}
          >
            <span className="line-clamp-1">{category.name}</span>

            {!hasChildren && typeof category.productCount === 'number' && category.productCount > 0 ? (
              <span className="shrink-0 text-xs text-muted-foreground">
                {category.productCount}
              </span>
            ) : null}
          </button>
        </div>

        {hasChildren && isExpanded ? (
          <div className="mt-0.5">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Đang tải danh mục...
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Chưa có danh mục.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((category) => renderNode(category))}
    </div>
  );
}

function FilterPanel({
  filter,
  setFilter,
  categoryTree,
  selectedCategory,
  loadingCategories,
}: {
  filter: ProductFilter;
  setFilter: (f: ProductFilter) => void;
  categoryTree: AdminCategoryRecord[];
  selectedCategory: AdminCategoryRecord | null;
  loadingCategories: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Danh mục</h3>

        <CategoryTreeFilter
          categories={categoryTree}
          selectedValue={filter.danhMuc}
          loading={loadingCategories}
          onSelect={(category) =>
            setFilter({
              ...filter,
              danhMuc: category?.slug || undefined,
              gioiTinh: undefined,
            })
          }
        />

        {selectedCategory ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Đang lọc: {formatCategoryPath(selectedCategory.path) || selectedCategory.name}
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Khuyến mãi</h3>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={!!filter.khuyenMai}
            onCheckedChange={(checked) =>
              setFilter({
                ...filter,
                khuyenMai: checked ? true : undefined,
              })
            }
          />
          Đang sale
        </label>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Khoảng giá</h3>

        <div className="space-y-2">
          {priceRanges.map((range) => (
            <label
              key={range.label}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={filter.giaMin === range.min && filter.giaMax === range.max}
                onCheckedChange={(checked) =>
                  setFilter({
                    ...filter,
                    giaMin: checked ? range.min : undefined,
                    giaMax: checked ? range.max : undefined,
                  })
                }
              />
              {range.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Màu sắc</h3>

        <div className="grid grid-cols-2 gap-2">
          {colors.map((color) => (
            <label
              key={color}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={filter.mauSac?.includes(color)}
                onCheckedChange={(checked) => {
                  const current = filter.mauSac || [];

                  setFilter({
                    ...filter,
                    mauSac: checked
                      ? [...current, color]
                      : current.filter((item) => item !== color),
                  });
                }}
              />
              {color}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Kích cỡ</h3>

        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => {
            const active = filter.kichCo?.includes(size);

            return (
              <button
                key={size}
                type="button"
                onClick={() => {
                  const current = filter.kichCo || [];

                  setFilter({
                    ...filter,
                    kichCo: active
                      ? current.filter((item) => item !== size)
                      : [...current, size],
                  });
                }}
                className={[
                  'rounded-md border px-2 py-1.5 text-xs font-medium transition',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:bg-muted',
                ].join(' ')}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Badge({
  filter,
  onRemove,
}: {
  filter: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
      {filter}
      <button type="button" onClick={onRemove}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function ProductListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<SanPham[]>([]);
  const [categoryTree, setCategoryTree] = useState<AdminCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [filter, setFilterState] = useState<ProductFilter>(() =>
    parseFilterFromSearchParams(searchParams)
  );

  const { addItem } = useCart();
  const {
    addItem: addWishlist,
    removeItem: removeWishlist,
    isInWishlist,
  } = useWishlist();

  const updateFilter = (nextFilter: ProductFilter) => {
    const cleanedFilter: ProductFilter = {
      ...nextFilter,
      danhMucIds: undefined,
    };

    setFilterState(cleanedFilter);
    setSearchParams(buildSearchParamsFromFilter(cleanedFilter), { replace: false });
  };

  useEffect(() => {
    setFilterState(parseFilterFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setLoadingCategories(true);

        const data = await productService.getCategoryTree();

        if (!cancelled) {
          setCategoryTree(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Load category tree error:', error);

        if (!cancelled) {
          setCategoryTree([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(() => {
    return findCategoryBySlugOrId(categoryTree, filter.danhMuc);
  }, [categoryTree, filter.danhMuc]);

  const selectedCategoryIds = useMemo(() => {
    return collectCategoryIds(selectedCategory);
  }, [selectedCategory]);

  const effectiveFilter = useMemo<ProductFilter>(() => {
    if (selectedCategoryIds.length > 0) {
      return {
        ...filter,
        danhMucIds: selectedCategoryIds,
      };
    }

    return filter;
  }, [filter, selectedCategoryIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      if (filter.danhMuc && loadingCategories) {
        setLoading(true);
        return;
      }

      try {
        setLoading(true);

        const data = await productService.getAll(effectiveFilter);

        if (!cancelled) {
          setProducts(data);
        }
      } catch (error) {
        console.error('Load products error:', error);

        if (!cancelled) {
          setProducts([]);
          toast.error('Không thể tải danh sách sản phẩm');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [effectiveFilter, filter.danhMuc, loadingCategories]);

  const title = getTitle(filter, selectedCategory);
  const priceLabel = getPriceLabel(filter);

  const handleAddToCart = (product: SanPham) => {
    const cartInfo = getDefaultCartInfo(product);

    if (!cartInfo.variantId || !cartInfo.size) {
      toast.info('Vui lòng vào chi tiết sản phẩm để chọn màu và size');
      return;
    }

    if (Number(product.soLuongTon || 0) <= 0 || Number(cartInfo.stock || 0) <= 0) {
      toast.error('Sản phẩm hiện đã hết hàng');
      return;
    }

    addItem(product, cartInfo.size, cartInfo.color, 1, {
      variantId: cartInfo.variantId,
      price: cartInfo.price,
      image: cartInfo.image,
      stock: cartInfo.stock,
    });
  };

  const resetFilter = () => updateFilter({});

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{title}</span>
        </nav>

        <div className="flex gap-8">
          <aside className="hidden w-64 shrink-0 lg:block">
            <h2 className="mb-4 text-lg font-semibold">Bộ lọc</h2>
            <FilterPanel
              filter={filter}
              setFilter={updateFilter}
              categoryTree={categoryTree}
              selectedCategory={selectedCategory}
              loadingCategories={loadingCategories}
            />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">
                  {products.length} sản phẩm
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                      Bộ lọc
                    </Button>
                  </SheetTrigger>

                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <SheetTitle>Bộ lọc</SheetTitle>
                    <div className="mt-4">
                      <FilterPanel
                        filter={filter}
                        setFilter={updateFilter}
                        categoryTree={categoryTree}
                        selectedCategory={selectedCategory}
                        loadingCategories={loadingCategories}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select
                  value={filter.sapXep || undefined}
                  onValueChange={(value) =>
                    updateFilter({
                      ...filter,
                      sapXep: value as ProductFilter['sapXep'],
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-40 text-sm">
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

            {(filter.danhMuc ||
              filter.gioiTinh ||
              filter.khuyenMai ||
              filter.sapXep ||
              filter.mauSac?.length ||
              filter.kichCo?.length ||
              filter.giaMin !== undefined ||
              filter.giaMax !== undefined) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {filter.danhMuc && (
                  <Badge
                    filter={selectedCategory?.name || filter.danhMuc}
                    onRemove={() =>
                      updateFilter({
                        ...filter,
                        danhMuc: undefined,
                        danhMucIds: undefined,
                      })
                    }
                  />
                )}

                {filter.gioiTinh && (
                  <Badge
                    filter={
                      filter.gioiTinh === 'nam'
                        ? 'Nam'
                        : filter.gioiTinh === 'nu'
                          ? 'Nữ'
                          : 'Unisex'
                    }
                    onRemove={() => updateFilter({ ...filter, gioiTinh: undefined })}
                  />
                )}

                {filter.khuyenMai && (
                  <Badge
                    filter="Đang sale"
                    onRemove={() => updateFilter({ ...filter, khuyenMai: undefined })}
                  />
                )}

                {priceLabel && (
                  <Badge
                    filter={priceLabel}
                    onRemove={() =>
                      updateFilter({
                        ...filter,
                        giaMin: undefined,
                        giaMax: undefined,
                      })
                    }
                  />
                )}

                {filter.sapXep && (
                  <Badge
                    filter={getSortLabel(filter.sapXep)}
                    onRemove={() => updateFilter({ ...filter, sapXep: undefined })}
                  />
                )}

                {(filter.mauSac || []).map((color) => (
                  <Badge
                    key={color}
                    filter={color}
                    onRemove={() =>
                      updateFilter({
                        ...filter,
                        mauSac: (filter.mauSac || []).filter((item) => item !== color),
                      })
                    }
                  />
                ))}

                {(filter.kichCo || []).map((size) => (
                  <Badge
                    key={size}
                    filter={size}
                    onRemove={() =>
                      updateFilter({
                        ...filter,
                        kichCo: (filter.kichCo || []).filter((item) => item !== size),
                      })
                    }
                  />
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground"
                  onClick={resetFilter}
                >
                  Xóa tất cả
                </Button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-lg border border-border bg-card"
                  >
                    <div className="aspect-[3/4] bg-secondary" />
                    <div className="space-y-2 p-3">
                      <div className="h-4 w-3/4 rounded bg-secondary" />
                      <div className="h-3 w-1/2 rounded bg-secondary" />
                      <div className="h-4 w-1/3 rounded bg-secondary" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Không tìm thấy sản phẩm nào
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={resetFilter}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={(item) =>
                      isInWishlist(item.id)
                        ? removeWishlist(item.id)
                        : addWishlist(item)
                    }
                    isWishlisted={isInWishlist(product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}