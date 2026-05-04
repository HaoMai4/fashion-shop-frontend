import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  Heart,
  Package,
  TicketPercent,
  Briefcase,
  ShieldCheck,
  ShoppingBag,
  Save,
  Loader2,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  clearAuth,
  getStoredUser,
  getMe,
  updateMe,
  getAddresses,
  isLoggedIn,
  type UserProfile,
  type UserAddress,
} from '@/services/api/userService';

type MenuItem = {
  key: string;
  label: string;
  icon: ReactNode;
  action: () => void;
};

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
};

function normalizeRole(role?: string) {
  return String(role || '').trim().toLowerCase();
}

function getRoleLabel(role?: string) {
  const normalized = normalizeRole(role);

  if (normalized === 'admin') return 'Quản trị viên';
  if (normalized === 'staff') return 'Nhân viên';
  return 'Thành viên';
}

function getGenderLabel(gender?: string) {
  const normalized = String(gender || '').trim().toLowerCase();

  if (normalized === 'nam' || normalized === 'male') return 'Nam';
  if (normalized === 'nu' || normalized === 'female') return 'Nữ';
  if (normalized === 'khac' || normalized === 'other') return 'Khác';
  return 'Chưa cập nhật';
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';

  return date.toLocaleDateString('vi-VN');
}

function formatAddress(address?: UserAddress | null) {
  if (!address) return 'Chưa cập nhật';

  const fullAddress = [
    address.addressLine,
    address.ward,
    address.district,
    address.city,
  ]
    .filter(Boolean)
    .join(', ');

  return fullAddress || 'Chưa cập nhật';
}

function buildFormFromUser(user?: UserProfile | null): ProfileForm {
  return {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || user?.sdt || '',
    gender: user?.gender || '',
    dateOfBirth: toDateInputValue(user?.dateOfBirth),
  };
}

export default function AccountPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [defaultAddress, setDefaultAddress] = useState<UserAddress | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => buildFormFromUser(getStoredUser()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getMe();
        setUser(profile);
        setForm(buildFormFromUser(profile));

        try {
          const addressList = await getAddresses();
          const mainAddress =
            addressList.find((item) => item.isDefault) || addressList[0] || null;
          setDefaultAddress(mainAddress);
        } catch (addressError) {
          console.error('Load default address error:', addressError);
          setDefaultAddress(null);
        }
      } catch (error: any) {
        clearAuth();
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        navigate('/dang-nhap');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    toast.success('Đã đăng xuất');
    navigate('/dang-nhap');
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = form.phone.trim();

    if (!firstName) {
      toast.error('Vui lòng nhập họ và tên đệm');
      return;
    }

    if (!lastName) {
      toast.error('Vui lòng nhập tên');
      return;
    }

    try {
      setSaving(true);

      const updatedUser = await updateMe({
        firstName,
        lastName,
        phone,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
      });

      setUser(updatedUser);
      setForm(buildFormFromUser(updatedUser));

      window.dispatchEvent(new Event('stylehub_user_updated'));
      toast.success('Đã cập nhật thông tin tài khoản');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể cập nhật thông tin tài khoản');
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    user?.hoTen ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    'Khách hàng';

  const email = user?.email || 'Chưa cập nhật';
  const joinedDate = formatDate(user?.createdAt);
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'admin';

  const menuItems: MenuItem[] = useMemo(() => {
    const baseItems: MenuItem[] = [
      {
        key: 'address',
        label: 'Địa chỉ giao hàng',
        icon: <MapPin className="h-5 w-5 text-slate-500" />,
        action: () => {
          navigate('/dia-chi');
        },
      },
      {
        key: 'orders',
        label: 'Đơn hàng của tôi',
        icon: <Package className="h-5 w-5 text-slate-500" />,
        action: () => {
          navigate('/don-hang');
        },
      },
      {
        key: 'wishlist',
        label: 'Sản phẩm yêu thích',
        icon: <Heart className="h-5 w-5 text-slate-500" />,
        action: () => {
          navigate('/yeu-thich');
        },
      },
      {
        key: 'voucher-wallet',
        label: 'Ví voucher',
        icon: <TicketPercent className="h-5 w-5 text-slate-500" />,
        action: () => {
          navigate('/vi-voucher');
        },
      },
      {
        key: 'ai-history',
        label: 'Lịch sử AI tư vấn',
        icon: <Briefcase className="h-5 w-5 text-slate-500" />,
        action: () => {
          toast.info('Phần lịch sử AI tư vấn sẽ làm ở bước sau');
        },
      },
    ];

    if (isAdmin) {
      baseItems.splice(2, 0, {
        key: 'admin',
        label: 'Quản trị hệ thống',
        icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
        action: () => {
          navigate('/admin');
        },
      });

      baseItems.splice(3, 0, {
        key: 'admin-orders',
        label: 'Quản lý đơn hàng',
        icon: <ShoppingBag className="h-5 w-5 text-blue-600" />,
        action: () => {
          navigate('/admin/orders');
        },
      });
    }

    return baseItems;
  }, [isAdmin, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10">
          Đang tải thông tin tài khoản...
        </div>
      </MainLayout>
    );
  }

  if (!isLoggedIn() || !user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-xl rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="mb-2 text-2xl font-bold">Tài khoản</h1>
            <p className="mb-4 text-muted-foreground">Bạn chưa đăng nhập.</p>
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
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-blue-600">
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-3xl font-bold">{fullName}</h1>
                <p className="text-muted-foreground">{email}</p>
                <p className={`mt-1 text-sm ${isAdmin ? 'text-blue-600' : 'text-amber-600'}`}>
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>

        {isAdmin ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-blue-700">Tài khoản quản trị</p>
                <p className="text-sm text-blue-600">
                  Bạn có thể vào khu vực quản trị để quản lý hệ thống.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/admin')}>
                  Vào trang admin
                </Button>
                <Button onClick={() => navigate('/admin/orders')}>
                  Quản lý đơn hàng
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.action}
                className="flex w-full items-center justify-between rounded-xl border bg-white px-5 py-4 text-left shadow-sm transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>

                <ChevronRight className="h-5 w-5 text-slate-400" />
              </button>
            ))}
          </div>

          <div
            id="profile-info"
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Thông tin cá nhân</h2>
                <p className="text-sm text-muted-foreground">
                  Cập nhật thông tin cơ bản dùng cho tài khoản và đơn hàng.
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">Họ và tên đệm</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(event) => handleChange('firstName', event.target.value)}
                  placeholder="Ví dụ: Mai Nhật"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Tên</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(event) => handleChange('lastName', event.target.value)}
                  placeholder="Ví dụ: Hào"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-slate-50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Email dùng để đăng nhập nên không chỉnh sửa tại đây.
                </p>
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

              <div>
                <Label htmlFor="gender">Giới tính</Label>
                <select
                  id="gender"
                  value={form.gender}
                  onChange={(event) => handleChange('gender', event.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Chưa cập nhật</option>
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              <div>
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Ngày tham gia</p>
                <p className="font-medium">{joinedDate}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Vai trò</p>
                <p className="font-medium">{getRoleLabel(user.role)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Giới tính hiện tại</p>
                <p className="font-medium">{getGenderLabel(user.gender)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Ngày sinh hiện tại</p>
                <p className="font-medium">{formatDate(user.dateOfBirth)}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Địa chỉ mặc định</p>
                <p className="font-medium">{formatAddress(defaultAddress)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Địa chỉ mặc định dùng cho quá trình thanh toán.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate('/dia-chi')}
                >
                  Quản lý địa chỉ giao hàng
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}