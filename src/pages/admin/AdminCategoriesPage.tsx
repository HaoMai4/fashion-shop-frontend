import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Folder,
  FolderOpen,
  FolderTree,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import {
  categoryService,
  type CategoryGroup,
  type CategoryPayload,
  type CategoryRecord,
  type CategoryStatus,
  type CategoryType,
} from '@/services/api/categoryService';

type FormMode = 'create' | 'edit';

type CategoryForm = {
  name: string;
  slug: string;
  status: CategoryStatus;
};

type CreateContext = {
  parent: CategoryRecord | null;
};

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  status: 'active',
};

const groupLabels: Record<CategoryGroup, string> = {
  nam: 'Nam',
  nu: 'Nữ',
  'the-thao': 'Thể thao',
  'phu-kien': 'Phụ kiện',
  unisex: 'Unisex',
};

const typeLabels: Record<CategoryType, string> = {
  ao: 'Áo',
  quan: 'Quần',
  vay: 'Váy/Đầm',
  'phu-kien': 'Phụ kiện',
  'do-the-thao': 'Đồ thể thao',
  khac: 'Khác',
};

const statusLabels: Record<CategoryStatus, string> = {
  active: 'Đang hiển thị',
  inactive: 'Đang ẩn',
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

function normalizeText(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function inferGroupFromNameOrSlug(name: string, slug: string): CategoryGroup {
  const text = normalizeText(`${name} ${slug}`);

  if (text.includes('nam')) return 'nam';
  if (text.includes('nu')) return 'nu';
  if (text.includes('the thao') || text.includes('sport')) return 'the-thao';
  if (text.includes('phu kien') || text.includes('giay') || text.includes('dep')) {
    return 'phu-kien';
  }

  return 'unisex';
}

function inferTypeFromNameOrSlug(name: string, slug: string): CategoryType {
  const text = normalizeText(`${name} ${slug}`);

  if (text.includes('the thao') || text.includes('sport') || text.includes('training')) {
    return 'do-the-thao';
  }

  if (
    text.includes('phu kien') ||
    text.includes('tat') ||
    text.includes('tui') ||
    text.includes('giay') ||
    text.includes('dep')
  ) {
    return 'phu-kien';
  }

  if (text.includes('vay') || text.includes('dam')) {
    return 'vay';
  }

  if (
    text.includes('quan') ||
    text.includes('jeans') ||
    text.includes('jogger') ||
    text.includes('short')
  ) {
    return 'quan';
  }

  if (
    text.includes('ao') ||
    text.includes('hoodie') ||
    text.includes('polo') ||
    text.includes('so mi') ||
    text.includes('khoac') ||
    text.includes('thun')
  ) {
    return 'ao';
  }

  return 'khac';
}

function formatPath(path?: string) {
  if (!path) return 'Hệ thống sẽ tự tạo sau khi lưu';

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

function countChildren(category: CategoryRecord | null, rootCategories: CategoryRecord[]) {
  if (!category) return rootCategories.length;

  return Array.isArray(category.children) ? category.children.length : 0;
}

function filterCategoryTree(categories: CategoryRecord[], keyword: string): CategoryRecord[] {
  const q = keyword.trim().toLowerCase();

  if (!q) return categories;

  const result: CategoryRecord[] = [];

  categories.forEach((category) => {
    const children = filterCategoryTree(category.children || [], keyword);

    const searchable = [
      category.name,
      category.slug,
      category.path,
      category.group,
      category.type,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (searchable.includes(q) || children.length > 0) {
      result.push({
        ...category,
        children,
      });
    }
  });

  return result;
}

function findCategoryById(categories: CategoryRecord[], id: string): CategoryRecord | null {
  for (const category of categories) {
    if (category._id === id) return category;

    const found = findCategoryById(category.children || [], id);
    if (found) return found;
  }

  return null;
}

function getRootPathPreview(slug: string) {
  return slug || 'duong-dan-danh-muc';
}

function getChildPathPreview(parent: CategoryRecord, slug: string) {
  const parentPath = parent.path || parent.slug || '';
  const safeSlug = slug || 'duong-dan-danh-muc';

  return parentPath ? `${parentPath}/${safeSlug}` : safeSlug;
}

type CategoryTreeNodeProps = {
  category: CategoryRecord;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onAddChild: (parent: CategoryRecord) => void;
  onEdit: (category: CategoryRecord) => void;
  onDelete: (category: CategoryRecord) => void;
  deletingSlug: string | null;
};

function CategoryTreeNode({
  category,
  depth,
  expandedIds,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  deletingSlug,
}: CategoryTreeNodeProps) {
  const children = Array.isArray(category.children) ? category.children : [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(category._id);

  return (
    <div>
      <div
        className="group flex flex-col gap-3 border-b px-4 py-3 transition hover:bg-muted/40 lg:flex-row lg:items-center lg:justify-between"
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            type="button"
            onClick={() => hasChildren && onToggle(category._id)}
            className="mt-1 flex h-6 w-6 items-center justify-center rounded-md hover:bg-background"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>

          <div className="mt-0.5 text-muted-foreground">
            {hasChildren && isExpanded ? (
              <FolderOpen className="h-5 w-5" />
            ) : (
              <Folder className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{category.name}</p>

              <span
                className={
                  category.status === 'inactive'
                    ? 'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'
                    : 'rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700'
                }
              >
                {statusLabels[(category.status || 'active') as CategoryStatus] || 'Đang hiển thị'}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>slug: {category.slug}</span>
              <span>cấp {category.level || depth + 1}</span>
              <span>{groupLabels[(category.group || 'unisex') as CategoryGroup] || 'Unisex'}</span>
              <span>{typeLabels[(category.type || 'khac') as CategoryType] || 'Khác'}</span>
              <span>{category.productCount || 0} sản phẩm</span>
              <span>{category.childrenCount || children.length} danh mục con</span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {formatPath(category.path)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 lg:min-w-[320px]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddChild(category)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Thêm vào đây
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category)}
          >
            <Edit className="mr-1 h-4 w-4" />
            Sửa
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(category)}
            disabled={deletingSlug === category.slug || category.canDelete === false}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {deletingSlug === category.slug
              ? 'Đang xóa'
              : category.canDelete === false
                ? 'Không thể xóa'
                : 'Xóa'}
          </Button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <CategoryTreeNode
              key={child._id}
              category={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              deletingSlug={deletingSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categoryTree, setCategoryTree] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [createContext, setCreateContext] = useState<CreateContext>({ parent: null });
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);

    try {
      const data = await categoryService.getCategoryTree();
      const safeData = Array.isArray(data) ? data : [];

      setCategoryTree(safeData);

      setExpandedIds((prev) => {
        if (prev.size > 0) return prev;

        const next = new Set<string>();

        safeData.forEach((root) => {
          next.add(root._id);
        });

        return next;
      });
    } catch (error: any) {
      console.error('getCategoryTree error:', error);
      toast.error(error?.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredTree = useMemo(() => {
    return filterCategoryTree(categoryTree, keyword);
  }, [categoryTree, keyword]);

  const totalCategoryCount = useMemo(() => {
    const count = (items: CategoryRecord[]): number =>
      items.reduce((sum, item) => sum + 1 + count(item.children || []), 0);

    return count(categoryTree);
  }, [categoryTree]);

  const selectedParent = useMemo(() => {
    return createContext.parent;
  }, [createContext.parent]);

  const currentSlug = slugify(form.slug);

  const pathPreview = useMemo(() => {
    if (formMode === 'edit' && editingCategory) {
      const parentId =
        typeof editingCategory.parentId === 'object' && editingCategory.parentId
          ? editingCategory.parentId._id || ''
          : typeof editingCategory.parentId === 'string'
            ? editingCategory.parentId
            : '';

      const parent = parentId ? findCategoryById(categoryTree, parentId) : null;

      if (parent) {
        return getChildPathPreview(parent, currentSlug);
      }

      return getRootPathPreview(currentSlug);
    }

    if (selectedParent) {
      return getChildPathPreview(selectedParent, currentSlug);
    }

    return getRootPathPreview(currentSlug);
  }, [formMode, editingCategory, selectedParent, currentSlug, categoryTree]);

  const resetForm = () => {
    setForm(emptyForm);
    setFormMode('create');
    setEditingCategory(null);
    setCreateContext({ parent: null });
    setSlugTouched(false);
  };

  const openCreateRoot = () => {
    resetForm();
    setCreateContext({ parent: null });
    setShowForm(true);
  };

  const openCreateChild = (parent: CategoryRecord) => {
    resetForm();
    setCreateContext({ parent });
    setShowForm(true);
  };

  const openEdit = (category: CategoryRecord) => {
    setFormMode('edit');
    setEditingCategory(category);
    setCreateContext({ parent: null });
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      status: category.status || 'active',
    });
    setSlugTouched(true);
    setShowForm(true);
  };

  const closeForm = () => {
    if (submitting) return;

    resetForm();
    setShowForm(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const expandAll = () => {
    const next = new Set<string>();

    const walk = (items: CategoryRecord[]) => {
      items.forEach((item) => {
        next.add(item._id);
        walk(item.children || []);
      });
    };

    walk(categoryTree);
    setExpandedIds(next);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleChangeForm = (field: keyof CategoryForm, value: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === 'name' && !slugTouched) {
        next.slug = slugify(value);
      }

      if (field === 'slug') {
        next.slug = slugify(value);
      }

      return next;
    });
  };

  const buildCreatePayload = (): CategoryPayload | null => {
    const name = form.name.trim();
    const slug = slugify(form.slug);

    if (!name) {
      toast.error('Vui lòng nhập tên danh mục');
      return null;
    }

    if (!slug) {
      toast.error('Slug không hợp lệ');
      return null;
    }

    const parent = selectedParent;

    const group: CategoryGroup = parent
      ? (parent.group || 'unisex')
      : inferGroupFromNameOrSlug(name, slug);

    const inferredType = inferTypeFromNameOrSlug(name, slug);

    const type: CategoryType = parent
      ? parent.type && parent.type !== 'khac'
        ? parent.type
        : inferredType
      : inferredType;

    const sortOrder = countChildren(parent, categoryTree) + 1;

    return {
      name,
      slug,
      parentId: parent?._id || null,
      group,
      type,
      sortOrder,
      status: form.status,
    };
  };

  const buildEditPayload = (): CategoryPayload | null => {
    if (!editingCategory) {
      toast.error('Không tìm thấy danh mục để cập nhật');
      return null;
    }

    const name = form.name.trim();
    const slug = slugify(form.slug);

    if (!name) {
      toast.error('Vui lòng nhập tên danh mục');
      return null;
    }

    if (!slug) {
      toast.error('Slug không hợp lệ');
      return null;
    }

    const parentId =
      typeof editingCategory.parentId === 'object' && editingCategory.parentId
        ? editingCategory.parentId._id || null
        : typeof editingCategory.parentId === 'string'
          ? editingCategory.parentId
          : null;

    return {
      name,
      slug,
      parentId,
      group: editingCategory.group || 'unisex',
      type: editingCategory.type || 'khac',
      sortOrder: editingCategory.sortOrder || 0,
      status: form.status,
    };
  };

  const handleSubmit = async () => {
    const payload = formMode === 'create' ? buildCreatePayload() : buildEditPayload();
    if (!payload) return;

    setSubmitting(true);

    try {
      if (formMode === 'create') {
        await categoryService.createCategory(payload);
        toast.success('Tạo danh mục thành công');
      } else {
        if (!editingCategory?.slug) {
          toast.error('Không tìm thấy danh mục để cập nhật');
          return;
        }

        await categoryService.updateCategory(editingCategory.slug, payload);
        toast.success('Cập nhật danh mục thành công');
      }

      closeForm();
      await fetchCategories();

      if (payload.parentId) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          next.add(String(payload.parentId));
          return next;
        });
      }
    } catch (error: any) {
      console.error('submit category error:', error);
      toast.error(
        error?.message ||
        (formMode === 'create'
          ? 'Không thể tạo danh mục'
          : 'Không thể cập nhật danh mục')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: CategoryRecord) => {
    const confirmed = window.confirm(
      `Xóa danh mục "${category.name}"?\n\nChỉ có thể xóa nếu danh mục này không có sản phẩm và không có danh mục con.`
    );

    if (!confirmed) return;

    setDeletingSlug(category.slug);

    try {
      const res = await categoryService.deleteCategory(category.slug);
      toast.success(res?.message || 'Xóa danh mục thành công');
      await fetchCategories();
    } catch (error: any) {
      console.error('delete category error:', error);
      toast.error(
        error?.message ||
        'Không thể xóa danh mục. Hãy kiểm tra danh mục này còn sản phẩm hoặc danh mục con không.'
      );
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý danh mục theo dạng cây thư mục để sản phẩm được lọc chính xác hơn.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={fetchCategories} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>

            <Button variant="outline" onClick={expandAll} disabled={loading}>
              Mở tất cả
            </Button>

            <Button variant="outline" onClick={collapseAll} disabled={loading}>
              Thu gọn
            </Button>

            <Button onClick={openCreateRoot}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm danh mục cấp 1
            </Button>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <FolderTree className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm theo tên, slug, đường dẫn hoặc nhóm danh mục..."
                  className="pl-9"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Tổng: {totalCategoryCount} danh mục
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cây danh mục</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-4 rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Cách dùng:</p>
              <p className="mt-1">
                Bấm vào mũi tên để mở rộng danh mục. Muốn thêm danh mục con ở đâu thì bấm
                “Thêm vào đây” ngay tại dòng đó. Ví dụ muốn thêm “Áo Sơ Mi Nam” thì bấm
                “Thêm vào đây” ở dòng “Áo Nam”.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Đang tải danh mục...
                </div>
              ) : filteredTree.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Không có danh mục phù hợp.
                </div>
              ) : (
                filteredTree.map((category) => (
                  <CategoryTreeNode
                    key={category._id}
                    category={category}
                    depth={0}
                    expandedIds={expandedIds}
                    onToggle={toggleExpand}
                    onAddChild={openCreateChild}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deletingSlug={deletingSlug}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background shadow-2xl">
              <div className="flex items-start justify-between border-b p-5">
                <div>
                  <h2 className="text-xl font-semibold">
                    {formMode === 'create'
                      ? selectedParent
                        ? `Thêm danh mục vào “${selectedParent.name}”`
                        : 'Thêm danh mục cấp 1'
                      : `Chỉnh sửa “${editingCategory?.name || ''}”`}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formMode === 'create'
                      ? selectedParent
                        ? 'Danh mục mới sẽ nằm bên trong danh mục bạn vừa chọn.'
                        : 'Danh mục cấp 1 thường là Nam, Nữ, Thể thao hoặc Phụ kiện.'
                      : 'Sửa tên hoặc slug không làm mất sản phẩm vì sản phẩm đang liên kết bằng ID danh mục.'}
                  </p>
                </div>

                <Button variant="ghost" size="sm" onClick={closeForm} disabled={submitting}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-5 p-5">
                {formMode === 'create' && selectedParent && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Bạn đang thêm danh mục con vào <strong>{selectedParent.name}</strong>.
                    Hệ thống sẽ tự hiểu danh mục mới thuộc khu vực{' '}
                    <strong>
                      {groupLabels[(selectedParent.group || 'unisex') as CategoryGroup] ||
                        'Unisex'}
                    </strong>{' '}
                    và nhóm sản phẩm{' '}
                    <strong>
                      {typeLabels[(selectedParent.type || 'khac') as CategoryType] || 'Khác'}
                    </strong>
                    .
                  </div>
                )}

                {formMode === 'edit' && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    Khi sửa tên danh mục, các sản phẩm đã gắn với danh mục này vẫn giữ nguyên
                    vì hệ thống lưu theo ID danh mục.
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tên danh mục</label>
                    <Input
                      value={form.name}
                      onChange={(event) => handleChangeForm('name', event.target.value)}
                      placeholder="Ví dụ: Áo Sơ Mi Nam"
                    />
                    <p className="text-xs text-muted-foreground">
                      Tên hiển thị trong admin và bộ lọc sản phẩm.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={form.slug}
                      onChange={(event) => {
                        setSlugTouched(true);
                        handleChangeForm('slug', event.target.value);
                      }}
                      placeholder="ao-so-mi-nam"
                    />
                    <p className="text-xs text-muted-foreground">
                      Có thể để hệ thống tự sinh từ tên danh mục.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      handleChangeForm('status', event.target.value as CategoryStatus)
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Danh mục ẩn sẽ không nên hiển thị ở bộ lọc ngoài trang khách hàng.
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <p className="font-medium text-foreground">Đường dẫn dự kiến</p>
                  <p className="mt-1 break-all text-muted-foreground">
                    {formatPath(pathPreview)}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {pathPreview}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t p-5">
                <Button variant="outline" onClick={closeForm} disabled={submitting}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? 'Đang lưu...'
                    : formMode === 'create'
                      ? 'Tạo danh mục'
                      : 'Lưu thay đổi'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}