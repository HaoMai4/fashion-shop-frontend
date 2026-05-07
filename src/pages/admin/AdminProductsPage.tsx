import { useEffect, useMemo, useState } from 'react';
import { Edit, ImagePlus, Package, Plus, RefreshCw, Trash2, X } from 'lucide-react';
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
import { formatDate, formatPrice } from '@/utils/format';
import { toast } from 'sonner';

type ProductFormMode = 'create' | 'edit';

type AdminProductSortMode =
  | 'default'
  | 'name_asc'
  | 'price_asc'
  | 'price_desc'
  | 'created_desc';

type ProductForm = {
  name: string;
  slug: string;
  shortDescription: string;
  brand: string;
  categoryId: string;
  gender: 'nam' | 'nu' | 'unisex';
  material: string;
  tagsText: string;
};

type VariantSizeForm = {
  size: string;
  price: string;
  discountPrice: string;
  stock: string;
};

type CreateVariantForm = {
  productId: string;
  productName: string;
  color: string;
  colorCode: string;
  images: File[];
  sizes: VariantSizeForm[];
};

type EditVariantForm = {
  color: string;
  colorCode: string;
  images: File[];
};

function slugify(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

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

function handleMoneyInputChange(
  value: string,
  onChange: (nextValue: string) => void
) {
  onChange(onlyDigits(value));
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

function getCategoryIdValue(product: AdminProductRecord) {
  if (product.categoryId && typeof product.categoryId === 'object') {
    return product.categoryId._id || '';
  }

  return typeof product.categoryId === 'string' ? product.categoryId : '';
}

function getProductTagsText(product: AdminProductRecord) {
  return Array.isArray(product.tags) ? product.tags.join(', ') : '';
}

function getProductImage(product: AdminProductRecord) {
  const defaultVariant = product.defaultVariant;
  if (defaultVariant?.images?.[0]) return defaultVariant.images[0];

  const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
  if (firstVariant?.images?.[0]) return firstVariant.images[0];

  return '/placeholder.svg';
}

function getProductPrice(product: AdminProductRecord) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  let minPrice = Number.POSITIVE_INFINITY;

  variants.forEach((variant) => {
    (variant.sizes || []).forEach((size) => {
      const price =
        typeof size.discountPrice === 'number' && size.discountPrice > 0
          ? size.discountPrice
          : size.price || 0;

      if (price > 0 && price < minPrice) {
        minPrice = price;
      }
    });
  });

  return Number.isFinite(minPrice) ? minPrice : 0;
}

function getTotalStock(product: AdminProductRecord) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  return variants.reduce((sum, variant) => {
    return (
      sum +
      (variant.sizes || []).reduce((sizeSum, size) => sizeSum + (size.stock || 0), 0)
    );
  }, 0);
}

function getVariantImages(variant: AdminVariantRecord) {
  return Array.isArray(variant.images) ? variant.images : [];
}

function getVariantSizes(variant: AdminVariantRecord) {
  return Array.isArray(variant.sizes) ? variant.sizes : [];
}

function getVariantCount(product: AdminProductRecord) {
  if (typeof product.variantsCount === 'number') return product.variantsCount;
  return Array.isArray(product.variants) ? product.variants.length : 0;
}

function getSizeId(sizeItem: AdminVariantSizeRecord) {
  return sizeItem._id || '';
}

function buildRowKey(variantId: string, sizeId: string, sizeIndex?: number) {
  return `${variantId}:${sizeId || sizeIndex || 0}`;
}

function mapSizeRecordToForm(sizeItem?: AdminVariantSizeRecord): VariantSizeForm {
  return {
    size: sizeItem?.size || '',
    price:
      typeof sizeItem?.price === 'number' && !Number.isNaN(sizeItem.price)
        ? String(sizeItem.price)
        : '',
    discountPrice:
      typeof sizeItem?.discountPrice === 'number' && !Number.isNaN(sizeItem.discountPrice)
        ? String(sizeItem.discountPrice)
        : '',
    stock:
      typeof sizeItem?.stock === 'number' && !Number.isNaN(sizeItem.stock)
        ? String(sizeItem.stock)
        : '0',
  };
}

const emptyProductForm: ProductForm = {
  name: '',
  slug: '',
  shortDescription: '',
  brand: '',
  categoryId: '',
  gender: 'unisex',
  material: '',
  tagsText: '',
};

const emptyVariantSize: VariantSizeForm = {
  size: '',
  price: '',
  discountPrice: '',
  stock: '',
};

const emptyVariantForm: CreateVariantForm = {
  productId: '',
  productName: '',
  color: '',
  colorCode: '#000000',
  images: [],
  sizes: [{ ...emptyVariantSize }],
};

const emptyEditVariantForm: EditVariantForm = {
  color: '',
  colorCode: '#000000',
  images: [],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [categories, setCategories] = useState<AdminCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [sortMode, setSortMode] = useState<AdminProductSortMode>('default');

  const [showProductForm, setShowProductForm] = useState(false);
  const [productFormMode, setProductFormMode] = useState<ProductFormMode>('create');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const [showVariantManager, setShowVariantManager] = useState(false);
  const [selectedVariantProductId, setSelectedVariantProductId] = useState<string | null>(null);
  const [creatingVariant, setCreatingVariant] = useState(false);
  const [variantForm, setVariantForm] = useState<CreateVariantForm>(emptyVariantForm);
  const [showCreateVariantForm, setShowCreateVariantForm] = useState(false);

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantEditForm, setVariantEditForm] = useState<EditVariantForm>(emptyEditVariantForm);
  const [updatingVariantId, setUpdatingVariantId] = useState<string | null>(null);
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);

  const [editingSizeRowKey, setEditingSizeRowKey] = useState<string | null>(null);
  const [sizeEditForm, setSizeEditForm] = useState<VariantSizeForm>(emptyVariantSize);
  const [savingSizeRowKey, setSavingSizeRowKey] = useState<string | null>(null);
  const [removingSizeRowKey, setRemovingSizeRowKey] = useState<string | null>(null);

  const [newSizeDrafts, setNewSizeDrafts] = useState<Record<string, VariantSizeForm>>({});
  const [addingSizeVariantId, setAddingSizeVariantId] = useState<string | null>(null);

  const [variantImageDrafts, setVariantImageDrafts] = useState<Record<string, string[]>>({});

  const selectedVariantProduct = useMemo(
    () => products.find((item) => item._id === selectedVariantProductId) || null,
    [products, selectedVariantProductId]
  );

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

  useEffect(() => {
    if (
      selectedVariantProductId &&
      !products.some((item) => item._id === selectedVariantProductId)
    ) {
      setShowVariantManager(false);
      setSelectedVariantProductId(null);
    }
  }, [products, selectedVariantProductId]);

  const filteredProducts = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    let result = products.filter((product) => {
      const productCategoryId = getCategoryIdValue(product);

      const matchesCategory =
        selectedCategoryId === 'all' || productCategoryId === selectedCategoryId;

      const text = [
        product.name,
        product.slug,
        product.brand,
        product.shortDescription,
        product.gender,
        product.material,
        getCategoryName(product, categories),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesKeyword = !q || text.includes(q);

      return matchesKeyword && matchesCategory;
    });

    switch (sortMode) {
      case 'name_asc':
        result = [...result].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'vi')
        );
        break;

      case 'price_asc':
        result = [...result].sort(
          (a, b) => getProductPrice(a) - getProductPrice(b)
        );
        break;

      case 'price_desc':
        result = [...result].sort(
          (a, b) => getProductPrice(b) - getProductPrice(a)
        );
        break;

      case 'created_desc':
        result = [...result].sort(
          (a, b) =>
            new Date(b.createdAt || '').getTime() -
            new Date(a.createdAt || '').getTime()
        );
        break;

      default:
        break;
    }

    return result;
  }, [products, keyword, categories, selectedCategoryId, sortMode]);

  const resetVariantEditingStates = () => {
    setEditingVariantId(null);
    setVariantEditForm(emptyEditVariantForm);
    setUpdatingVariantId(null);
    setDeletingVariantId(null);
    setEditingSizeRowKey(null);
    setSizeEditForm(emptyVariantSize);
    setSavingSizeRowKey(null);
    setRemovingSizeRowKey(null);
    setNewSizeDrafts({});
    setAddingSizeVariantId(null);
    setVariantImageDrafts({});
    setShowCreateVariantForm(false);
  };

  function moveImage(images: string[], from: number, to: number) {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  const setAsPrimaryImage = (variantId: string, index: number) => {
    setVariantImageDrafts((prev) => {
      const current = prev[variantId] || [];
      if (!current[index]) return prev;

      return {
        ...prev,
        [variantId]: moveImage(current, index, 0),
      };
    });
  };

  const moveDraftImage = (variantId: string, from: number, to: number) => {
    setVariantImageDrafts((prev) => {
      const current = prev[variantId] || [];
      if (to < 0 || to >= current.length) return prev;

      return {
        ...prev,
        [variantId]: moveImage(current, from, to),
      };
    });
  };

  const removeImageFromDraft = (variantId: string, index: number) => {
    setVariantImageDrafts((prev) => {
      const current = prev[variantId] || [];
      return {
        ...prev,
        [variantId]: current.filter((_, i) => i !== index),
      };
    });
  };


  const handleOpenCreateProductForm = () => {
    setProductFormMode('create');
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setSlugTouched(false);
    setShowVariantManager(false);
    resetVariantEditingStates();
    setShowProductForm(true);
  };

  const handleOpenEditProductForm = (product: AdminProductRecord) => {
    setProductFormMode('edit');
    setEditingProductId(product._id);
    setProductForm({
      name: product.name || '',
      slug: product.slug || '',
      shortDescription: product.shortDescription || '',
      brand: product.brand || '',
      categoryId: getCategoryIdValue(product),
      gender:
        product.gender === 'nam' || product.gender === 'nu' || product.gender === 'unisex'
          ? product.gender
          : 'unisex',
      material: product.material || '',
      tagsText: getProductTagsText(product),
    });
    setSlugTouched(true);
    setShowVariantManager(false);
    resetVariantEditingStates();
    setShowProductForm(true);
  };

  const handleCloseProductForm = () => {
    if (submittingProduct) return;
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setSlugTouched(false);
    setShowProductForm(false);
  };

  const handleChangeProductForm = (field: keyof ProductForm, value: string) => {
    setProductForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'name' && !slugTouched) {
        next.slug = slugify(value);
      }

      return next;
    });
  };

  const handleSubmitProduct = async () => {
    const name = productForm.name.trim();
    const slug = slugify(productForm.slug);
    const categoryId = productForm.categoryId;

    if (!name) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!slug) {
      toast.error('Slug không hợp lệ');
      return;
    }

    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    const tags = productForm.tagsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmittingProduct(true);

    try {
      const payload = {
        name,
        slug,
        shortDescription: productForm.shortDescription.trim(),
        brand: productForm.brand.trim(),
        categoryId,
        gender: productForm.gender,
        material: productForm.material.trim(),
        tags,
      };

      let res: any;

      if (productFormMode === 'create') {
        res = await productService.createProduct(payload);
        toast.success(res?.message || 'Tạo sản phẩm thành công');
      } else {
        if (!editingProductId) {
          toast.error('Không tìm thấy sản phẩm để cập nhật');
          return;
        }

        res = await productService.updateProduct(editingProductId, payload);
        toast.success(res?.message || 'Cập nhật sản phẩm thành công');
      }

      handleCloseProductForm();
      await fetchProducts();
    } catch (error: any) {
      console.error('submitProduct error:', error);
      toast.error(
        error?.message ||
        (productFormMode === 'create'
          ? 'Không thể tạo sản phẩm'
          : 'Không thể cập nhật sản phẩm')
      );
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleOpenVariantManager = (product: AdminProductRecord) => {
    setShowProductForm(false);
    resetVariantEditingStates();
    setSelectedVariantProductId(product._id);
    setVariantForm({
      productId: product._id,
      productName: product.name,
      color: '',
      colorCode: '#000000',
      images: [],
      sizes: [{ ...emptyVariantSize }],
    });
    setShowCreateVariantForm(false);
    setShowVariantManager(true);
  };

  const handleCloseVariantManager = () => {
    if (
      creatingVariant ||
      updatingVariantId ||
      savingSizeRowKey ||
      addingSizeVariantId ||
      deletingVariantId
    ) {
      return;
    }

    setVariantForm(emptyVariantForm);
    setSelectedVariantProductId(null);
    resetVariantEditingStates();
    setShowVariantManager(false);
  };

  const handleOpenCreateVariantForm = () => {
    if (!selectedVariantProduct) {
      toast.error('Không tìm thấy sản phẩm để thêm biến thể');
      return;
    }

    setVariantForm({
      productId: selectedVariantProduct._id,
      productName: selectedVariantProduct.name,
      color: '',
      colorCode: '#000000',
      images: [],
      sizes: [{ ...emptyVariantSize }],
    });

    setShowCreateVariantForm(true);
  };

  const handleCancelCreateVariantForm = () => {
    if (creatingVariant) return;

    if (selectedVariantProduct) {
      setVariantForm({
        productId: selectedVariantProduct._id,
        productName: selectedVariantProduct.name,
        color: '',
        colorCode: '#000000',
        images: [],
        sizes: [{ ...emptyVariantSize }],
      });
    } else {
      setVariantForm(emptyVariantForm);
    }

    setShowCreateVariantForm(false);
  };

  const handleVariantFieldChange = (
    field: keyof Omit<CreateVariantForm, 'sizes' | 'images'>,
    value: string
  ) => {
    setVariantForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleVariantImageChange = (files: FileList | null) => {
    const nextFiles = files ? Array.from(files) : [];
    setVariantForm((prev) => ({ ...prev, images: nextFiles.slice(0, 5) }));
  };

  const handleVariantSizeChange = (
    index: number,
    field: keyof VariantSizeForm,
    value: string
  ) => {
    setVariantForm((prev) => {
      const nextSizes = [...prev.sizes];
      nextSizes[index] = {
        ...nextSizes[index],
        [field]: value,
      };
      return {
        ...prev,
        sizes: nextSizes,
      };
    });
  };

  const handleAddSizeRow = () => {
    setVariantForm((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { ...emptyVariantSize }],
    }));
  };

  const handleRemoveSizeRow = (index: number) => {
    setVariantForm((prev) => {
      if (prev.sizes.length === 1) return prev;
      return {
        ...prev,
        sizes: prev.sizes.filter((_, idx) => idx !== index),
      };
    });
  };

  const normalizeSizeForm = (form: VariantSizeForm) => {
    return {
      size: form.size.trim(),
      price: parseNumberInput(form.price),
      discountPrice: form.discountPrice ? parseNumberInput(form.discountPrice) : 0,
      stock: Number(onlyDigits(form.stock)) || 0,
    };
  };

  const handleCreateVariant = async () => {
    if (!variantForm.productId) {
      toast.error('Không tìm thấy sản phẩm để thêm biến thể');
      return;
    }

    const color = variantForm.color.trim();
    if (!color) {
      toast.error('Vui lòng nhập màu');
      return;
    }

    const normalizedSizes = variantForm.sizes
      .filter((item) => item.size.trim())
      .map(normalizeSizeForm);

    if (normalizedSizes.length === 0) {
      toast.error('Vui lòng nhập ít nhất 1 size');
      return;
    }

    const invalidPrice = normalizedSizes.some((item) => item.price <= 0);
    if (invalidPrice) {
      toast.error('Giá bán của các size phải lớn hơn 0');
      return;
    }

    const currentProductId = variantForm.productId;
    const currentProductName = variantForm.productName;

    const formData = new FormData();
    formData.append('productId', currentProductId);
    formData.append('color', color);
    formData.append('colorCode', variantForm.colorCode || '#000000');
    formData.append('sizes', JSON.stringify(normalizedSizes));

    variantForm.images.forEach((file) => {
      formData.append('images', file);
    });

    setCreatingVariant(true);

    try {
      const res: any = await productService.createVariant(formData);
      toast.success(res?.message || 'Tạo biến thể thành công');

      await fetchProducts();

      setVariantForm({
        productId: currentProductId,
        productName: currentProductName,
        color: '',
        colorCode: '#000000',
        images: [],
        sizes: [{ ...emptyVariantSize }],
      });

      setShowCreateVariantForm(false);
    } catch (error: any) {
      console.error('createVariant error:', error);
      toast.error(error?.message || 'Không thể tạo biến thể');
    } finally {
      setCreatingVariant(false);
    }
  };

  const handleOpenEditVariant = (variant: AdminVariantRecord) => {
    if (!variant._id) {
      toast.error('Không tìm thấy mã biến thể');
      return;
    }

    setEditingVariantId(variant._id);
    setVariantEditForm({
      color: variant.color || '',
      colorCode: variant.colorCode || '#000000',
      images: [],
    });

    setVariantImageDrafts((prev) => ({
      ...prev,
      [variant._id!]: Array.isArray(variant.images) ? [...variant.images] : [],
    }));
  };

  const handleCancelEditVariant = () => {
    if (updatingVariantId) return;

    if (editingVariantId) {
      setVariantImageDrafts((prev) => {
        const next = { ...prev };
        delete next[editingVariantId];
        return next;
      });
    }

    setEditingVariantId(null);
    setVariantEditForm(emptyEditVariantForm);
  };

  const handleEditVariantFieldChange = (
    field: keyof Omit<EditVariantForm, 'images'>,
    value: string
  ) => {
    setVariantEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditVariantImageChange = (files: FileList | null) => {
    const nextFiles = files ? Array.from(files) : [];
    setVariantEditForm((prev) => ({
      ...prev,
      images: nextFiles.slice(0, 10),
    }));
  };

  const handleSaveVariant = async (variantId: string) => {
    const color = variantEditForm.color.trim();

    if (!color) {
      toast.error('Vui lòng nhập màu cho biến thể');
      return;
    }

    setUpdatingVariantId(variantId);

    try {
      const hasNewImages = variantEditForm.images.length > 0;

      const res: any = await productService.updateVariant(variantId, {
        color,
        colorCode: variantEditForm.colorCode || '#000000',
        images: variantEditForm.images,
        action: hasNewImages ? 'replace' : 'merge',
      });

      const draftImages = variantImageDrafts[variantId] || [];

      if (!hasNewImages && draftImages.length > 0) {
        await productService.reorderVariantImages(variantId, draftImages);
      }

      toast.success(res?.message || 'Cập nhật biến thể thành công');
      await fetchProducts();
      setEditingVariantId(null);
      setVariantEditForm(emptyEditVariantForm);
      setVariantImageDrafts((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
    } catch (error: any) {
      console.error('updateVariant error:', error);
      toast.error(error?.message || 'Không thể cập nhật biến thể');
    } finally {
      setUpdatingVariantId(null);
    }
  };

  const handleDeleteVariant = async (variantId: string, variantName: string) => {
    if (!variantId) {
      toast.error('Không tìm thấy variantId');
      return;
    }

    const confirmed = window.confirm(`Xóa hẳn biến thể "${variantName}"?`);
    if (!confirmed) return;

    setDeletingVariantId(variantId);

    try {
      const res: any = await productService.deleteVariant(variantId);
      toast.success(res?.message || 'Xóa biến thể thành công');
      await fetchProducts();

      if (editingVariantId === variantId) {
        setEditingVariantId(null);
        setVariantEditForm(emptyEditVariantForm);
      }

      setVariantImageDrafts((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
    } catch (error: any) {
      console.error('deleteVariant error:', error);
      toast.error(error?.message || 'Không thể xóa biến thể');
    } finally {
      setDeletingVariantId(null);
    }
  };

  const handleOpenEditSizeRow = (variantId: string, sizeItem: AdminVariantSizeRecord) => {
    if (!sizeItem._id) {
      toast.error('Size này chưa có _id nên không thể chỉnh sửa');
      return;
    }

    const rowKey = buildRowKey(variantId, sizeItem._id);
    setEditingSizeRowKey(rowKey);
    setSizeEditForm(mapSizeRecordToForm(sizeItem));
  };

  const handleCancelEditSizeRow = () => {
    if (savingSizeRowKey) return;
    setEditingSizeRowKey(null);
    setSizeEditForm(emptyVariantSize);
  };

  const handleSizeEditFieldChange = (field: keyof VariantSizeForm, value: string) => {
    setSizeEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSizeRow = async (variantId: string, sizeId: string) => {
    if (!sizeId) {
      toast.error('Không tìm thấy sizeId');
      return;
    }

    const rowKey = buildRowKey(variantId, sizeId);
    const normalized = normalizeSizeForm(sizeEditForm);

    if (!normalized.size) {
      toast.error('Vui lòng nhập size');
      return;
    }

    if (normalized.price <= 0) {
      toast.error('Giá bán phải lớn hơn 0');
      return;
    }

    setSavingSizeRowKey(rowKey);

    try {
      const res: any = await productService.updateVariantSize(variantId, sizeId, normalized);
      toast.success(res?.message || 'Cập nhật size thành công');
      await fetchProducts();
      setEditingSizeRowKey(null);
      setSizeEditForm(emptyVariantSize);
    } catch (error: any) {
      console.error('updateVariantSize error:', error);
      toast.error(error?.message || 'Không thể cập nhật size');
    } finally {
      setSavingSizeRowKey(null);
    }
  };

  const handleRemoveSizeRowExisting = async (variantId: string, sizeId: string) => {
    if (!sizeId) {
      toast.error('Không tìm thấy sizeId');
      return;
    }

    const confirmed = window.confirm('Xóa size này khỏi biến thể?');
    if (!confirmed) return;

    const rowKey = buildRowKey(variantId, sizeId);
    setRemovingSizeRowKey(rowKey);

    try {
      const res: any = await productService.removeVariantSize(variantId, sizeId);
      toast.success(res?.message || 'Xóa size thành công');
      await fetchProducts();

      if (editingSizeRowKey === rowKey) {
        setEditingSizeRowKey(null);
        setSizeEditForm(emptyVariantSize);
      }
    } catch (error: any) {
      console.error('removeVariantSize error:', error);
      toast.error(error?.message || 'Không thể xóa size');
    } finally {
      setRemovingSizeRowKey(null);
    }
  };

  const handleNewSizeDraftChange = (
    variantId: string,
    field: keyof VariantSizeForm,
    value: string
  ) => {
    setNewSizeDrafts((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] || { ...emptyVariantSize }),
        [field]: value,
      },
    }));
  };

  const handleAddNewSizeToVariant = async (variantId: string) => {
    const draft = newSizeDrafts[variantId] || { ...emptyVariantSize };
    const normalized = normalizeSizeForm(draft);

    if (!normalized.size) {
      toast.error('Vui lòng nhập size mới');
      return;
    }

    if (normalized.price <= 0) {
      toast.error('Giá bán phải lớn hơn 0');
      return;
    }

    setAddingSizeVariantId(variantId);

    try {
      const res: any = await productService.addVariantSize(variantId, normalized);
      toast.success(res?.message || 'Thêm size thành công');
      await fetchProducts();

      setNewSizeDrafts((prev) => ({
        ...prev,
        [variantId]: { ...emptyVariantSize },
      }));
    } catch (error: any) {
      console.error('addVariantSize error:', error);
      toast.error(error?.message || 'Không thể thêm size');
    } finally {
      setAddingSizeVariantId(null);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    const confirmed = window.confirm(`Xóa sản phẩm "${productName}"?`);
    if (!confirmed) return;

    setDeletingId(productId);
    try {
      const res: any = await productService.deleteProduct(productId);
      toast.success(res?.message || 'Xóa sản phẩm thành công');
      await fetchProducts();
    } catch (error: any) {
      console.error('deleteProduct error:', error);
      toast.error(error?.message || 'Không thể xóa sản phẩm');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bước hiện tại: thêm và sửa sản phẩm gốc, xem biến thể, thêm biến thể mới,
              chỉnh sửa biến thể và quản lý size trực tiếp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={fetchProducts}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Tải lại
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={handleOpenCreateProductForm}
            >
              <Plus className="h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {showProductForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-background shadow-2xl">
              <div className="border-b p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {productFormMode === 'create'
                        ? 'Thêm sản phẩm gốc'
                        : 'Sửa sản phẩm gốc'}
                    </CardTitle>

                    {productFormMode === 'edit' && editingProductId ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Chỉ sửa thông tin sản phẩm gốc. Giá, ảnh, màu, size và tồn kho nằm ở biến thể.
                      </p>
                    ) : null}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseProductForm}
                    disabled={submittingProduct}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-5">
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitProduct();
                  }}
                >
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Sản phẩm gốc chỉ lưu thông tin chung như tên, slug, danh mục, thương hiệu,
                    giới tính, chất liệu và mô tả. Giá, ảnh, màu, size và tồn kho sẽ được quản lý
                    trong phần biến thể.
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Tên sản phẩm <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={productForm.name}
                        onChange={(e) => handleChangeProductForm('name', e.target.value)}
                        placeholder="Ví dụ: Áo Polo Nam Urban Accent"
                        disabled={submittingProduct}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Slug <span className="text-destructive">*</span>
                      </label>
                      <Input
                        value={productForm.slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          handleChangeProductForm('slug', e.target.value);
                        }}
                        placeholder="ao-polo-nam-urban-accent"
                        disabled={submittingProduct}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Thương hiệu</label>
                      <Input
                        value={productForm.brand}
                        onChange={(e) => handleChangeProductForm('brand', e.target.value)}
                        placeholder="Ví dụ: Coolmate"
                        disabled={submittingProduct}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Danh mục <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) => handleChangeProductForm('categoryId', e.target.value)}
                        disabled={submittingProduct || loadingCategories}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Giới tính</label>
                      <select
                        value={productForm.gender}
                        onChange={(e) =>
                          handleChangeProductForm(
                            'gender',
                            e.target.value as ProductForm['gender']
                          )
                        }
                        disabled={submittingProduct}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="unisex">Unisex</option>
                        <option value="nam">Nam</option>
                        <option value="nu">Nữ</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Chất liệu</label>
                      <Input
                        value={productForm.material}
                        onChange={(e) => handleChangeProductForm('material', e.target.value)}
                        placeholder="Ví dụ: Cotton, Kaki, Polyester..."
                        disabled={submittingProduct}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Mô tả ngắn</label>
                    <textarea
                      value={productForm.shortDescription}
                      onChange={(e) =>
                        handleChangeProductForm('shortDescription', e.target.value)
                      }
                      placeholder="Nhập mô tả ngắn cho sản phẩm..."
                      disabled={submittingProduct}
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Tags</label>
                    <Input
                      value={productForm.tagsText}
                      onChange={(e) => handleChangeProductForm('tagsText', e.target.value)}
                      placeholder="Ví dụ: polo, nam, basic, công sở"
                      disabled={submittingProduct}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Nhập nhiều tag bằng dấu phẩy.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseProductForm}
                      disabled={submittingProduct}
                    >
                      Hủy
                    </Button>

                    <Button type="submit" disabled={submittingProduct}>
                      {submittingProduct
                        ? productFormMode === 'create'
                          ? 'Đang tạo...'
                          : 'Đang lưu...'
                        : productFormMode === 'create'
                          ? 'Tạo sản phẩm'
                          : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        {showVariantManager && selectedVariantProduct ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-background shadow-2xl">
              <div className="border-b p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Quản lý biến thể sản phẩm</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sản phẩm: {selectedVariantProduct.name}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseVariantManager}
                    disabled={
                      creatingVariant ||
                      !!updatingVariantId ||
                      !!savingSizeRowKey ||
                      !!addingSizeVariantId ||
                      !!deletingVariantId
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-96px)] space-y-6 overflow-y-auto p-5">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  Ở bước này bạn có thể xem, sửa màu và mã màu của variant, thêm size mới,
                  sửa giá hoặc tồn kho của size hiện có, xóa size và xóa hẳn variant.
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold">Biến thể hiện có</h3>

                  {Array.isArray(selectedVariantProduct.variants) &&
                    selectedVariantProduct.variants.length > 0 ? (
                    <div className="space-y-4">
                      {selectedVariantProduct.variants.map((variant, index) => {
                        const images = getVariantImages(variant);
                        const sizes = getVariantSizes(variant);
                        const variantId = variant._id || '';
                        const isEditingVariant = editingVariantId === variantId;
                        const newSizeDraft =
                          newSizeDrafts[variantId] || { ...emptyVariantSize };
                        const displayImagesForAdmin = isEditingVariant
                          ? variantImageDrafts[variantId] || images
                          : images;

                        return (
                          <div key={variant._id || index} className="rounded-xl border p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex-1 space-y-3">
                                {isEditingVariant ? (
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <label className="mb-2 block text-sm font-medium">
                                        Màu
                                      </label>
                                      <Input
                                        value={variantEditForm.color}
                                        onChange={(e) =>
                                          handleEditVariantFieldChange(
                                            'color',
                                            e.target.value
                                          )
                                        }
                                        placeholder="Ví dụ: Đen"
                                        disabled={updatingVariantId === variantId}
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-2 block text-sm font-medium">
                                        Mã màu
                                      </label>
                                      <div className="flex gap-2">
                                        <input
                                          type="color"
                                          value={variantEditForm.colorCode}
                                          onChange={(e) =>
                                            handleEditVariantFieldChange(
                                              'colorCode',
                                              e.target.value
                                            )
                                          }
                                          disabled={updatingVariantId === variantId}
                                          className="h-10 w-16 rounded-md border border-input bg-background p-1"
                                        />
                                        <Input
                                          value={variantEditForm.colorCode}
                                          onChange={(e) =>
                                            handleEditVariantFieldChange(
                                              'colorCode',
                                              e.target.value
                                            )
                                          }
                                          placeholder="#000000"
                                          disabled={updatingVariantId === variantId}
                                        />
                                      </div>
                                    </div>

                                    <div className="md:col-span-2">
                                      <label className="mb-2 block text-sm font-medium">
                                        Ảnh mới cho variant
                                      </label>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) =>
                                          handleEditVariantImageChange(e.target.files)
                                        }
                                        disabled={updatingVariantId === variantId}
                                        className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                      />
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Chỉ chọn ảnh nếu muốn cập nhật ảnh cho variant này.
                                      </p>

                                      {variantEditForm.images.length > 0 ? (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {variantEditForm.images.map((file, fileIndex) => (
                                            <div
                                              key={`${file.name}-${fileIndex}`}
                                              className="rounded-md border px-3 py-2 text-xs text-muted-foreground"
                                            >
                                              {file.name}
                                            </div>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <span
                                      className="h-5 w-5 rounded-full border border-border"
                                      style={{
                                        backgroundColor: variant.colorCode || '#000000',
                                      }}
                                    />
                                    <div>
                                      <p className="font-medium">
                                        {variant.color || `Biến thể ${index + 1}`}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Mã màu: {variant.colorCode || 'Chưa có'}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm text-muted-foreground">
                                  {sizes.length} size
                                </div>

                                {isEditingVariant ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveVariant(variantId)}
                                      disabled={!variantId || updatingVariantId === variantId}
                                    >
                                      {updatingVariantId === variantId
                                        ? 'Đang lưu...'
                                        : 'Lưu variant'}
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEditVariant}
                                      disabled={updatingVariantId === variantId}
                                    >
                                      Hủy
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOpenEditVariant(variant)}
                                      disabled={!variantId}
                                    >
                                      <Edit className="mr-1 h-4 w-4" />
                                      Sửa variant
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleDeleteVariant(
                                          variantId,
                                          variant.color || `Biến thể ${index + 1}`
                                        )
                                      }
                                      disabled={!variantId || deletingVariantId === variantId}
                                    >
                                      {deletingVariantId === variantId
                                        ? 'Đang xóa...'
                                        : 'Xóa variant'}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="mt-4">
                              <p className="mb-2 text-sm font-medium">Ảnh hiện tại</p>

                              {displayImagesForAdmin.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                  {displayImagesForAdmin.map((image, imageIndex) => (
                                    <div
                                      key={`${variantId}-${imageIndex}`}
                                      className="rounded-lg border p-2"
                                    >
                                      <img
                                        src={image}
                                        alt={variant.color || `variant-${imageIndex}`}
                                        className="h-20 w-20 rounded-lg border object-cover"
                                      />

                                      {isEditingVariant ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              moveDraftImage(
                                                variantId,
                                                imageIndex,
                                                imageIndex - 1
                                              )
                                            }
                                            disabled={imageIndex === 0}
                                          >
                                            ←
                                          </Button>

                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              moveDraftImage(
                                                variantId,
                                                imageIndex,
                                                imageIndex + 1
                                              )
                                            }
                                            disabled={
                                              imageIndex ===
                                              displayImagesForAdmin.length - 1
                                            }
                                          >
                                            →
                                          </Button>

                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              setAsPrimaryImage(variantId, imageIndex)
                                            }
                                            disabled={imageIndex === 0}
                                          >
                                            Ảnh chính
                                          </Button>

                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                              removeImageFromDraft(variantId, imageIndex)
                                            }
                                            disabled={displayImagesForAdmin.length === 1}
                                          >
                                            Xóa
                                          </Button>
                                        </div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Chưa có ảnh</p>
                              )}
                            </div>

                            <div className="mt-4">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="text-sm font-medium">Danh sách size</p>
                              </div>

                              {sizes.length > 0 ? (
                                <div className="overflow-x-auto rounded-lg border">
                                  <table className="w-full text-sm">
                                    <thead className="bg-secondary/40">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium">Size</th>
                                        <th className="px-3 py-2 text-left font-medium">Giá</th>
                                        <th className="px-3 py-2 text-left font-medium">
                                          Giá giảm
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium">
                                          Tồn kho
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium">
                                          Thao tác
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sizes.map((sizeItem, sizeIndex) => {
                                        const sizeId = getSizeId(sizeItem);
                                        const rowKey = buildRowKey(
                                          variantId,
                                          sizeId,
                                          sizeIndex
                                        );
                                        const isEditingRow = editingSizeRowKey === rowKey;

                                        return (
                                          <tr key={rowKey} className="border-t">
                                            <td className="px-3 py-2">
                                              {isEditingRow ? (
                                                <Input
                                                  value={sizeEditForm.size}
                                                  onChange={(e) =>
                                                    handleSizeEditFieldChange(
                                                      'size',
                                                      e.target.value
                                                    )
                                                  }
                                                  placeholder="Size"
                                                  disabled={savingSizeRowKey === rowKey}
                                                />
                                              ) : (
                                                sizeItem.size || 'Chưa có'
                                              )}
                                            </td>

                                            <td className="px-3 py-2">
                                              {isEditingRow ? (
                                                <Input
                                                  inputMode="numeric"
                                                  value={formatNumberInput(sizeEditForm.price)}
                                                  onChange={(e) =>
                                                    handleMoneyInputChange(e.target.value, (value) =>
                                                      handleSizeEditFieldChange('price', value)
                                                    )
                                                  }
                                                  placeholder="Giá"
                                                  disabled={savingSizeRowKey === rowKey}
                                                />
                                              ) : (
                                                formatPrice(sizeItem.price || 0)
                                              )}
                                            </td>

                                            <td className="px-3 py-2">
                                              {isEditingRow ? (
                                                <Input
                                                  inputMode="numeric"
                                                  value={formatNumberInput(sizeEditForm.discountPrice)}
                                                  onChange={(e) =>
                                                    handleMoneyInputChange(e.target.value, (value) =>
                                                      handleSizeEditFieldChange('discountPrice', value)
                                                    )
                                                  }
                                                  placeholder="Giá giảm"
                                                  disabled={savingSizeRowKey === rowKey}
                                                />
                                              ) : sizeItem.discountPrice ? (
                                                formatPrice(sizeItem.discountPrice)
                                              ) : (
                                                'Không có'
                                              )}
                                            </td>

                                            <td className="px-3 py-2">
                                              {isEditingRow ? (
                                                <Input
                                                  inputMode="numeric"
                                                  value={sizeEditForm.stock}
                                                  onChange={(e) =>
                                                    handleSizeEditFieldChange('stock', onlyDigits(e.target.value))
                                                  }
                                                  placeholder="Tồn kho"
                                                  disabled={savingSizeRowKey === rowKey}
                                                />
                                              ) : (
                                                sizeItem.stock || 0
                                              )}
                                            </td>

                                            <td className="px-3 py-2">
                                              {sizeId ? (
                                                <div className="flex flex-wrap gap-2">
                                                  {isEditingRow ? (
                                                    <>
                                                      <Button
                                                        size="sm"
                                                        onClick={() =>
                                                          handleSaveSizeRow(variantId, sizeId)
                                                        }
                                                        disabled={
                                                          !variantId ||
                                                          savingSizeRowKey === rowKey
                                                        }
                                                      >
                                                        {savingSizeRowKey === rowKey
                                                          ? 'Đang lưu...'
                                                          : 'Lưu'}
                                                      </Button>

                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleCancelEditSizeRow}
                                                        disabled={savingSizeRowKey === rowKey}
                                                      >
                                                        Hủy
                                                      </Button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                          handleOpenEditSizeRow(
                                                            variantId,
                                                            sizeItem
                                                          )
                                                        }
                                                        disabled={!variantId}
                                                      >
                                                        Sửa
                                                      </Button>

                                                      <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() =>
                                                          handleRemoveSizeRowExisting(
                                                            variantId,
                                                            sizeId
                                                          )
                                                        }
                                                        disabled={
                                                          !variantId ||
                                                          removingSizeRowKey === rowKey
                                                        }
                                                      >
                                                        {removingSizeRowKey === rowKey
                                                          ? 'Đang xóa...'
                                                          : 'Xóa'}
                                                      </Button>
                                                    </>
                                                  )}
                                                </div>
                                              ) : (
                                                <span className="text-xs text-muted-foreground">
                                                  Size cũ chưa có _id
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Chưa có size</p>
                              )}

                              <div className="mt-4 rounded-lg border border-dashed p-3">
                                <p className="mb-3 text-sm font-medium">
                                  Thêm size vào biến thể này
                                </p>

                                <div className="grid gap-3 md:grid-cols-[0.8fr_1.2fr_1fr_1fr_auto]">
                                  <Input
                                    value={newSizeDraft.size}
                                    onChange={(e) =>
                                      handleNewSizeDraftChange(
                                        variantId,
                                        'size',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Size"
                                    disabled={!variantId || addingSizeVariantId === variantId}
                                  />

                                  <Input
                                    inputMode="numeric"
                                    value={formatNumberInput(newSizeDraft.price)}
                                    onChange={(e) =>
                                      handleMoneyInputChange(e.target.value, (value) =>
                                        handleNewSizeDraftChange(variantId, 'price', value)
                                      )
                                    }
                                    placeholder="Giá"
                                    disabled={!variantId || addingSizeVariantId === variantId}
                                  />

                                  <Input
                                    inputMode="numeric"
                                    value={formatNumberInput(newSizeDraft.discountPrice)}
                                    onChange={(e) =>
                                      handleMoneyInputChange(e.target.value, (value) =>
                                        handleNewSizeDraftChange(variantId, 'discountPrice', value)
                                      )
                                    }
                                    placeholder="Giá giảm"
                                    disabled={!variantId || addingSizeVariantId === variantId}
                                  />

                                  <Input
                                    inputMode="numeric"
                                    value={newSizeDraft.stock}
                                    onChange={(e) =>
                                      handleNewSizeDraftChange(variantId, 'stock', onlyDigits(e.target.value))
                                    }
                                    placeholder="Tồn kho"
                                    disabled={!variantId || addingSizeVariantId === variantId}
                                  />

                                  <Button
                                    type="button"
                                    onClick={() => handleAddNewSizeToVariant(variantId)}
                                    disabled={!variantId || addingSizeVariantId === variantId}
                                  >
                                    {addingSizeVariantId === variantId
                                      ? 'Đang thêm...'
                                      : 'Thêm size'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                      Sản phẩm này chưa có biến thể nào.
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Thêm biến thể mới</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Chỉ mở form khi cần thêm màu, ảnh và size mới cho sản phẩm này.
                      </p>
                    </div>

                    {!showCreateVariantForm ? (
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={handleOpenCreateVariantForm}
                        disabled={creatingVariant}
                      >
                        <Plus className="h-4 w-4" />
                        Thêm biến thể mới
                      </Button>
                    ) : null}
                  </div>

                  {showCreateVariantForm ? (
                    <div className="rounded-xl border p-4">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Thông tin biến thể mới</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Nhập màu, mã màu, ảnh và danh sách size cho biến thể mới.
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelCreateVariantForm}
                          disabled={creatingVariant}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Màu</label>
                          <Input
                            value={variantForm.color}
                            onChange={(e) =>
                              handleVariantFieldChange('color', e.target.value)
                            }
                            placeholder="Ví dụ: Đen"
                            disabled={creatingVariant}
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Mã màu</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={variantForm.colorCode}
                              onChange={(e) =>
                                handleVariantFieldChange('colorCode', e.target.value)
                              }
                              disabled={creatingVariant}
                              className="h-10 w-16 rounded-md border border-input bg-background p-1"
                            />

                            <Input
                              value={variantForm.colorCode}
                              onChange={(e) =>
                                handleVariantFieldChange('colorCode', e.target.value)
                              }
                              placeholder="#000000"
                              disabled={creatingVariant}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium">Ảnh biến thể</label>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleVariantImageChange(e.target.files)}
                          disabled={creatingVariant}
                          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />

                        <p className="mt-1 text-xs text-muted-foreground">
                          Có thể chọn tối đa 5 ảnh.
                        </p>

                        {variantForm.images.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {variantForm.images.map((file, index) => (
                              <div
                                key={`${file.name}-${index}`}
                                className="rounded-md border px-3 py-2 text-xs text-muted-foreground"
                              >
                                {file.name}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="block text-sm font-medium">Danh sách size</label>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddSizeRow}
                            disabled={creatingVariant}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            Thêm size
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {variantForm.sizes.map((sizeItem, index) => (
                            <div
                              key={index}
                              className="grid gap-3 rounded-lg border p-3 md:grid-cols-[0.8fr_1.2fr_1fr_1fr_auto]"
                            >
                              <Input
                                value={sizeItem.size}
                                onChange={(e) =>
                                  handleVariantSizeChange(index, 'size', e.target.value)
                                }
                                placeholder="Size: M"
                                disabled={creatingVariant}
                              />

                              <Input
                                inputMode="numeric"
                                value={formatNumberInput(sizeItem.price)}
                                onChange={(e) =>
                                  handleMoneyInputChange(e.target.value, (value) =>
                                    handleVariantSizeChange(index, 'price', value)
                                  )
                                }
                                placeholder="Giá"
                                disabled={creatingVariant}
                              />

                              <Input
                                inputMode="numeric"
                                value={formatNumberInput(sizeItem.discountPrice)}
                                onChange={(e) =>
                                  handleMoneyInputChange(e.target.value, (value) =>
                                    handleVariantSizeChange(index, 'discountPrice', value)
                                  )
                                }
                                placeholder="Giá giảm"
                                disabled={creatingVariant}
                              />

                              <Input
                                inputMode="numeric"
                                value={sizeItem.stock}
                                onChange={(e) =>
                                  handleVariantSizeChange(index, 'stock', onlyDigits(e.target.value))
                                }
                                placeholder="Tồn kho"
                                disabled={creatingVariant}
                              />

                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleRemoveSizeRow(index)}
                                disabled={creatingVariant || variantForm.sizes.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelCreateVariantForm}
                          disabled={creatingVariant}
                        >
                          Hủy
                        </Button>

                        <Button onClick={handleCreateVariant} disabled={creatingVariant}>
                          {creatingVariant ? 'Đang tạo biến thể...' : 'Tạo biến thể'}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Danh sách sản phẩm</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hiển thị {filteredProducts.length} / {products.length} sản phẩm
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo tên, slug, thương hiệu..."
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
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as AdminProductSortMode)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:w-[190px]"
                >
                  <option value="default">Mặc định</option>
                  <option value="name_asc">Tên sản phẩm A-Z</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                  <option value="created_desc">Ngày tạo mới nhất</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Đang tải danh sách sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Không có sản phẩm phù hợp</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[70px]">STT</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Thương hiệu</TableHead>
                    <TableHead>Giới tính</TableHead>
                    <TableHead>Chất liệu</TableHead>
                    <TableHead>Giá từ</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Biến thể</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="w-[280px] text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredProducts.map((product, index) => {
                    const productId = product._id;
                    const image = getProductImage(product);
                    const minPrice = getProductPrice(product);
                    const totalStock = getTotalStock(product);

                    return (
                      <TableRow key={productId}>
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={image}
                              alt={product.name}
                              className="h-14 w-14 rounded-lg border object-cover"
                            />

                            <div className="min-w-0">
                              <p className="line-clamp-1 font-medium">{product.name}</p>
                              <p className="line-clamp-1 text-xs text-muted-foreground">
                                /{product.slug}
                              </p>
                              {product.shortDescription ? (
                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                  {product.shortDescription}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>{getCategoryName(product, categories)}</TableCell>
                        <TableCell>{product.brand || 'Chưa có'}</TableCell>
                        <TableCell>
                          {product.gender === 'nam'
                            ? 'Nam'
                            : product.gender === 'nu'
                              ? 'Nữ'
                              : 'Unisex'}
                        </TableCell>

                        <TableCell>{product.material || 'Đang cập nhật'}</TableCell>
                        <TableCell className="font-medium">{formatPrice(minPrice)}</TableCell>
                        <TableCell>{totalStock}</TableCell>
                        <TableCell>{getVariantCount(product)}</TableCell>
                        <TableCell>
                          {product.createdAt ? formatDate(product.createdAt) : 'Chưa có ngày'}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleOpenEditProductForm(product)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Sửa
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleOpenVariantManager(product)}
                            >
                              <ImagePlus className="h-3.5 w-3.5" />
                              Biến thể
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                              disabled={deletingId === productId}
                              onClick={() => handleDelete(productId, product.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingId === productId ? 'Đang xóa' : 'Xóa'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}