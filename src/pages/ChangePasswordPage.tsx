import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  changePassword,
  getMe,
  isLoggedIn,
  type UserProfile,
} from '@/services/api/userService';

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isLoggedIn()) {
        navigate('/dang-nhap');
        return;
      }

      try {
        const profile = await getMe();
        setUser(profile);
      } catch (error) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        navigate('/dang-nhap');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword || !newPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);

      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      toast.success(res?.message || 'Đổi mật khẩu thành công');

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/tai-khoan');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-10">
          Đang tải thông tin tài khoản...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <KeyRound className="h-6 w-6" />
          </div>

          <h1 className="mb-2 text-2xl font-bold">Đổi mật khẩu</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Cập nhật mật khẩu đăng nhập cho tài khoản của bạn.
          </p>

          {user && user.hasPassword === false ? (
            <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-medium text-amber-800">
                Tài khoản này đang đăng nhập bằng Google.
              </p>
              <p className="text-amber-700">
                Bạn chưa có mật khẩu riêng trên hệ thống. Nếu muốn đăng nhập bằng email và mật khẩu,
                hãy dùng chức năng quên mật khẩu để thiết lập mật khẩu mới.
              </p>

              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/quen-mat-khau">Thiết lập mật khẩu</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/tai-khoan">Quay lại tài khoản</Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}