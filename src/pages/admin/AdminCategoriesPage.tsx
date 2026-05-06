import { useEffect, useMemo, useState } from 'react';
import { Edit, FolderTree, Plus, RefreshCw, Trash2, X } from 'lucide-react';

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
import { toast } from 'sonner';

import {
  categoryService,
  type CategoryPayload,
  type CategoryRecord,
} from '@/services/api/categoryService';

type FormMode = 'create' | 'edit';

type CategoryForm = {
  name: string;
  slug: string;
  path: string;
};

const emptyForm: CategoryForm = {
  name: '',
  slug: '',
  path: '',
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [pathTouched, setPathTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);

    try {
      const data = await categoryService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('getCategories error:', error);
      toast.error(error?.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) {
      return categories;
    }

    return categories.filter((category) => {
      const text = [category.name, category.slug, category.path]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(q);
    });
  }, [categories, keyword]);

  const resetForm = () => {
    setForm(emptyForm);
    setFormMode('create');
    setEditingSlug(null);
    setSlugTouched(false);
    setPathTouched(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (category: CategoryRecord) => {
    setFormMode('edit');
    setEditingSlug(category.slug);
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      path: category.path || category.slug || '',
    });
    setSlugTouched(true);
    setPathTouched(true);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    if (submitting) return;

    resetForm();
    setShowForm(false);
  };

  const handleChangeForm = (field: keyof CategoryForm, value: string) => {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };

      if (field === 'name' && !slugTouched) {
        const nextSlug = slugify(value);
        next.slug = nextSlug;

        if (!pathTouched) {
          next.path = nextSlug;
        }
      }

      if (field === 'slug') {
        const nextSlug = slugify(value);
        next.slug = nextSlug;

        if (!pathTouched) {
          next.path = nextSlug;
        }
      }

      return next;
    });
  };

  const buildPayload = (): CategoryPayload | null => {
    const name = form.name.trim();
    const slug = slugify(form.slug);
    const path = form.path.trim() || slug;

    if (!name) {
      toast.error('Vui lòng nhập tên danh mục');
      return null;
    }

    if (!slug) {
      toast.error('Slug không hợp lệ');
      return null;
    }

    if (!path) {
      toast.error('Vui lòng nhập path danh mục');
      return null;
    }

    return {
      name,
      slug,
      path,
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);

    try {
      if (formMode === 'create') {
        await categoryService.createCategory(payload);
        toast.success('Tạo danh mục thành công');
      } else {
        if (!editingSlug) {
          toast.error('Không tìm thấy danh mục để cập nhật');
          return;
        }

        await categoryService.updateCategory(editingSlug, payload);
        toast.success('Cập nhật danh mục thành công');
      }

      handleCloseForm();
      await fetchCategories();
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
      `Xóa danh mục "${category.name}"? Nếu danh mục đang có sản phẩm, hệ thống sẽ không cho xóa.`
    );

    if (!confirmed) return;

    setDeletingSlug(category.slug);

    try {
      const res = await categoryService.deleteCategory(category.slug);
      toast.success(res?.message || 'Xóa danh mục thành công');
      await fetchCategories();
    } catch (error: any) {
      console.error('delete category error:', error);
      toast.error(error?.message || 'Không thể xóa danh mục');
    } finally {
      setDeletingSlug(null);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Thêm, chỉnh sửa và xóa danh mục sản phẩm của cửa hàng.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={fetchCategories} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>

            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm danh mục
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
                  placeholder="Tìm theo tên, slug hoặc path..."
                  className="pl-9"
                />
              </div>

              <div className="text-sm text-muted-foreground">
                Tổng: {categories.length} danh mục
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-4 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {formMode === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}
              </CardTitle>

              <Button variant="ghost" size="sm" onClick={handleCloseForm} disabled={submitting}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tên danh mục</label>
                <Input
                  value={form.name}
                  onChange={(event) => handleChangeForm('name', event.target.value)}
                  placeholder="Ví dụ: Áo Polo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    handleChangeForm('slug', event.target.value);
                  }}
                  placeholder="ao-polo"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Path</label>
                <Input
                  value={form.path}
                  onChange={(event) => {
                    setPathTouched(true);
                    handleChangeForm('path', event.target.value);
                  }}
                  placeholder="ao-polo"
                />
              </div>

              <div className="md:col-span-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleCloseForm} disabled={submitting}>
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách danh mục</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên danh mục</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead className="w-[180px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Đang tải danh mục...
                      </TableCell>
                    </TableRow>
                  ) : filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Không có danh mục phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category._id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell>{category.path}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(category)}
                            >
                              <Edit className="mr-1 h-4 w-4" />
                              Sửa
                            </Button>

                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(category)}
                              disabled={deletingSlug === category.slug}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              {deletingSlug === category.slug ? 'Đang xóa' : 'Xóa'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}