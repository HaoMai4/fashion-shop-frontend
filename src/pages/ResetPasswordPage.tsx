import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { forgotPassword, resetPassword } from '@/services/api/userService';

const RESEND_SECONDS = 60;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error('Vui lòng nhập email trước khi gửi lại OTP');
      return;
    }

    if (resendCooldown > 0) {
      toast.info(`Vui lòng chờ ${resendCooldown} giây trước khi gửi lại mã`);
      return;
    }

    try {
      setResending(true);

      const res = await forgotPassword(normalizedEmail);

      toast.success(res?.message || 'Đã gửi lại mã OTP');
      setResendCooldown(RESEND_SECONDS);
    } catch (error: any) {
      toast.error(error?.message || 'Không thể gửi lại OTP');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!normalizedEmail || !normalizedOtp || !newPassword) {
      toast.error('Vui lòng nhập email, OTP và mật khẩu mới');
      return;
    }

    if (normalizedOtp.length !== 6) {
      toast.error('OTP phải gồm 6 số');
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

      const res = await resetPassword({
        email: normalizedEmail,
        otp: normalizedOtp,
        newPassword,
      });

      toast.success(res?.message || 'Đặt lại mật khẩu thành công');
      navigate('/dang-nhap');
    } catch (error: any) {
      toast.error(error?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <KeyRound className="h-6 w-6" />
          </div>

          <h1 className="mb-2 text-2xl font-bold">Đặt lại mật khẩu</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Nhập mã OTP trong email và tạo mật khẩu mới.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Mã OTP</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="Nhập mã OTP 6 số"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || resending}>
              {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Chưa nhận OTP?{' '}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending || resendCooldown > 0}
              className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {resending
                ? 'Đang gửi...'
                : resendCooldown > 0
                  ? `Gửi lại sau ${resendCooldown}s`
                  : 'Gửi lại mã'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}