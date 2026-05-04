import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Edit,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  TicketPercent,
  Trash2,
  X,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatPrice } from '@/utils/format';
import { toast } from 'sonner';
import {
  createAdminVoucher,
  deleteAdminVoucher,
  getAdminVouchers,
  updateAdminVoucher,
  type AdminVoucher,
  type VoucherPayload,
} from '@/services/api/voucherService';

type VoucherForm = {
  code: string;
  title: string;
  description: string;
  detail: string;
  terms: string;
  type: 'percent' | 'fixed';
  value: string;
  maxDiscount: string;
  minOrderValue: string;
  startAt: string;
  endAt: string;
  usageLimit: string;
  perUserLimit: string;
  active: boolean;
  visibleToUsers: boolean;
  combinable: boolean;
};

type FilterStatus = 'all' | 'active' | 'inactive';
type VisibleFilter = 'all' | 'visible' | 'hidden';

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function nextMonthInputValue() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function emptyForm(): VoucherForm {
  return {
    code: '',
    title: '',
    description: '',
    detail: '',
    terms: '',
    type: 'percent',
    value: '',
    maxDiscount: '',
    minOrderValue: '0',
    startAt: todayInputValue(),
    endAt: nextMonthInputValue(),
    usageLimit: '',
    perUserLimit: '1',
    active: true,
    visibleToUsers: true,
    combinable: false,
  };
}

function buildFormFromVoucher(voucher: AdminVoucher): VoucherForm {
  return {
    code: voucher.code || '',
    title: voucher.title || '',
    description: voucher.description || '',
    detail: voucher.detail || '',
    terms: voucher.terms || '',
    type: voucher.type || 'percent',
    value: String(voucher.value || ''),
    maxDiscount:
      voucher.maxDiscount === null || voucher.maxDiscount === undefined
        ? ''
        : String(voucher.maxDiscount),
    minOrderValue: String(voucher.minOrderValue || 0),
    startAt: toDateInputValue(voucher.startAt),
    endAt: toDateInputValue(voucher.endAt),
    usageLimit:
      voucher.usageLimit === null || voucher.usageLimit === undefined
        ? ''
        : String(voucher.usageLimit),
    perUserLimit:
      voucher.perUserLimit === null || voucher.perUserLimit === undefined
        ? ''
        : String(voucher.perUserLimit),
    active: voucher.active !== false,
    visibleToUsers: voucher.visibleToUsers !== false,
    combinable: voucher.combinable === true,
  };
}

function toNullableNumber(value: string) {
  const trimmed = String(value || '').trim();

  if (!trimmed) return null;

  return Number(trimmed);
}

function buildPayload(form: VoucherForm): VoucherPayload {
  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim(),
    description: form.description.trim(),
    detail: form.detail.trim(),
    terms: form.terms.trim(),
    type: form.type,
    value: Number(form.value || 0),
    maxDiscount: toNullableNumber(form.maxDiscount),
    minOrderValue: Number(form.minOrderValue || 0),
    startAt: form.startAt,
    endAt: form.endAt,
    usageLimit: toNullableNumber(form.usageLimit),
    perUserLimit: toNullableNumber(form.perUserLimit),
    active: form.active,
    visibleToUsers: form.visibleToUsers,
    combinable: form.combinable,
  };
}

function getVoucherDiscountText(voucher: AdminVoucher) {
  if (voucher.type === 'percent') {
    const maxText =
      voucher.maxDiscount && voucher.maxDiscount > 0
        ? `, tối đa ${formatPrice(voucher.maxDiscount)}`
        : '';

    return `Giảm ${voucher.value}%${maxText}`;
  }

  return `Giảm ${formatPrice(voucher.value)}`;
}

function getVoucherDescription(voucher: AdminVoucher) {
  if (voucher.description?.trim()) return voucher.description.trim();

  const minText =
    voucher.minOrderValue && voucher.minOrderValue > 0
      ? ` cho đơn từ ${formatPrice(voucher.minOrderValue)}`
      : '';

  return `${getVoucherDiscountText(voucher)}${minText}`;
}

function getVoucherStatus(voucher: AdminVoucher) {
  const now = new Date();
  const startAt = voucher.startAt ? new Date(voucher.startAt) : null;
  const endAt = voucher.endAt ? new Date(voucher.endAt) : null;

  if (!voucher.active) {
    return {
      label: 'Đã tắt',
      variant: 'secondary' as const,
    };
  }

  if (startAt && now < startAt) {
    return {
      label: 'Chưa bắt đầu',
      variant: 'outline' as const,
    };
  }

  if (endAt && now > endAt) {
    return {
      label: 'Hết hạn',
      variant: 'destructive' as const,
    };
  }

  if (
    voucher.usageLimit !== null &&
    voucher.usageLimit !== undefined &&
    Number(voucher.usedCount || 0) >= Number(voucher.usageLimit)
  ) {
    return {
      label: 'Hết lượt',
      variant: 'destructive' as const,
    };
  }

  return {
    label: 'Đang hoạt động',
    variant: 'default' as const,
  };
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<AdminVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [visibleFilter, setVisibleFilter] = useState<VisibleFilter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucher | null>(null);
  const [form, setForm] = useState<VoucherForm>(() => emptyForm());

  const filteredSummary = useMemo(() => {
    return {
      total: vouchers.length,
      active: vouchers.filter((item) => item.active !== false).length,
      hidden: vouchers.filter((item) => item.visibleToUsers === false).length,
      visible: vouchers.filter((item) => item.visibleToUsers !== false).length,
    };
  }, [vouchers]);

  const loadVouchers = async () => {
    try {
      setLoading(true);

      const data = await getAdminVouchers({
        q: query.trim() || undefined,
        active:
          activeFilter === 'active'
            ? true
            : activeFilter === 'inactive'
              ? false
              : undefined,
        visibleToUsers:
          visibleFilter === 'visible'
            ? true
            : visibleFilter === 'hidden'
              ? false
              : undefined,
      });

      setVouchers(data);
    } catch (error: any) {
      console.error('Load admin vouchers error:', error);
      toast.error(error?.message || 'Không thể tải danh sách voucher');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, visibleFilter]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadVouchers();
  };

  const openCreateForm = () => {
    setEditingVoucher(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEditForm = (voucher: AdminVoucher) => {
    setEditingVoucher(voucher);
    setForm(buildFormFromVoucher(voucher));
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingVoucher(null);
    setForm(emptyForm());
  };

  const handleFormChange =
    (field: keyof VoucherForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = event.target;

      if (target instanceof HTMLInputElement && target.type === 'checkbox') {
        setForm((prev) => ({
          ...prev,
          [field]: target.checked,
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        [field]: target.value,
      }));
    };

  const validateForm = () => {
    if (!form.code.trim()) {
      toast.error('Vui lòng nhập mã voucher');
      return false;
    }

    if (!form.value || Number(form.value) <= 0) {
      toast.error('Giá trị giảm giá phải lớn hơn 0');
      return false;
    }

    if (form.type === 'percent' && Number(form.value) > 100) {
      toast.error('Voucher phần trăm không được vượt quá 100%');
      return false;
    }

    if (!form.endAt) {
      toast.error('Vui lòng chọn ngày kết thúc');
      return false;
    }

    if (form.startAt && form.endAt && new Date(form.startAt) > new Date(form.endAt)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return false;
    }

    if (form.maxDiscount && Number(form.maxDiscount) < 0) {
      toast.error('Giảm tối đa không hợp lệ');
      return false;
    }

    if (form.minOrderValue && Number(form.minOrderValue) < 0) {
      toast.error('Đơn tối thiểu không hợp lệ');
      return false;
    }

    if (form.usageLimit && Number(form.usageLimit) < 0) {
      toast.error('Giới hạn lượt dùng không hợp lệ');
      return false;
    }

    if (form.perUserLimit && Number(form.perUserLimit) < 0) {
      toast.error('Giới hạn mỗi người dùng không hợp lệ');
      return false;
    }

    return true;
  };

  const handleSubmitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayload(form);

      if (editingVoucher?._id) {
        await updateAdminVoucher(editingVoucher._id, payload);
        toast.success('Đã cập nhật voucher');
      } else {
        await createAdminVoucher(payload);
        toast.success('Đã tạo voucher');
      }

      closeForm();
      await loadVouchers();
    } catch (error: any) {
      console.error('Save voucher error:', error);
      toast.error(error?.message || 'Không thể lưu voucher');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (voucher: AdminVoucher) => {
    try {
      await updateAdminVoucher(voucher._id, {
        active: !(voucher.active !== false),
      });

      toast.success(
        voucher.active !== false ? 'Đã tắt voucher' : 'Đã bật voucher'
      );

      await loadVouchers();
    } catch (error: any) {
      toast.error(error?.message || 'Không thể cập nhật trạng thái voucher');
    }
  };

  const handleToggleVisible = async (voucher: AdminVoucher) => {
    try {
      await updateAdminVoucher(voucher._id, {
        visibleToUsers: voucher.visibleToUsers === false,
      });

      toast.success(
        voucher.visibleToUsers === false
          ? 'Đã hiện voucher trong ví người dùng'
          : 'Đã ẩn voucher khỏi ví người dùng'
      );

      await loadVouchers();
    } catch (error: any) {
      toast.error(error?.message || 'Không thể cập nhật hiển thị voucher');
    }
  };

  const handleDelete = async (voucher: AdminVoucher) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa voucher ${voucher.code}? Hành động này không thể hoàn tác.`
    );

    if (!confirmed) return;

    try {
      await deleteAdminVoucher(voucher._id);
      toast.success('Đã xóa voucher');
      await loadVouchers();
    } catch (error: any) {
      toast.error(error?.message || 'Không thể xóa voucher');
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quản lý voucher</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tạo, chỉnh sửa, bật/tắt và ẩn/hiện voucher trong ví người dùng.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={loadVouchers} disabled={loading}>
              <RefreshCw className="h-4 w-4" />
              Tải lại
            </Button>

            <Button className="gap-2" onClick={openCreateForm}>
              <Plus className="h-4 w-4" />
              Tạo voucher
            </Button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Tổng voucher</p>
              <p className="mt-1 text-2xl font-bold">{filteredSummary.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Đang bật</p>
              <p className="mt-1 text-2xl font-bold">{filteredSummary.active}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Hiện trong ví</p>
              <p className="mt-1 text-2xl font-bold">{filteredSummary.visible}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Đang ẩn</p>
              <p className="mt-1 text-2xl font-bold">{filteredSummary.hidden}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-4">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[1fr_180px_180px_120px]">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo mã, tiêu đề hoặc mô tả..."
              />

              <select
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as FilterStatus)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Đã tắt</option>
              </select>

              <select
                value={visibleFilter}
                onChange={(event) => setVisibleFilter(event.target.value as VisibleFilter)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Tất cả hiển thị</option>
                <option value="visible">Hiện trong ví</option>
                <option value="hidden">Đang ẩn</option>
              </select>

              <Button type="submit">Tìm</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TicketPercent className="h-5 w-5" />
              Danh sách voucher
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Đang tải danh sách voucher...
              </div>
            ) : vouchers.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Không có voucher phù hợp
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã voucher</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Điều kiện</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Lượt dùng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {vouchers.map((voucher) => {
                    const status = getVoucherStatus(voucher);

                    return (
                      <TableRow key={voucher._id}>
                        <TableCell>
                          <div>
                            <p className="font-bold">{voucher.code}</p>
                            <p className="text-xs text-muted-foreground">
                              {voucher.type === 'percent' ? 'Theo phần trăm' : 'Giảm cố định'}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-[280px]">
                          <p className="font-medium">
                            {voucher.title || getVoucherDiscountText(voucher)}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {getVoucherDescription(voucher)}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>Đơn từ {formatPrice(voucher.minOrderValue || 0)}</p>
                            <p className="text-muted-foreground">
                              {voucher.maxDiscount
                                ? `Tối đa ${formatPrice(voucher.maxDiscount)}`
                                : 'Không giới hạn giảm tối đa'}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>{voucher.startAt ? formatDate(voucher.startAt) : 'Chưa có'}</p>
                            <p className="text-muted-foreground">
                              đến {voucher.endAt ? formatDate(voucher.endAt) : 'Chưa có'}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <p>
                              {voucher.usedCount || 0}
                              {voucher.usageLimit ? `/${voucher.usageLimit}` : '/∞'}
                            </p>
                            <p className="text-muted-foreground">
                              Mỗi user: {voucher.perUserLimit ?? 'Không giới hạn'}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant={status.variant}>{status.label}</Badge>

                            <div>
                              {voucher.visibleToUsers === false ? (
                                <Badge variant="secondary">Ẩn khỏi ví</Badge>
                              ) : (
                                <Badge variant="outline">Hiện trong ví</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditForm(voucher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(voucher)}
                              title={voucher.active !== false ? 'Tắt voucher' : 'Bật voucher'}
                            >
                              {voucher.active !== false ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleVisible(voucher)}
                              title={
                                voucher.visibleToUsers === false
                                  ? 'Hiện trong ví'
                                  : 'Ẩn khỏi ví'
                              }
                            >
                              {voucher.visibleToUsers === false ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => handleDelete(voucher)}
                            >
                              <Trash2 className="h-4 w-4" />
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

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {editingVoucher ? 'Cập nhật voucher' : 'Tạo voucher mới'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Nhập thông tin mã giảm giá dùng trong ví voucher và checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-2 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Mã voucher *</Label>
                  <Input
                    value={form.code}
                    onChange={handleFormChange('code')}
                    placeholder="STYLE20"
                  />
                </div>

                <div>
                  <Label>Tiêu đề</Label>
                  <Input
                    value={form.title}
                    onChange={handleFormChange('title')}
                    placeholder="Ưu đãi StyleHub 20%"
                  />
                </div>

                <div>
                  <Label>Loại giảm *</Label>
                  <select
                    value={form.type}
                    onChange={handleFormChange('type')}
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="percent">Giảm theo phần trăm</option>
                    <option value="fixed">Giảm cố định</option>
                  </select>
                </div>

                <div>
                  <Label>
                    Giá trị giảm {form.type === 'percent' ? '(%)' : '(VNĐ)'} *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.value}
                    onChange={handleFormChange('value')}
                    placeholder={form.type === 'percent' ? '20' : '50000'}
                  />
                </div>

                <div>
                  <Label>Giảm tối đa</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.maxDiscount}
                    onChange={handleFormChange('maxDiscount')}
                    placeholder="Ví dụ: 80000"
                  />
                </div>

                <div>
                  <Label>Đơn tối thiểu</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.minOrderValue}
                    onChange={handleFormChange('minOrderValue')}
                    placeholder="Ví dụ: 500000"
                  />
                </div>

                <div>
                  <Label>Ngày bắt đầu</Label>
                  <Input
                    type="date"
                    value={form.startAt}
                    onChange={handleFormChange('startAt')}
                  />
                </div>

                <div>
                  <Label>Ngày kết thúc *</Label>
                  <Input
                    type="date"
                    value={form.endAt}
                    onChange={handleFormChange('endAt')}
                  />
                </div>

                <div>
                  <Label>Tổng lượt dùng</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.usageLimit}
                    onChange={handleFormChange('usageLimit')}
                    placeholder="Để trống nếu không giới hạn"
                  />
                </div>

                <div>
                  <Label>Lượt dùng mỗi user</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.perUserLimit}
                    onChange={handleFormChange('perUserLimit')}
                    placeholder="Ví dụ: 1"
                  />
                </div>
              </div>

              <div>
                <Label>Mô tả ngắn</Label>
                <textarea
                  value={form.description}
                  onChange={handleFormChange('description')}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Giảm 20%, tối đa 80.000đ cho đơn từ 500.000đ"
                />
              </div>

              <div>
                <Label>Chi tiết</Label>
                <textarea
                  value={form.detail}
                  onChange={handleFormChange('detail')}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Áp dụng cho khách hàng mua sắm tại StyleHub trong thời gian khuyến mãi."
                />
              </div>

              <div>
                <Label>Điều kiện sử dụng</Label>
                <textarea
                  value={form.terms}
                  onChange={handleFormChange('terms')}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Không quy đổi thành tiền mặt. Mỗi tài khoản chỉ sử dụng 1 lần."
                />
              </div>

              <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={handleFormChange('active')}
                  />
                  Voucher đang bật
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.visibleToUsers}
                    onChange={handleFormChange('visibleToUsers')}
                  />
                  Hiện trong ví người dùng
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.combinable}
                    onChange={handleFormChange('combinable')}
                  />
                  Cho phép kết hợp
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Hủy
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu
                    </>
                  ) : editingVoucher ? (
                    'Lưu thay đổi'
                  ) : (
                    'Tạo voucher'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}