import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { vietnamLocations } from '@/data/vietnamLocations';
import {
  addAddress,
  deleteAddress,
  getAddresses,
  isLoggedIn,
  setDefaultAddress,
  updateAddress,
  type AddressPayload,
  type UserAddress,
} from '@/services/api/userService';

type SelectOption = {
  name: string;
};

type SearchableSelectProps = {
  label: string;
  value: string;
  placeholder: string;
  searchPlaceholder: string;
  options: SelectOption[];
  disabled?: boolean;
  emptyText?: string;
  onSelect: (value: string) => void;
};

const emptyForm: AddressPayload = {
  receiverName: '',
  phone: '',
  addressLine: '',
  ward: '',
  district: '',
  city: '',
  isDefault: false,
};

function getAddressId(address: UserAddress) {
  return address._id || address.id || '';
}

function formatAddress(address: UserAddress) {
  return [
    address.addressLine,
    address.ward,
    address.district,
    address.city,
  ]
    .filter(Boolean)
    .join(', ');
}

function removeVietnameseTones(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function matchesSearch(name: string, keyword: string) {
  if (!keyword.trim()) return true;
  return removeVietnameseTones(name).includes(removeVietnameseTones(keyword));
}

function SearchableSelect({
  label,
  value,
  placeholder,
  searchPlaceholder,
  options,
  disabled = false,
  emptyText = 'Không tìm thấy kết quả',
  onSelect,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const filteredOptions = useMemo(() => {
    return options.filter((option) => matchesSearch(option.name, keyword));
  }, [keyword, options]);

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setKeyword('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <Label>{label}</Label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className="mt-1 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && !disabled ? (
        <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl border bg-white p-3 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          <div className="mt-2 max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option.name)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100"
                >
                  <span>{option.name}</span>

                  {value === option.name ? (
                    <Check className="h-4 w-4 text-blue-600" />
                  ) : null}
                </button>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                {emptyText}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AddressPage() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState<AddressPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const selectedProvince = useMemo(() => {
    return vietnamLocations.find((province) => province.name === form.city);
  }, [form.city]);

  const selectedDistrict = useMemo(() => {
    return selectedProvince?.districts.find(
      (district) => district.name === form.district
    );
  }, [form.district, selectedProvince]);

  const provinceOptions = useMemo(() => {
    return vietnamLocations.map((province) => ({
      name: province.name,
    }));
  }, []);

  const districtOptions = useMemo(() => {
    if (!selectedProvince) return [];

    return selectedProvince.districts.map((district) => ({
      name: district.name,
    }));
  }, [selectedProvince]);

  const wardOptions = useMemo(() => {
    if (!selectedDistrict) return [];

    return selectedDistrict.wards.map((ward) => ({
      name: ward.name,
    }));
  }, [selectedDistrict]);

  const fullAddressPreview = [
    form.addressLine,
    form.ward,
    form.district,
    form.city,
  ]
    .filter(Boolean)
    .join(', ');

  const loadAddresses = async () => {
    if (!isLoggedIn()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data);
    } catch (error: any) {
      toast.error(error?.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleChange = (field: keyof AddressPayload, value: string | boolean) => {
    setForm((prev) => {
      if (field === 'city') {
        return {
          ...prev,
          city: String(value),
          district: '',
          ward: '',
        };
      }

      if (field === 'district') {
        return {
          ...prev,
          district: String(value),
          ward: '',
        };
      }

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleOpenAdd = () => {
    setEditingAddressId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const handleOpenEdit = (address: UserAddress) => {
    setEditingAddressId(getAddressId(address));
    setForm({
      receiverName: address.receiverName || '',
      phone: address.phone || '',
      addressLine: address.addressLine || '',
      ward: address.ward || '',
      district: address.district || '',
      city: address.city || '',
      isDefault: !!address.isDefault,
    });
    setFormOpen(true);
  };

  const handleCancelForm = () => {
    setEditingAddressId(null);
    setForm(emptyForm);
    setFormOpen(false);
  };

  const validateForm = () => {
    if (!form.receiverName.trim()) {
      toast.error('Vui lòng nhập tên người nhận');
      return false;
    }

    if (!form.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return false;
    }

    if (!/^(0|\+84)[0-9]{9,10}$/.test(form.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ');
      return false;
    }

    if (!form.city.trim()) {
      toast.error('Vui lòng chọn tỉnh/thành phố');
      return false;
    }

    if (!form.district.trim()) {
      toast.error('Vui lòng chọn quận/huyện');
      return false;
    }

    if (!form.ward.trim()) {
      toast.error('Vui lòng chọn phường/xã');
      return false;
    }

    if (!form.addressLine.trim()) {
      toast.error('Vui lòng nhập địa chỉ cụ thể');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload: AddressPayload = {
      receiverName: form.receiverName.trim(),
      phone: form.phone.trim(),
      addressLine: form.addressLine.trim(),
      ward: form.ward.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      isDefault: !!form.isDefault,
    };

    try {
      setSaving(true);

      const data = editingAddressId
        ? await updateAddress(editingAddressId, payload)
        : await addAddress(payload);

      setAddresses(data);
      handleCancelForm();

      toast.success(
        editingAddressId
          ? 'Đã cập nhật địa chỉ giao hàng'
          : 'Đã thêm địa chỉ giao hàng'
      );
    } catch (error: any) {
      toast.error(error?.message || 'Không thể lưu địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address: UserAddress) => {
    const addressId = getAddressId(address);
    if (!addressId) return;

    const confirmed = window.confirm('Bạn có chắc muốn xóa địa chỉ này?');
    if (!confirmed) return;

    try {
      const data = await deleteAddress(addressId);
      setAddresses(data);
      toast.success('Đã xóa địa chỉ');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể xóa địa chỉ');
    }
  };

  const handleSetDefault = async (address: UserAddress) => {
    const addressId = getAddressId(address);
    if (!addressId || address.isDefault) return;

    try {
      const data = await setDefaultAddress(addressId);
      setAddresses(data);
      toast.success('Đã đặt làm địa chỉ mặc định');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể đặt địa chỉ mặc định');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10">
          Đang tải danh sách địa chỉ...
        </div>
      </MainLayout>
    );
  }

  if (!isLoggedIn()) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-2xl font-bold">Địa chỉ giao hàng</h1>
            <p className="mb-4 text-muted-foreground">
              Bạn cần đăng nhập để quản lý địa chỉ giao hàng.
            </p>
            <Button onClick={() => navigate('/dang-nhap')}>
              Đi đến đăng nhập
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate('/tai-khoan')}
              className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Quay lại tài khoản
            </button>

            <h1 className="text-3xl font-bold">Địa chỉ giao hàng</h1>
            <p className="text-muted-foreground">
              Quản lý địa chỉ nhận hàng dùng cho quá trình đặt hàng.
            </p>
          </div>

          <Button onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm địa chỉ
          </Button>
        </div>

        {formOpen ? (
          <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  {editingAddressId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Nhập thông tin người nhận và địa chỉ giao hàng.
                </p>
              </div>

              <Button variant="outline" onClick={handleCancelForm}>
                <X className="mr-2 h-4 w-4" />
                Hủy
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="receiverName">Người nhận</Label>
                <Input
                  id="receiverName"
                  value={form.receiverName}
                  onChange={(event) =>
                    handleChange('receiverName', event.target.value)
                  }
                  placeholder="Ví dụ: Mai Nhật Hào"
                />
              </div>

              <div>
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  placeholder="Ví dụ: 0909123456"
                />
              </div>

              <SearchableSelect
                label="Tỉnh/Thành phố"
                value={form.city}
                placeholder="Chọn tỉnh/thành phố"
                searchPlaceholder="Tìm tỉnh/thành phố, ví dụ: Ho, Ha Noi"
                options={provinceOptions}
                onSelect={(value) => handleChange('city', value)}
              />

              <SearchableSelect
                label="Quận/Huyện"
                value={form.district}
                placeholder={
                  selectedProvince
                    ? 'Chọn quận/huyện'
                    : 'Chọn tỉnh/thành phố trước'
                }
                searchPlaceholder="Tìm quận/huyện"
                options={districtOptions}
                disabled={!selectedProvince}
                onSelect={(value) => handleChange('district', value)}
              />

              <SearchableSelect
                label="Phường/Xã"
                value={form.ward}
                placeholder={
                  selectedDistrict
                    ? 'Chọn phường/xã'
                    : 'Chọn quận/huyện trước'
                }
                searchPlaceholder="Tìm phường/xã"
                options={wardOptions}
                disabled={!selectedDistrict}
                onSelect={(value) => handleChange('ward', value)}
              />

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.isDefault}
                    onChange={(event) =>
                      handleChange('isDefault', event.target.checked)
                    }
                  />
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="addressLine">Địa chỉ cụ thể</Label>
                <Input
                  id="addressLine"
                  value={form.addressLine}
                  onChange={(event) =>
                    handleChange('addressLine', event.target.value)
                  }
                  placeholder="Số nhà, tên đường, tòa nhà..."
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Địa chỉ đầy đủ:{' '}
                  <span className="font-medium text-foreground">
                    {fullAddressPreview || 'Chưa đủ thông tin địa chỉ'}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu địa chỉ
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}

        {addresses.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <MapPin className="h-8 w-8 text-slate-500" />
            </div>

            <h2 className="mb-2 text-xl font-bold">
              Bạn chưa có địa chỉ giao hàng
            </h2>
            <p className="mb-5 text-muted-foreground">
              Thêm địa chỉ để quá trình đặt hàng nhanh hơn.
            </p>

            <Button onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm địa chỉ đầu tiên
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={getAddressId(address)}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold">
                        {address.receiverName}
                      </h2>

                      {address.isDefault ? (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          <Star className="mr-1 h-3 w-3" />
                          Mặc định
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Số điện thoại:{' '}
                      <span className="font-medium text-foreground">
                        {address.phone}
                      </span>
                    </p>

                    <p className="mt-2 text-sm">
                      {formatAddress(address) || 'Chưa cập nhật địa chỉ'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!address.isDefault ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Đặt mặc định
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(address)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Sửa
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(address)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}