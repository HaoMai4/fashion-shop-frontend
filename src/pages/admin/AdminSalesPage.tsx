import { useEffect, useMemo, useState } from 'react';
import { Edit, Package, Plus, RefreshCw, Save, X } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    productService,
    type AdminCategoryRecord,
    type AdminProductRecord,
    type AdminVariantRecord,
    type AdminVariantSizeRecord,
} from '@/services/api/productService';
import { formatPrice } from '@/utils/format';
import { toast } from 'sonner';

type SaleStatusFilter = 'all' | 'on_sale' | 'not_sale';

type SaleRow = {
    rowKey: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string;
    categoryId: string;
    categoryName: string;
    variantId: string;
    variantColor: string;
    variantColorCode: string;
    variantImage: string;
    sizeId: string;
    size: string;
    price: number;
    discountPrice: number;
    discountPercent: number;
    onSale: boolean;
    saleStartAt: string | null;
    saleEndAt: string | null;
    saleNote: string;
    stock: number;
};

type SaleProductGroup = {
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string;
    categoryId: string;
    categoryName: string;
    rows: SaleRow[];
    totalSizeCount: number;
    saleSizeCount: number;
    totalStock: number;
    minPrice: number;
    minSalePrice: number;
    maxDiscountPercent: number;
};

type SaleVariantGroup = {
    variantKey: string;
    variantId: string;
    variantColor: string;
    variantColorCode: string;
    variantImage: string;
    rows: SaleRow[];
};

type SaleEditForm = {
    price: string;
    discountPrice: string;
    discountPercent: string;
    stock: string;
    saleStartAt: string;
    saleEndAt: string;
    saleNote: string;
};

function onlyDigits(value: string | number) {
    return String(value || '').replace(/[^\d]/g, '');
}

function formatNumberInput(value: string | number) {
    const digits = onlyDigits(value);
    if (!digits) return '';

    return Number(digits).toLocaleString('vi-VN');
}

function parseNumberInput(value: string | number) {
    const digits = onlyDigits(value);
    return digits ? Number(digits) : 0;
}

function toDateTimeLocalValue(value?: string | Date | null) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
}

function dateTimeLocalToISOString(value: string) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
}

function getFutureDateTimeLocal(hours: number) {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return toDateTimeLocalValue(date);
}

function normalizeText(value: string) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function getCategoryIdValue(product: AdminProductRecord) {
    if (product.categoryId && typeof product.categoryId === 'object') {
        return product.categoryId._id || '';
    }

    return typeof product.categoryId === 'string' ? product.categoryId : '';
}

function getCategoryName(
    product: AdminProductRecord,
    categories: AdminCategoryRecord[] = []
) {
    if (product.categoryId && typeof product.categoryId === 'object') {
        return product.categoryId.name || 'Chưa rõ';
    }

    if (typeof product.categoryId === 'string') {
        const matched = categories.find((item) => item._id === product.categoryId);
        return matched?.name || product.categoryId;
    }

    return 'Chưa rõ';
}

function getProductImage(product: AdminProductRecord) {
    const defaultVariant = product.defaultVariant;
    if (defaultVariant?.images?.[0]) return defaultVariant.images[0];

    const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
    if (firstVariant?.images?.[0]) return firstVariant.images[0];

    return '/placeholder.svg';
}

function getVariantSizes(variant: AdminVariantRecord) {
    return Array.isArray(variant.sizes) ? variant.sizes : [];
}

function getVariantImage(variant: AdminVariantRecord, fallbackImage: string) {
    if (Array.isArray(variant.images) && variant.images[0]) {
        return variant.images[0];
    }

    return fallbackImage || '/placeholder.svg';
}

function isSaleRow(row: SaleRow) {
    return row.discountPrice > 0 && row.discountPrice < row.price;
}

function getDiscountPercent(price: number, discountPrice: number) {
    if (!price || !discountPrice || discountPrice >= price) return 0;

    return Math.round(((price - discountPrice) / price) * 100);
}

function SaleStatusBadge({ isOnSale }: { isOnSale: boolean }) {
    if (isOnSale) {
        return (
            <span className="inline-flex whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                Đang sale
            </span>
        );
    }

    return (
        <span className="inline-flex whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            Chưa sale
        </span>
    );
}

function flattenSaleRows(
    products: AdminProductRecord[],
    categories: AdminCategoryRecord[]
): SaleRow[] {
    return products.flatMap((product) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        const productImage = getProductImage(product);
        const categoryId = getCategoryIdValue(product);
        const categoryName = getCategoryName(product, categories);

        return variants.flatMap((variant, variantIndex) => {
            const variantId = variant._id || '';
            const sizes = getVariantSizes(variant);
            const variantImage = getVariantImage(variant, productImage);

            return sizes.map((sizeItem: AdminVariantSizeRecord, sizeIndex) => {
                const sizeId = sizeItem._id || '';
                const rowKey = `${product._id}:${variantId || variantIndex}:${sizeId || sizeIndex}`;

                return {
                    rowKey,
                    productId: product._id,
                    productName: product.name || '',
                    productSlug: product.slug || '',
                    productImage,
                    categoryId,
                    categoryName,
                    variantId,
                    variantColor: variant.color || '',
                    variantColorCode: variant.colorCode || '#000000',
                    variantImage,
                    sizeId,
                    size: sizeItem.size || '',
                    price: Number(sizeItem.price || 0),
                    discountPrice: Number(sizeItem.discountPrice || 0),
                    discountPercent: Number(sizeItem.discountPercent || 0),
                    onSale: Boolean(sizeItem.onSale),
                    saleStartAt: sizeItem.saleStartAt || null,
                    saleEndAt: sizeItem.saleEndAt || null,
                    saleNote: sizeItem.saleNote || '',
                    stock: Number(sizeItem.stock || 0),
                };
            });
        });
    });
}

function groupRowsByProduct(rows: SaleRow[]): SaleProductGroup[] {
    const map = new Map<string, SaleRow[]>();

    rows.forEach((row) => {
        const current = map.get(row.productId) || [];
        current.push(row);
        map.set(row.productId, current);
    });

    return Array.from(map.entries()).map(([productId, productRows]) => {
        const first = productRows[0];
        const saleRows = productRows.filter(isSaleRow);

        const prices = productRows
            .map((row) => row.price)
            .filter((price) => price > 0);

        const salePrices = saleRows
            .map((row) => row.discountPrice)
            .filter((price) => price > 0);

        const discountPercents = saleRows.map((row) =>
            getDiscountPercent(row.price, row.discountPrice)
        );

        return {
            productId,
            productName: first.productName,
            productSlug: first.productSlug,
            productImage: first.productImage,
            categoryId: first.categoryId,
            categoryName: first.categoryName,
            rows: productRows,
            totalSizeCount: productRows.length,
            saleSizeCount: saleRows.length,
            totalStock: productRows.reduce((sum, row) => sum + row.stock, 0),
            minPrice: prices.length ? Math.min(...prices) : 0,
            minSalePrice: salePrices.length ? Math.min(...salePrices) : 0,
            maxDiscountPercent: discountPercents.length ? Math.max(...discountPercents) : 0,
        };
    });
}

function groupRowsByVariant(rows: SaleRow[]): SaleVariantGroup[] {
    const map = new Map<string, SaleRow[]>();

    rows.forEach((row) => {
        const key = row.variantId || `${row.productId}:${row.variantColor}`;
        const current = map.get(key) || [];
        current.push(row);
        map.set(key, current);
    });

    return Array.from(map.entries()).map(([variantKey, variantRows]) => {
        const first = variantRows[0];

        return {
            variantKey,
            variantId: first.variantId,
            variantColor: first.variantColor,
            variantColorCode: first.variantColorCode,
            variantImage: first.variantImage,
            rows: variantRows,
        };
    });
}

export default function AdminSalesPage() {
    const [products, setProducts] = useState<AdminProductRecord[]>([]);
    const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const [keyword, setKeyword] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');
    const [statusFilter, setStatusFilter] = useState<SaleStatusFilter>('on_sale');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
    const [savingRowKey, setSavingRowKey] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<SaleEditForm>({
        price: '',
        discountPrice: '',
        discountPercent: '',
        stock: '',
        saleStartAt: '',
        saleEndAt: '',
        saleNote: '',
    });

    const fetchProducts = async () => {
        setLoading(true);

        try {
            const res = await productService.getAdminProducts();
            setProducts(Array.isArray(res?.data) ? res.data : []);
        } catch (error: any) {
            console.error('getAdminProducts error:', error);
            toast.error(error?.message || 'Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setLoadingCategories(true);

        try {
            const res = await productService.getCategories();
            setCategories(Array.isArray(res) ? res : []);
        } catch (error: any) {
            console.error('getCategories error:', error);
            toast.error(error?.message || 'Không thể tải danh mục');
        } finally {
            setLoadingCategories(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const saleRows = useMemo(
        () => flattenSaleRows(products, categories),
        [products, categories]
    );

    const productGroups = useMemo(() => groupRowsByProduct(saleRows), [saleRows]);

    const filteredProductGroups = useMemo(() => {
        const q = normalizeText(keyword);

        return productGroups.filter((group) => {
            const matchesCategory =
                selectedCategoryId === 'all' || group.categoryId === selectedCategoryId;

            const groupOnSale = group.saleSizeCount > 0;

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'on_sale' && groupOnSale) ||
                (statusFilter === 'not_sale' && !groupOnSale);

            const searchable = normalizeText(
                [
                    group.productName,
                    group.productSlug,
                    group.categoryName,
                    ...group.rows.flatMap((row) => [row.variantColor, row.size]),
                ].join(' ')
            );

            const matchesKeyword = !q || searchable.includes(q);

            return matchesCategory && matchesStatus && matchesKeyword;
        });
    }, [productGroups, keyword, selectedCategoryId, statusFilter]);

    const selectedProductGroup = useMemo(() => {
        if (!selectedProductId) return null;
        return productGroups.find((group) => group.productId === selectedProductId) || null;
    }, [productGroups, selectedProductId]);

    const selectedVariantGroups = useMemo(() => {
        if (!selectedProductGroup) return [];
        return groupRowsByVariant(selectedProductGroup.rows);
    }, [selectedProductGroup]);

    const saleProductCount = productGroups.filter((group) => group.saleSizeCount > 0).length;
    const notSaleProductCount = productGroups.length - saleProductCount;
    const saleSizeCount = saleRows.filter(isSaleRow).length;

    const resetEditState = () => {
        setEditingRowKey(null);
        setEditForm({
            price: '',
            discountPrice: '',
            discountPercent: '',
            stock: '',
            saleStartAt: '',
            saleEndAt: '',
            saleNote: '',
        });
    };

    const handleOpenEdit = (row: SaleRow) => {
        if (!row.variantId || !row.sizeId) {
            toast.error('Dòng size này thiếu variantId hoặc sizeId, không thể chỉnh sale');
            return;
        }

        setEditingRowKey(row.rowKey);
        setEditForm({
            price: row.price ? String(row.price) : '',
            discountPrice: row.discountPrice ? String(row.discountPrice) : '',
            discountPercent:
                row.discountPercent > 0
                    ? String(row.discountPercent)
                    : row.discountPrice
                        ? String(getDiscountPercent(row.price, row.discountPrice))
                        : '',
            stock: String(row.stock || 0),
            saleStartAt: toDateTimeLocalValue(row.saleStartAt),
            saleEndAt: toDateTimeLocalValue(row.saleEndAt),
            saleNote: row.saleNote || '',
        });
    };

    const handleCancelEdit = () => {
        if (savingRowKey) return;
        resetEditState();
    };

    const handleSelectProduct = (group: SaleProductGroup) => {
        setSelectedProductId(group.productId);
        resetEditState();
    };

    const handleClosePopup = () => {
        if (savingRowKey) return;
        setSelectedProductId(null);
        resetEditState();
    };

    const handleAddSale = () => {
        setStatusFilter('not_sale');
        setSelectedProductId(null);
        resetEditState();

        toast.info('Đã chuyển sang danh sách sản phẩm chưa sale. Chọn một sản phẩm để set sale.');
    };

    const handlePriceChange = (value: string) => {
        const nextPrice = onlyDigits(value);
        const priceNumber = parseNumberInput(nextPrice);
        const percentNumber = Number(onlyDigits(editForm.discountPercent || ''));

        setEditForm((prev) => {
            let nextDiscountPrice = prev.discountPrice;

            if (priceNumber > 0 && percentNumber > 0) {
                const calculated = Math.round((priceNumber * (100 - percentNumber)) / 100);
                nextDiscountPrice = String(calculated);
            }

            return {
                ...prev,
                price: nextPrice,
                discountPrice: nextDiscountPrice,
            };
        });
    };

    const handleDiscountPriceChange = (value: string) => {
        const nextDiscountPrice = onlyDigits(value);
        const priceNumber = parseNumberInput(editForm.price);
        const discountNumber = parseNumberInput(nextDiscountPrice);

        const nextPercent =
            priceNumber > 0 && discountNumber > 0 && discountNumber < priceNumber
                ? String(getDiscountPercent(priceNumber, discountNumber))
                : '';

        setEditForm((prev) => ({
            ...prev,
            discountPrice: nextDiscountPrice,
            discountPercent: nextPercent,
        }));
    };

    const handleDiscountPercentChange = (value: string) => {
        const raw = onlyDigits(value);
        const percent = Math.min(Number(raw || 0), 99);
        const priceNumber = parseNumberInput(editForm.price);

        const discountPrice =
            priceNumber > 0 && percent > 0
                ? Math.round((priceNumber * (100 - percent)) / 100)
                : 0;

        setEditForm((prev) => ({
            ...prev,
            discountPercent: percent ? String(percent) : '',
            discountPrice: discountPrice ? String(discountPrice) : '',
        }));
    };

    const handleQuickSaleTime = (hours: number, note: string) => {
        setEditForm((prev) => ({
            ...prev,
            saleStartAt: toDateTimeLocalValue(new Date()),
            saleEndAt: getFutureDateTimeLocal(hours),
            saleNote: note,
        }));
    };

    const handleUnlimitedSaleTime = () => {
        setEditForm((prev) => ({
            ...prev,
            saleStartAt: '',
            saleEndAt: '',
            saleNote: 'Sale không giới hạn thời gian',
        }));
    };

    const handleSaveSale = async (row: SaleRow) => {
        const price = parseNumberInput(editForm.price);
        const discountPrice = parseNumberInput(editForm.discountPrice);
        const stock = Number(onlyDigits(editForm.stock)) || 0;
        const discountPercent = Number(onlyDigits(editForm.discountPercent)) || 0;
        const isOnSale = discountPrice > 0 && discountPrice < price;

        if (!row.variantId || !row.sizeId) {
            toast.error('Không tìm thấy variantId hoặc sizeId');
            return;
        }

        if (!row.size) {
            toast.error('Size không hợp lệ');
            return;
        }

        if (price <= 0) {
            toast.error('Giá gốc phải lớn hơn 0');
            return;
        }

        if (discountPrice > 0 && discountPrice >= price) {
            toast.error('Giá giảm phải nhỏ hơn giá gốc');
            return;
        }

        setSavingRowKey(row.rowKey);

        try {
            const res: any = await productService.updateVariantSize(row.variantId, row.sizeId, {
                size: row.size,
                price,
                discountPrice,
                discountPercent,
                onSale: isOnSale,
                saleStartAt: dateTimeLocalToISOString(editForm.saleStartAt),
                saleEndAt: dateTimeLocalToISOString(editForm.saleEndAt),
                saleNote: editForm.saleNote.trim(),
                stock,
            });

            toast.success(res?.message || 'Đã cập nhật sale');
            await fetchProducts();
            resetEditState();
        } catch (error: any) {
            console.error('update sale error:', error);
            toast.error(error?.message || 'Không thể cập nhật sale');
        } finally {
            setSavingRowKey(null);
        }
    };

    const handleTurnOffSale = async (row: SaleRow) => {
        if (!row.variantId || !row.sizeId) {
            toast.error('Không tìm thấy variantId hoặc sizeId');
            return;
        }

        const confirmed = window.confirm(
            `Tắt sale cho ${row.productName} - ${row.variantColor} - size ${row.size}?`
        );

        if (!confirmed) return;

        setSavingRowKey(row.rowKey);

        try {
            const res: any = await productService.updateVariantSize(row.variantId, row.sizeId, {
                size: row.size,
                price: row.price,
                discountPrice: 0,
                discountPercent: 0,
                onSale: false,
                saleStartAt: null,
                saleEndAt: null,
                saleNote: '',
                stock: row.stock,
            });

            toast.success(res?.message || 'Đã tắt sale');
            await fetchProducts();

            if (editingRowKey === row.rowKey) {
                resetEditState();
            }
        } catch (error: any) {
            console.error('turn off sale error:', error);
            toast.error(error?.message || 'Không thể tắt sale');
        } finally {
            setSavingRowKey(null);
        }
    };

    return (
        <MainLayout>
            <div className="container mx-auto max-w-7xl px-4 py-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">Quản lý sale</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Quản lý sản phẩm đang sale và set giá giảm theo từng size trong biến thể.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={fetchProducts}
                            disabled={loading}
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tải lại
                        </Button>

                        <Button className="gap-2" onClick={handleAddSale}>
                            <Plus className="h-4 w-4" />
                            Thêm sản phẩm sale
                        </Button>
                    </div>
                </div>

                <div className="mb-4 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
                            <p className="mt-1 text-2xl font-bold">{productGroups.length}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">Sản phẩm đang sale</p>
                            <p className="mt-1 text-2xl font-bold">{saleProductCount}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">Sản phẩm chưa sale</p>
                            <p className="mt-1 text-2xl font-bold">{notSaleProductCount}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">Size đang sale</p>
                            <p className="mt-1 text-2xl font-bold">{saleSizeCount}</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-base">Danh sách sản phẩm</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Hiển thị {filteredProductGroups.length} / {productGroups.length} sản phẩm
                                </p>
                            </div>

                            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                                <Input
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="Tìm sản phẩm, màu, size..."
                                    className="w-full sm:w-72"
                                />

                                <select
                                    value={selectedCategoryId}
                                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-[190px]"
                                    disabled={loadingCategories}
                                >
                                    <option value="all">Tất cả danh mục</option>
                                    {categories.map((category) => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as SaleStatusFilter)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-[170px]"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="on_sale">Đang sale</option>
                                    <option value="not_sale">Chưa sale</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {loading ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                Đang tải danh sách sale...
                            </div>
                        ) : filteredProductGroups.length === 0 ? (
                            <div className="py-12 text-center">
                                <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground">
                                    Không có sản phẩm phù hợp
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[70px]">STT</TableHead>
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead>Danh mục</TableHead>
                                            <TableHead>Size sale</TableHead>
                                            <TableHead>Giá gốc từ</TableHead>
                                            <TableHead>Giá sale từ</TableHead>
                                            <TableHead>Giảm cao nhất</TableHead>
                                            <TableHead>Tồn kho</TableHead>
                                            <TableHead className="min-w-[110px]">Trạng thái</TableHead>
                                            <TableHead className="w-[170px] text-center">Thao tác</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {filteredProductGroups.map((group, index) => {
                                            const groupOnSale = group.saleSizeCount > 0;

                                            return (
                                                <TableRow key={group.productId}>
                                                    <TableCell className="font-medium text-muted-foreground">
                                                        {index + 1}
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={group.productImage}
                                                                alt={group.productName}
                                                                className="h-14 w-14 rounded-lg border object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = '/placeholder.svg';
                                                                }}
                                                            />

                                                            <div className="min-w-0">
                                                                <p className="line-clamp-1 font-medium">
                                                                    {group.productName}
                                                                </p>
                                                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                                                    /{group.productSlug}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>{group.categoryName}</TableCell>
                                                    <TableCell>
                                                        {group.saleSizeCount} / {group.totalSizeCount}
                                                    </TableCell>
                                                    <TableCell>{formatPrice(group.minPrice)}</TableCell>
                                                    <TableCell>
                                                        {group.minSalePrice
                                                            ? formatPrice(group.minSalePrice)
                                                            : 'Chưa sale'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {group.maxDiscountPercent > 0
                                                            ? `-${group.maxDiscountPercent}%`
                                                            : 'Không có'}
                                                    </TableCell>
                                                    <TableCell>{group.totalStock}</TableCell>
                                                    <TableCell>
                                                        <SaleStatusBadge isOnSale={groupOnSale} />
                                                    </TableCell>

                                                    <TableCell className="text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1 whitespace-nowrap"
                                                            onClick={() => handleSelectProduct(group)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                            Quản lý sale
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {selectedProductGroup ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
                        <div className="max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-2xl">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={selectedProductGroup.productImage}
                                        alt={selectedProductGroup.productName}
                                        className="h-16 w-16 rounded-xl border object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = '/placeholder.svg';
                                        }}
                                    />

                                    <div>
                                        <h2 className="text-lg font-bold">
                                            Quản lý sale: {selectedProductGroup.productName}
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {selectedProductGroup.categoryName} ·{' '}
                                            {selectedProductGroup.saleSizeCount} /{' '}
                                            {selectedProductGroup.totalSizeCount} size đang sale
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClosePopup}
                                    disabled={!!savingRowKey}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="max-h-[calc(88vh-96px)] overflow-y-auto p-5">
                                <div className="space-y-5">
                                    {selectedVariantGroups.map((variantGroup) => (
                                        <div key={variantGroup.variantKey} className="rounded-xl border p-4">
                                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                                <img
                                                    src={variantGroup.variantImage}
                                                    alt={variantGroup.variantColor || 'variant'}
                                                    className="h-16 w-16 rounded-xl border object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/placeholder.svg';
                                                    }}
                                                />

                                                <span
                                                    className="h-5 w-5 rounded-full border"
                                                    style={{ backgroundColor: variantGroup.variantColorCode }}
                                                />

                                                <div>
                                                    <p className="font-medium">
                                                        Biến thể: {variantGroup.variantColor || 'Chưa có màu'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {variantGroup.rows.length} size
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto rounded-lg border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Size</TableHead>
                                                            <TableHead>Giá gốc</TableHead>
                                                            <TableHead>Giá giảm</TableHead>
                                                            <TableHead>% giảm</TableHead>
                                                            <TableHead>Tồn kho</TableHead>
                                                            <TableHead className="min-w-[260px]">Thời gian sale</TableHead>
                                                            <TableHead className="min-w-[110px]">Trạng thái</TableHead>
                                                            <TableHead className="w-[230px] text-center">
                                                                Thao tác
                                                            </TableHead>
                                                        </TableRow>
                                                    </TableHeader>

                                                    <TableBody>
                                                        {variantGroup.rows.map((row) => {
                                                            const isEditing = editingRowKey === row.rowKey;
                                                            const isSaving = savingRowKey === row.rowKey;
                                                            const rowOnSale = isSaleRow(row);
                                                            const discountPercent = getDiscountPercent(
                                                                row.price,
                                                                row.discountPrice
                                                            );

                                                            return (
                                                                <TableRow key={row.rowKey}>
                                                                    <TableCell className="font-medium">
                                                                        {row.size || 'Chưa có'}
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        {isEditing ? (
                                                                            <Input
                                                                                inputMode="numeric"
                                                                                value={formatNumberInput(editForm.price)}
                                                                                onChange={(e) =>
                                                                                    handlePriceChange(e.target.value)
                                                                                }
                                                                                disabled={isSaving}
                                                                                className="w-32"
                                                                            />
                                                                        ) : (
                                                                            formatPrice(row.price)
                                                                        )}
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        {isEditing ? (
                                                                            <Input
                                                                                inputMode="numeric"
                                                                                value={formatNumberInput(editForm.discountPrice)}
                                                                                onChange={(e) =>
                                                                                    handleDiscountPriceChange(e.target.value)
                                                                                }
                                                                                disabled={isSaving}
                                                                                className="w-32"
                                                                            />
                                                                        ) : row.discountPrice ? (
                                                                            formatPrice(row.discountPrice)
                                                                        ) : (
                                                                            'Không có'
                                                                        )}
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        {isEditing ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <Input
                                                                                    inputMode="numeric"
                                                                                    value={editForm.discountPercent}
                                                                                    onChange={(e) =>
                                                                                        handleDiscountPercentChange(e.target.value)
                                                                                    }
                                                                                    disabled={isSaving}
                                                                                    className="w-20"
                                                                                />
                                                                                <span className="text-sm text-muted-foreground">
                                                                                    %
                                                                                </span>
                                                                            </div>
                                                                        ) : discountPercent > 0 ? (
                                                                            `-${discountPercent}%`
                                                                        ) : (
                                                                            'Không có'
                                                                        )}
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        {isEditing ? (
                                                                            <Input
                                                                                inputMode="numeric"
                                                                                value={editForm.stock}
                                                                                onChange={(e) =>
                                                                                    setEditForm((prev) => ({
                                                                                        ...prev,
                                                                                        stock: onlyDigits(e.target.value),
                                                                                    }))
                                                                                }
                                                                                disabled={isSaving}
                                                                                className="w-24"
                                                                            />
                                                                        ) : (
                                                                            row.stock
                                                                        )}
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        {isEditing ? (
                                                                            <div className="min-w-[250px] space-y-2">
                                                                                <div className="grid gap-2 sm:grid-cols-2">
                                                                                    <Input
                                                                                        type="datetime-local"
                                                                                        value={editForm.saleStartAt}
                                                                                        onChange={(e) =>
                                                                                            setEditForm((prev) => ({
                                                                                                ...prev,
                                                                                                saleStartAt: e.target.value,
                                                                                            }))
                                                                                        }
                                                                                        disabled={isSaving}
                                                                                    />

                                                                                    <Input
                                                                                        type="datetime-local"
                                                                                        value={editForm.saleEndAt}
                                                                                        onChange={(e) =>
                                                                                            setEditForm((prev) => ({
                                                                                                ...prev,
                                                                                                saleEndAt: e.target.value,
                                                                                            }))
                                                                                        }
                                                                                        disabled={isSaving}
                                                                                    />
                                                                                </div>

                                                                                <Input
                                                                                    value={editForm.saleNote}
                                                                                    onChange={(e) =>
                                                                                        setEditForm((prev) => ({
                                                                                            ...prev,
                                                                                            saleNote: e.target.value,
                                                                                        }))
                                                                                    }
                                                                                    placeholder="Ghi chú sale"
                                                                                    disabled={isSaving}
                                                                                />

                                                                                <div className="flex flex-wrap gap-1">
                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => handleQuickSaleTime(2, 'Sale 2h')}
                                                                                        disabled={isSaving}
                                                                                    >
                                                                                        2h
                                                                                    </Button>

                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => handleQuickSaleTime(6, 'Sale 6h')}
                                                                                        disabled={isSaving}
                                                                                    >
                                                                                        6h
                                                                                    </Button>

                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => handleQuickSaleTime(24, 'Sale 24h')}
                                                                                        disabled={isSaving}
                                                                                    >
                                                                                        24h
                                                                                    </Button>

                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        onClick={() => handleQuickSaleTime(24 * 7, 'Sale 7 ngày')}
                                                                                        disabled={isSaving}
                                                                                    >
                                                                                        7 ngày
                                                                                    </Button>

                                                                                    <Button
                                                                                        type="button"
                                                                                        size="sm"
                                                                                        variant="ghost"
                                                                                        onClick={handleUnlimitedSaleTime}
                                                                                        disabled={isSaving}
                                                                                    >
                                                                                        Không giới hạn
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : row.saleStartAt || row.saleEndAt ? (
                                                                            <div className="min-w-[190px] text-xs text-muted-foreground">
                                                                                <p>
                                                                                    Bắt đầu:{' '}
                                                                                    {row.saleStartAt
                                                                                        ? new Date(row.saleStartAt).toLocaleString('vi-VN')
                                                                                        : 'Không giới hạn'}
                                                                                </p>
                                                                                <p>
                                                                                    Kết thúc:{' '}
                                                                                    {row.saleEndAt
                                                                                        ? new Date(row.saleEndAt).toLocaleString('vi-VN')
                                                                                        : 'Không giới hạn'}
                                                                                </p>
                                                                                {row.saleNote ? <p>Ghi chú: {row.saleNote}</p> : null}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-xs text-muted-foreground">Không giới hạn</span>
                                                                        )}
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        <SaleStatusBadge isOnSale={rowOnSale} />
                                                                    </TableCell>

                                                                    <TableCell className="text-center">
                                                                        {isEditing ? (
                                                                            <div className="flex justify-center gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="gap-1 whitespace-nowrap"
                                                                                    onClick={() => handleSaveSale(row)}
                                                                                    disabled={isSaving}
                                                                                >
                                                                                    <Save className="h-3.5 w-3.5" />
                                                                                    {isSaving ? 'Đang lưu' : 'Lưu'}
                                                                                </Button>

                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="gap-1 whitespace-nowrap"
                                                                                    onClick={handleCancelEdit}
                                                                                    disabled={isSaving}
                                                                                >
                                                                                    <X className="h-3.5 w-3.5" />
                                                                                    Hủy
                                                                                </Button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-center gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    className="gap-1 whitespace-nowrap"
                                                                                    onClick={() => handleOpenEdit(row)}
                                                                                    disabled={!row.variantId || !row.sizeId}
                                                                                >
                                                                                    <Edit className="h-3.5 w-3.5" />
                                                                                    Sửa sale
                                                                                </Button>

                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="destructive"
                                                                                    className="whitespace-nowrap"
                                                                                    onClick={() => handleTurnOffSale(row)}
                                                                                    disabled={!rowOnSale || isSaving}
                                                                                >
                                                                                    Tắt sale
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </MainLayout>
    );
}