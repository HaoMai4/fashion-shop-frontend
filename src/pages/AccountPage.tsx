import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  Heart,
  Package,
  User,
  Award,
  Briefcase,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  clearAuth,
  getStoredUser,
  getMe,
  isLoggedIn,
  type UserProfile,
} from '@/services/api/userService';

type MenuItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
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

export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getMe();
        setUser(profile);
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

  const fullName =
    user?.hoTen ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    'Khách hàng';

  const email = user?.email || 'Chưa cập nhật';
  const phone = user?.sdt || user?.phone || 'Chưa cập nhật';
  const joinedDate = 'Chưa cập nhật';
  const role = normalizeRole(user?.role);
  const isAdmin = role === 'admin';

  const menuItems: MenuItem[] = useMemo(() => {
    const baseItems: MenuItem[] = [
      {
        key: 'profile',
        label: 'Thông tin cá nhân',
        icon: <User className="h-5 w-5 text-slate-500" />,
        action: () => {
          const section = document.getElementById('profile-info');
          section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      },
      {
        key: 'address',
        label: 'Địa chỉ giao hàng',
        icon: <MapPin className="h-5 w-5 text-slate-500" />,
        action: () => {
          toast.info('Phần địa chỉ giao hàng sẽ làm ở bước sau');
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
          toast.info('Phần sản phẩm yêu thích sẽ làm ở bước sau');
        },
      },
      {
        key: 'points',
        label: 'Điểm thành viên',
        icon: <Award className="h-5 w-5 text-slate-500" />,
        action: () => {
          toast.info('Phần điểm thành viên sẽ làm ở bước sau');
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
      baseItems.splice(3, 0, {
        key: 'admin',
        label: 'Quản trị hệ thống',
        icon: <ShieldCheck className="h-5 w-5 text-blue-600" />,
        action: () => {
          navigate('/admin');
        },
      });

      baseItems.splice(4, 0, {
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
            <Button onClick={() => navigate('/dang-nhap')}>Đi đến đăng nhập</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-blue-600">
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
                  Bạn có thể vào khu vực quản trị để quản lý đơn hàng.
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

        <div className="mb-6 space-y-3">
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
          <h2 className="mb-5 text-2xl font-bold">Thông tin cá nhân</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Họ tên</p>
              <p className="font-medium">{fullName}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Số điện thoại</p>
              <p className="font-medium">{phone}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Ngày tham gia</p>
              <p className="font-medium">{joinedDate}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Vai trò</p>
              <p className="font-medium">{getRoleLabel(user.role)}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Địa chỉ</p>
              <p className="font-medium">{user.diaChi || user.address || 'Chưa cập nhật'}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}